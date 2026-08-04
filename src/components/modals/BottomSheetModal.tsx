import type { ReactNode } from 'react';

interface BottomSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  overlayId?: string;
}

export default function BottomSheetModal({ isOpen, onClose, children, overlayId }: BottomSheetModalProps) {
  return (
    <div
      className={`stop-form-overlay${isOpen ? ' open' : ''}`}
      id={overlayId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="stop-form-card">{children}</div>
    </div>
  );
}
