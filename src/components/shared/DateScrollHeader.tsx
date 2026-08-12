import { useEffect, useMemo, useRef, useState } from 'react';

export interface DateScrollTab {
  id: string;
  label: string;
}

interface DateScrollHeaderProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  tabs?: DateScrollTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  daysBefore?: number;
  daysAfter?: number;
  language?: 'en' | 'km';
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// A self-driven scrollLeft tween instead of native scrollIntoView({behavior:'smooth'}) —
// the native version's timing is inconsistent across browsers/engines (and can fight
// CSS scroll-snap), whereas setting scrollLeft directly each frame is the same code
// path a real drag already takes, so it reaches the target reliably.
function animateScrollLeft(container: HTMLElement, target: number, onDone: () => void, duration = 260) {
  const start = container.scrollLeft;
  const change = target - start;
  if (Math.abs(change) < 1) {
    onDone();
    return;
  }
  const startTime = performance.now();
  const step = (now: number) => {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - (1 - t) ** 3;
    container.scrollLeft = start + change * eased;
    if (t < 1) requestAnimationFrame(step);
    else onDone();
  };
  requestAnimationFrame(step);
}

export default function DateScrollHeader({
  selectedDate,
  onSelectDate,
  tabs,
  activeTab,
  onTabChange,
  daysBefore = 10,
  daysAfter = 10,
  language = 'en',
}: DateScrollHeaderProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const dates = useMemo(() => {
    const list: Date[] = [];
    for (let i = -daysBefore; i <= daysAfter; i += 1) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      list.push(d);
    }
    return list;
  }, [today, daysBefore, daysAfter]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafId = useRef<number | null>(null);
  const userInteracting = useRef(false);
  // Set right before a selection change originates from the scroll position
  // itself (the item is already centered by the user's own scroll), so the
  // centering effect below doesn't re-animate a scroll that would otherwise
  // fight the gesture that just finished and produce a visible jump.
  const selectedFromScroll = useRef(false);
  // True while our own centering tween is driving scrollLeft. Its intermediate
  // positions must not be mistaken for a user scroll gesture — otherwise the
  // "nearest date" logic below would commit to whatever date briefly passed
  // by mid-animation instead of the one we're actually animating toward.
  const isProgrammaticScroll = useRef(false);
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(language === 'km' ? 'km-KH' : 'en-US', { weekday: 'short' }),
    [language],
  );

  // The visual "which date is under the center marker" state — updates live,
  // on every scroll frame, independent of the debounced commit below. This is
  // what keeps the highlight glued to the fixed center dot while dates slide
  // past underneath, instead of jumping only once scrolling fully settles.
  const [focusedKey, setFocusedKey] = useState<number>(() => {
    const match = dates.find((d) => isSameDay(d, selectedDate));
    return (match ?? today).getTime();
  });

  const findClosestKey = (): number | null => {
    const container = scrollRef.current;
    if (!container) return null;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closestKey: number | null = null;
    let closestDist = Infinity;
    itemRefs.current.forEach((node, key) => {
      const itemCenter = node.offsetLeft + node.offsetWidth / 2;
      const dist = Math.abs(itemCenter - containerCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestKey = key;
      }
    });
    return closestKey;
  };

  useEffect(() => {
    const match = dates.find((d) => isSameDay(d, selectedDate));
    if (match) setFocusedKey(match.getTime());

    if (selectedFromScroll.current) {
      selectedFromScroll.current = false;
      return;
    }
    if (!match) return;

    // The container can still be mid-layout (e.g. width not yet settled) right
    // after this view mounts, which would compute a bogus centering target.
    // Wait a few frames for a real, stable width before animating.
    let attempts = 0;
    let cancelled = false;
    const tryCenter = () => {
      if (cancelled) return;
      const node = itemRefs.current.get(match.getTime());
      const container = scrollRef.current;
      if (!node || !container) return;
      if (container.clientWidth < 20 && attempts < 15) {
        attempts += 1;
        requestAnimationFrame(tryCenter);
        return;
      }
      const target = node.offsetLeft + node.offsetWidth / 2 - container.clientWidth / 2;
      isProgrammaticScroll.current = true;
      animateScrollLeft(container, target, () => {
        isProgrammaticScroll.current = false;
      });
    };
    requestAnimationFrame(tryCenter);
    return () => {
      cancelled = true;
    };
  }, [selectedDate, dates]);

  useEffect(() => () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    if (rafId.current) cancelAnimationFrame(rafId.current);
  }, []);

  const markUserInteracting = () => {
    userInteracting.current = true;
  };

  const handleScroll = () => {
    // Ignore scroll events produced by our own centering tween — the target
    // date is already known and correct; live-tracking these would just
    // flicker the highlight through whatever's passing by mid-animation.
    if (isProgrammaticScroll.current) return;

    // Live: keep the center highlight glued to whatever is closest, every frame.
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const key = findClosestKey();
      if (key !== null) setFocusedKey(key);
    });

    // Settle correction: browsers can coalesce/skip the final `scroll` event
    // right as a smooth-scroll animation finishes, which would otherwise leave
    // the live highlight one frame stale. This always re-verifies against the
    // real DOM position once scrolling has stopped, regardless of whether the
    // scroll was a user drag or our own programmatic centering.
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const closestKey = findClosestKey();
      if (closestKey === null) return;
      setFocusedKey(closestKey);

      if (!userInteracting.current) return;
      userInteracting.current = false;
      const closestDate = dates.find((d) => d.getTime() === closestKey);
      if (closestDate && !isSameDay(closestDate, selectedDate)) {
        selectedFromScroll.current = true;
        onSelectDate(closestDate);
      }
    }, 150);
  };

  return (
    <div className="date-scroll-header">
      <div
        className="date-scroll-track"
        ref={scrollRef}
        onScroll={handleScroll}
        onPointerDown={markUserInteracting}
        onWheel={markUserInteracting}
        onTouchStart={markUserInteracting}
      >
        {dates.map((date) => {
          const key = date.getTime();
          const focused = focusedKey === key;
          return (
            <button
              key={key}
              type="button"
              ref={(node) => {
                if (node) itemRefs.current.set(key, node);
                else itemRefs.current.delete(key);
              }}
              className={`date-scroll-item${focused ? ' selected' : ''}`}
              aria-pressed={isSameDay(date, selectedDate)}
              onClick={() => {
                // A tap bubbles a pointerdown to the track first, which would
                // otherwise make the resulting auto-center scroll look like a
                // manual drag and re-trigger nearest-item reselection — flipping
                // the selection to a neighboring date right after the tap.
                userInteracting.current = false;
                if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
                onSelectDate(date);
              }}
            >
              <span className="date-scroll-weekday">{weekdayFormatter.format(date)}</span>
              <span className="date-scroll-day">{date.getDate()}</span>
            </button>
          );
        })}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="date-scroll-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`date-scroll-tab${tab.id === activeTab ? ' active' : ''}`}
              aria-pressed={tab.id === activeTab}
              onClick={() => onTabChange?.(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
