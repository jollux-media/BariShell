import type { ChordQuality, ExtensionId, NoteName, TuningId } from './types';

export const CHROMATIC: NoteName[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

export const NOTE_INDEX: Record<NoteName, number> = Object.fromEntries(
  CHROMATIC.map((n, i) => [n, i]),
) as Record<NoteName, number>;

/** Open strings, index 0 = 6th (lowest). midiBase is the MIDI note number of each open string. */
export const TUNINGS: Record<TuningId, { label: string; open: NoteName[]; midiBase: number[] }> = {
  'baritone-be': {
    label: 'B–E–A–D–F♯–B (standard baritone)',
    open: ['B', 'E', 'A', 'D', 'F#', 'B'],
    // B1=35  E2=40  A2=45  D3=50  F#3=54  B3=59
    midiBase: [35, 40, 45, 50, 54, 59],
  },
  'baritone-adg': {
    label: 'A–D–G–C–E–A',
    open: ['A', 'D', 'G', 'C', 'E', 'A'],
    // A1=33  D2=38  G2=43  C3=48  E3=52  A3=57
    midiBase: [33, 38, 43, 48, 52, 57],
  },
  'guitar-standard': {
    label: 'E–A–D–G–B–E (standard guitar)',
    open: ['E', 'A', 'D', 'G', 'B', 'E'],
    // E2=40 A2=45 D3=50 G3=55 B3=59 E4=64
    midiBase: [40, 45, 50, 55, 59, 64],
  },
};

/** Absolute MIDI pitch for a string/fret combination in a given tuning. */
export function absoluteMidi(stringIdx: number, fret: number, tuning: TuningId): number {
  return TUNINGS[tuning].midiBase[stringIdx] + fret;
}

// ─── Chord quality definitions ────────────────────────────────────────────────
// The `third` field is the "second chord tone" (not always a literal 3rd —
// for sus chords it is a 2nd or 4th; for 6th chords it is a literal 3rd).
// The `seventh` field is the "third chord tone" (6th, 7th, or dim-7th).

export const QUALITY_INTERVALS: Record<ChordQuality, { third: number; seventh: number }> = {
  // 7th chords
  maj7:      { third: 4, seventh: 11 },
  dom7:      { third: 4, seventh: 10 },
  min7:      { third: 3, seventh: 10 },
  m7b5:      { third: 3, seventh: 10 }, // shell omits ♭5; root+♭3+♭7 identical to min7
  dim7:      { third: 3, seventh: 9  }, // root + m3 + d7
  // 6th chords
  '6':       { third: 4, seventh: 9  }, // root + M3 + M6
  m6:        { third: 3, seventh: 9  }, // root + m3 + M6
  // Sus chords (retain 7th so three-note shell works)
  '7sus4':   { third: 5, seventh: 10 }, // root + P4 + m7
  maj7sus4:  { third: 5, seventh: 11 }, // root + P4 + M7
  '7sus2':   { third: 2, seventh: 10 }, // root + M2 + m7
  maj7sus2:  { third: 2, seventh: 11 }, // root + M2 + M7
};

/** Full labels shown in the chord-type dropdown. */
export const CHORD_QUALITY_LABELS: Record<ChordQuality, string> = {
  maj7:     'Major 7 (Δ7)',
  dom7:     'Dominant 7',
  min7:     'Minor 7 (m7)',
  m7b5:     'Half-diminished (m7♭5)',
  dim7:     'Diminished 7 (º7)',
  '6':      'Major 6',
  m6:       'Minor 6 (m6)',
  '7sus4':  '7sus4',
  maj7sus4: 'Δ7sus4',
  '7sus2':  '7sus2',
  maj7sus2: 'Δ7sus2',
};

/** Short chord-name symbol appended to the root (e.g. "C" + "Δ7" = "CΔ7"). */
export const CHORD_QUALITY_SYMBOL: Record<ChordQuality, string> = {
  maj7:     'Δ7',
  dom7:     '7',
  min7:     'm7',
  m7b5:     'm7♭5',
  dim7:     'º7',
  '6':      '6',
  m6:       'm6',
  '7sus4':  '7sus4',
  maj7sus4: 'Δ7sus4',
  '7sus2':  '7sus2',
  maj7sus2: 'Δ7sus2',
};

/** Quality-specific labels for each chord tone slot, used in the position list. */
export const QUALITY_TONE_LABELS: Record<ChordQuality, { third: string; seventh: string }> = {
  maj7:     { third: '3',    seventh: 'Δ7'  },
  dom7:     { third: '3',    seventh: '♭7'  },
  min7:     { third: '♭3',   seventh: '♭7'  },
  m7b5:     { third: '♭3',   seventh: '♭7'  },
  dim7:     { third: '♭3',   seventh: 'º7'  },
  '6':      { third: '3',    seventh: '6'   },
  m6:       { third: '♭3',   seventh: '6'   },
  '7sus4':  { third: 'sus4', seventh: '♭7'  },
  maj7sus4: { third: 'sus4', seventh: 'Δ7'  },
  '7sus2':  { third: 'sus2', seventh: '♭7'  },
  maj7sus2: { third: 'sus2', seventh: 'Δ7'  },
};

/** Grouped chord qualities for the optgroup dropdown. */
export const CHORD_QUALITY_GROUPS: Array<{ label: string; qualities: ChordQuality[] }> = [
  { label: '7th chords', qualities: ['maj7', 'dom7', 'min7', 'm7b5', 'dim7'] },
  { label: '6th chords', qualities: ['6', 'm6'] },
  { label: 'Sus chords', qualities: ['7sus4', 'maj7sus4', '7sus2', 'maj7sus2'] },
];

// ─── Extension intervals ──────────────────────────────────────────────────────

export const EXTENSION_INTERVALS: Record<NonNullable<ExtensionId>, { label: string; semitones: number }> = {
  b9:   { label: '♭9',  semitones: 1 },
  '9':  { label: '9',   semitones: 2 },
  s9:   { label: '♯9',  semitones: 3 },
  '11': { label: '11',  semitones: 5 },
  s11:  { label: '♯11', semitones: 6 },
  b13:  { label: '♭13', semitones: 8 },
  '13': { label: '13',  semitones: 9 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const ROOT_OPTIONS: NoteName[] = [...CHROMATIC];

/** Lowest fret (0–11) on stringIdx where `note` sounds. Repeats every 12 frets. */
export function lowestFretForNote(stringIdx: number, note: NoteName, tuning: TuningId): number {
  const openIdx = NOTE_INDEX[TUNINGS[tuning].open[stringIdx]];
  const targetIdx = NOTE_INDEX[note];
  return (targetIdx - openIdx + 12) % 12;
}

/**
 * Cumulative semitone interval from open string `fromIdx` to `toIdx`.
 * `toIdx` must be > `fromIdx`.
 */
export function openStringDiff(fromIdx: number, toIdx: number, tuning: TuningId): number {
  const open = TUNINGS[tuning].open;
  let total = 0;
  for (let i = fromIdx; i < toIdx; i++) {
    total += ((NOTE_INDEX[open[i + 1]] - NOTE_INDEX[open[i]]) + 12) % 12;
  }
  return total;
}

export function pitchAt(stringIndex: number, fret: number, tuning: TuningId): NoteName {
  const open = TUNINGS[tuning].open[stringIndex];
  return CHROMATIC[(NOTE_INDEX[open] + fret) % 12];
}

export function chordTones(
  root: NoteName,
  quality: ChordQuality,
): { root: NoteName; third: NoteName; seventh: NoteName } {
  const rootIdx = NOTE_INDEX[root];
  const { third, seventh } = QUALITY_INTERVALS[quality];
  return {
    root,
    third:   CHROMATIC[(rootIdx + third)   % 12],
    seventh: CHROMATIC[(rootIdx + seventh) % 12],
  };
}

export function displayNote(n: NoteName): string {
  return n.replace('#', '♯');
}
