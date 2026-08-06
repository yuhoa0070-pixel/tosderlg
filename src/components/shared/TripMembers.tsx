import { useState } from 'react';
import type { Language, TripMember } from '../../types';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2) || '?').toUpperCase();
}

export default function TripMembers({ members, language }: { members: TripMember[]; language: Language }) {
  const [open, setOpen] = useState(false);
  if (members.length === 0) return null;
  const km = language === 'km';
  const visibleMembers = members.slice(0, 5);
  const remainingMembers = Math.max(0, members.length - visibleMembers.length);
  const panelId = `trip-members-${members.map((member) => member.id).join('-').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40)}`;

  return (
    <div className="trip-members" aria-label={km ? 'សមាជិកដំណើរ' : 'Trip members'}>
      <button
        type="button"
        className={`trip-members-trigger${open ? ' open' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={km ? `បង្ហាញសមាជិកដំណើរ ${members.length} នាក់` : `Show ${members.length} trip members`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="trip-members-avatar-stack" aria-hidden="true">
          {visibleMembers.map((member) => (
            <span className={`trip-member-avatar compact ${member.role}`} key={member.id}>
              <span>{initials(member.name)}</span>
              {member.photoUrl && (
                <img
                  src={member.photoUrl}
                  alt=""
                  onError={(event) => event.currentTarget.remove()}
                />
              )}
            </span>
          ))}
          {remainingMembers > 0 && <span className="trip-member-more">+{remainingMembers}</span>}
        </span>
        <svg className="trip-members-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div className="trip-members-panel" id={panelId}>
          <div className="trip-members-panel-heading">
            <strong>{km ? 'សមាជិកដំណើរ' : 'Trip members'}</strong>
            <span>{members.length}</span>
          </div>
          <div className="trip-members-list">
            {members.map((member) => (
              <div className="trip-member-row" key={member.id}>
                <div className={`trip-member-avatar ${member.role}`} aria-hidden="true">
                  <span>{initials(member.name)}</span>
                  {member.photoUrl && (
                    <img
                      src={member.photoUrl}
                      alt=""
                      onError={(event) => event.currentTarget.remove()}
                    />
                  )}
                </div>
                <span className="trip-member-copy">
                  <strong>{member.name}</strong>
                  <small>
                    {member.role === 'owner'
                      ? km ? 'ម្ចាស់ដំណើរ' : 'Owner'
                      : km ? 'សមាជិក' : 'Member'}
                  </small>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
