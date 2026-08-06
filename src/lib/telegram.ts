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
  horizontal_accuracy: number | null;
}

export type TelegramLocationResult =
  | { status: 'success'; lat: number; lng: number; accuracy: number | null }
  | { status: 'denied' }
  | { status: 'unavailable' };

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

  // Telegram's WebView doesn't always shrink the CSS layout viewport when
  // the keyboard opens. Use the smaller of Telegram's live height and the
  // browser Visual Viewport so fixed sheets follow the actually visible area.
  // `viewportStableHeight` must not be used here because it intentionally
  // excludes temporary changes such as the on-screen keyboard.
  const setViewportHeightVar = () => {
    const telegramHeight = webApp.viewportHeight || webApp.viewportStableHeight;
    const visualHeight = window.visualViewport?.height;
    const visibleHeight = visualHeight && visualHeight > 0
      ? Math.min(telegramHeight, visualHeight)
      : telegramHeight;
    document.documentElement.style.setProperty(VIEWPORT_HEIGHT_VAR, `${Math.round(visibleHeight)}px`);
  };
  setViewportHeightVar();
  webApp.onEvent('viewportChanged', setViewportHeightVar);
  window.visualViewport?.addEventListener('resize', setViewportHeightVar);
  window.addEventListener('resize', setViewportHeightVar);

  return () => {
    webApp.offEvent('themeChanged', handleThemeChanged);
    webApp.offEvent('viewportChanged', setViewportHeightVar);
    window.visualViewport?.removeEventListener('resize', setViewportHeightVar);
    window.removeEventListener('resize', setViewportHeightVar);
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
const LOCATION_REQUEST_TIMEOUT_MS = 12000;

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
    try {
      manager.init(() => {
        clearTimeout(timer);
        resolve();
      });
    } catch {
      clearTimeout(timer);
      resolve();
    }
  });
}

/**
 * One-shot location fetch via Telegram's LocationManager. There's no native
 * "watch" API here (unlike navigator.geolocation.watchPosition), so callers
 * that want continuous tracking should poll this on an interval.
 */
export async function getTelegramLocation(): Promise<TelegramLocationResult> {
  const webApp = getTelegramWebApp();
  const manager = webApp?.LocationManager;
  if (!manager) return { status: 'unavailable' };

  await ensureLocationManagerInited(manager);
  if (!manager.isLocationAvailable) return { status: 'unavailable' };

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: TelegramLocationResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => finish({ status: 'unavailable' }), LOCATION_REQUEST_TIMEOUT_MS);

    try {
      manager.getLocation((data) => {
        if (data) {
          finish({
            status: 'success',
            lat: data.latitude,
            lng: data.longitude,
            accuracy: typeof data.horizontal_accuracy === 'number' ? data.horizontal_accuracy : null,
          });
          return;
        }
        finish(manager.isAccessRequested && !manager.isAccessGranted ? { status: 'denied' } : { status: 'unavailable' });
      });
    } catch {
      finish({ status: 'unavailable' });
    }
  });
}

/** Opens Telegram's native bot-location settings from a direct user action. */
export function openTelegramLocationSettings(): boolean {
  const manager = getTelegramWebApp()?.LocationManager;
  if (!manager?.isInited || !manager.isLocationAvailable) return false;
  manager.openSettings();
  return true;
}
