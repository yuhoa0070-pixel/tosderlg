import type { Theme } from '../types';

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  colorScheme: 'light' | 'dark';
  onEvent: (eventType: 'themeChanged', callback: () => void) => void;
  offEvent: (eventType: 'themeChanged', callback: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

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
  return () => webApp.offEvent('themeChanged', handleThemeChanged);
}
