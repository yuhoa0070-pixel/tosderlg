import type { Trip } from '../types';

const MAX_HIGHLIGHTS = 4;

function periodLabel(time: string, km: boolean): string {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return km ? 'ការឈប់' : 'Stop';
  let hour = parseInt(match[1], 10) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;

  if (km) {
    if (hour < 6) return 'ពេលយប់';
    if (hour < 11) return 'ថ្ងៃរះ';
    if (hour < 12) return 'ព្រឹក';
    if (hour < 14) return 'អាហារថ្ងៃត្រង់';
    if (hour < 17) return 'រសៀល';
    if (hour < 21) return 'អាហារល្ងាច';
    return 'ល្ងាច';
  }
  if (hour < 6) return 'Night';
  if (hour < 11) return 'Sunrise';
  if (hour < 12) return 'Morning';
  if (hour < 14) return 'Lunch';
  if (hour < 17) return 'Afternoon';
  if (hour < 21) return 'Dinner';
  return 'Evening';
}

export interface TripHighlight {
  key: string;
  text: string;
}

// Trips don't have a dedicated "starred moment" concept yet, so highlights
// are derived from stops — ones with a note attached read as more
// deliberately memorable, so they're surfaced first.
export function tripHighlights(trip: Trip, km: boolean): TripHighlight[] {
  const allStops = trip.tripDays.flatMap((day) => day.stops);
  const withNotes = allStops.filter((stop) => stop.sub.trim());
  const withoutNotes = allStops.filter((stop) => !stop.sub.trim());
  return [...withNotes, ...withoutNotes].slice(0, MAX_HIGHLIGHTS).map((stop, index) => ({
    key: `${stop.title}-${index}`,
    text: `${periodLabel(stop.time, km)} ${km ? 'នៅ' : 'at'} ${stop.title}`,
  }));
}
