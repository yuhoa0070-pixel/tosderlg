import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { useAppContext } from '../../context/AppContext';
import BottomSheetModal from './BottomSheetModal';

const MC_COLORS = ['mc-card-green', 'mc-card-lavender', 'mc-card-peach'];

function momentImgFallback(e: SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none';
}

// Ported from initMcCarousel(): tracks the "active" slide via
// getBoundingClientRect proximity to the track's horizontal center on
// scroll (debounced), rather than IntersectionObserver — this mirrors the
// original's approach 1:1.
export default function MemoryCollectionModal() {
  const { state, dispatch } = useAppContext();
  const isOpen = state.activeModal === 'memoryCollection';
  const group = state.activeMomentGroup;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<number | undefined>(undefined);
  const [activeIdx, setActiveIdx] = useState(0);
  const [viewAllStatus, setViewAllStatus] = useState('');

  const photos = group?.photos ?? [];
  const isSample = group?.tripId == null;

  function updateActive() {
    const track = trackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll<HTMLElement>('.mc-feature-card');
    const rect = track.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    let closestIdx = 0;
    let closestDist = Infinity;
    cards.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const dist = Math.abs(center - (r.left + r.width / 2));
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });
    setActiveIdx(closestIdx);
  }

  useEffect(() => {
    if (!isOpen) return;
    setViewAllStatus('');
    setActiveIdx(0);
    const timeout = window.setTimeout(() => {
      const track = trackRef.current;
      if (!track) return;
      const cards = track.querySelectorAll<HTMLElement>('.mc-feature-card');
      if (cards.length) {
        const first = cards[0];
        track.scrollLeft = first.offsetLeft - (track.clientWidth - first.clientWidth) / 2;
      }
      updateActive();
    }, 60);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, group]);

  function handleScroll() {
    window.clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = window.setTimeout(updateActive, 50);
  }

  function scrollToCard(i: number) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelectorAll<HTMLElement>('.mc-feature-card')[i];
    if (!card) return;
    track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.clientWidth) / 2, behavior: 'smooth' });
  }

  function close() {
    dispatch({ type: 'CLOSE_MODAL' });
  }

  function handleViewAll() {
    if (isSample || !group) {
      setViewAllStatus("This is a sample — add your own photos from a trip's map explorer to see them here.");
      return;
    }
    dispatch({ type: 'CLOSE_MODAL' });
    dispatch({ type: 'NAVIGATE', view: 'all-photos' });
  }

  return (
    <BottomSheetModal isOpen={isOpen} onClose={close} overlayId="memoryCollectionOverlay">
      <div style={{ position: 'relative', textAlign: 'center', marginBottom: 14 }}>
        <h2 style={{ marginBottom: 2 }}>{group?.title ?? ''}</h2>
        <p className="mc-sub">
          {photos.length} photo{photos.length > 1 ? 's' : ''} saved from this stop
        </p>
      </div>

      <div className="mc-carousel-wrap">
        <div className="mc-carousel-track" ref={trackRef} onScroll={handleScroll}>
          {photos.map((p, i) => (
            <div key={i} className={`mc-feature-card ${MC_COLORS[i % MC_COLORS.length]}${i === activeIdx ? ' active' : ''}`}>
              <div className="mc-collage">
                <img src={p.src} alt="" onError={momentImgFallback} />
              </div>
              <div className="mc-feature-title">{group?.title}</div>
              <div className="mc-feature-desc">{p.caption ? p.caption : `Photo ${i + 1} of ${photos.length} from this stop`}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mc-dots">
        {photos.map((_, i) => (
          <div key={i} className={`mc-dot${i === activeIdx ? ' active' : ''}`} onClick={() => scrollToCard(i)} />
        ))}
      </div>

      <button className="btn btn-primary" onClick={handleViewAll}>
        View all photos
      </button>
      <div className="status" style={{ marginTop: 8 }}>
        {viewAllStatus}
      </div>
    </BottomSheetModal>
  );
}
