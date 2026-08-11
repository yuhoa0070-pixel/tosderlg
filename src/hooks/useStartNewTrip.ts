import { useAppContext } from '../context/AppContext';

export function useStartNewTrip(): (prefillDestination?: string) => void {
  const { dispatch } = useAppContext();

  return function startNewTrip(prefillDestination = '') {
    dispatch({ type: 'SET_NEW_TRIP_DESTINATION', destination: prefillDestination });
    dispatch({ type: 'DESELECT_TRIP' });
    dispatch({ type: 'NAVIGATE', view: 'itinerary' });
    window.setTimeout(() => {
      const destinationInput = document.getElementById('destination') as HTMLInputElement | null;
      destinationInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      destinationInput?.focus({ preventScroll: true });
    }, 60);
  };
}
