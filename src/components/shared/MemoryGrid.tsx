import type { CSSProperties, SyntheticEvent } from 'react';
import type { Photo } from '../../types';

interface MemoryGridProps {
  photos: Photo[];
  onPhotoClick: (index: number) => void;
  /** Omit to render without the trailing "+" add tile (e.g. AllPhotosView). */
  onAddClick?: () => void;
  /** AllPhotosView hides broken images on error; the map detail-card grid does not (matches original). */
  useImgFallback?: boolean;
  gridId?: string;
  style?: CSSProperties;
}

function momentImgFallback(e: SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.onerror = null;
  e.currentTarget.style.display = 'none';
}

export default function MemoryGrid({ photos, onPhotoClick, onAddClick, useImgFallback, gridId, style }: MemoryGridProps) {
  return (
    <div className="memory-grid" id={gridId} style={style}>
      {photos.map((p, i) => (
        <div className="memory-tile" key={i} onClick={() => onPhotoClick(i)}>
          <img src={p.src} onError={useImgFallback ? momentImgFallback : undefined} />
        </div>
      ))}
      {onAddClick && (
        <div className="memory-add" onClick={onAddClick}>
          +
        </div>
      )}
    </div>
  );
}
