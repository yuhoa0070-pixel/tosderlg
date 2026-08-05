import type { Theme } from '../types';

interface TelegramUser {
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

type TelegramEvent = 'themeChanged' | 'viewportChanged';

interface TelegramLocationData {
  latitude: number;
  longitude: number;
}

interface TelegramLocationManager {
  isInited: boolean;
  isLocationAvailable: boolean;
  isAccessRequested: boolean;
  isAccessGranted: boolean;
  init: (callback?: () => void) => void;
  getLocation: (callback: (data: TelegramLocationData | null) => void) => void;
  openSettings: () => void;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  colorScheme: 'light' | 'dark';
  viewportHeight: number;
  viewportStableHeight: number;
  initDataUnsafe?: { user?: TelegramUser };
  LocationManager?: TelegramLocationManager;
  openTelegramLink?: (url: string) => void;
  onEvent: (eventType: TelegramEvent, callback: () => void) => void;
  offEvent: (eventType: TelegramEvent, callback: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function getTelegramUser(): TelegramUser | null {
  return getTelegramWebApp()?.initDataUnsafe?.user ?? null;
}

export function telegramUserDisplayName(user: TelegramUser): string {
  return [user.first_name, user.last_name].filter(Boolean).join(' ');
}

const VIEWPORT_HEIGHT_VAR = '--tg-viewport-height';

export function initTelegramWebApp(onThemeChange: (theme: Theme) => void): (() => void) | void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;

  webApp.ready();
  webApp.expand();
  onThemeChange(webApp.colorScheme === 'light' ? 'light' : 'dark');

  const handleThemeChanged = () => {
    onThemeChange(webApp.colorScheme === 'light' ? 'light' : 'dark');
  };
  webApp.onEvent('themeChanged', handleThemeChanged);

  // Telegram's WebView doesn't shrink the CSS layout viewport when the
  // on-screen keyboard opens, so `position:fixed; inset:0` elements (the
  // bottom-sheet modals, bottom nav) end up anchored below the visible
  // area. Track Telegram's own reported viewport height instead and drive
  // full-height fixed elements off a CSS var, updated on every resize.
  const setViewportHeightVar = () => {
    document.documentElement.style.setProperty(VIEWPORT_HEIGHT_VAR, `${webApp.viewportStableHeight}px`);
  };
  setViewportHeightVar();
  webApp.onEvent('viewportChanged', setViewportHeightVar);

  return () => {
    webApp.offEvent('themeChanged', handleThemeChanged);
    webApp.offEvent('viewportChanged', setViewportHeightVar);
  };
}

/**
 * True when Telegram's LocationManager is present, meaning we should use it
 * instead of the raw browser Geolocation API — inside Telegram's WebView,
 * navigator.geolocation can be blocked/unreliable, while LocationManager
 * goes through Telegram's own native permission flow.
 */
export function hasTelegramLocationManager(): boolean {
  return !!getTelegramWebApp()?.LocationManager;
}

const LOCATION_MANAGER_INIT_TIMEOUT_MS = 2500;

// Some client versions log "LocationManager is not supported" and never
// invoke init()'s callback at all, rather than calling back to report
// failure. Without a timeout, awaiting that callback hangs forever and the
// caller never falls back to browser geolocation.
function ensureLocationManagerInited(manager: TelegramLocationManager): Promise<void> {
  return new Promise((resolve) => {
    if (manager.isInited) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, LOCATION_MANAGER_INIT_TIMEOUT_MS);
    manager.init(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}

/**
 * One-shot location fetch via Telegram's LocationManager. There's no native
 * "watch" API here (unlike navigator.geolocation.watchPosition), so callers
 * that want continuous tracking should poll this on an interval.
 */
export async function getTelegramLocation(): Promise<{ lat: number; lng: number } | null> {
  const webApp = getTelegramWebApp();
  const manager = webApp?.LocationManager;
  if (!manager) return null;

  await ensureLocationManagerInited(manager);
  if (!manager.isLocationAvailable) return null;

  return new Promise((resolve) => {
    manager.getLocation((data) => {
      resolve(data ? { lat: data.latitude, lng: data.longitude } : null);
    });
  });
}
