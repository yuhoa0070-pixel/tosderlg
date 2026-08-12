import { useEffect, useState } from 'react';
import { fetchWeatherForecast, type WeatherForecast } from '../lib/weather';
import type { GeoCenter } from '../types';

export function useWeatherForecast(center: GeoCenter): WeatherForecast | null {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);

  useEffect(() => {
    let cancelled = false;
    setForecast(null);
    fetchWeatherForecast(center).then((result) => {
      if (!cancelled) setForecast(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng]);

  return forecast;
}
