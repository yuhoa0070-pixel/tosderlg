import { useAppContext } from '../../context/AppContext';
import { useActiveTrip } from '../../hooks/useActiveTrip';
import PackingChecklist from '../shared/PackingChecklist';
import BottomSheetModal from './BottomSheetModal';

export default function PackingChecklistModal() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();
  const isOpen = state.activeModal === 'packingChecklist';

  function close() {
    dispatch({ type: 'CLOSE_MODAL' });
  }

  return (
    <BottomSheetModal isOpen={isOpen} onClose={close} overlayId="packingChecklistOverlay">
      {activeTrip && <PackingChecklist trip={activeTrip} />}
    </BottomSheetModal>
  );
}
