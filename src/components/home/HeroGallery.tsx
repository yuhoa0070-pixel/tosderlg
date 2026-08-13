import { useEffect, useRef, useState } from 'react';
import { heroGalleryData } from '../../lib/constants';

const AUTO_SCROLL_INTERVAL_MS = 4000;
const RESUME_AFTER_INTERACTION_MS = 5000;
const COUNT = heroGalleryData.length;

// A plain, instant scrollLeft jump — no animated tween. Animated scrolling
// (both native scrollTo({behavior:'smooth'}) and a hand-rolled rAF tween)
// kept producing visible stutter, so the card change now just snaps.
function jumpScrollLeft(container: HTMLElement, target: number, onDone?: () => void) {
  container.scrollLeft = target;
  onDone?.();
}

export default function HeroGallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const rafId = useRef<number | null>(null);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goToIndexRef = useRef<(index: number) => void>(() => {});
  const goToNextRef = useRef<() => void>(() => {});
  const cardCenters = useRef<number[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Each card's center only changes on layout/resize, never during a
    // scroll — reading offsetLeft/offsetWidth from inside the scroll-driven
    // loop below forces a synchronous layout on every single frame, right
    // while that same loop is also writing scrollLeft. That read/write
    // interleaving is what causes the stutter; caching the positions once
    // turns the hot path into pure arithmetic plus style writes.
    const recalcCardCenters = () => {
      cardCenters.current = cardRefs.current.map((card) => (card ? card.offsetLeft + card.offsetWidth / 2 : 0));
    };

    const applyScrollEffect = () => {
      const containerCenter = track.scrollLeft + track.clientWidth / 2;
      let closestIndex = 0;
      let closestDist = Infinity;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const cardCenter = cardCenters.current[i] ?? 0;
        const distance = Math.abs(cardCenter - containerCenter);
        const progress = Math.min(distance / (track.clientWidth || 1), 1);
        const scale = 1 - progress * 0.08;
        const opacity = 1 - progress * 0.45;
        card.style.transform = `scale(${scale})`;
        card.style.opacity = String(opacity);
        if (distance < closestDist) {
          closestDist = distance;
          closestIndex = i;
        }
      });
      setActiveIndex(closestIndex % COUNT);
    };

    const handleScroll = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(applyScrollEffect);
    };

    const handleResize = () => {
      recalcCardCenters();
      handleScroll();
    };

    const stopAutoScroll = () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
    };

    // Advance forward by exactly one card-width every time, including the
    // step from the last real card onto the trailing clone of the first
    // card — then, once that identical-looking clone has fully slid into
    // place, snap back to the real first card with no animation at all.
    // Because the clone is pixel-for-pixel the same as the real card, that
    // snap is invisible, so looping back to the start never has to cover
    // the whole track's width in one fast, jarring slide (the "blink").
    const goToNext = () => {
      const cardWidth = track.clientWidth;
      if (!cardWidth) return;
      const currentIndex = Math.round(track.scrollLeft / cardWidth);
      const nextIndex = currentIndex + 1;
      jumpScrollLeft(track, nextIndex * cardWidth, () => {
        if (nextIndex >= COUNT) track.scrollLeft = 0;
      });
    };
    goToNextRef.current = goToNext;

    const startAutoScroll = () => {
      stopAutoScroll();
      autoScrollTimer.current = setInterval(goToNext, AUTO_SCROLL_INTERVAL_MS);
    };

    // Pause on any user-driven interaction, resume a while after it ends —
    // avoids fighting a swipe in progress or restarting mid-gesture.
    const pauseAndScheduleResume = () => {
      stopAutoScroll();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      resumeTimer.current = setTimeout(startAutoScroll, RESUME_AFTER_INTERACTION_MS);
    };

    goToIndexRef.current = (index: number) => {
      pauseAndScheduleResume();
      jumpScrollLeft(track, index * track.clientWidth);
    };

    recalcCardCenters();
    applyScrollEffect();
    startAutoScroll();
    track.addEventListener('scroll', handleScroll, { passive: true });
    track.addEventListener('pointerdown', pauseAndScheduleResume);
    track.addEventListener('touchstart', pauseAndScheduleResume, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      track.removeEventListener('scroll', handleScroll);
      track.removeEventListener('pointerdown', pauseAndScheduleResume);
      track.removeEventListener('touchstart', pauseAndScheduleResume);
      window.removeEventListener('resize', handleResize);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      stopAutoScroll();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  const handleNextClick = () => {
    goToIndexRef.current(activeIndex); // pauses autoplay + schedules resume
    goToNextRef.current();
  };

  return (
    <div className="hero-gallery-wrap">
      <div className="hero-gallery" ref={trackRef}>
        {heroGalleryData.map((card, i) => (
          <div
            key={card.seed}
            className="hero-gallery-card"
            ref={(node) => {
              if (node) cardRefs.current[i] = node;
            }}
            style={{
              background: `linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.05) 55%), url('${card.image ?? `https://picsum.photos/seed/${card.seed}/260/300`}') center/cover`,
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              dangerouslySetInnerHTML={{ __html: card.icon }}
            />
            <span>{card.label}</span>
          </div>
        ))}
        {/* Trailing clone of the first card — see goToNext for why this exists. */}
        <div
          aria-hidden="true"
          className="hero-gallery-card"
          ref={(node) => {
            if (node) cardRefs.current[COUNT] = node;
          }}
          style={{
            background: `linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.05) 55%), url('${heroGalleryData[0].image ?? `https://picsum.photos/seed/${heroGalleryData[0].seed}/260/300`}') center/cover`,
          }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            dangerouslySetInnerHTML={{ __html: heroGalleryData[0].icon }}
          />
          <span>{heroGalleryData[0].label}</span>
        </div>
      </div>

      <button
        type="button"
        className="hero-gallery-arrow prev"
        aria-label="Previous slide"
        onClick={() => goToIndexRef.current((activeIndex - 1 + COUNT) % COUNT)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
      </button>
      <button type="button" className="hero-gallery-arrow next" aria-label="Next slide" onClick={handleNextClick}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
      </button>

      <div className="hero-gallery-dots" role="tablist" aria-label="Discover more slides">
        {heroGalleryData.map((card, i) => (
          <button
            key={card.seed}
            type="button"
            role="tab"
            aria-label={card.label}
            aria-selected={i === activeIndex}
            className={`hero-gallery-dot${i === activeIndex ? ' active' : ''}`}
            onClick={() => goToIndexRef.current(i)}
          />
        ))}
      </div>
    </div>
  );
}
