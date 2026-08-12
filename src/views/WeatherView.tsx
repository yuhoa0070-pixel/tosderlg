import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { useCurrentWeather } from '../hooks/useCurrentWeather';
import { DEFAULT_CENTER } from '../lib/constants';
import WeatherAlertCard from '../components/shared/WeatherAlertCard';

export default function WeatherView() {
  const { state, dispatch } = useAppContext();
  const trip = useActiveTrip();
  const km = state.language === 'km';
  const weather = useCurrentWeather(trip?.center ?? DEFAULT_CENTER);

  if (!trip) return null;

  const destName = trip.destination.split(',')[0].trim();

  return (
    <section id="view-weather" className="active">
      <div className="tsh-top-row" style={{ marginBottom: 22 }}>
        <div className="icon-btn glass" onClick={() => dispatch({ type: 'NAVIGATE', view: state.previousView ?? 'home' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 4 12l7 7" /><path d="M4.5 12h15" /></svg>
        </div>
        <div className="tsh-title-meta">
          <h2 className="tsh-title">{km ? 'អាកាសធាតុ' : 'Weather'}</h2>
          <p className="tsh-subtitle">{destName}</p>
        </div>
      </div>

      {weather ? (
        <WeatherAlertCard weather={weather} destination={destName} language={state.language} />
      ) : (
        <p className="trip-details-documents-empty">
          {km ? 'កំពុងផ្ទុកអាកាសធាតុ…' : 'Loading weather…'}
        </p>
      )}
    </section>
  );
}
