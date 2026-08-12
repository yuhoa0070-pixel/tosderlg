import { useEffect, useState } from 'react';
import { fetchCurrentWeather, type CurrentWeather } from '../lib/weather';
import type { GeoCenter } from '../types';

export function useCurrentWeather(center: GeoCenter): CurrentWeather | null {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);

  useEffect(() => {
    let cancelled = false;
    setWeather(null);
    fetchCurrentWeather(center).then((result) => {
      if (!cancelled) setWeather(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng]);

  return weather;
}
