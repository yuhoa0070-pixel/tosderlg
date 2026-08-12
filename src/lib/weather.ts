import type { GeoCenter } from '../types';

export interface CurrentWeather {
  tempC: number;
  feelsLikeC: number;
  code: number;
  humidity: number;
  windKph: number;
  windDeg: number;
  isDay: boolean;
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    is_day?: number;
  };
}

export async function fetchCurrentWeather(center: GeoCenter): Promise<CurrentWeather | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(center.lat));
    url.searchParams.set('longitude', String(center.lng));
    url.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,wind_direction_10m,is_day');
    url.searchParams.set('timezone', 'auto');

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = (await response.json()) as OpenMeteoResponse;
    const current = data.current;
    const tempC = current?.temperature_2m;
    const code = current?.weather_code;
    if (typeof tempC !== 'number' || typeof code !== 'number') return null;

    return {
      tempC,
      feelsLikeC: typeof current?.apparent_temperature === 'number' ? current.apparent_temperature : tempC,
      code,
      humidity: typeof current?.relative_humidity_2m === 'number' ? current.relative_humidity_2m : 0,
      windKph: typeof current?.wind_speed_10m === 'number' ? current.wind_speed_10m : 0,
      windDeg: typeof current?.wind_direction_10m === 'number' ? current.wind_direction_10m : 0,
      isDay: current?.is_day !== 0,
    };
  } catch {
    return null;
  }
}

export type WeatherIconKind = 'sun' | 'partly-cloudy' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'thunderstorm' | 'unknown';

// Maps Open-Meteo's WMO weather codes to an icon category.
// https://open-meteo.com/en/docs — "WMO Weather interpretation codes"
export function weatherIconKind(code: number): WeatherIconKind {
  if (code === 0) return 'sun';
  if (code <= 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return 'unknown';
}

// The reference design calls out "hot"/"cold"/"windy" as their own alert
// styles rather than just a sky condition — derived here from real
// temperature/wind thresholds instead of a separate (unavailable) alert feed.
export type WeatherAlertKind = 'sun' | 'partly-cloudy' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'thunderstorm' | 'hot' | 'cold' | 'windy';

export function weatherAlertKind(weather: CurrentWeather): WeatherAlertKind {
  if (weather.tempC >= 35) return 'hot';
  if (weather.tempC <= 5) return 'cold';
  if (weather.windKph >= 40) return 'windy';
  const base = weatherIconKind(weather.code);
  return base === 'unknown' ? 'cloudy' : base;
}

const COMPASS_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function compassDirection(deg: number): string {
  const index = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
  return COMPASS_LABELS[index];
}
