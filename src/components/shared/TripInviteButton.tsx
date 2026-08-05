import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getTelegramUser, getTelegramWebApp, telegramUserDisplayName } from '../../lib/telegram';
import { createShareId, createTripInviteLink } from '../../lib/tripInvite';
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
  const km = state.language === 'km';

  async function inviteFriends() {
    setStatus('');
    try {
      const shareId = trip.shareId ?? createShareId();
      if (!trip.shareId) dispatch({ type: 'SET_TRIP_SHARE_ID', tripId: trip.id, shareId });
      const telegramUser = getTelegramUser();
      const sharedBy = telegramUser ? telegramUserDisplayName(telegramUser) : state.profileName || 'A friend';
      const inviteLink = createTripInviteLink(trip, sharedBy, shareId);
      const destination = trip.destination.split(',')[0];
      const shareText = km
        ? `ចូលមើលគម្រោងដំណើរទៅ ${destination} ជាមួយខ្ញុំ ✈️`
        : `Join me and view our ${destination} trip plan ✈️`;
      const webApp = getTelegramWebApp();

      if (webApp?.openTelegramLink) {
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
        webApp.openTelegramLink(telegramShareUrl);
        setStatus(km ? 'កំពុងបើក Telegram…' : 'Opening Telegram…');
        return;
      }

      if (navigator.share) {
        await navigator.share({ title: `${destination} trip`, text: shareText, url: inviteLink });
        setStatus(km ? 'បានចែករំលែកការអញ្ជើញ' : 'Invite shared');
        return;
      }

      await copyText(inviteLink);
      setStatus(km ? 'បានចម្លងតំណអញ្ជើញ' : 'Invite link copied');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setStatus(error instanceof Error ? error.message : km ? 'មិនអាចចែករំលែកបានទេ' : 'Could not share this trip');
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
          </small>
        </span>
      </div>
    );
  }

  return (
    <div className="trip-share-panel">
      <button type="button" className="trip-invite-button" onClick={inviteFriends}>
        <span className="trip-invite-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 19c0-3.4 2.3-5.5 5.5-5.5s5.5 2.1 5.5 5.5M17 8v6M14 11h6" />
          </svg>
        </span>
        <span className="trip-invite-copy">
          <strong>{km ? 'អញ្ជើញមិត្តភក្តិ' : 'Invite friends'}</strong>
          <small>{km ? 'អនុញ្ញាតឱ្យពួកគេមើលគម្រោងដំណើរ' : 'Let them join and view the trip plan'}</small>
        </span>
        <span className="trip-invite-arrow" aria-hidden="true">→</span>
      </button>
      {status && <p className="trip-share-status" role="status">{status}</p>}
    </div>
  );
}
