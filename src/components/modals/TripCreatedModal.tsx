import { useEffect, useMemo, type CSSProperties } from 'react';
import { useAppContext } from '../../context/AppContext';
import BottomSheetModal from './BottomSheetModal';

const AUTO_DISMISS_MS = 2400;
const FIREWORK_COLORS = ['#2ECC71', '#A57CFF', '#FFD83D', '#FF6584', '#4FD1C5'];
const BURST_ORIGINS = [
  { x: 20, y: 26, delay: 0 },
  { x: 80, y: 20, delay: 180 },
  { x: 50, y: 42, delay: 380 },
  { x: 14, y: 60, delay: 560 },
  { x: 86, y: 56, delay: 720 },
];
const PARTICLES_PER_BURST = 12;

type ParticleStyle = CSSProperties & { '--tx': string; '--ty': string };

interface Particle {
  tx: number;
  ty: number;
  color: string;
}

function buildBurstParticles(seed: number): Particle[] {
  return Array.from({ length: PARTICLES_PER_BURST }, (_, i) => {
    const angle = (i / PARTICLES_PER_BURST) * Math.PI * 2;
    const distance = 38 + ((i * 7 + seed * 13) % 28);
    return {
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      color: FIREWORK_COLORS[(i + seed) % FIREWORK_COLORS.length],
    };
  });
}

export default function TripCreatedModal() {
  const { state, dispatch } = useAppContext();
  const isOpen = state.activeModal === 'tripCreated';
  const km = state.language === 'km';

  const bursts = useMemo(
    () => BURST_ORIGINS.map((origin, index) => ({ ...origin, particles: buildBurstParticles(index) })),
    [],
  );

  function continuePlanning() {
    dispatch({ type: 'CLOSE_MODAL' });
  }

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(continuePlanning, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <BottomSheetModal isOpen={isOpen} onClose={continuePlanning} overlayId="tripCreatedOverlay">
      <div
        className="trip-created-art"
        role="dialog"
        aria-modal="true"
        aria-label={km ? 'ដំណើរត្រូវបានបង្កើតដោយជោគជ័យ' : 'Trip created successfully'}
        onClick={continuePlanning}
      >
        <img src="/waylo-group-of-friends-transparent.png" alt="" className="trip-created-friends" />
      </div>

      {isOpen && (
        <div className="firework-layer" aria-hidden="true">
          {bursts.map((burst, burstIndex) => (
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
        </div>
      )}
    </BottomSheetModal>
  );
}
