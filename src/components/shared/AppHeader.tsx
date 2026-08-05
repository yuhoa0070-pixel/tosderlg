import { useAppContext } from '../../context/AppContext';
import ThemeToggle from './ThemeToggle';

export default function AppHeader() {
  const { state } = useAppContext();

  return (
    <div className="app-header">
      <img
        src={state.theme === 'dark' ? '/logo-full-dark.png' : '/logo-full-transparent.png'}
        alt="Waylo"
        className="app-header-logo-img"
      />
      <ThemeToggle />
    </div>
  );
}
