import type { Language, TripMember } from '../../types';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2) || '?').toUpperCase();
}

export default function TripMembers({ members, language }: { members: TripMember[]; language: Language }) {
  if (members.length === 0) return null;
  const km = language === 'km';

  return (
    <div className="trip-members">
      <div className="trip-members-avatar-stack" role="list" aria-label={km ? 'សមាជិកដំណើរ' : 'Trip members'}>
        {members.map((member) => (
          <span
            className={`trip-member-avatar compact ${member.role}`}
            key={member.id}
            role="listitem"
            aria-label={`${member.name} · ${member.role === 'owner' ? (km ? 'ម្ចាស់ដំណើរ' : 'Owner') : (km ? 'សមាជិក' : 'Member')}`}
          >
            <span aria-hidden="true">{initials(member.name)}</span>
            {member.photoUrl && (
              <img
                src={member.photoUrl}
                alt=""
                onError={(event) => event.currentTarget.remove()}
              />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
