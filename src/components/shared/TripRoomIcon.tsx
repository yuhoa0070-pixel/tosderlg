interface TripRoomIconProps {
  className?: string;
  size?: number;
}

export default function TripRoomIcon({ className, size = 20 }: TripRoomIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8.5" cy="8" r="3" />
      <path d="M3 19c0-3.4 2.2-5.5 5.5-5.5S14 15.6 14 19" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5 14.2c.5-.2 1-.2 1.6-.2 2.6 0 4.4 1.7 4.4 4.5" />
    </svg>
  );
}
