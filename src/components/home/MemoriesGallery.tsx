import { useAppContext } from '../../context/AppContext';
import { sampleMemories } from '../../lib/constants';
import { buildRecentMoments } from '../../lib/tripUtils';
import MomentCard from '../shared/MomentCard';

export default function MemoriesGallery() {
  const { state } = useAppContext();
  const groups = buildRecentMoments(state.trips);
  const isSampleFallback = groups.length === 0;
  const display = isSampleFallback ? sampleMemories : groups;

  // Memory collection preview (tap-to-open carousel) lands in a later phase —
  // for now the cards render but are not yet interactive.
  const handleClick = () => {};

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
