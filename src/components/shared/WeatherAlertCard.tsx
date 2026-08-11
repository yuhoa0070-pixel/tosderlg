import {
  compassDirection,
  weatherAlertKind,
  type CurrentWeather,
  type WeatherAlertKind,
} from '../../lib/weather';
import WeatherIcon from './WeatherIcon';

interface WeatherAlertCardProps {
  weather: CurrentWeather;
  destination: string;
  language: 'en' | 'km';
}

const WEATHER_COPY: Record<WeatherAlertKind, { en: string; km: string; adviceEn: string; adviceKm: string }> = {
  sun: { en: 'Clear skies', km: 'មេឃស្រឡះ', adviceEn: 'A lovely day to explore outdoors.', adviceKm: 'ថ្ងៃល្អសម្រាប់ដើរលេងខាងក្រៅ។' },
  'partly-cloudy': { en: 'Partly cloudy', km: 'មានពពកខ្លះ', adviceEn: 'Comfortable weather for a full day out.', adviceKm: 'អាកាសធាតុល្អសម្រាប់ដើរលេងពេញមួយថ្ងៃ។' },
  cloudy: { en: 'Cloudy', km: 'មានពពកច្រើន', adviceEn: 'Keep a light layer close by.', adviceKm: 'យកអាវស្រាលទៅជាមួយផង។' },
  fog: { en: 'Foggy', km: 'មានអ័ព្ទ', adviceEn: 'Allow extra time between stops.', adviceKm: 'ទុកពេលបន្ថែមសម្រាប់ធ្វើដំណើរ។' },
  rain: { en: 'Rain expected', km: 'អាចមានភ្លៀង', adviceEn: 'Pack an umbrella and waterproof shoes.', adviceKm: 'យកឆ័ត្រ និងស្បែកជើងការពារទឹក។' },
  snow: { en: 'Snowy', km: 'មានព្រិល', adviceEn: 'Bring warm layers and allow extra travel time.', adviceKm: 'យកអាវក្រាស់ និងទុកពេលធ្វើដំណើរបន្ថែម។' },
  thunderstorm: { en: 'Storm alert', km: 'ព្រមានព្យុះ', adviceEn: 'Move outdoor plans indoors when possible.', adviceKm: 'ប្តូរផែនការខាងក្រៅទៅក្នុងអគារបើអាច។' },
  hot: { en: 'Heat alert', km: 'ព្រមានកម្ដៅ', adviceEn: 'Carry water and avoid the midday heat.', adviceKm: 'យកទឹក និងជៀសវាងកម្ដៅថ្ងៃត្រង់។' },
  cold: { en: 'Cold alert', km: 'ព្រមានត្រជាក់', adviceEn: 'Pack warm layers before heading out.', adviceKm: 'យកអាវកក់ក្ដៅមុនចេញដំណើរ។' },
  windy: { en: 'Strong wind', km: 'ខ្យល់ខ្លាំង', adviceEn: 'Secure loose items and check outdoor plans.', adviceKm: 'រក្សារបស់របរឱ្យជាប់ និងពិនិត្យផែនការខាងក្រៅ។' },
};

function AlertIcon({ kind, code }: { kind: WeatherAlertKind; code: number }) {
  if (kind === 'hot' || kind === 'cold') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 14.8V5a3 3 0 0 0-6 0v9.8a5 5 0 1 0 6 0Z" />
        <path d="M11 7v9" />
      </svg>
    );
  }
  if (kind === 'windy') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 8h11.5a3 3 0 1 0-2.4-4.8M3 12h16a2.5 2.5 0 1 1-2 4M3 16h8" />
      </svg>
    );
  }
  return <WeatherIcon code={code} />;
}

export default function WeatherAlertCard({ weather, destination, language }: WeatherAlertCardProps) {
  const km = language === 'km';
  const kind = weatherAlertKind(weather);
  const copy = WEATHER_COPY[kind];
  const condition = km ? copy.km : copy.en;
  const advice = km ? copy.adviceKm : copy.adviceEn;
  const temp = Math.round(weather.tempC);
  const wind = Math.round(weather.windKph);

  return (
    <div className={`weather-alert weather-${kind}`} role="status" aria-label={`${condition}, ${temp}°C`}>
      <div className="weather-alert-top">
        <span className="weather-alert-location">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></svg>
          <span>{km ? `ឥឡូវនេះនៅ ${destination}` : `Now in ${destination}`}</span>
        </span>
        <span className="weather-alert-status"><i aria-hidden="true" />{condition}</span>
      </div>

      <div className="weather-alert-main">
        <div className="weather-alert-hero">
          <span className="weather-alert-icon-wrap">
            <span className="weather-alert-icon"><AlertIcon kind={kind} code={weather.code} /></span>
          </span>
          <span className="weather-alert-temperature">
            <strong>{temp}°</strong>
            <small>Celsius</small>
          </span>
        </div>

        <div className="weather-alert-metrics">
          <span className="weather-alert-metric">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3s5 5.4 5 10a5 5 0 0 1-10 0c0-4.6 5-10 5-10Z" /></svg>
            <span><small>{km ? 'សំណើម' : 'Humidity'}</small><strong>{Math.round(weather.humidity)}%</strong></span>
          </span>
          <span className="weather-alert-metric">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h10a3 3 0 1 0-2.4-4.8M4 14h14a2.5 2.5 0 1 1-2 4M4 19h7" /></svg>
            <span><small>{km ? 'ខ្យល់' : 'Wind'}</small><strong>{compassDirection(weather.windDeg)} · {wind} km/h</strong></span>
          </span>
        </div>
      </div>

      <div className="weather-alert-tip">
        <span className="weather-alert-tip-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" /></svg></span>
        <span><strong>{km ? 'គន្លឹះដំណើរ' : 'Trip tip'}</strong><small>{advice}</small></span>
      </div>
    </div>
  );
}
