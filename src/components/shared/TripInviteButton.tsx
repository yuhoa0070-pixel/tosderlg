import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getTelegramUser, getTelegramWebApp, telegramUserDisplayName } from '../../lib/telegram';
import { saveTripRoom } from '../../lib/tripRoom';
import type { Trip } from '../../types';

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
  const km = state.language === 'km';

  async function inviteFriends() {
    if (busy) return;
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
      const appUrl = `${window.location.origin}${window.location.pathname}`;
      const webApp = getTelegramWebApp();

      if (webApp?.openTelegramLink) {
        webApp.openTelegramLink(
          `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`,
        );
        setStatus(km ? 'កំពុងបើក Telegram…' : 'Opening Telegram…');
        return;
      }

      if (navigator.share) {
        await navigator.share({ title: `${destination} trip room`, text: shareText, url: appUrl });
        setStatus(km ? 'បានចែករំលែកលេខកូដបន្ទប់' : 'Room code shared');
        return;
      }

      await copyText(`${shareText}\n${appUrl}`);
      setStatus(km ? 'បានចម្លងលេខកូដបន្ទប់' : 'Room code copied');
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
        <span className="shared-trip-icon" aria-hidden="true">👥</span>
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
      <div className="trip-share-actions">
        {trip.roomCode && (
          <div className="trip-room-code" aria-label={`Trip room code ${trip.roomCode}`}>
            <span>{km ? 'កូដ' : 'Code'}</span>
            <strong>{trip.roomCode}</strong>
          </div>
        )}
        <button type="button" className="trip-invite-button" onClick={inviteFriends} disabled={busy}>
          <svg className="trip-invite-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 19c0-3.4 2.3-5.5 5.5-5.5s5.5 2.1 5.5 5.5M17 8v6M14 11h6" />
          </svg>
          <span>{busy ? (km ? 'កំពុងបង្កើត…' : 'Creating…') : (km ? 'អញ្ជើញមិត្ត' : 'Invite friend')}</span>
        </button>
      </div>
      {status && <p className="trip-share-status" role="status">{status}</p>}
    </div>
  );
}
