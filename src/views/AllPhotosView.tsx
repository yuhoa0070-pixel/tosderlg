import { useAppContext } from '../context/AppContext';
import MemoryGrid from '../components/shared/MemoryGrid';

export default function AllPhotosView() {
  const { state, dispatch } = useAppContext();
  const group = state.activeMomentGroup;
  const trip = group ? state.trips.find((t) => t.id === group.tripId) : undefined;
  const photos = (group?.key && trip?.photos[group.key]) || group?.photos || [];

  function openPhoto(idx: number) {
    if (!group?.key) return;
    dispatch({ type: 'SET_VIEWING_PHOTO', photo: { key: group.key, index: idx } });
    dispatch({ type: 'SET_MEMORY_RETURN_VIEW', view: 'all-photos' });
    dispatch({ type: 'NAVIGATE', view: 'memory' });
  }

  return (
    <section id="view-all-photos" className="active">
      <div className="topbar">
        <div className="icon-btn" onClick={() => dispatch({ type: 'NAVIGATE', view: 'home' })}>
          &#8592;
        </div>
        <div />
      </div>
      <p className="eyebrow" id="allPhotosEyebrow">
        Photo collection
      </p>
      <h1 id="allPhotosTitle">{group?.title ?? ''}</h1>
      <p className="sub" id="allPhotosSub">
        {photos.length} photo{photos.length === 1 ? '' : 's'}
      </p>
      <MemoryGrid photos={photos} onPhotoClick={openPhoto} useImgFallback gridId="allPhotosGrid" style={{ marginTop: 8 }} />
    </section>
  );
}
