import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { useCurrentWeather } from '../hooks/useCurrentWeather';
import { DEFAULT_CENTER } from '../lib/constants';
import { compassDirection, weatherAlertKind, type WeatherAlertKind } from '../lib/weather';
import WeatherIcon from '../components/shared/WeatherIcon';

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

  if (!trip) return null;

  const destName = trip.destination.split(',')[0].trim();

  return (
    <section id="view-weather" className="active weather-view">
      {weather ? (
        (() => {
          const kind = weatherAlertKind(weather);
          const copy = WEATHER_COPY[kind];
          const condition = km ? copy.km : copy.en;
          const advice = km ? copy.adviceKm : copy.adviceEn;
          const temp = Math.round(weather.tempC);
          const feels = Math.round(weather.feelsLikeC);
          const wind = Math.round(weather.windKph);

          return (
            <>
              <div className={`weather-hero weather-${kind}`}>
                <div className="weather-hero-topbar">
                  <div className="icon-btn glass" onClick={() => dispatch({ type: 'NAVIGATE', view: state.previousView ?? 'home' })}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 4 12l7 7" /><path d="M4.5 12h15" /></svg>
                  </div>
                  <span className="weather-hero-status"><i aria-hidden="true" />{condition}</span>
                </div>

                <div className="weather-hero-loc">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></svg>
                  <span>{km ? `ឥឡូវនេះនៅ ${destName}` : `Now in ${destName}`}</span>
                </div>

                <div className="weather-hero-figure"><WeatherIcon code={weather.code} /></div>
                <div className="weather-hero-temp">{temp}°</div>
                <div className="weather-hero-cond">{condition}</div>
              </div>

              <div className="weather-metrics-row">
                <div className="weather-metric-chip">
                  <small>{km ? 'មានអារម្មណ៍ថា' : 'Feels like'}</small>
                  <strong>{feels}°</strong>
                </div>
                <div className="weather-metric-chip">
                  <small>{km ? 'សំណើម' : 'Humidity'}</small>
                  <strong>{Math.round(weather.humidity)}%</strong>
                </div>
                <div className="weather-metric-chip">
                  <small>{km ? 'ខ្យល់' : 'Wind'}</small>
                  <strong>{compassDirection(weather.windDeg)} · {wind}km/h</strong>
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
          );
        })()
      ) : (
        <>
          <div className="weather-hero weather-cloudy">
            <div className="weather-hero-topbar">
              <div className="icon-btn glass" onClick={() => dispatch({ type: 'NAVIGATE', view: state.previousView ?? 'home' })}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 4 12l7 7" /><path d="M4.5 12h15" /></svg>
              </div>
            </div>
            <div className="weather-hero-loc">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></svg>
              <span>{km ? `ឥឡូវនេះនៅ ${destName}` : `Now in ${destName}`}</span>
            </div>
          </div>
          <p className="trip-details-documents-empty">{km ? 'កំពុងផ្ទុកអាកាសធាតុ…' : 'Loading weather…'}</p>
        </>
      )}
    </section>
  );
}
