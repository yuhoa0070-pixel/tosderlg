import type { Trip } from '../types';
import { useAppContext } from '../context/AppContext';

export function useActiveTrip(): Trip | undefined {
  const { state } = useAppContext();
  return state.trips.find((t) => t.id === state.currentTripId);
}
