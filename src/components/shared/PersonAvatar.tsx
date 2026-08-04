// Generic person-silhouette fallback icon used by the profile avatar when no
// photo has been set — ported verbatim from the original's personAvatarSVG().
export default function PersonAvatar() {
  return (
    <svg viewBox="0 0 24 24" width="58%" height="58%" style={{ display: 'block' }}>
      <circle cx="12" cy="8.6" r="4" fill="var(--text-muted)" />
      <path d="M3.5 21c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5" fill="var(--accent)" />
    </svg>
  );
}
