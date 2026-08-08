import { useAppContext } from '../context/AppContext';

export function useStartNewTrip(): () => void {
  const { dispatch } = useAppContext();

  return function startNewTrip() {
    dispatch({ type: 'DESELECT_TRIP' });
    dispatch({ type: 'NAVIGATE', view: 'itinerary' });
    window.setTimeout(() => {
      const destinationInput = document.getElementById('destination') as HTMLInputElement | null;
      destinationInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      destinationInput?.focus({ preventScroll: true });
    }, 60);
  };
}
