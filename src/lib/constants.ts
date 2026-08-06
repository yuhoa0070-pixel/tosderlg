import type { GeoCenter, MomentGroup } from '../types';

export const DEFAULT_CENTER: GeoCenter = { lat: 38.7223, lng: -9.1393 };

export const sampleMemories: MomentGroup[] = [
  {
    time: '10:30 am',
    title: 'Walk around Hyde Park',
    photos: [
      { src: 'https://picsum.photos/seed/hyde-park-1/200/260' },
      { src: 'https://picsum.photos/seed/hyde-park-2/200/260' },
      { src: 'https://picsum.photos/seed/hyde-park-3/200/260' },
    ],
  },
  {
    time: '1:15 pm',
    title: 'Lunch at the food market',
    photos: [
      { src: 'https://picsum.photos/seed/food-market-1/200/260' },
      { src: 'https://picsum.photos/seed/food-market-2/200/260' },
    ],
  },
];

export interface HeroGalleryCard {
  label: string;
  seed: string;
  image?: string;
  icon: string;
}

// SVG path data ported verbatim from the original hero-gallery-card icons.
export const heroGalleryData: HeroGalleryCard[] = [
  {
    label: 'City escapes',
    seed: 'city-escapes',
    image: '/city-escape-traveler.png',
    icon: '<path d="M3 17l5-6 4 4 5-7 4 5"/>',
  },
  {
    label: 'Coastal days',
    seed: 'coastal-days',
    image: '/coastal-days.webp',
    icon: '<path d="M2 15c2 2 4 2 6 0s4-2 6 0 4 2 6 0"/><path d="M2 19c2 2 4 2 6 0s4-2 6 0 4 2 6 0"/><circle cx="17" cy="7" r="3"/>',
  },
  {
    label: 'Mountain air',
    seed: 'mountain-air',
    image: '/mountain-air-camp.webp',
    icon: '<path d="M3 19l6-10 4 6 2-3 6 7z"/>',
  },
  {
    label: 'Night markets',
    seed: 'night-markets',
    image: '/night-markets.webp',
    icon: '<path d="M5 21V9l7-6 7 6v12"/><path d="M9 21v-6h6v6"/>',
  },
];
