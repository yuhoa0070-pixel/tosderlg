import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Language } from '../../types';

interface DatePickerFieldProps {
  id: string;
  label: string;
  value: string;
  min?: string;
  language: Language;
  onChange: (value: string) => void;
}

const WEEKDAYS = {
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  km: ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស'],
};

function parseIsoDate(value?: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameDay(first: Date | null, second: Date): boolean {
  return !!first && first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
}

export default function DatePickerField({ id, label, value, min, language, onChange }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const initialDate = parseIsoDate(value) ?? parseIsoDate(min) ?? new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(initialDate));
  const km = language === 'km';
  const locale = km ? 'km-KH' : 'en-US';
  const selectedDate = parseIsoDate(draftValue);
  const minimumDate = parseIsoDate(min);
  const today = new Date();
  const todayValue = toIsoDate(today);

  useEffect(() => {
    if (!open) return;
    const nextDate = parseIsoDate(value) ?? parseIsoDate(min) ?? new Date();
    setDraftValue(value);
    setVisibleMonth(startOfMonth(nextDate));

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, value, min]);

  const calendarDays = useMemo(() => {
    const firstWeekday = visibleMonth.getDay();
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    return Array.from({ length: 42 }, (_, index) => {
      const dayNumber = index - firstWeekday + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) return null;
      return new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), dayNumber);
    });
  }, [visibleMonth]);

  const formattedValue = value
    ? new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(parseIsoDate(value) ?? today)
    : (km ? 'ជ្រើសរើសថ្ងៃ' : 'Select date');
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(visibleMonth);
  const minimumMonth = minimumDate ? startOfMonth(minimumDate) : null;
  const previousMonthDisabled = !!minimumMonth && visibleMonth.getTime() <= minimumMonth.getTime();

  function chooseToday() {
    const allowedDate = minimumDate && today < minimumDate ? minimumDate : today;
    setDraftValue(toIsoDate(allowedDate));
    setVisibleMonth(startOfMonth(allowedDate));
  }

  function confirmSelection() {
    if (!draftValue) return;
    onChange(draftValue);
    setOpen(false);
  }

  return (
    <div className="date-picker-field">
      <label className="date-picker-label" htmlFor={id}>{label}</label>
      <button
        type="button"
        className={`date-picker-trigger${value ? ' has-value' : ''}`}
        id={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span>{formattedValue}</span>
        <svg className="date-picker-icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5.5" width="17" height="15" rx="3" />
          <path d="M8 3.5v4M16 3.5v4M3.5 10h17" />
          <path d="M8 14h2M14 14h2M8 17.5h2M14 17.5h2" />
        </svg>
      </button>

      {open && createPortal(
        <div className="date-sheet-overlay open" role="presentation" onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <div className="date-sheet" role="dialog" aria-modal="true" aria-labelledby={`${id}-date-title`}>
            <span className="date-sheet-handle" aria-hidden="true" />
            <header className="date-sheet-heading">
              <span>
                <small>{label}</small>
                <strong id={`${id}-date-title`}>{km ? 'ជ្រើសរើសកាលបរិច្ឆេទ' : 'Choose a date'}</strong>
              </span>
              <button type="button" className="date-sheet-today" onClick={chooseToday}>
                {km ? 'ថ្ងៃនេះ' : 'Today'}
              </button>
            </header>

            <div className="date-sheet-month-nav">
              <button
                type="button"
                aria-label={km ? 'ខែមុន' : 'Previous month'}
                disabled={previousMonthDisabled}
                onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <strong>{monthLabel}</strong>
              <button
                type="button"
                aria-label={km ? 'ខែបន្ទាប់' : 'Next month'}
                onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>

            <div className="date-sheet-weekdays" aria-hidden="true">
              {WEEKDAYS[language].map((weekday, index) => <span key={`${weekday}-${index}`}>{weekday}</span>)}
            </div>
            <div className="date-sheet-days" role="grid">
              {calendarDays.map((date, index) => {
                if (!date) return <span className="date-sheet-day-spacer" key={`empty-${index}`} />;
                const isoDate = toIsoDate(date);
                const disabled = !!min && isoDate < min;
                const selected = sameDay(selectedDate, date);
                const isToday = isoDate === todayValue;
                return (
                  <button
                    type="button"
                    role="gridcell"
                    className={`${selected ? ' selected' : ''}${isToday ? ' today' : ''}`}
                    aria-selected={selected}
                    disabled={disabled}
                    key={isoDate}
                    onClick={() => setDraftValue(isoDate)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="date-sheet-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                {km ? 'បោះបង់' : 'Cancel'}
              </button>
              <button type="button" className="btn btn-primary" disabled={!draftValue} onClick={confirmSelection}>
                {km ? 'ជ្រើសរើសថ្ងៃ' : 'Select date'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
