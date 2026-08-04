import { useState } from 'react';
import BottomNav, { type NavId } from './components/nav/BottomNav';

function App() {
  const [active, setActive] = useState<NavId>('navHome');

  return (
    <div className="app">
      <div className="app-glow" />

      <section id="view-home" className="active">
        <div className="hero">
          <p className="hero-eyebrow">Waylo</p>
          <h1 className="hero-title">
            <span>Good morning</span>
          </h1>
          <p className="hero-sub">say less — pick a vibe, drop a spot, start stacking days ✨</p>
        </div>
      </section>

      <BottomNav
        active={active}
        disabled={false}
        onHome={() => setActive('navHome')}
        onItinerary={() => setActive('navItinerary')}
        onMap={() => setActive('navMap')}
        onProfile={() => setActive('navProfile')}
      />
    </div>
  );
}

export default App;
