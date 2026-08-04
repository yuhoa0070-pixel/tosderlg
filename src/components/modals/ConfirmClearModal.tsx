import { useAppContext } from '../../context/AppContext';
import { clearPersistedState } from '../../context/persistence';
import BottomSheetModal from './BottomSheetModal';

export default function ConfirmClearModal() {
  const { state, dispatch } = useAppContext();
  const isOpen = state.activeModal === 'confirmClear';

  function close() {
    dispatch({ type: 'CLOSE_MODAL' });
  }

  function handleConfirm() {
    // Wipe storage under both the current and legacy keys, then reset
    // in-memory state — CLEAR_ALL_DATA's reducer case already resets
    // currentView to 'home' and activeModal to null.
    clearPersistedState();
    dispatch({ type: 'CLEAR_ALL_DATA' });
  }

  return (
    <BottomSheetModal isOpen={isOpen} onClose={close} overlayId="confirmClearOverlay">
      <h2>Clear all data?</h2>
      <p className="sub" style={{ marginBottom: 20 }}>
        This deletes every saved trip, stop, and photo memory on this device. It can&rsquo;t be undone.
      </p>
      <div className="row2">
        <button className="btn btn-ghost" onClick={close}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={handleConfirm}>
          Clear everything
        </button>
      </div>
    </BottomSheetModal>
  );
}
