export default function AnimatedTravelBackground() {
  return (
    <div className="travel-background" aria-hidden="true">
      <svg
        className="travel-background-atmosphere"
        viewBox="0 0 420 900"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <filter id="travel-cloud-blur" x="-25%" y="-40%" width="150%" height="180%">
            <feGaussianBlur stdDeviation="2.6" />
          </filter>
          <filter id="travel-star-glow" x="-250%" y="-250%" width="600%" height="600%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="travel-stars">
          <circle cx="44" cy="76" r="1.15" />
          <circle cx="365" cy="163" r=".8" />
          <circle cx="318" cy="54" r=".65" />
        </g>

        <g className="travel-cloud travel-cloud-small" filter="url(#travel-cloud-blur)">
          <path d="M278 120c7-15 20-21 34-17 8-17 28-23 43-12 8 6 12 15 12 24 10 0 19 6 22 15H279c-4-3-4-7-1-10Z" />
        </g>
        <g className="travel-cloud travel-cloud-large" filter="url(#travel-cloud-blur)">
          <path d="M319 70c8-18 25-26 43-19 10-21 35-28 54-14 9 7 14 18 14 29 13 0 23 7 27 18H320c-5-4-5-10-1-14Z" />
        </g>
      </svg>

      <svg
        className="travel-background-scenery"
        viewBox="0 0 420 300"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id="travel-hill-rear" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" className="travel-hill-rear-start" />
            <stop offset="1" className="travel-hill-rear-end" />
          </linearGradient>
          <linearGradient id="travel-hill-mid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" className="travel-hill-mid-start" />
            <stop offset="1" className="travel-hill-mid-end" />
          </linearGradient>
          <linearGradient id="travel-hill-front" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" className="travel-hill-front-start" />
            <stop offset="1" className="travel-hill-front-end" />
          </linearGradient>
          <linearGradient id="travel-leaf-light" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" className="travel-leaf-start" />
            <stop offset="1" className="travel-leaf-end" />
          </linearGradient>
          <filter id="travel-rear-softness" x="-8%" y="-16%" width="116%" height="132%">
            <feGaussianBlur stdDeviation="1.35" />
          </filter>
        </defs>

        <g className="travel-hills travel-hills-rear" filter="url(#travel-rear-softness)">
          <path
            fill="url(#travel-hill-rear)"
            d="M-8 153C30 117 64 106 101 128c31 19 55 31 91 9 40-25 69-39 107-10 36 28 66 15 129-26v207H-8Z"
          />
        </g>
        <g className="travel-hills travel-hills-middle">
          <path
            fill="url(#travel-hill-mid)"
            d="M-8 181c42-33 73-45 111-19 37 26 65 30 104 1 37-27 70-25 108 3 35 26 68 26 113-2v144H-8Z"
          />
          <path
            className="travel-hill-mist"
            d="M-8 184c45-29 78-36 113-13 35 23 65 25 103-2 37-26 70-23 108 4 34 24 67 23 112-3v20c-44 25-78 24-113 0-37-26-69-28-106-2-40 28-72 26-108 3-35-23-67-17-109 12Z"
          />
        </g>
        <g className="travel-hills travel-hills-front">
          <path
            fill="url(#travel-hill-front)"
            d="M-8 226c54-26 91-23 131 7 42 32 77 36 122 9 50-30 100-38 183-12v78H-8Z"
          />
        </g>

        <g className="travel-botanical travel-botanical-left">
          <path className="travel-plant-stem" d="M12 305c9-54 18-103 31-152" />
          <path className="travel-plant-stem" d="M28 230c-3-20-9-34-19-47M32 211c12-16 23-27 38-35M38 183c-2-17-7-30-15-41M42 165c10-13 19-22 31-29" />
          <g fill="url(#travel-leaf-light)">
            <path d="M9 183c12 5 18 15 19 30-15-4-23-14-19-30Z" />
            <path d="M70 176c-2 14-13 23-34 27 4-15 15-24 34-27Z" />
            <path d="M22 141c12 6 17 16 17 29-14-4-21-14-17-29Z" />
            <path d="M73 136c-2 13-12 22-30 26 3-14 13-23 30-26Z" />
            <path d="M5 225c12 5 18 15 18 29-14-3-21-13-18-29Z" />
          </g>
        </g>

        <g className="travel-botanical travel-botanical-right">
          <path className="travel-plant-stem" d="M410 305c-8-55-17-102-30-148" />
          <path className="travel-plant-stem" d="M395 234c4-19 10-34 20-47M390 213c-12-16-24-27-39-34M384 184c3-17 8-30 16-41M380 166c-10-13-19-22-31-29" />
          <g fill="url(#travel-leaf-light)">
            <path d="M415 187c-12 4-19 14-20 29 15-3 23-13 20-29Z" />
            <path d="M351 179c2 14 13 23 34 27-4-15-15-24-34-27Z" />
            <path d="M400 142c-12 6-18 16-17 29 14-4 21-14 17-29Z" />
            <path d="M349 137c2 13 12 22 30 26-3-14-13-23-30-26Z" />
            <path d="M417 227c-12 5-18 15-18 29 14-3 21-13 18-29Z" />
          </g>
        </g>
      </svg>
    </div>
  );
}
