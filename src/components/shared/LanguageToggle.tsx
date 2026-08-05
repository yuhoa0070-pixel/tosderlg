import { useAppContext } from '../../context/AppContext';

export default function LanguageToggle() {
  const { state, dispatch } = useAppContext();
  const isEnglish = state.language === 'en';
  const nextLanguage = isEnglish ? 'km' : 'en';
  const nextLabel = isEnglish ? 'Khmer' : 'English';

  return (
    <button
      type="button"
      className="language-mode-button"
      aria-label={`Switch to ${nextLabel}`}
      title={`Switch to ${nextLabel}`}
      onClick={() => dispatch({ type: 'SET_LANGUAGE', language: nextLanguage })}
    >
      <span aria-hidden="true">{isEnglish ? '🇬🇧' : '🇰🇭'}</span>
    </button>
  );
}
