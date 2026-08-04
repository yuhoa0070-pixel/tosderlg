import { useAppContext } from '../../context/AppContext';
import { sampleMemories } from '../../lib/constants';
import { buildRecentMoments } from '../../lib/tripUtils';
import type { MomentGroup } from '../../types';
import MomentCard from '../shared/MomentCard';

export default function MemoriesGallery() {
  const { state, dispatch } = useAppContext();
  const groups = buildRecentMoments(state.trips);
  const isSampleFallback = groups.length === 0;
  const display = isSampleFallback ? sampleMemories : groups;

  // Tapping a moment card opens the carousel preview (openMemoryCollection
  // in the original) — "View all photos" inside it navigates to AllPhotosView.
  const handleClick = (group: MomentGroup, _isSample: boolean) => {
    dispatch({ type: 'SET_ACTIVE_MOMENT_GROUP', group });
    dispatch({ type: 'OPEN_MODAL', modal: 'memoryCollection' });
  };

  return (
    <div id="memoriesWrap" style={{ marginBottom: 24 }}>
      <p className="eyebrow" style={{ marginBottom: 8 }}>
        Memories
      </p>
      <div id="memoriesGallery">
        {display.map((group, i) => (
          <MomentCard key={group.key ?? i} group={group} isSample={isSampleFallback} onClick={handleClick} />
        ))}
      </div>
    </div>
  );
}
