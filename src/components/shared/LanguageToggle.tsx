import { useAppContext } from '../../context/AppContext';

function UnitedStatesFlag() {
  return (
    <svg viewBox="0 0 28 20" role="img" aria-label="United States flag">
      <rect width="28" height="20" fill="#fff" />
      <path fill="#D73743" d="M0 0h28v1.54H0zm0 3.08h28v1.54H0zm0 3.07h28v1.54H0zm0 3.08h28v1.54H0zm0 3.08h28v1.54H0zm0 3.07h28v1.54H0zm0 3.08h28V20H0z" />
      <rect width="12.2" height="10.77" fill="#3556A8" />
      <g fill="#fff">
        <circle cx="1.4" cy="1.3" r=".45" /><circle cx="3.7" cy="1.3" r=".45" /><circle cx="6" cy="1.3" r=".45" /><circle cx="8.3" cy="1.3" r=".45" /><circle cx="10.6" cy="1.3" r=".45" />
        <circle cx="2.55" cy="3.3" r=".45" /><circle cx="4.85" cy="3.3" r=".45" /><circle cx="7.15" cy="3.3" r=".45" /><circle cx="9.45" cy="3.3" r=".45" />
        <circle cx="1.4" cy="5.3" r=".45" /><circle cx="3.7" cy="5.3" r=".45" /><circle cx="6" cy="5.3" r=".45" /><circle cx="8.3" cy="5.3" r=".45" /><circle cx="10.6" cy="5.3" r=".45" />
        <circle cx="2.55" cy="7.3" r=".45" /><circle cx="4.85" cy="7.3" r=".45" /><circle cx="7.15" cy="7.3" r=".45" /><circle cx="9.45" cy="7.3" r=".45" />
        <circle cx="1.4" cy="9.3" r=".45" /><circle cx="3.7" cy="9.3" r=".45" /><circle cx="6" cy="9.3" r=".45" /><circle cx="8.3" cy="9.3" r=".45" /><circle cx="10.6" cy="9.3" r=".45" />
      </g>
    </svg>
  );
}

function CambodiaFlag() {
  return (
    <svg viewBox="0 0 28 20" role="img" aria-label="Cambodia flag">
      <rect width="28" height="20" fill="#2455A5" />
      <rect y="5" width="28" height="10" fill="#D72D3B" />
      <g fill="#fff">
        <path d="M7 13.5h14v1H7zm1-1.5h12v1H8zm1.1-1.5h9.8v1H9.1z" />
        <path d="M10 10.5V8.1l1.5-1.4 1.3 1.2V6.2L14 5l1.2 1.2v1.7l1.3-1.2L18 8.1v2.4h-1.4V8.7l-1.4 1.1V8L14 6.9 12.8 8v1.8l-1.4-1.1v1.8z" />
      </g>
    </svg>
  );
}

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
      <span key={state.language} className="mode-flag" aria-hidden="true">
        {isEnglish ? <UnitedStatesFlag /> : <CambodiaFlag />}
      </span>
    </button>
  );
}
