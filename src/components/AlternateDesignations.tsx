import { CHORD_AMBIGUITY_INTRO, findAlternateDesignations } from '../lib/chordAnalysis';
import type { ChordQuality, ExtensionId, FretNote, InversionId, NoteName, TuningId } from '../lib/types';
import { BoardHelpAccordion } from './BoardHelpAccordion';

interface AlternateDesignationsProps {
  notes: FretNote[];
  tuning: TuningId;
  selectedRoot: NoteName;
  selectedQuality: ChordQuality;
  selectedInversion: InversionId;
  selectedExt1: ExtensionId;
  selectedExt2: ExtensionId;
  primaryName: string;
  open: boolean;
  onToggle: () => void;
}

export function AlternateDesignations({
  notes,
  tuning,
  selectedRoot,
  selectedQuality,
  selectedInversion,
  selectedExt1,
  selectedExt2,
  primaryName,
  open,
  onToggle,
}: AlternateDesignationsProps) {
  const designations =
    notes.length > 0
      ? findAlternateDesignations({
          notes,
          tuning,
          selectedRoot,
          selectedQuality,
          selectedInversion,
          selectedExt1,
          selectedExt2,
          primaryName,
        })
      : [];

  const alternates = designations.filter((d) => !d.isPrimary);

  return (
    <BoardHelpAccordion
      title="Alternate designations"
      className="board-help--designations"
      open={open}
      onToggle={onToggle}
    >
      <p className="board-help__intro">{CHORD_AMBIGUITY_INTRO}</p>

      {notes.length === 0 ? (
        <p className="board-help__empty">Select a position to see how this voicing can be named.</p>
      ) : (
        <>
          <p className="board-help__pitch">
            Notes sounding: <strong>{designations[0]?.pitchSummary ?? '—'}</strong>
          </p>

          <ul className="designation-list">
            {designations.map((item) => (
              <li
                key={item.name}
                className={
                  item.isPrimary
                    ? 'designation designation--primary'
                    : 'designation'
                }
              >
                <span className="designation__name">
                  {item.name}
                  {item.isPrimary && (
                    <span className="designation__badge">Your selection</span>
                  )}
                </span>
                <p className="designation__context">{item.context}</p>
              </li>
            ))}
          </ul>

          {alternates.length === 0 && designations.length <= 1 && (
            <p className="board-help__empty">
              No other common jazz interpretations for this exact pitch collection.
            </p>
          )}
        </>
      )}
    </BoardHelpAccordion>
  );
}
