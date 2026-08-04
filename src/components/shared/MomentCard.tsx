import type { MomentGroup } from '../../types';

interface MomentCardProps {
  group: MomentGroup;
  isSample: boolean;
  onClick: (group: MomentGroup, isSample: boolean) => void;
}

function momentImgFallback(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none';
}

export default function MomentCard({ group, isSample, onClick }: MomentCardProps) {
  const words = group.title.split(' ');
  const verb = words[0] || '';
  const rest = words.slice(1).join(' ');
  const stackPhotos = group.photos.slice(0, 3);

  return (
    <div
      className="moment-card"
      style={isSample ? { opacity: 0.85 } : undefined}
      onClick={() => onClick(group, isSample)}
    >
      <div className="moment-time">
        {group.time}
        {isSample ? (
          <>
            {' · '}
            <span style={{ color: 'var(--text-muted)' }}>example</span>
          </>
        ) : null}
      </div>
      <div className="moment-title">
        <b>{verb}</b> {rest}
      </div>
      <div className="moment-stack">
        {stackPhotos.map((p, i) => {
          const rev = stackPhotos.length - 1 - i;
          const rot = rev * 7;
          const left = rev * 26;
          return (
            <img
              key={i}
              className="moment-stack-img"
              src={p.src}
              onError={momentImgFallback}
              style={{
                left: `${left}px`,
                width: `${100 - rev * 10}px`,
                transform: `rotate(${rot}deg)`,
                zIndex: 10 - rev,
              }}
            />
          );
        })}
        <div className="moment-count">
          {group.photos.length} <span>&#8594;</span>
        </div>
      </div>
    </div>
  );
}
