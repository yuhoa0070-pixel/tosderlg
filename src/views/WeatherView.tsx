import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { useWeatherForecast } from '../hooks/useWeatherForecast';
import { DEFAULT_CENTER } from '../lib/constants';
import { weatherAlertKind, weatherIconKind, type WeatherAlertKind } from '../lib/weather';
import WeatherIcon from '../components/shared/WeatherIcon';
import DateScrollHeader from '../components/shared/DateScrollHeader';

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const CONDITION_LABEL: Record<WeatherAlertKind, { en: string; km: string }> = {
  sun: { en: 'Sunny', km: 'ថ្ងៃរះ' },
  'partly-cloudy': { en: 'Partly Sunny', km: 'មានពពកខ្លះ' },
  cloudy: { en: 'Cloudy', km: 'មានពពកច្រើន' },
  fog: { en: 'Foggy', km: 'មានអ័ព្ទ' },
  rain: { en: 'Rainy', km: 'មានភ្លៀង' },
  snow: { en: 'Snowy', km: 'មានព្រិល' },
  thunderstorm: { en: 'Stormy', km: 'ព្យុះ' },
  hot: { en: 'Very Hot', km: 'ក្ដៅខ្លាំង' },
  cold: { en: 'Very Cold', km: 'ត្រជាក់ខ្លាំង' },
  windy: { en: 'Windy', km: 'ខ្យល់ខ្លាំង' },
};

const SUMMARY_LINE: Record<WeatherAlertKind, { en: string; km: string }> = {
  sun: { en: 'You can see clear skies all day.', km: 'អ្នកនឹងឃើញមេឃស្រឡះពេញមួយថ្ងៃ។' },
  'partly-cloudy': { en: 'Expect a mix of sun and clouds today.', km: 'ថ្ងៃនេះមានពន្លឺថ្ងៃលាយនឹងពពក។' },
  cloudy: { en: 'Clouds will cover the sky most of the day.', km: 'ពពកនឹងគ្របដណ្ដប់ភាគច្រើននៃថ្ងៃ។' },
  fog: { en: 'Patchy fog may reduce visibility today.', km: 'អាចមានអ័ព្ទបន្ថយភាពមើលឃើញ។' },
  rain: { en: 'Rain showers are likely throughout the day.', km: 'អាចមានភ្លៀងពេញមួយថ្ងៃ។' },
  snow: { en: 'Snow flurries are expected today.', km: 'អាចមានព្រិលធ្លាក់ថ្ងៃនេះ។' },
  thunderstorm: { en: 'Thunderstorms may roll through later today.', km: 'អាចមានព្យុះផ្គររំពេចនៅពេលក្រោយ។' },
  hot: { en: 'Temperatures will stay high — stay hydrated.', km: 'សីតុណ្ហភាពនៅតែខ្ពស់ — សូមផឹកទឹកឱ្យបានគ្រប់គ្រាន់។' },
  cold: { en: 'A cold day ahead — bundle up before heading out.', km: 'ថ្ងៃនេះត្រជាក់ — សូមស្លៀកសម្លៀកបំពាក់កក់ក្ដៅ។' },
  windy: { en: 'Expect gusty winds throughout the day.', km: 'អាចមានខ្យល់បក់ខ្លាំងពេញមួយថ្ងៃ។' },
};

function formatHour(date: Date, km: boolean): string {
  return date.toLocaleTimeString(km ? 'km-KH' : 'en-US', { hour: 'numeric', minute: date.getMinutes() ? '2-digit' : undefined });
}

export default function WeatherView() {
  const { state, dispatch } = useAppContext();
  const trip = useActiveTrip();
  const km = state.language === 'km';
  const forecast = useWeatherForecast(trip?.center ?? DEFAULT_CENTER);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const isToday = isSameDay(selectedDate, new Date());

  if (!trip) return null;

  const destName = trip.destination.split(',')[0].trim();

  const dateHeader = (
    <DateScrollHeader
      selectedDate={selectedDate}
      onSelectDate={setSelectedDate}
      language={state.language}
    />
  );

  if (!forecast) {
    return (
      <section id="view-weather" className="active weather-view">
        <div className="wx-hero">
          <div className="icon-btn glass wx-back" onClick={() => dispatch({ type: 'NAVIGATE', view: state.previousView ?? 'home' })}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 4 12l7 7" /><path d="M4.5 12h15" /></svg>
          </div>
          <p className="wx-loading">{km ? 'កំពុងផ្ទុកអាកាសធាតុ…' : 'Loading weather…'}</p>
        </div>
      </section>
    );
  }

  const { current, tempMaxC, tempMinC } = forecast;

  const selectedDay = forecast.days.find((d) => isSameDay(d.date, selectedDate));
  const isPast = !isToday && selectedDate < forecast.days[0].date;

  let headlineTempC: number | null = null;
  let hourly: typeof forecast.hourly = [];
  let dayKind: WeatherAlertKind | null = null;
  if (selectedDay) {
    headlineTempC = isToday ? current.tempC : selectedDay.tempMaxC;
    hourly = isToday ? forecast.hourly : selectedDay.hourly;
    dayKind = isToday ? weatherAlertKind(current) : weatherIconKind(selectedDay.code) === 'unknown' ? 'cloudy' : (weatherIconKind(selectedDay.code) as WeatherAlertKind);
  }
  const condition = dayKind ? (km ? CONDITION_LABEL[dayKind].km : CONDITION_LABEL[dayKind].en) : '';
  const summary = dayKind ? (km ? SUMMARY_LINE[dayKind].km : SUMMARY_LINE[dayKind].en) : '';

  const hourlyTemps = hourly.map((h) => h.tempC);
  const minT = hourlyTemps.length ? Math.min(...hourlyTemps) : 0;
  const maxT = hourlyTemps.length ? Math.max(...hourlyTemps) : 0;
  const range = Math.max(maxT - minT, 1);
  const points = hourly.map((h, i) => {
    const x = hourly.length > 1 ? (i / (hourly.length - 1)) * 100 : 50;
    const y = 26 - ((h.tempC - minT) / range) * 22;
    return `${x},${y}`;
  });

  return (
    <section id="view-weather" className="active weather-view">
      <div className="wx-hero">
        <div className="icon-btn glass wx-back" onClick={() => dispatch({ type: 'NAVIGATE', view: state.previousView ?? 'home' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 4 12l7 7" /><path d="M4.5 12h15" /></svg>
        </div>

        <div className="wx-content">
          <div className="wx-loc">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></svg>
            <span>{destName}</span>
          </div>

          {dateHeader}

          {selectedDay ? (
            <>
              <div className="wx-temp">{Math.round(headlineTempC ?? 0)}°</div>
              <div className="wx-cond">{condition}</div>

              <div className="wx-highlow">
                <span>↑{Math.round(isToday ? tempMaxC : selectedDay.tempMaxC)}° / ↓{Math.round(isToday ? tempMinC : selectedDay.tempMinC)}°</span>
              </div>
              {isToday && (
                <div className="wx-feels">{km ? `មានអារម្មណ៍ថា ${Math.round(current.feelsLikeC)}°` : `Feels like ${Math.round(current.feelsLikeC)}°`}</div>
              )}

              <p className="wx-summary">{summary}</p>

              <div className="wx-hourly">
                {hourly.map((h) => (
                  <div className="wx-hour-col" key={h.time.getTime()}>
                    <span className="wx-hour-time">{h.isSunset ? (km ? 'ថ្ងៃលិច' : 'Sunset') : formatHour(h.time, km)}</span>
                    <span className="wx-hour-icon">
                      {h.isSunset ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v6M5.6 8.6l1.4 1.4M18.4 8.6 17 10M3 18h18M5 15a7 7 0 0 1 14 0" /></svg>
                      ) : (
                        <WeatherIcon code={h.code} />
                      )}
                    </span>
                    <span className="wx-hour-temp">{Math.round(h.tempC)}°</span>
                    {!h.isSunset && <span className="wx-hour-precip">{Math.round(h.precipProbability)}%</span>}
                  </div>
                ))}
                <svg className="wx-trend-svg" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
                  <polyline points={points.join(' ')} fill="none" />
                  {points.map((point) => {
                    const [x, y] = point.split(',');
                    return <circle key={point} cx={x} cy={y} r="1.4" />;
                  })}
                </svg>
              </div>

            </>
          ) : (
            <p className="wx-placeholder">
              {isPast
                ? (km ? 'មិនអាចមើលអាកាសធាតុថ្ងៃមុនបានទេ' : "Past weather isn't available")
                : (km ? 'ព្យាករណ៍លើសពី ៧ថ្ងៃមិនទាន់មានទេ' : "Forecast beyond 7 days isn't available yet")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
