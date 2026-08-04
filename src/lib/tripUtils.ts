import type { MomentGroup, Trip } from '../types';

export function keyFor(d: number, s: number): string {
  return 'd' + d + '-s' + s;
}

export function isPastTrip(trip: Trip): boolean {
  if (!trip.endDate) return false;
  const end = new Date(trip.endDate + 'T23:59:59');
  return end < new Date();
}

export function dayCount(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  const diff = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1;
  return Math.min(Math.max(diff, 1), 6);
}

export function buildRecentMoments(trips: Trip[]): MomentGroup[] {
  const groups: MomentGroup[] = [];
  trips.forEach((trip) => {
    Object.entries(trip.photos || {}).forEach(([key, arr]) => {
      if (!arr || !arr.length) return;
      const m = key.match(/^d(\d+)-s(\d+)$/);
      let time = '';
      let title = 'Memory';
      if (m) {
        const day = trip.tripDays[parseInt(m[1], 10)];
        const stop = day && day.stops[parseInt(m[2], 10)];
        if (stop) {
          time = stop.time;
          title = stop.title;
        }
      }
      groups.push({ tripId: trip.id, key, time, title, photos: arr });
    });
  });
  return groups.slice(-8).reverse();
}
