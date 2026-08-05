import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import type { Theme } from '../../types';

export default function ThemeSkyTransition() {
  const { state } = useAppContext();
  const previousTheme = useRef(state.theme);
  const [transitionTheme, setTransitionTheme] = useState<Theme | null>(null);

  useEffect(() => {
    if (previousTheme.current === state.theme) return;
    previousTheme.current = state.theme;
    setTransitionTheme(state.theme);

    const timer = window.setTimeout(() => setTransitionTheme(null), 1200);
    return () => window.clearTimeout(timer);
  }, [state.theme]);

  if (!transitionTheme) return null;

  return (
    <div className={`theme-sky-transition ${transitionTheme}`} aria-hidden="true">
      <div className="theme-sky-wash" />
      {transitionTheme === 'light' ? (
        <svg className="theme-celestial theme-sun-rise" viewBox="0 0 64 64">
          <g fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
            <circle cx="32" cy="32" r="12" fill="currentColor" stroke="none" />
            <path d="M32 4v8M32 52v8M4 32h8M52 32h8M12.2 12.2l5.7 5.7M46.1 46.1l5.7 5.7M12.2 51.8l5.7-5.7M46.1 17.9l5.7-5.7" />
          </g>
        </svg>
      ) : (
        <svg className="theme-celestial theme-moon-set" viewBox="0 0 64 64">
          <path fill="currentColor" d="M48.8 43.3A23 23 0 0 1 22 6.9 25 25 0 1 0 57 39a23 23 0 0 1-8.2 4.3Z" />
          <circle cx="50" cy="13" r="2.2" fill="currentColor" opacity=".72" />
          <circle cx="57" cy="22" r="1.4" fill="currentColor" opacity=".5" />
        </svg>
      )}
    </div>
  );
}
