import type { Stop } from '../../types';

interface StopCardProps {
  stop: Stop;
  mode: 'readonly' | 'editable';
  onEdit?: () => void;
  onRemove?: () => void;
}

function isImgIcon(emoji: string | undefined): boolean {
  return !!emoji && emoji.startsWith('data:image');
}

export default function StopCard({ stop, mode, onEdit, onRemove }: StopCardProps) {
  const iconSize = mode === 'readonly' ? 38 : 32;

  const icon = isImgIcon(stop.emoji) ? (
    <img
      src={stop.emoji}
      style={{ width: iconSize, height: iconSize, borderRadius: 8, objectFit: 'contain', flexShrink: 0 }}
    />
  ) : (
    <span style={{ fontSize: mode === 'readonly' ? 34 : 28, flexShrink: 0, lineHeight: 1 }}>
      {stop.emoji || '📍'}
    </span>
  );

  if (mode === 'readonly') {
    return (
      <div className="stop-card">
        {icon}
        <div className="stop-body">
          <div className="stop-title">{stop.title}</div>
          <div className="stop-sub">{stop.sub}</div>
        </div>
        <div className="stop-time" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          {stop.time}
        </div>
      </div>
    );
  }

  return (
    <div className="stop-card">
      <div className="grip">&#8942;&#8942;</div>
      {icon}
      <div className="stop-body">
        <div className="stop-time" style={{ marginBottom: 2 }}>
          {stop.time}
        </div>
        <div className="stop-title">{stop.title}</div>
      </div>
      <div className="stop-controls">
        <span title="Edit" style={{ cursor: 'pointer' }} onClick={onEdit}>
          &#9998;
        </span>
        <span title="Remove" style={{ cursor: 'pointer' }} onClick={onRemove}>
          &times;
        </span>
      </div>
    </div>
  );
}
