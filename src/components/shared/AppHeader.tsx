import ThemeToggle from './ThemeToggle';

function WayloMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 42 C18 60, 30 60, 32 48 C34 36, 46 36, 48 48 C50 60, 62 60, 64 42 C66 26, 74 18, 82 18"
        fill="none"
        stroke="#2ECC71"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="83" cy="17" r="6.5" fill="#F5B335" />
    </svg>
  );
}

export default function AppHeader() {
  return (
    <div className="app-header">
      <div className="app-header-logo">
        <WayloMark />
        <span>WAYLO</span>
      </div>
      <ThemeToggle />
    </div>
  );
}
