import type { MomentGroup } from '../../types';

interface MomentCardProps {
  group: MomentGroup;
  isSample: boolean;
  onClick: (group: MomentGroup, isSample: boolean) => void;
}

export default function MomentCard({ group, isSample, onClick }: MomentCardProps) {
  const words = group.title.split(' ');
  const verb = words[0] || '';
  const rest = words.slice(1).join(' ');
  const cover = group.photos[0];

  return (
    <div className="moment-card" onClick={() => onClick(group, isSample)}>
      {cover ? <img className="moment-card-photo" src={cover.src} alt="" /> : null}
      <div className="moment-card-scrim" />
      <div className="moment-card-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-2h6.6l1.2 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
        {group.photos.length}
      </div>
      <div className="moment-card-content">
        <div className="moment-card-title">
          <b>{verb}</b> {rest}
        </div>
        <div className="moment-card-sub-row">
          <div className="moment-card-sub">
            {group.time}
            {isSample ? ' · example' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
