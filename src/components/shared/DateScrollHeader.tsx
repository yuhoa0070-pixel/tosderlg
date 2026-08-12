import { useEffect, useMemo, useRef } from 'react';

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
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(language === 'km' ? 'km-KH' : 'en-US', { weekday: 'short' }),
    [language],
  );

  useEffect(() => {
    const match = dates.find((d) => isSameDay(d, selectedDate));
    if (!match) return;
    const node = itemRefs.current.get(match.getTime());
    node?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedDate, dates]);

  return (
    <div className="date-scroll-header">
      <div className="date-scroll-track" ref={scrollRef}>
        {dates.map((date) => {
          const key = date.getTime();
          const selected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          return (
            <button
              key={key}
              type="button"
              ref={(node) => {
                if (node) itemRefs.current.set(key, node);
                else itemRefs.current.delete(key);
              }}
              className={`date-scroll-item${selected ? ' selected' : ''}${isToday ? ' is-today' : ''}`}
              aria-pressed={selected}
              onClick={() => onSelectDate(date)}
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
