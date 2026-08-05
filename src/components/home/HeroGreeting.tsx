import type { ReactNode } from 'react';
import { useAppContext } from '../../context/AppContext';
import AppHeader from '../shared/AppHeader';

export default function HeroGreeting({ children }: { children?: ReactNode }) {
  const { state } = useAppContext();

  return (
    <div className="hero">
      <AppHeader />
      <h1 className="hero-title">
        <span>Kook Kook</span>
      </h1>
      <p className="hero-sub">
        {state.language === 'km' ? 'ជ្រើសរើសអារម្មណ៍ ទីកន្លែង ហើយចាប់ផ្ដើមរៀបចំដំណើរ ✨' : 'say less — pick a vibe, drop a spot, start stacking days ✨'}
      </p>
      {children}
    </div>
  );
}
