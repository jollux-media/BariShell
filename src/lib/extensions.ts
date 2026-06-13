import {
  absoluteMidi,
  CHROMATIC,
  EXTENSION_INTERVALS,
  lowestFretForNote,
  NOTE_INDEX,
} from './music';
import { SHELL_MAX_FRET_SPAN } from './shells';
import type { ExtensionId, FretNote, NoteName, ShellPosition, TuningId } from './types';

/**
 * Find the best free-string placement for an extension note.
 *
 * Rules (in priority order):
 *   1. One note per string — cannot use strings occupied by shell tones or
 *      extensions already placed via `alreadyPlaced`.
 *   2. Adding the extension fret must not blow out the total fretted span —
 *      the combined span of all fretted (non-open) shell and extension notes
 *      must stay within SHELL_MAX_FRET_SPAN. Open strings (fret 0) are free.
 *   3. Prefer placements whose absolute pitch is above the root note.
 *   4. Within each group, prefer the candidate closest to the chord anchor.
 *   5. Fall back to below-root placements only when no above-root option exists.
 */
export function findExtensionNote(
  extId: NonNullable<ExtensionId>,
  tone: 'ext1' | 'ext2',
  position: ShellPosition,
  tuning: TuningId,
  maxFret: number,
  alreadyPlaced: FretNote[] = [],
): FretNote | null {
  const ext      = EXTENSION_INTERVALS[extId];
  const rootIdx  = NOTE_INDEX[position.rootPitch];
  const extPitch = CHROMATIC[(rootIdx + ext.semitones) % 12] as NoteName;

  const allPlaced = [...position.notes, ...alreadyPlaced];
  const frettedFrets = allPlaced.map((n) => n.fret).filter((f) => f > 0);
  const frettedMin   = frettedFrets.length ? Math.min(...frettedFrets) : 0;
  const frettedMax   = frettedFrets.length ? Math.max(...frettedFrets) : 0;

  const rootNote = position.notes.find((n) => n.tone === 'root')!;
  const rootMidi = absoluteMidi(rootNote.string, rootNote.fret, tuning);

  const usedStrings = new Set(allPlaced.map((n) => n.string));
  const freeStrings = [0, 1, 2, 3, 4, 5].filter((s) => !usedStrings.has(s));

  const aboveRoot: Array<{ note: FretNote; dist: number }> = [];
  const belowRoot: Array<{ note: FretNote; dist: number }> = [];

  for (const strIdx of freeStrings) {
    const base = lowestFretForNote(strIdx, extPitch, tuning);
    for (let f = base; f <= maxFret; f += 12) {
      if (f > 0) {
        const newMin = Math.min(frettedMin || f, f);
        const newMax = Math.max(frettedMax || f, f);
        if (newMax - newMin > SHELL_MAX_FRET_SPAN) continue;
      }

      const midi = absoluteMidi(strIdx, f, tuning);
      const dist = Math.abs(f - position.anchorFret);
      const note: FretNote = { string: strIdx, fret: f, tone, pitch: extPitch };

      if (midi > rootMidi) {
        aboveRoot.push({ note, dist });
      } else {
        belowRoot.push({ note, dist });
      }
    }
  }

  const pool = aboveRoot.length > 0 ? aboveRoot : belowRoot;
  if (pool.length === 0) return null;

  pool.sort((a, b) => a.dist - b.dist);
  return pool[0].note;
}

/** Place ext1 then ext2, each on its own unused string. */
export function findAllExtensionNotes(
  position: ShellPosition,
  ext1: ExtensionId,
  ext2: ExtensionId,
  tuning: TuningId,
  maxFret: number,
): FretNote[] {
  const result: FretNote[] = [];

  if (ext1) {
    const n = findExtensionNote(ext1, 'ext1', position, tuning, maxFret, result);
    if (n) result.push(n);
  }
  if (ext2) {
    const n = findExtensionNote(ext2, 'ext2', position, tuning, maxFret, result);
    if (n) result.push(n);
  }

  return result;
}

export function positionSupportsExtensions(
  position: ShellPosition,
  ext1: ExtensionId,
  ext2: ExtensionId,
  tuning: TuningId,
  maxFret: number,
): boolean {
  const placed = findAllExtensionNotes(position, ext1, ext2, tuning, maxFret);
  if (ext1 && !placed.some((n) => n.tone === 'ext1')) return false;
  if (ext2 && !placed.some((n) => n.tone === 'ext2')) return false;
  return true;
}

export function filterViablePositions(
  positions: ShellPosition[],
  ext1: ExtensionId,
  ext2: ExtensionId,
  tuning: TuningId,
  maxFret: number,
): ShellPosition[] {
  if (!ext1 && !ext2) return positions;
  return positions.filter((p) =>
    positionSupportsExtensions(p, ext1, ext2, tuning, maxFret),
  );
}
