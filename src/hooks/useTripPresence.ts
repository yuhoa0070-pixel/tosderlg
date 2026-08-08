import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { currentTripMember, getPresence, type TripPresenceEntry } from '../lib/tripRoom';
import type { Trip } from '../types';

const POLL_INTERVAL_MS = 5000;

export function useTripPresence(trip: Trip | undefined): TripPresenceEntry[] {
  const { state } = useAppContext();
  const [presence, setPresence] = useState<TripPresenceEntry[]>([]);
  const roomCode = trip?.roomCode;
  const selfId = useMemo(
    () => currentTripMember(state.profileName, state.profilePhoto).id,
    [state.profileName, state.profilePhoto],
  );

  useEffect(() => {
    if (!roomCode) {
      setPresence([]);
      return;
    }
    let cancelled = false;
    async function poll() {
      try {
        const entries = await getPresence(roomCode as string);
        if (!cancelled) setPresence(entries);
      } catch {
        // Presence is best-effort — a failed poll just means stale/empty indicators.
      }
    }
    poll();
    const timer = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [roomCode]);

  return useMemo(() => presence.filter((entry) => entry.memberId !== selfId), [presence, selfId]);
}
