import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { Language } from '../../types';

interface TripSuccessCelebrationProps {
  open: boolean;
  onClose: () => void;
  onViewItinerary: () => void;
  friendImageSrc: string;
  language: Language;
}

const SETTLE_DELAY_MS = 2500;
const FADE_DURATION_MS = 400;

const WAYLO_COLORS = ['#2ECC71', '#6FE7B4', '#FF8A73', '#FFD83D', '#7FB8FF'];

const FIREWORK_ORIGINS = [
  { x: 12, y: -4, delay: 300 },
  { x: 88, y: -2, delay: 480 },
  { x: 50, y: 40, delay: 650 },
];
const PARTICLES_PER_BURST = 12;
const CONFETTI_COUNT = 14;

type ParticleStyle = CSSProperties & { '--tx': string; '--ty': string };
type ConfettiStyle = CSSProperties & { '--dx': string; '--rot': string };

function buildFireworkParticles(seed: number) {
  return Array.from({ length: PARTICLES_PER_BURST }, (_, i) => {
    const angle = (i / PARTICLES_PER_BURST) * Math.PI * 2;
    const distance = 30 + ((i * 7 + seed * 11) % 20);
    return {
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      color: WAYLO_COLORS[(i + seed) % WAYLO_COLORS.length],
    };
  });
}

function buildConfetti() {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    key: i,
    left: 32 + ((i * 17) % 36),
    dx: ((i * 37) % 90) - 45,
    rot: (i * 53) % 360,
    delay: 350 + (i % 6) * 90,
    duration: 1150 + (i % 4) * 130,
    shape: i % 2 === 0 ? 'rect' : 'circle',
    color: WAYLO_COLORS[(i + 2) % WAYLO_COLORS.length],
  }));
}

type Phase = 'active' | 'fading' | 'settled';

export default function TripSuccessCelebration({
  open,
  onClose,
  onViewItinerary,
  friendImageSrc,
  language,
}: TripSuccessCelebrationProps) {
  const km = language === 'km';
  const [phase, setPhase] = useState<Phase>('active');
  const [reduceMotion, setReduceMotion] = useState(false);
  const timersRef = useRef<number[]>([]);

  const fireworks = useMemo(
    () => FIREWORK_ORIGINS.map((origin, index) => ({ ...origin, particles: buildFireworkParticles(index) })),
    [],
  );
  const confetti = useMemo(buildConfetti, []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(query.matches);
    const handleChange = () => setReduceMotion(query.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    if (!open) {
      setPhase('active');
      return;
    }
    if (reduceMotion) {
      setPhase('settled');
      return;
    }
    const fadeTimer = window.setTimeout(() => setPhase('fading'), SETTLE_DELAY_MS);
    const settleTimer = window.setTimeout(() => setPhase('settled'), SETTLE_DELAY_MS + FADE_DURATION_MS);
    timersRef.current = [fadeTimer, settleTimer];
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [open, reduceMotion]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="trip-success-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tripSuccessHeadline"
      aria-describedby="tripSuccessCopy"
    >
      <div className="trip-success-art">
        {!reduceMotion && phase !== 'settled' && (
          <div className={`trip-success-fx${phase === 'fading' ? ' is-fading' : ''}`} aria-hidden="true">
            {fireworks.map((burst, burstIndex) => (
              <span
                key={burstIndex}
                className="firework-burst"
                style={{ left: `${burst.x}%`, top: `${burst.y}%`, animationDelay: `${burst.delay}ms` }}
              >
                {burst.particles.map((particle, particleIndex) => (
                  <span
                    key={particleIndex}
                    className="firework-particle"
                    style={{
                      '--tx': `${particle.tx}px`,
                      '--ty': `${particle.ty}px`,
                      background: particle.color,
                      animationDelay: `${burst.delay}ms`,
                    } as ParticleStyle}
                  />
                ))}
              </span>
            ))}
            {confetti.map((piece) => (
              <span
                key={piece.key}
                className={`trip-confetti-piece trip-confetti-${piece.shape}`}
                style={{
                  left: `${piece.left}%`,
                  background: piece.color,
                  animationDelay: `${piece.delay}ms`,
                  animationDuration: `${piece.duration}ms`,
                  '--dx': `${piece.dx}px`,
                  '--rot': `${piece.rot}deg`,
                } as ConfettiStyle}
              />
            ))}
          </div>
        )}
        <img
          src={friendImageSrc}
          alt=""
          className={`trip-success-friends${reduceMotion ? ' no-anim' : ''}`}
        />
      </div>

      <button
        type="button"
        className={`trip-success-close${reduceMotion ? ' no-anim' : ''}`}
        aria-label={km ? 'បិទ' : 'Close'}
        onClick={onClose}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>

      <div className={`trip-success-card${reduceMotion ? ' no-anim' : ''}`}>
        <span className="trip-success-check" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="m5 13 4 4 10-10" /></svg>
        </span>
        <h2 id="tripSuccessHeadline">{km ? 'ដំណើររក្សាទុករួចរាល់!' : 'Trip saved!'}</h2>
        <p id="tripSuccessCopy">
          {km ? 'ដំណើររបស់អ្នករួចរាល់ហើយ។ ឥឡូវធ្វើឱ្យវាកើតឡើង!' : 'Your adventure is ready. Now make it happen!'}
        </p>
        <div className="trip-success-actions">
          <button type="button" className="btn btn-primary" onClick={onViewItinerary}>
            {km ? 'មើលកាលវិភាគ' : 'View itinerary'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {km ? 'ត្រឡប់ទៅទំព័រដើម' : 'Back to home'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
