import { useAppContext } from '../../context/AppContext';

export default function LanguageToggle() {
  const { state, dispatch } = useAppContext();

  return (
    <div className="language-toggle" role="group" aria-label="Language">
      <button
        type="button"
        className={state.language === 'en' ? 'active' : ''}
        aria-pressed={state.language === 'en'}
        onClick={() => dispatch({ type: 'SET_LANGUAGE', language: 'en' })}
      >
        EN
      </button>
      <button
        type="button"
        className={state.language === 'km' ? 'active' : ''}
        aria-pressed={state.language === 'km'}
        onClick={() => dispatch({ type: 'SET_LANGUAGE', language: 'km' })}
      >
        ខ្មែរ
      </button>
    </div>
  );
}
