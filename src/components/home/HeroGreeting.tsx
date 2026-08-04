import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAppContext } from '../../context/AppContext';
import { playCluck } from '../../lib/audio';

export default function HeroGreeting({ children }: { children?: ReactNode }) {
  const { state } = useAppContext();
  const [bounce, setBounce] = useState(false);
  const hasFiredRef = useRef(false);

  const hour = new Date().getHours();
  const name = state.profileName || 'Di Tian';
  const isMorning = hour < 12;
  const isNight = hour >= 18;
  const text = isMorning ? `Kook kook, ${name}!` : hour < 18 ? `Good afternoon, ${name}` : `Good evening, ${name}`;

  useEffect(() => {
    if (!isNight || hasFiredRef.current) return;
    hasFiredRef.current = true;
    setBounce(false);
    // restart the animation on the next frame, mirroring the original's
    // classList remove/reflow/add sequence
    requestAnimationFrame(() => {
      setBounce(true);
      playCluck();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNight]);

  return (
    <div className="hero">
      <p className="hero-eyebrow">Waylo</p>
      <h1 className="hero-title">
        <span>{text}</span>{' '}
        <span
          className={`wave-sticker${bounce ? ' night-bounce' : ''}`}
          role="img"
          aria-label="waving hand"
          onAnimationEnd={() => setBounce(false)}
        >
          👋
        </span>
      </h1>
      <p className="hero-sub">say less — pick a vibe, drop a spot, start stacking days ✨</p>
      {children}
    </div>
  );
}
