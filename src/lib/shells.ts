import {
  chordTones,
  lowestFretForNote,
} from './music';
import type {
  ChordQuality,
  FretNote,
  InversionId,
  NoteName,
  ShellPosition,
  ShellShape,
  ShellShapeId,
  TuningId,
} from './types';

// ─── Shape catalogue ──────────────────────────────────────────────────────────
//
// Two core pattern families plus wide-voiced inversion shapes:
//
//  Type A  "skip" pattern  — root · (muted) · 7th · 3rd
//    s643: root 6th, 7th 4th, 3rd 3rd   (the classic jazz-guitar shape)
//    s532: root 5th, 7th 3rd, 3rd 2nd
//    s421: root 4th, 7th 2nd, 3rd 1st
//
//  Type B  "adjacent" pattern — 3rd · root · 7th
//    s654: root 6th, 3rd 5th, 7th 4th
//    s543: root 5th, 3rd 4th, 7th 3rd   (the other classic jazz-guitar shape)
//    s432: root 4th, 3rd 3rd, 7th 2nd
//    s321: root 3rd, 3rd 2nd, 7th 1st
//
//  Type C  "wide" pattern — uses 1st string, enables open-string inversions
//    s541: root 5th, 7th 1st, 3rd 4th   (1st-inversion: open-E bass)
//    s651: root 6th, 7th 5th, 3rd 1st   (2nd-inversion: open-B + open-E bass)
//    s431: root 3rd, 7th 1st, 3rd 4th   (compact 1st-inversion cluster)
//
// Fret offsets are NOT hard-coded — they are derived at runtime from the
// tuning's open-string intervals, so they automatically adapt to any tuning.

export const SHELL_SHAPES: ShellShape[] = [
  // ── Type A ──
  {
    id: 's643',
    label: '6–4–3',
    description: 'Root 6th, 7th 4th, 3rd 3rd',
    rootStringIdx: 0, seventhStringIdx: 2, thirdStringIdx: 3,
  },
  {
    id: 's532',
    label: '5–3–2',
    description: 'Root 5th, 7th 3rd, 3rd 2nd',
    rootStringIdx: 1, seventhStringIdx: 3, thirdStringIdx: 4,
  },
  {
    id: 's421',
    label: '4–2–1',
    description: 'Root 4th, 7th 2nd, 3rd 1st',
    rootStringIdx: 2, seventhStringIdx: 4, thirdStringIdx: 5,
  },
  // ── Type B ──
  {
    id: 's654',
    label: '6–5–4',
    description: 'Root 6th, 3rd 5th, 7th 4th',
    rootStringIdx: 0, seventhStringIdx: 2, thirdStringIdx: 1,
  },
  {
    id: 's543',
    label: '5–4–3',
    description: 'Root 5th, 3rd 4th, 7th 3rd',
    rootStringIdx: 1, seventhStringIdx: 3, thirdStringIdx: 2,
  },
  {
    id: 's432',
    label: '4–3–2',
    description: 'Root 4th, 3rd 3rd, 7th 2nd',
    rootStringIdx: 2, seventhStringIdx: 4, thirdStringIdx: 3,
  },
  {
    id: 's321',
    label: '3–2–1',
    description: 'Root 3rd, 3rd 2nd, 7th 1st',
    rootStringIdx: 3, seventhStringIdx: 5, thirdStringIdx: 4,
  },
  // ── Type C ──
  {
    id: 's541',
    label: '5–4–1',
    description: 'Root 5th, 7th 1st, 3rd 4th',
    rootStringIdx: 1, seventhStringIdx: 5, thirdStringIdx: 2,
  },
  {
    id: 's651',
    label: '6–5–1',
    description: 'Root 6th, 7th 5th, 3rd 1st',
    rootStringIdx: 0, seventhStringIdx: 1, thirdStringIdx: 5,
  },
  {
    id: 's431',
    label: '4–3–1',
    description: 'Root 3rd str, 7th 1st str, 3rd 4th str',
    rootStringIdx: 3, seventhStringIdx: 5, thirdStringIdx: 2,
  },
];

export function getShellShape(id: ShellShapeId): ShellShape {
  const s = SHELL_SHAPES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown shell shape: ${id}`);
  return s;
}

// ─── Inversions & playability ─────────────────────────────────────────────────
//
// Each inversion rotates which tone sits on each shape string slot. Valid voicings
// are found by trying octave placements on each string and keeping only those
// whose frets all fit within one hand position (SHELL_MAX_FRET_SPAN).

type ShellTone = 'root' | 'third' | 'seventh';

/** Tone on each shape string slot for the selected inversion (bass · mid · top). */
const INVERSION_TONE_ORDER: Record<InversionId, [ShellTone, ShellTone, ShellTone]> = {
  root:   ['root', 'seventh', 'third'],
  first:  ['third', 'root', 'seventh'],
  second: ['seventh', 'third', 'root'],
};

// ─── Position finders ─────────────────────────────────────────────────────────

/** Max fret reach for shell voicings — about four fret positions (e.g. frets 2–5). */
export const SHELL_MAX_FRET_SPAN = 3;

function fretsForPitch(
  stringIdx: number,
  pitch: NoteName,
  tuning: TuningId,
  maxFret: number,
): number[] {
  const base = lowestFretForNote(stringIdx, pitch, tuning);
  const frets: number[] = [];
  for (let f = base; f <= maxFret; f += 12) frets.push(f);
  return frets;
}

function isPlayableShellVoicing(
  bassFret: number,
  frets: number[],
  maxSpan: number,
): boolean {
  if (Math.max(...frets) - Math.min(...frets) > maxSpan) return false;
  return frets.every((f) => Math.abs(f - bassFret) <= maxSpan);
}

export function findShellPositions(options: {
  root: NoteName;
  quality: ChordQuality;
  shapeId: ShellShapeId;
  tuning: TuningId;
  inversion?: InversionId;
  maxFret?: number;
  maxSpan?: number;
}): ShellPosition[] {
  const {
    root,
    quality,
    shapeId,
    tuning,
    inversion = 'root',
    maxFret = 17,
    maxSpan = SHELL_MAX_FRET_SPAN,
  } = options;

  const shape = getShellShape(shapeId);
  const [bassTone, midTone, topTone] = INVERSION_TONE_ORDER[inversion];
  const tones = chordTones(root, quality);

  const bassString = shape.rootStringIdx;
  const midString  = shape.seventhStringIdx;
  const topString  = shape.thirdStringIdx;

  const bassFrets = fretsForPitch(bassString, tones[bassTone], tuning, maxFret);
  const midFrets  = fretsForPitch(midString,  tones[midTone],  tuning, maxFret);
  const topFrets  = fretsForPitch(topString,  tones[topTone],  tuning, maxFret);

  const positions: ShellPosition[] = [];

  for (const bassFret of bassFrets) {
    for (const midFret of midFrets) {
      for (const topFret of topFrets) {
        const frets = [bassFret, midFret, topFret];
        if (!isPlayableShellVoicing(bassFret, frets, maxSpan)) continue;

        const notes: FretNote[] = [
          { string: bassString, fret: bassFret, tone: bassTone, pitch: tones[bassTone] },
          { string: midString,  fret: midFret,  tone: midTone,  pitch: tones[midTone] },
          { string: topString,  fret: topFret,  tone: topTone,  pitch: tones[topTone] },
        ];

        const rootNote = notes.find((n) => n.tone === 'root');
        if (!rootNote) continue;

        const anchorFret = Math.min(...frets);

        positions.push({
          id: `${shapeId}-${inversion}-r${rootNote.fret}-a${anchorFret}`,
          shapeId,
          rootFret: rootNote.fret,
          rootPitch: tones.root,
          notes,
          anchorFret,
        });
      }
    }
  }

  return positions;
}

export function findAllShellPositions(options: {
  root: NoteName;
  quality: ChordQuality;
  tuning: TuningId;
  inversion?: InversionId;
  shapeIds?: ShellShapeId[];
  maxFret?: number;
  maxSpan?: number;
}): ShellPosition[] {
  const ids = options.shapeIds ?? (SHELL_SHAPES.map((s) => s.id) as ShellShapeId[]);

  const all = ids.flatMap((shapeId) =>
    findShellPositions({ ...options, shapeId }),
  );

  // Sort by anchor fret (lowest note first), then root fret for stable ordering
  all.sort((a, b) => a.anchorFret - b.anchorFret || a.rootFret - b.rootFret);

  return all;
}

// ─── Inversions ───────────────────────────────────────────────────────────────

export const INVERSION_OPTIONS: { id: InversionId; label: string }[] = [
  { id: 'root',   label: 'Root position' },
  { id: 'first',  label: '1st inversion (3rd in bass)' },
  { id: 'second', label: '2nd inversion (7th in bass)' },
];

/** Legend display order for shell tones under each inversion. */
export const LEGEND_TONE_ORDER: Record<InversionId, ShellTone[]> = {
  root:   ['root', 'third', 'seventh'],
  first:  ['third', 'seventh', 'root'],
  second: ['seventh', 'third', 'root'],
};

// ─── Position grouping ────────────────────────────────────────────────────────

/** String index 0 = 6th (low) … 5 = 1st (high). */
export const ROOT_STRING_ORDER = [0, 1, 2, 3, 4, 5] as const;

export const ROOT_STRING_LABELS = ['6th', '5th', '4th', '3rd', '2nd', '1st'] as const;

export interface PositionGroup {
  stringIdx: number;
  label: string;
  positions: ShellPosition[];
}

/** Which string carries the root note in this voicing. */
export function rootStringForPosition(pos: ShellPosition): number {
  const rootNote = pos.notes.find((n) => n.tone === 'root');
  if (!rootNote) throw new Error(`Position ${pos.id} has no root note`);
  return rootNote.string;
}

/**
 * Group positions by the string that holds the root note.
 * Default order: 6th → 5th → 4th → 3rd → 2nd → 1st.
 * When priorityStringIdx is set (fretboard root placement), that string's
 * group comes first, then the remaining strings in the default order.
 */
export function groupPositionsByRootString(
  positions: ShellPosition[],
  priorityStringIdx?: number | null,
): PositionGroup[] {
  const byString = new Map<number, ShellPosition[]>();
  for (const pos of positions) {
    const s = rootStringForPosition(pos);
    if (!byString.has(s)) byString.set(s, []);
    byString.get(s)!.push(pos);
  }

  const order =
    priorityStringIdx != null
      ? [priorityStringIdx, ...ROOT_STRING_ORDER.filter((s) => s !== priorityStringIdx)]
      : [...ROOT_STRING_ORDER];

  return order
    .filter((s) => (byString.get(s)?.length ?? 0) > 0)
    .map((s) => ({
      stringIdx: s,
      label: `${ROOT_STRING_LABELS[s]} string`,
      positions: byString.get(s)!,
    }));
}

/** Root strings that have at least one position, in 6th → 1st order. */
export function viableRootStrings(positions: ShellPosition[]): number[] {
  const present = new Set(positions.map((p) => rootStringForPosition(p)));
  return ROOT_STRING_ORDER.filter((s) => present.has(s));
}

export function hasViableOnString(
  positions: ShellPosition[],
  stringIdx: number,
): boolean {
  return positions.some((p) => rootStringForPosition(p) === stringIdx);
}
