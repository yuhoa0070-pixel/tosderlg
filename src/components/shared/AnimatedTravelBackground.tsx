const BACKGROUND_IMAGE = '/travel-app-background.png';

export default function AnimatedTravelBackground() {
  return (
    <div className="travel-background" aria-hidden="true">
      <img className="travel-background-base" src={BACKGROUND_IMAGE} alt="" />

      <div className="travel-background-clouds">
        <img src={BACKGROUND_IMAGE} alt="" />
      </div>

      <div className="travel-background-hills">
        <img src={BACKGROUND_IMAGE} alt="" />
      </div>
      <div className="travel-background-leaves travel-background-leaves-left">
        <img src={BACKGROUND_IMAGE} alt="" />
      </div>
      <div className="travel-background-leaves travel-background-leaves-right">
        <img src={BACKGROUND_IMAGE} alt="" />
      </div>

      <svg
        className="travel-background-route"
        viewBox="0 0 853 1844"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <g className="travel-dark-cloud travel-dark-cloud-small">
          <path d="M602 121c7-16 21-23 36-18 8-17 29-23 44-12 8 6 12 15 12 25 10 0 19 6 22 15H602c-4-3-4-7 0-10Z" />
        </g>
        <g className="travel-dark-cloud travel-dark-cloud-large">
          <path d="M704 86c9-19 27-27 45-20 11-22 38-30 58-15 10 7 16 19 16 31 13 0 25 8 29 20H704c-5-5-5-11 0-16Z" />
        </g>

      </svg>
    </div>
  );
}
