import { heroGalleryData } from '../../lib/constants';

export default function HeroGallery() {
  return (
    <div className="hero-gallery">
      {heroGalleryData.map((card) => (
        <div
          key={card.seed}
          className="hero-gallery-card"
          style={{
            background: `linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.05) 55%), url('https://picsum.photos/seed/${card.seed}/260/300') center/cover`,
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
  );
}
