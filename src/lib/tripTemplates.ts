import type { GeoCenter, Stop, TripDay } from '../types';

export interface TripTemplate {
  id: string;
  destination: string;
  destinationLabel: string;
  title: string;
  routeSummary: string;
  tags: string[];
  center: GeoCenter;
  days: Array<Array<Omit<Stop, 'mapLink'>>>;
}

// Hand-authored starter itineraries using real, well-known landmarks and
// their real public coordinates. No ratings, clone counts, or creator
// attribution — this app has no accounts or usage tracking to back that
// kind of social-proof data honestly.
export const TRIP_TEMPLATES: TripTemplate[] = [
  {
    id: 'bali-ubud-highlights',
    destination: 'Ubud, Bali, Indonesia',
    destinationLabel: 'Bali, Indonesia',
    title: 'Ubud Highlights',
    routeSummary: 'Tegallalang · Ubud · Tirta Empul',
    tags: ['popular', '3days', 'nature'],
    center: { lat: -8.5069, lng: 115.2625 },
    days: [
      [
        { time: '9:00 AM', title: 'Tegallalang Rice Terraces', sub: 'Iconic stepped paddies', emoji: '🌾', lat: -8.4312, lng: 115.2777 },
        { time: '2:00 PM', title: 'Ubud Monkey Forest', sub: 'Sacred sanctuary walk', emoji: '🐒', lat: -8.5188, lng: 115.2588 },
      ],
      [
        { time: '9:00 AM', title: 'Ubud Palace', sub: 'Royal courtyard architecture', emoji: '🏛️', lat: -8.5069, lng: 115.2625 },
        { time: '4:00 PM', title: 'Campuhan Ridge Walk', sub: 'Sunset over the hills', emoji: '🌿', lat: -8.4988, lng: 115.2571 },
      ],
      [
        { time: '9:00 AM', title: 'Tirta Empul Temple', sub: 'Holy spring water temple', emoji: '🛕', lat: -8.4155, lng: 115.3155 },
        { time: '3:00 PM', title: 'Ubud Art Market', sub: 'Local crafts and textiles', emoji: '🛍️', lat: -8.5075, lng: 115.2626 },
      ],
    ],
  },
  {
    id: 'bali-canggu-uluwatu',
    destination: 'Canggu, Bali, Indonesia',
    destinationLabel: 'Bali, Indonesia',
    title: 'Canggu & Uluwatu Beach Loop',
    routeSummary: 'Canggu · Uluwatu · Jimbaran',
    tags: ['popular', '3days', 'beach', 'adventure'],
    center: { lat: -8.6478, lng: 115.1385 },
    days: [
      [
        { time: '10:00 AM', title: 'Canggu Beach', sub: 'Surf lesson and beach clubs', emoji: '🏄', lat: -8.6478, lng: 115.1385 },
        { time: '5:00 PM', title: 'Batu Bolong Beach', sub: 'Sunset by the temple', emoji: '🌅', lat: -8.6543, lng: 115.1329 },
      ],
      [
        { time: '10:00 AM', title: 'Padang Padang Beach', sub: 'Cliffside cove swim', emoji: '🏖️', lat: -8.8115, lng: 115.1052 },
        { time: '4:00 PM', title: 'Uluwatu Temple', sub: 'Clifftop temple + kecak dance', emoji: '🛕', lat: -8.8291, lng: 115.0850 },
      ],
      [
        { time: '10:00 AM', title: 'Nusa Dua Beach', sub: 'Calm water, white sand', emoji: '🏖️', lat: -8.8005, lng: 115.2317 },
        { time: '6:00 PM', title: 'Jimbaran Seafood Dinner', sub: 'Grilled catch on the sand', emoji: '🦐', lat: -8.7906, lng: 115.1631 },
      ],
    ],
  },
  {
    id: 'tokyo-classic-3day',
    destination: 'Tokyo, Japan',
    destinationLabel: 'Tokyo, Japan',
    title: 'Classic Tokyo, 3 Days',
    routeSummary: 'Asakusa · Shibuya · Tsukiji',
    tags: ['popular', '3days', 'culture'],
    center: { lat: 35.6762, lng: 139.6503 },
    days: [
      [
        { time: '9:00 AM', title: 'Senso-ji Temple', sub: "Tokyo's oldest temple", emoji: '⛩️', lat: 35.7148, lng: 139.7967 },
        { time: '12:00 PM', title: 'Asakusa Street Food', sub: 'Nakamise shopping street', emoji: '🍡', lat: 35.7118, lng: 139.7963 },
      ],
      [
        { time: '10:00 AM', title: 'Meiji Shrine', sub: 'Forest shrine walk', emoji: '⛩️', lat: 35.6764, lng: 139.6993 },
        { time: '3:00 PM', title: 'Shibuya Crossing', sub: "The world's busiest crossing", emoji: '🚦', lat: 35.6595, lng: 139.7005 },
      ],
      [
        { time: '8:00 AM', title: 'Tsukiji Outer Market', sub: 'Fresh sushi breakfast', emoji: '🍣', lat: 35.6654, lng: 139.7707 },
        { time: '2:00 PM', title: 'Akihabara', sub: 'Anime, arcades, electronics', emoji: '🎮', lat: 35.6984, lng: 139.7731 },
      ],
    ],
  },
];

export function tripTemplateDays(template: TripTemplate): TripDay[] {
  return template.days.map((stops) => ({
    stops: stops.map((stop) => ({ ...stop, mapLink: null })),
  }));
}

export function tripTemplateTags(templates: TripTemplate[]): string[] {
  const tags = new Set<string>();
  templates.forEach((template) => template.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags);
}
