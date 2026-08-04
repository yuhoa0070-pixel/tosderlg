import type { ReactNode } from 'react';
import { useAppContext } from '../../context/AppContext';

export default function HeroGreeting({ children }: { children?: ReactNode }) {
  const { state } = useAppContext();

  const hour = new Date().getHours();
  const name = state.profileName || 'Di Tian';
  const isMorning = hour < 12;
  const text = isMorning ? `Kook kook, ${name}!` : hour < 18 ? `Good afternoon, ${name}` : `Good evening, ${name}`;

  return (
    <div className="hero">
      <p className="hero-eyebrow">Waylo</p>
      <h1 className="hero-title">
        <span>{text}</span>
      </h1>
      <p className="hero-sub">say less — pick a vibe, drop a spot, start stacking days ✨</p>
      {children}
    </div>
  );
}
