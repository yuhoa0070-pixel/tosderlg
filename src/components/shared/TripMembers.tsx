import type { Language, TripMember } from '../../types';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2) || '?').toUpperCase();
}

export default function TripMembers({ members, language }: { members: TripMember[]; language: Language }) {
  if (members.length === 0) return null;
  const km = language === 'km';

  return (
    <div className="trip-members" aria-label={km ? 'សមាជិកដំណើរ' : 'Trip members'}>
      <div className="trip-members-heading">
        <span>{km ? 'សមាជិកដំណើរ' : 'Trip members'}</span>
        <small>{members.length}</small>
      </div>
      <div className="trip-members-track">
        {members.map((member) => (
          <div className="trip-member-chip" key={member.id}>
            <div className="trip-member-avatar" aria-hidden="true">
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
  );
}
