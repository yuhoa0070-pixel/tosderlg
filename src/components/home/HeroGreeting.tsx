import type { ReactNode } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getTelegramUser, telegramUserDisplayName } from '../../lib/telegram';

export default function HeroGreeting({ children }: { children?: ReactNode }) {
  const { state } = useAppContext();
  const telegramUser = getTelegramUser();
  const telegramDisplayName = telegramUser ? telegramUserDisplayName(telegramUser) : '';
  const greetingName = telegramDisplayName || state.profileName || 'Traveler';

  return (
    <div className="hero">
      <h1 className="hero-title">
        <span>Hi, {greetingName}</span>
      </h1>
      <p className="hero-sub">
        {state.language === 'km' ? 'ជ្រើសរើសអារម្មណ៍ ទីកន្លែង ហើយចាប់ផ្ដើមរៀបចំដំណើរ ✨' : 'say less — pick a vibe, drop a spot, start stacking days ✨'}
      </p>
      {children}
    </div>
  );
}
