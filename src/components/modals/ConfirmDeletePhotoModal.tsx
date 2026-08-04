import { useAppContext } from '../../context/AppContext';
import BottomSheetModal from './BottomSheetModal';

export default function ConfirmDeletePhotoModal() {
  const { state, dispatch } = useAppContext();
  const isOpen = state.activeModal === 'confirmDeletePhoto';

  function close() {
    dispatch({ type: 'CLOSE_MODAL' });
  }

  function handleDelete() {
    const viewing = state.viewingPhoto;
    if (viewing) {
      dispatch({ type: 'DELETE_PHOTO', key: viewing.key, index: viewing.index });
    }
    dispatch({ type: 'CLOSE_MODAL' });
    dispatch({ type: 'NAVIGATE', view: state.memoryReturnView });
  }

  return (
    <BottomSheetModal isOpen={isOpen} onClose={close} overlayId="confirmDeletePhotoOverlay">
      <h2>Delete this photo?</h2>
      <p className="sub" style={{ marginBottom: 20 }}>
        This memory and its caption will be removed. It can't be undone.
      </p>
      <div className="row2">
        <button className="btn btn-ghost" onClick={close}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={handleDelete}>
          Delete photo
        </button>
      </div>
    </BottomSheetModal>
  );
}
