import { useEffect, useState, type ChangeEvent } from 'react';
import { useAppContext } from '../../context/AppContext';
import PersonAvatar from '../shared/PersonAvatar';
import BottomSheetModal from './BottomSheetModal';

export default function EditProfileModal() {
  const { state, dispatch } = useAppContext();
  const isOpen = state.activeModal === 'editProfile';

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(state.profileName);
    setPhoto(state.profilePhoto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function close() {
    dispatch({ type: 'CLOSE_MODAL' });
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhoto((ev.target?.result as string) ?? null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleSave() {
    dispatch({ type: 'SET_PROFILE_NAME', name: name.trim() });
    dispatch({ type: 'SET_PROFILE_PHOTO', photo });
    close();
  }

  return (
    <BottomSheetModal isOpen={isOpen} onClose={close} overlayId="profileFormOverlay">
      <h2>Edit profile</h2>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <label className="avatar-edit" id="avatarEditPreview" htmlFor="avatarFileInput" style={{ cursor: 'pointer' }}>
          <div className="avatar-edit-inner">
            {photo ? <img id="avatarEditImg" src={photo} alt="" /> : <PersonAvatar />}
          </div>
          <div className="avatar-edit-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-2h6.6l1.2 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </div>
        </label>
      </div>
      <label className="field-label">Name</label>
      <input type="text" id="profileNameInput" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="row2" style={{ marginTop: 6 }}>
        <button className="btn btn-ghost" onClick={close}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
      </div>
      <input type="file" id="avatarFileInput" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
    </BottomSheetModal>
  );
}
