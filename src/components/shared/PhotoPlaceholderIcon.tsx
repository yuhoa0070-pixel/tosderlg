export default function PhotoPlaceholderIcon({ className = 'photo-placeholder-icon' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4 16.5 9 12l3 3 4-4.5 4 4.5" />
    </svg>
  );
}
