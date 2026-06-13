import {
  absoluteMidi,
  CHORD_QUALITY_SYMBOL,
  CHROMATIC,
  displayNote,
  EXTENSION_INTERVALS,
  NOTE_INDEX,
  QUALITY_INTERVALS,
} from './music';
import type { ChordQuality, ExtensionId, FretNote, InversionId, NoteName, TuningId } from './types';

const OPTIONAL_INTERVALS = [7]; // perfect 5th — often omitted in shell voicings

const ALL_QUALITIES = Object.keys(QUALITY_INTERVALS) as ChordQuality[];
const ALL_EXTENSIONS = Object.keys(EXTENSION_INTERVALS) as NonNullable<ExtensionId>[];

export interface AlternateDesignation {
  name: string;
  pitchSummary: string;
  context: string;
  isPrimary?: boolean;
}

export interface ChordAnalysisInput {
  notes: FretNote[];
  tuning: TuningId;
  selectedRoot: NoteName;
  selectedQuality: ChordQuality;
  selectedInversion: InversionId;
  selectedExt1: ExtensionId;
  selectedExt2: ExtensionId;
  primaryName: string;
}

function pitchClassSet(notes: FretNote[]): Set<number> {
  return new Set(notes.map((n) => NOTE_INDEX[n.pitch]));
}

function pitchSummary(notes: FretNote[]): string {
  const ordered = [...new Set(notes.map((n) => n.pitch))].sort(
    (a, b) => NOTE_INDEX[a] - NOTE_INDEX[b],
  );
  return ordered.map(displayNote).join(' · ');
}

function bassNote(notes: FretNote[], tuning: TuningId): FretNote {
  return notes.reduce((lowest, note) =>
    absoluteMidi(note.string, note.fret, tuning)
      < absoluteMidi(lowest.string, lowest.fret, tuning)
      ? note
      : lowest,
  );
}

function baseIntervals(quality: ChordQuality): number[] {
  const { third, seventh } = QUALITY_INTERVALS[quality];
  return [0, third, seventh];
}

function extensionsPresent(
  rootIdx: number,
  pitchSet: Set<number>,
  quality: ChordQuality,
): NonNullable<ExtensionId>[] {
  const shell = new Set(baseIntervals(quality));
  const found: NonNullable<ExtensionId>[] = [];
  for (const id of ALL_EXTENSIONS) {
    const semitones = EXTENSION_INTERVALS[id].semitones;
    if (shell.has(semitones)) continue;
    if (pitchSet.has((rootIdx + semitones) % 12)) found.push(id);
  }
  return found;
}

function matchesAsChord(
  rootIdx: number,
  pitchSet: Set<number>,
  quality: ChordQuality,
  extensions: NonNullable<ExtensionId>[],
): boolean {
  const required = [
    ...baseIntervals(quality),
    ...extensions.map((id) => EXTENSION_INTERVALS[id].semitones),
  ];
  const allowed = new Set([...required, ...OPTIONAL_INTERVALS]);

  for (const pc of pitchSet) {
    if (!allowed.has((pc - rootIdx + 12) % 12)) return false;
  }
  for (const interval of required) {
    if (!pitchSet.has((rootIdx + interval) % 12)) return false;
  }
  return true;
}

function formatName(
  root: NoteName,
  quality: ChordQuality,
  extensions: NonNullable<ExtensionId>[],
  bass: NoteName,
): string {
  let name = displayNote(root) + CHORD_QUALITY_SYMBOL[quality];
  if (extensions.length > 0) {
    name += `(${extensions.map((id) => EXTENSION_INTERVALS[id].label).join('/')})`;
  }
  if (bass !== root) name += `/${displayNote(bass)}`;
  return name;
}

function selectedExtensions(input: ChordAnalysisInput): NonNullable<ExtensionId>[] {
  const ids: NonNullable<ExtensionId>[] = [];
  if (input.selectedExt1) ids.push(input.selectedExt1);
  if (input.selectedExt2) ids.push(input.selectedExt2);
  return ids;
}

function sameExtensions(
  a: NonNullable<ExtensionId>[],
  b: NonNullable<ExtensionId>[],
): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, i) => id === sortedB[i]);
}

function inversionLabel(inversion: InversionId): string | null {
  if (inversion === 'first') return '1st inversion (3rd in bass)';
  if (inversion === 'second') return '2nd inversion (7th in bass)';
  return null;
}

function buildContext(
  root: NoteName,
  bass: NoteName,
  pitchSet: Set<number>,
  input: ChordAnalysisInput,
): string {
  const rootInVoicing = pitchSet.has(NOTE_INDEX[root]);
  const bassIsRoot = bass === root;
  const isSelectedRoot = root === input.selectedRoot;

  if (isSelectedRoot && rootInVoicing && bassIsRoot && inversionLabel(input.selectedInversion) === null) {
    return 'Your chosen chord symbol — the notes match this function when the root is in the bass.';
  }

  const parts: string[] = [];

  if (!rootInVoicing) {
    parts.push('Rootless voicing — the root is implied by the band or resolving harmony.');
  }

  if (bassIsRoot) {
    parts.push('With this note in the bass, listeners tend to hear this harmonic function.');
  } else {
    parts.push(
      `The bass note ${displayNote(bass)} shapes how this collection is heard — same notes, different role than ${displayNote(root)} in the bass.`,
    );
  }

  if (isSelectedRoot && !bassIsRoot) {
    const inv = inversionLabel(input.selectedInversion);
    if (inv) parts.push(`Matches your ${inv.toLowerCase()} reading of ${input.primaryName}.`);
  }

  return parts.join(' ');
}

function scoreMatch(
  root: NoteName,
  bass: NoteName,
  input: ChordAnalysisInput,
): number {
  let score = 0;
  if (root === bass) score += 40;
  if (root === input.selectedRoot) score += 20;
  if (root === bass && root === input.selectedRoot) score += 10;
  return score;
}

export function findAlternateDesignations(input: ChordAnalysisInput): AlternateDesignation[] {
  const { notes, tuning, selectedRoot, selectedQuality, primaryName } = input;
  if (notes.length === 0) return [];

  const pitchSet = pitchClassSet(notes);
  const summary = pitchSummary(notes);
  const bass = bassNote(notes, tuning).pitch;

  const matches: Array<AlternateDesignation & { score: number }> = [];

  for (let rootIdx = 0; rootIdx < 12; rootIdx++) {
    const root = CHROMATIC[rootIdx];
    for (const quality of ALL_QUALITIES) {
      const extensions = extensionsPresent(rootIdx, pitchSet, quality);
      if (!matchesAsChord(rootIdx, pitchSet, quality, extensions)) continue;

      const name = formatName(root, quality, extensions, bass);
      const isPrimary =
        root === selectedRoot
        && quality === selectedQuality
        && sameExtensions(extensions, selectedExtensions(input));

      matches.push({
        name,
        pitchSummary: summary,
        context: buildContext(root, bass, pitchSet, input),
        isPrimary,
        score: scoreMatch(root, bass, input),
      });
    }
  }

  const byName = new Map<string, AlternateDesignation & { score: number }>();
  for (const match of matches) {
    const existing = byName.get(match.name);
    if (!existing || match.score > existing.score) byName.set(match.name, match);
  }

  const sorted = [...byName.values()].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  const primaryIdx = sorted.findIndex((d) => d.isPrimary);
  if (primaryIdx === -1 && primaryName) {
    sorted.unshift({
      name: bass !== selectedRoot ? `${primaryName}/${displayNote(bass)}` : primaryName,
      pitchSummary: summary,
      context: buildContext(selectedRoot, bass, pitchSet, input),
      isPrimary: true,
      score: 100,
    });
  } else if (primaryIdx > 0) {
    const [primary] = sorted.splice(primaryIdx, 1);
    sorted.unshift(primary);
  }

  const MAX_SHOWN = 10;
  const trimmed = sorted.slice(0, MAX_SHOWN);

  return trimmed.map(({ score: _score, ...rest }) => rest);
}

export const CHORD_AMBIGUITY_INTRO =
  'A chord symbol names a harmonic function, not an exact voicing. The same notes — especially with extensions or inversions — can support more than one reading depending on bass note and context.';
