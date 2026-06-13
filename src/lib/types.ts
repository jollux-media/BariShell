export type NoteName =
  | 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F'
  | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type ChordQuality =
  // 7th chords
  | 'maj7' | 'dom7' | 'min7' | 'm7b5' | 'dim7'
  // 6th chords
  | '6' | 'm6'
  // Sus chords (all with 7th so shell logic works)
  | '7sus4' | 'maj7sus4' | '7sus2' | 'maj7sus2';

/** Two dropdowns allow up to two simultaneous extensions. */
export type ExtensionId =
  | 'b9' | '9' | 's9' | '11' | 's11' | 'b13' | '13' | null;

/**
 * Shape IDs encode which strings carry root / 7th / 3rd.
 *
 * Type A  (root – skip – 7th – 3rd):  s643 · s532 · s421
 * Type B  (3rd – root – 7th, adjacent): s654 · s543 · s432 · s321
 * Type C  (wide/open-string voicings):  s541 · s651 · s431
 */
export type ShellShapeId =
  | 's643' | 's532' | 's421'
  | 's654' | 's543' | 's432' | 's321'
  | 's541' | 's651' | 's431';

export type TuningId = 'baritone-be' | 'baritone-adg' | 'guitar-standard';

/** Root position, or 1st/2nd inversion (3rd or 7th in bass). */
export type InversionId = 'root' | 'first' | 'second';

export type ChordTone = 'root' | 'third' | 'seventh' | 'ext1' | 'ext2';

export interface ShellShape {
  id: ShellShapeId;
  label: string;
  description: string;
  rootStringIdx: number;
  seventhStringIdx: number;
  thirdStringIdx: number;
}

export interface FretNote {
  string: number;
  fret: number;
  tone: ChordTone;
  pitch: NoteName;
  /** Overrides the dot text label (used for extension interval names). */
  label?: string;
}

export interface ShellPosition {
  id: string;
  shapeId: ShellShapeId;
  rootFret: number;
  rootPitch: NoteName;
  notes: FretNote[];
  anchorFret: number;
}
