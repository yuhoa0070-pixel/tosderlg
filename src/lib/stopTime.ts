export function formatStopTime(rawValue: string): string {
  const raw = rawValue.trim();
  if (!raw) return '';

  const normalized = raw.toLowerCase().replaceAll('.', '').replace(/\s+/g, '');
  if (normalized === 'noon') return '12:00 PM';
  if (normalized === 'midnight') return '12:00 AM';

  const match = normalized.match(/^(\d{1,4})(?::(\d{1,2}))?(a|am|p|pm)?$/);
  if (!match) return raw;

  const digits = match[1];
  const suffix = match[3];
  let hourText = digits;
  let minuteText = match[2] ?? '';

  if (!match[2] && digits.length >= 3) {
    hourText = digits.slice(0, -2);
    minuteText = digits.slice(-2);
  }

  let hour = Number(hourText);
  const minute = minuteText ? Number(minuteText) : 0;
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute < 0 || minute > 59) return raw;

  let meridiem: 'AM' | 'PM';
  if (suffix) {
    if (hour < 1 || hour > 12) return raw;
    meridiem = suffix.startsWith('p') ? 'PM' : 'AM';
  } else {
    if (hour < 0 || hour > 23) return raw;
    meridiem = hour >= 12 ? 'PM' : 'AM';
    hour %= 12;
    if (hour === 0) hour = 12;
  }

  return `${hour}:${String(minute).padStart(2, '0')} ${meridiem}`;
}
