import type { ReactNode } from 'react';
import { useAppContext } from '../../context/AppContext';
import ThemeToggle from '../shared/ThemeToggle';

export default function HeroGreeting({ children }: { children?: ReactNode }) {
  const { state } = useAppContext();

  const hour = new Date().getHours();
  const name = state.profileName || 'Di Tian';
  const isMorning = hour < 12;
  const text = isMorning ? `Kook kook, ${name}!` : hour < 18 ? `Good afternoon, ${name}` : `Good evening, ${name}`;

  return (
    <div className="hero">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <img
          src={state.theme === 'dark' ? '/logo-full-dark.png' : '/logo-full-transparent.png'}
          alt="Waylo"
          style={{ height: 64, width: 'auto', display: 'block' }}
        />
        <ThemeToggle />
      </div>
      <h1 className="hero-title">
        <span>{text}</span>
      </h1>
      <p className="hero-sub">say less — pick a vibe, drop a spot, start stacking days ✨</p>
      {children}
    </div>
  );
}
