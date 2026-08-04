import type { ReactNode } from 'react';

interface IconButtonProps {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  className?: string;
}

export default function IconButton({ children, onClick, title, className }: IconButtonProps) {
  return (
    <div className={`icon-btn${className ? ' ' + className : ''}`} onClick={onClick} title={title}>
      {children}
    </div>
  );
}
