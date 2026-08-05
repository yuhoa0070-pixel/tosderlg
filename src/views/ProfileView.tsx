import { useAppContext } from '../context/AppContext';
import LanguageToggle from '../components/shared/LanguageToggle';
import PersonAvatar from '../components/shared/PersonAvatar';

export default function ProfileView() {
  const { state, dispatch } = useAppContext();
  const km = state.language === 'km';

  return (
    <section id="view-profile" className="active">
      <div className="topbar">
        <div className="icon-btn" onClick={() => dispatch({ type: 'NAVIGATE', view: 'home' })}>
          &#8592;
        </div>
        <div />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 26 }}>
        <div
          className="avatar-edit"
          id="profilePageAvatar"
          style={{ width: 76, height: 76, fontSize: 22 }}
          onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'editProfile' })}
        >
          <div className="avatar-edit-inner">
            {state.profilePhoto ? <img id="profilePageImg" src={state.profilePhoto} alt="" /> : <PersonAvatar />}
          </div>
          <div className="avatar-edit-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-2h6.6l1.2 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </div>
        </div>
        <div id="profilePageName" style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>
          {state.profileName || (km ? 'បញ្ចូលឈ្មោះរបស់អ្នក' : 'Add your name')}
        </div>
      </div>

      <div className="profile-row" id="menuEditProfile" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'editProfile' })}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4z" />
          <path d="M4.5 20.5c0-4 3.4-6.8 7.5-6.8s7.5 2.8 7.5 6.8" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
        <span>{km ? 'កែប្រែគណនី' : 'Edit profile'}</span>
      </div>

      <div className="profile-row" id="menuMyTrips" onClick={() => dispatch({ type: 'NAVIGATE', view: 'mytrips' })}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="8" width="16" height="12" rx="3" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          <circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none" />
        </svg>
        <span>{km ? 'ដំណើររបស់ខ្ញុំ' : 'My trips'}</span>
      </div>

      <div className="profile-row language-row">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
        </svg>
        <span>{km ? 'ភាសា' : 'Language'}</span>
        <LanguageToggle />
      </div>

      <div className="profile-row danger" id="menuClear" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'confirmClear' })}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 7h15" />
          <path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" />
          <path d="M6.5 7l1 12.5A2 2 0 0 0 9.5 21h5a2 2 0 0 0 2-1.5L17.5 7" />
          <circle cx="12" cy="13" r="1.3" fill="currentColor" stroke="none" />
        </svg>
        <span>{km ? 'លុបទិន្នន័យទាំងអស់' : 'Clear all data'}</span>
      </div>
    </section>
  );
}
