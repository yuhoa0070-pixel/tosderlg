import { createPortal } from 'react-dom';
import BottomSheetModal from './BottomSheetModal';

interface LocationConsentModalProps {
  isOpen: boolean;
  language: 'en' | 'km';
  onClose: () => void;
  onAllow: () => void;
}

export default function LocationConsentModal({ isOpen, language, onClose, onAllow }: LocationConsentModalProps) {
  const km = language === 'km';

  return createPortal(
    <BottomSheetModal isOpen={isOpen} onClose={onClose} overlayId="locationConsentOverlay">
      <div role="dialog" aria-modal="true" aria-labelledby="locationConsentTitle">
        <div className="location-consent-icon" aria-hidden="true">
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-6.3 7-11.8a7 7 0 1 0-14 0C5 14.7 12 21 12 21z" />
            <circle cx="12" cy="9.2" r="2.4" />
          </svg>
        </div>
        <h2 id="locationConsentTitle">{km ? 'អនុញ្ញាតឱ្យតាមដានទីតាំង?' : 'Allow location tracking?'}</h2>
        <p className="location-consent-copy">
          {km
            ? 'Waylo ប្រើទីតាំងបច្ចុប្បន្នរបស់អ្នក ដើម្បីបង្ហាញអ្នកនៅលើផែនទីនេះប៉ុណ្ណោះ។'
            : 'Waylo uses your live location only to show your position on this map.'}
        </p>
        <div className="location-consent-privacy">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
          </svg>
          <span>{km ? 'ទីតាំងរបស់អ្នកមិនត្រូវបានរក្សាទុក ឬចែករំលែកទេ។' : 'Your location is not stored or shared.'}</span>
        </div>
        <div className="row2 location-consent-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {km ? 'មិនទាន់ទេ' : 'Not now'}
          </button>
          <button type="button" className="btn btn-primary" onClick={onAllow}>
            {km ? 'អនុញ្ញាត' : 'Allow tracking'}
          </button>
        </div>
      </div>
    </BottomSheetModal>,
    document.body,
  );
}
