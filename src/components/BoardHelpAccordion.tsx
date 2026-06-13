import type { ReactNode } from 'react';

interface BoardHelpAccordionProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  className?: string;
  children: ReactNode;
}

export function BoardHelpAccordion({
  title,
  open,
  onToggle,
  className,
  children,
}: BoardHelpAccordionProps) {
  return (
    <details open={open} className={className ? `board-help ${className}` : 'board-help'}>
      <summary
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
      >
        {title}
      </summary>
      <div className="board-help__body">{children}</div>
    </details>
  );
}
