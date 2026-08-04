import type { Theme } from '../types';

interface TelegramUser {
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

type TelegramEvent = 'themeChanged' | 'viewportChanged';

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  colorScheme: 'light' | 'dark';
  viewportHeight: number;
  viewportStableHeight: number;
  initDataUnsafe?: { user?: TelegramUser };
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
