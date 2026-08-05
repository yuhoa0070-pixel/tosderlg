import { useAppContext } from '../../context/AppContext';

export default function ThemeToggle() {
  const { state, dispatch } = useAppContext();

  return (
    <div className="theme-toggle" id="themeToggle" role="group" aria-label="Color theme">
      <button
        type="button"
        className={`theme-toggle-opt${state.theme === 'dark' ? ' active' : ''}`}
        data-theme="dark"
        aria-label="Dark mode"
        aria-pressed={state.theme === 'dark'}
        title="Dark mode"
        onClick={() => dispatch({ type: 'SET_THEME', theme: 'dark' })}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
          <path d="M20.5 14.5a8.5 8.5 0 0 1-11-11 8.5 8.5 0 1 0 11 11z" />
        </svg>
      </button>
      <button
        type="button"
        className={`theme-toggle-opt${state.theme === 'light' ? ' active' : ''}`}
        data-theme="light"
        aria-label="Light mode"
        aria-pressed={state.theme === 'light'}
        title="Light mode"
        onClick={() => dispatch({ type: 'SET_THEME', theme: 'light' })}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
      </button>
    </div>
  );
}
