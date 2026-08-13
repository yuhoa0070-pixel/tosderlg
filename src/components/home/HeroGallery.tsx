import { useEffect, useRef, useState } from 'react';
import { heroGalleryData } from '../../lib/constants';

const AUTO_SCROLL_INTERVAL_MS = 5000;
const RESUME_AFTER_INTERACTION_MS = 5000;

// A self-driven scrollLeft tween instead of native scrollTo({behavior:'smooth'}) —
// the native version's timing is inconsistent across browsers/engines, whereas
// setting scrollLeft directly each frame is the same code path a real drag
// already takes, so it reaches the target reliably.
function animateScrollLeft(container: HTMLElement, target: number, duration = 1800) {
  const start = container.scrollLeft;
  const change = target - start;
  if (Math.abs(change) < 1) return;
  const startTime = performance.now();
  const step = (now: number) => {
    const t = Math.min((now - startTime) / duration, 1);
    // ease-in-out sine — the gentlest common easing curve, no sharp
    // acceleration at either end of the slide.
    const eased = (1 - Math.cos(Math.PI * t)) / 2;
    container.scrollLeft = start + change * eased;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export default function HeroGallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const rafId = useRef<number | null>(null);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goToIndexRef = useRef<(index: number) => void>(() => {});
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const applyScrollEffect = () => {
      const containerCenter = track.scrollLeft + track.clientWidth / 2;
      let closestIndex = 0;
      let closestDist = Infinity;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
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
      setActiveIndex(closestIndex);
    };

    const handleScroll = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(applyScrollEffect);
    };

    const stopAutoScroll = () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
    };

    const startAutoScroll = () => {
      stopAutoScroll();
      autoScrollTimer.current = setInterval(() => {
        const cardWidth = track.clientWidth;
        if (!cardWidth) return;
        const count = cardRefs.current.length;
        const currentIndex = Math.round(track.scrollLeft / cardWidth);
        const nextIndex = (currentIndex + 1) % count;
        animateScrollLeft(track, nextIndex * cardWidth);
      }, AUTO_SCROLL_INTERVAL_MS);
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
      animateScrollLeft(track, index * track.clientWidth);
    };

    applyScrollEffect();
    startAutoScroll();
    track.addEventListener('scroll', handleScroll, { passive: true });
    track.addEventListener('pointerdown', pauseAndScheduleResume);
    track.addEventListener('touchstart', pauseAndScheduleResume, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      track.removeEventListener('scroll', handleScroll);
      track.removeEventListener('pointerdown', pauseAndScheduleResume);
      track.removeEventListener('touchstart', pauseAndScheduleResume);
      window.removeEventListener('resize', handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      stopAutoScroll();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  const count = heroGalleryData.length;

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
      </div>

      <button
        type="button"
        className="hero-gallery-arrow prev"
        aria-label="Previous slide"
        onClick={() => goToIndexRef.current((activeIndex - 1 + count) % count)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
      </button>
      <button
        type="button"
        className="hero-gallery-arrow next"
        aria-label="Next slide"
        onClick={() => goToIndexRef.current((activeIndex + 1) % count)}
      >
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
