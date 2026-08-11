import type { MomentGroup, Trip } from '../types';

export function keyFor(d: number, s: number): string {
  return 'd' + d + '-s' + s;
}

export function parseKey(key: string): { day: number; stop: number } | null {
  const m = key.match(/^d(\d+)-s(\d+)$/);
  if (!m) return null;
  return { day: parseInt(m[1], 10), stop: parseInt(m[2], 10) };
}

export function isPastTrip(trip: Trip): boolean {
  if (!trip.endDate) return false;
  const end = new Date(trip.endDate + 'T23:59:59');
  return end < new Date();
}

export interface UpcomingTripAlert {
  daysUntil: number;
  tone: 'soon' | 'urgent';
}

export function getUpcomingTripAlert(trip: Trip, now = new Date()): UpcomingTripAlert | null {
  if (!trip.startDate) return null;
  const [year, month, day] = trip.startDate.split('-').map(Number);
  if (!year || !month || !day) return null;

  const startUtc = Date.UTC(year, month - 1, day);
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const daysUntil = Math.round((startUtc - todayUtc) / 86400000);
  if (daysUntil < 0 || daysUntil > 30) return null;

  return { daysUntil, tone: daysUntil <= 7 ? 'urgent' : 'soon' };
}

export function dayDateLabel(startDate: string | null, dayIndex: number, language: 'en' | 'km'): string | null {
  if (!startDate) return null;
  const [year, month, day] = startDate.split('-').map(Number);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day + dayIndex);
  return new Intl.DateTimeFormat(language === 'km' ? 'km-KH' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function plannedDaysProgress(tripDays: Trip['tripDays']): { planned: number; total: number; percent: number } {
  const total = tripDays.length;
  const planned = tripDays.filter((day) => day.stops.length > 0).length;
  const percent = total ? Math.round((planned / total) * 100) : 0;
  return { planned, total, percent };
}

export function formatTripDateRange(trip: Trip, km: boolean): string {
  if (!trip.startDate || !trip.endDate) return km ? 'មិនទាន់កំណត់ថ្ងៃ' : 'Dates not set';
  const start = new Date(`${trip.startDate}T00:00:00`);
  const end = new Date(`${trip.endDate}T00:00:00`);
  const sameYear = start.getFullYear() === end.getFullYear();
  const fmt = new Intl.DateTimeFormat(km ? 'km-KH' : 'en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  return start.getTime() === end.getTime() ? fmt.format(start) : `${fmt.format(start)} – ${fmt.format(end)}`;
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
