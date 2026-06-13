import {
  CHORD_QUALITY_GROUPS,
  CHORD_QUALITY_LABELS,
  EXTENSION_INTERVALS,
  ROOT_OPTIONS,
  TUNINGS,
} from '../lib/music';
import { INVERSION_OPTIONS } from '../lib/shells';
import type {
  ChordQuality,
  ExtensionId,
  InversionId,
  NoteName,
  TuningId,
} from '../lib/types';
import { ControlSelect } from './ControlSelect';

interface ControlsProps {
  tuning:      TuningId;
  root:        NoteName;
  quality:     ChordQuality;
  ext1:        ExtensionId;
  ext2:        ExtensionId;
  inversion:   InversionId;
  isDragMode:  boolean;
  onTuningChange:     (t: TuningId) => void;
  onRootChange:       (root: NoteName) => void;
  onQualityChange:    (q: ChordQuality) => void;
  onExt1Change:       (e: ExtensionId) => void;
  onExt2Change:       (e: ExtensionId) => void;
  onInversionChange:  (inv: InversionId) => void;
  onDragModeToggle:   (on: boolean) => void;
}

const EXT_OPTIONS = Object.entries(EXTENSION_INTERVALS) as [
  NonNullable<ExtensionId>,
  { label: string; semitones: number },
][];

export function Controls({
  tuning,
  root,
  quality,
  ext1,
  ext2,
  inversion,
  isDragMode,
  onTuningChange,
  onRootChange,
  onQualityChange,
  onExt1Change,
  onExt2Change,
  onInversionChange,
  onDragModeToggle,
}: ControlsProps) {
  const rootSelectValue = isDragMode ? 'drag' : root;

  function handleRootChange(value: string) {
    if (value === 'drag') {
      onDragModeToggle(true);
    } else {
      onDragModeToggle(false);
      onRootChange(value as NoteName);
    }
  }

  function handleExtChange(
    value: string,
    setter: (e: ExtensionId) => void,
  ) {
    setter(value === '' ? null : (value as NonNullable<ExtensionId>));
  }

  const tuningOptions = (Object.keys(TUNINGS) as TuningId[]).map((id) => ({
    value: id,
    label: TUNINGS[id].label,
  }));

  const rootOptions = [
    { value: 'drag', label: 'Click fretboard…' },
    ...ROOT_OPTIONS.map((n) => ({ value: n, label: n })),
  ];

  const qualityOptions = CHORD_QUALITY_GROUPS.map((group) => ({
    label: group.label,
    options: group.qualities.map((q) => ({
      value: q,
      label: CHORD_QUALITY_LABELS[q],
    })),
  }));

  const extOptions = [
    { value: '', label: 'None' },
    ...EXT_OPTIONS.map(([id, { label }]) => ({ value: id, label })),
  ];

  const inversionOptions = INVERSION_OPTIONS.map(({ id, label }) => ({
    value: id,
    label,
  }));

  return (
    <div className="controls">
      <ControlSelect
        label="Tuning"
        value={tuning}
        options={tuningOptions}
        onChange={(v) => onTuningChange(v as TuningId)}
        className="control--tuning"
      />

      <ControlSelect
        label="Root"
        value={rootSelectValue}
        options={rootOptions}
        onChange={handleRootChange}
      />

      <ControlSelect
        label="Quality"
        value={quality}
        options={qualityOptions}
        onChange={(v) => onQualityChange(v as ChordQuality)}
        className="control--chord-type"
      />

      <ControlSelect
        label="Extension"
        value={ext1 ?? ''}
        options={extOptions}
        onChange={(v) => handleExtChange(v, onExt1Change)}
      />

      <ControlSelect
        label="Extension 2"
        value={ext2 ?? ''}
        options={extOptions}
        onChange={(v) => handleExtChange(v, onExt2Change)}
      />

      <ControlSelect
        label="Inversion"
        value={inversion}
        options={inversionOptions}
        onChange={(v) => onInversionChange(v as InversionId)}
        className="control--inversion"
      />
    </div>
  );
}
