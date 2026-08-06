import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getTelegramUser, getTelegramWebApp, telegramUserDisplayName } from '../../lib/telegram';
import { saveTripRoom } from '../../lib/tripRoom';
import type { Trip } from '../../types';
import TripRoomIcon from './TripRoomIcon';

function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  textArea.remove();
  return Promise.resolve();
}

export default function TripInviteButton({ trip }: { trip: Trip }) {
  const { state, dispatch } = useAppContext();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const km = state.language === 'km';

  useEffect(() => {
    if (!codeCopied) return;
    const timer = window.setTimeout(() => {
      setCodeCopied(false);
      setStatus('');
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [codeCopied]);

  async function copyRoomCode() {
    if (!trip.roomCode) return;
    try {
      await copyText(trip.roomCode);
      setCodeCopied(true);
      setStatus('');
    } catch {
      setCodeCopied(false);
      setStatus(km ? 'មិនអាចចម្លងកូដបានទេ' : 'Could not copy the code');
    }
  }

  async function inviteFriends() {
    if (busy) return;
    setCodeCopied(false);
    setStatus('');
    setBusy(true);
    try {
      const telegramUser = getTelegramUser();
      const sharedBy = telegramUser ? telegramUserDisplayName(telegramUser) : state.profileName || 'A friend';
      const room = await saveTripRoom(trip, sharedBy);
      dispatch({
        type: 'SET_TRIP_ROOM',
        tripId: trip.id,
        code: room.code,
        ownerToken: room.ownerToken,
        updatedAt: room.updatedAt,
      });

      const destination = trip.destination.split(',')[0];
      const shareText = km
        ? `ចូលបន្ទប់ដំណើរ ${destination} របស់ខ្ញុំនៅ Waylo ✈️\nលេខកូដបន្ទប់៖ ${room.code}`
        : `Join my ${destination} trip room in Waylo ✈️\nRoom code: ${room.code}`;
      const webApp = getTelegramWebApp();

      if (webApp?.openTelegramLink) {
        webApp.openTelegramLink(
          `https://t.me/share/url?url=&text=${encodeURIComponent(shareText)}`,
        );
        setStatus(km ? 'កំពុងបើក Telegram…' : 'Opening Telegram…');
        return;
      }

      if (navigator.share) {
        await navigator.share({ title: `${destination} trip room`, text: shareText });
        setStatus(km ? 'បានចែករំលែកលេខកូដបន្ទប់' : 'Room code shared');
        return;
      }

      await copyText(shareText);
      setStatus('');
      setCodeCopied(true);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setStatus(error instanceof Error ? error.message : km ? 'មិនអាចបង្កើតបន្ទប់បានទេ' : 'Could not create the trip room');
    } finally {
      setBusy(false);
    }
  }

  if (trip.readOnly) {
    return (
      <div className="shared-trip-banner">
        <span className="shared-trip-icon"><TripRoomIcon size={20} /></span>
        <span>
          <strong>{km ? 'ដំណើរដែលបានចែករំលែក' : 'Shared trip'}</strong>
          <small>
            {km
              ? `ចែករំលែកដោយ ${trip.sharedBy || 'មិត្តភក្តិ'} · មើលតែប៉ុណ្ណោះ`
              : `Shared by ${trip.sharedBy || 'a friend'} · View only`}
            {trip.roomCode ? ` · ${trip.roomCode}` : ''}
          </small>
        </span>
      </div>
    );
  }

  return (
    <div className="trip-share-panel">
      <div className={`trip-share-actions${trip.roomCode ? ' has-room-code' : ''}`}>
        {trip.roomCode && (
          <button
            type="button"
            className={`trip-room-code${codeCopied ? ' copied' : ''}`}
            aria-label={km ? `ចម្លងកូដបន្ទប់ ${trip.roomCode}` : `Copy trip room code ${trip.roomCode}`}
            onClick={copyRoomCode}
          >
            <span className="trip-room-code-label">{km ? 'កូដ' : 'Code'}</span>
            <strong>{trip.roomCode}</strong>
            <span className="trip-room-copy-icon" aria-hidden="true">
              {codeCopied ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 4 4L19 6" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </span>
          </button>
        )}
        <button type="button" className="trip-invite-button" onClick={inviteFriends} disabled={busy}>
          <svg className="trip-invite-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 19c0-3.4 2.3-5.5 5.5-5.5s5.5 2.1 5.5 5.5M17 8v6M14 11h6" />
          </svg>
          <span>{busy ? (km ? 'កំពុងបង្កើត…' : 'Creating…') : (km ? 'អញ្ជើញមិត្ត' : 'Invite friend')}</span>
        </button>
      </div>
      {codeCopied && (
        <div className="trip-copy-toast" role="status" aria-live="polite">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 2.6 2.6L16.5 9" />
          </svg>
          <span>Copied</span>
        </div>
      )}
      {status && <p className="trip-share-status" role="status">{status}</p>}
    </div>
  );
}
