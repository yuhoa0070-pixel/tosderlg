import { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { useCurrentWeather } from '../hooks/useCurrentWeather';
import { DEFAULT_CENTER } from '../lib/constants';
import { compassDirection, weatherAlertKind, type WeatherAlertKind } from '../lib/weather';
import WeatherIcon from '../components/shared/WeatherIcon';
import DateScrollHeader from '../components/shared/DateScrollHeader';

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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

export default function WeatherView() {
  const { state, dispatch } = useAppContext();
  const trip = useActiveTrip();
  const km = state.language === 'km';
  const weather = useCurrentWeather(trip?.center ?? DEFAULT_CENTER);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [activeTab, setActiveTab] = useState('current');
  const today = useMemo(() => new Date(), []);
  const isToday = isSameDay(selectedDate, today);
  const showLive = activeTab === 'current' && isToday && !!weather;

  const tabs = [
    { id: 'current', label: km ? 'បច្ចុប្បន្ន' : 'Current' },
    { id: 'forecast', label: km ? 'ព្យាករណ៍' : 'Forecast' },
  ];

  if (!trip) return null;

  const destName = trip.destination.split(',')[0].trim();
  const kind = weather ? weatherAlertKind(weather) : 'cloudy';
  const copy = WEATHER_COPY[kind];
  const condition = km ? copy.km : copy.en;
  const advice = km ? copy.adviceKm : copy.adviceEn;

  return (
    <section id="view-weather" className="active weather-view">
      <div className={`weather-hero weather-${kind}`}>
        <div className="weather-hero-topbar">
          <div className="icon-btn glass" onClick={() => dispatch({ type: 'NAVIGATE', view: state.previousView ?? 'home' })}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 4 12l7 7" /><path d="M4.5 12h15" /></svg>
          </div>
          {showLive && <span className="weather-hero-status"><i aria-hidden="true" />{condition}</span>}
        </div>

        <div className="weather-hero-loc">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></svg>
          <span>{km ? `ឥឡូវនេះនៅ ${destName}` : `Now in ${destName}`}</span>
        </div>

        <DateScrollHeader
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          language={state.language}
        />

        {showLive ? (
          <>
            <div className="weather-hero-figure"><WeatherIcon code={weather.code} /></div>
            <div className="weather-hero-temp">{Math.round(weather.tempC)}°</div>
            <div className="weather-hero-cond">{condition}</div>
          </>
        ) : (
          <div className="weather-hero-placeholder">
            <p>
              {activeTab === 'forecast'
                ? (km ? 'ព្យាករណ៍អាកាសធាតុច្រើនថ្ងៃនឹងមកដល់ឆាប់ៗនេះ' : 'Multi-day forecast coming soon')
                : (km ? 'អាកាសធាតុបច្ចុប្បន្នអាចមើលបានតែថ្ងៃនេះប៉ុណ្ណោះ' : 'Live conditions are only available for today')}
            </p>
          </div>
        )}
      </div>

      {showLive ? (
        <>
          <div className="weather-metrics-row">
            <div className="weather-metric-chip">
              <small>{km ? 'មានអារម្មណ៍ថា' : 'Feels like'}</small>
              <strong>{Math.round(weather.feelsLikeC)}°</strong>
            </div>
            <div className="weather-metric-chip">
              <small>{km ? 'សំណើម' : 'Humidity'}</small>
              <strong>{Math.round(weather.humidity)}%</strong>
            </div>
            <div className="weather-metric-chip">
              <small>{km ? 'ខ្យល់' : 'Wind'}</small>
              <strong>{compassDirection(weather.windDeg)} · {Math.round(weather.windKph)}km/h</strong>
            </div>
          </div>

          <div className="weather-tip-card">
            <span className="weather-tip-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" /></svg>
            </span>
            <div>
              <strong>{km ? 'គន្លឹះដំណើរ' : 'Trip tip'}</strong>
              <p>{advice}</p>
            </div>
          </div>
        </>
      ) : (
        !weather && <p className="trip-details-documents-empty">{km ? 'កំពុងផ្ទុកអាកាសធាតុ…' : 'Loading weather…'}</p>
      )}
    </section>
  );
}
