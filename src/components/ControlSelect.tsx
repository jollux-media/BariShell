import { useEffect, useId, useRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

interface ControlSelectProps {
  label: string;
  value: string;
  options: SelectOption[] | SelectOptionGroup[];
  onChange: (value: string) => void;
  className?: string;
}

function isGrouped(
  options: SelectOption[] | SelectOptionGroup[],
): options is SelectOptionGroup[] {
  return options.length > 0 && 'options' in options[0];
}

function findLabel(
  options: SelectOption[] | SelectOptionGroup[],
  value: string,
): string {
  if (isGrouped(options)) {
    for (const group of options) {
      const match = group.options.find((o) => o.value === value);
      if (match) return match.label;
    }
    return value;
  }
  return options.find((o) => o.value === value)?.label ?? value;
}

export function ControlSelect({
  label,
  value,
  options,
  onChange,
  className = '',
}: ControlSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function select(val: string) {
    onChange(val);
    setOpen(false);
  }

  const display = findLabel(options, value);

  function renderOptions() {
    if (isGrouped(options)) {
      return options.map((group) => (
        <div key={group.label} className="control-select__group">
          <div className="control-select__group-label">{group.label}</div>
          {group.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              className={
                opt.value === value
                  ? 'control-select__option control-select__option--active'
                  : 'control-select__option'
              }
              onClick={() => select(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ));
    }
    return options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        role="option"
        aria-selected={opt.value === value}
        className={
          opt.value === value
            ? 'control-select__option control-select__option--active'
            : 'control-select__option'
        }
        onClick={() => select(opt.value)}
      >
        {opt.label}
      </button>
    ));
  }

  return (
    <div
      ref={rootRef}
      className={`control control-select ${className}${open ? ' control-select--open' : ''}`}
    >
      <span className="control-select__label">{label}</span>
      <button
        type="button"
        className="control-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="control-select__value">{display}</span>
        <span className="control-select__chevron" aria-hidden />
      </button>
      {open && (
        <div id={listId} className="control-select__menu" role="listbox">
          {renderOptions()}
        </div>
      )}
    </div>
  );
}
