import { useAppContext } from '../../context/AppContext';

export default function LanguageToggle() {
  const { state, dispatch } = useAppContext();

  return (
    <div className="language-toggle" role="group" aria-label="Language">
      <button
        type="button"
        className={state.language === 'en' ? 'active' : ''}
        aria-label="English"
        aria-pressed={state.language === 'en'}
        title="English"
        onClick={() => dispatch({ type: 'SET_LANGUAGE', language: 'en' })}
      >
        <span aria-hidden="true">🇬🇧</span>
      </button>
      <button
        type="button"
        className={state.language === 'km' ? 'active' : ''}
        aria-label="Khmer"
        aria-pressed={state.language === 'km'}
        title="Khmer"
        onClick={() => dispatch({ type: 'SET_LANGUAGE', language: 'km' })}
      >
        <span aria-hidden="true">🇰🇭</span>
      </button>
    </div>
  );
}
