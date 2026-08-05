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
      onFocusCapture={(event) => {
        const field = event.target;
        if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) return;
        const card = event.currentTarget.querySelector<HTMLElement>('.stop-form-card');
        if (!card) return;

        window.setTimeout(() => {
          const fieldRect = field.getBoundingClientRect();
          const cardRect = card.getBoundingClientRect();
          const viewportBottom = window.visualViewport
            ? window.visualViewport.offsetTop + window.visualViewport.height
            : window.innerHeight;
          const visibleBottom = Math.min(cardRect.bottom, viewportBottom) - 20;
          const visibleTop = Math.max(cardRect.top, window.visualViewport?.offsetTop ?? 0) + 16;

          if (fieldRect.bottom > visibleBottom) {
            card.scrollBy({ top: fieldRect.bottom - visibleBottom + 24, behavior: 'smooth' });
          } else if (fieldRect.top < visibleTop) {
            card.scrollBy({ top: fieldRect.top - visibleTop - 16, behavior: 'smooth' });
          }
        }, 280);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="stop-form-card">{children}</div>
    </div>
  );
}
