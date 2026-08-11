import { weatherIconKind } from '../../lib/weather';

export default function WeatherIcon({ code }: { code: number }) {
  const kind = weatherIconKind(code);

  switch (kind) {
    case 'sun':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      );
    case 'partly-cloudy':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41" />
          <path d="M15.9 12.65a4 4 0 0 0-5.9-4.13" />
          <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
        </svg>
      );
    case 'cloudy':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      );
    case 'fog':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16.5 13H9a6 6 0 1 1 5.83-7.4" />
          <path d="M4 17h16M6 21h12" />
        </svg>
      );
    case 'rain':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.71 12.9A4.5 4.5 0 0 0 17 4h-1.26A8 8 0 1 0 4 14.9" />
          <path d="M8 14v6M12 16v6M16 14v6" />
        </svg>
      );
    case 'snow':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.71 12.9A4.5 4.5 0 0 0 17 4h-1.26A8 8 0 1 0 4 14.9" />
          <path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01" />
        </svg>
      );
    case 'thunderstorm':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 16.33A4.5 4.5 0 0 1 7 7.5h1.26A8 8 0 1 1 17 16.9" />
          <path d="m13 12-3 5h4l-3 5" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
        </svg>
      );
  }
}
