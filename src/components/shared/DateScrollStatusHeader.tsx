import { useEffect, useMemo, useRef, useState } from 'react';

interface DateScrollStatusHeaderProps {
  daysBefore?: number;
  daysAfter?: number;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const TABS = [
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'activity', label: 'Activity' },
];

export default function DateScrollStatusHeader({ daysBefore = 10, daysAfter = 10 }: DateScrollStatusHeaderProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTab, setActiveTab] = useState('nutrition');

  const dates = useMemo(() => {
    const list: Date[] = [];
    for (let i = -daysBefore; i <= daysAfter; i += 1) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      list.push(d);
    }
    return list;
  }, [today, daysBefore, daysAfter]);

  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const weekdayFormatter = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'short' }), []);

  useEffect(() => {
    const match = dates.find((d) => isSameDay(d, selectedDate));
    if (!match) return;
    const node = itemRefs.current.get(match.getTime());
    node?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedDate, dates]);

  return (
    <div className="dsh-card">
      <div className="dsh-notch" aria-hidden="true" />

      <div className="dsh-statusbar">
        <span className="dsh-time">9:41</span>
        <span className="dsh-status-icons" aria-hidden="true">
          <svg viewBox="0 0 20 12" width="18" height="11"><rect x="0" y="7" width="3" height="5" rx="0.5" /><rect x="5" y="5" width="3" height="7" rx="0.5" /><rect x="10" y="3" width="3" height="9" rx="0.5" /><rect x="15" y="0" width="3" height="12" rx="0.5" /></svg>
          <svg viewBox="0 0 16 12" width="16" height="12"><path d="M8 10.2a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" /><path d="M4.6 6.8a4.8 4.8 0 0 1 6.8 0L10 8.2a2.8 2.8 0 0 0-4 0L4.6 6.8Z" /><path d="M1.8 4a8.8 8.8 0 0 1 12.4 0L12.8 5.4a6.8 6.8 0 0 0-9.6 0L1.8 4Z" /></svg>
          <svg viewBox="0 0 25 12" width="24" height="12"><rect x="0.5" y="0.5" width="20" height="11" rx="2.5" fill="none" stroke="currentColor" /><rect x="2" y="2" width="16" height="8" rx="1.2" /><rect x="21.5" y="4" width="2" height="4" rx="1" /></svg>
        </span>
      </div>

      <div className="dsh-date-row">
        {dates.map((date) => {
          const key = date.getTime();
          const selected = isSameDay(date, selectedDate);
          return (
            <button
              key={key}
              type="button"
              ref={(node) => {
                if (node) itemRefs.current.set(key, node);
                else itemRefs.current.delete(key);
              }}
              className="dsh-date-col"
              aria-pressed={selected}
              onClick={() => setSelectedDate(date)}
            >
              <span className="dsh-weekday">{weekdayFormatter.format(date)}</span>
              <span className={`dsh-day-circle${selected ? ' selected' : ''}`}>{date.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="dsh-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`dsh-tab${tab.id === activeTab ? ' active' : ''}`}
            aria-pressed={tab.id === activeTab}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
