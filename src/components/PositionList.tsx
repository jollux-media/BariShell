import type { ReactNode } from 'react';
import { getShellShape } from '../lib/shells';
import type { PositionGroup } from '../lib/shells';

interface PositionListProps {
  groups:               PositionGroup[];
  selectedPositionId:   string | null;
  priorityStringIdx?:   number | null;
  emptyMessage?:        string;
  onSelect:             (id: string) => void;
}

function fretRangeLabel(pos: PositionGroup['positions'][0]): string {
  const frets = pos.notes.map((n) => n.fret);
  const min = Math.min(...frets);
  const max = Math.max(...frets);
  if (min === max) return min === 0 ? 'Open' : `Fret ${min}`;
  if (min === 0) return `Open–${max}`;
  return `Frets ${min}–${max}`;
}

function PositionItems({
  positions,
  selectedPositionId,
  onSelect,
  indexOffset = 0,
}: {
  positions: PositionGroup['positions'];
  selectedPositionId: string | null;
  onSelect: (id: string) => void;
  indexOffset?: number;
}) {
  return (
    <>
      {positions.map((pos, index) => {
        const shape = getShellShape(pos.shapeId);
        const range = fretRangeLabel(pos);

        return (
          <li key={pos.id}>
            <button
              type="button"
              className={
                selectedPositionId === pos.id
                  ? 'position-btn position-btn--active'
                  : 'position-btn'
              }
              onClick={() => onSelect(pos.id)}
            >
              <span className="position-btn__title">
                Position {indexOffset + index + 1} · {range}
              </span>
              <span className="position-btn__subtitle">
                Shape {shape.label}
              </span>
            </button>
          </li>
        );
      })}
    </>
  );
}

export function PositionList({
  groups,
  selectedPositionId,
  priorityStringIdx = null,
  emptyMessage,
  onSelect,
}: PositionListProps) {
  const total = groups.reduce((n, g) => n + g.positions.length, 0);

  if (total === 0) {
    return (
      <p className="empty-positions">
        {emptyMessage ?? 'No shell voicings in range. Try a different root or tuning.'}
      </p>
    );
  }

  const sections: ReactNode[] = [];
  let indexOffset = 0;

  for (const group of groups) {
    const isPriority =
      priorityStringIdx != null && group.stringIdx === priorityStringIdx;

    sections.push(
      <div key={group.stringIdx} className="pos-string-group">
        <p
          className={
            isPriority
              ? 'pos-section-label pos-section-label--priority'
              : 'pos-section-label'
          }
        >
          {group.label}
        </p>
        <ol className="position-list">
          <PositionItems
            positions={group.positions}
            selectedPositionId={selectedPositionId}
            onSelect={onSelect}
            indexOffset={indexOffset}
          />
        </ol>
      </div>,
    );
    indexOffset += group.positions.length;
  }

  return <>{sections}</>;
}
