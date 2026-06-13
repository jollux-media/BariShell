import { useMemo, useState } from 'react';
import { BoardHelpAccordion } from './components/BoardHelpAccordion';
import { AlternateDesignations } from './components/AlternateDesignations';
import { Controls } from './components/Controls';
import { Fretboard } from './components/Fretboard';
import { PositionList } from './components/PositionList';
import { RootPlacementNotice } from './components/RootPlacementNotice';
import { filterViablePositions, findAllExtensionNotes } from './lib/extensions';
import {
  CHORD_QUALITY_SYMBOL,
  displayNote,
  EXTENSION_INTERVALS,
  QUALITY_TONE_LABELS,
} from './lib/music';
import {
  findAllShellPositions,
  getShellShape,
  groupPositionsByRootString,
  hasViableOnString,
  INVERSION_OPTIONS,
  LEGEND_TONE_ORDER,
  viableRootStrings,
} from './lib/shells';
import type {
  ChordQuality,
  ExtensionId,
  FretNote,
  InversionId,
  NoteName,
  ShellPosition,
  ShellShapeId,
  TuningId,
} from './lib/types';
import './App.css';

const MAX_FRET = 17;

/** Type A = skip, Type B = adjacent, Type C = wide open-string voicings. */
const SHAPE_FAMILY: Record<ShellShapeId, 'A' | 'B' | 'C'> = {
  s643: 'A', s532: 'A', s421: 'A',
  s654: 'B', s543: 'B', s432: 'B', s321: 'B',
  s541: 'C', s651: 'C', s431: 'C',
};


function resolveActivePosition(
  list: ShellPosition[],
  selectedShapeId: ShellShapeId | null,
): ShellPosition | null {
  if (!selectedShapeId) return list[0] ?? null;
  const exact = list.find((p) => p.shapeId === selectedShapeId);
  if (exact) return exact;
  const family = SHAPE_FAMILY[selectedShapeId];
  return list.find((p) => SHAPE_FAMILY[p.shapeId] === family) ?? list[0] ?? null;
}

function App() {
  const [root,       setRoot]       = useState<NoteName>('C');
  const [quality,    setQuality]    = useState<ChordQuality>('maj7');
  const [tuning,     setTuning]     = useState<TuningId>('baritone-be');
  const [selectedShapeId, setSelectedShapeId] = useState<ShellShapeId | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [ext1,       setExt1]       = useState<ExtensionId>(null);
  const [ext2,       setExt2]       = useState<ExtensionId>(null);
  const [inversion,  setInversion]  = useState<InversionId>('root');
  const [dragMode,        setDragMode]        = useState(false);
  const [dragRootString,  setDragRootString]  = useState<number | null>(null);

  const [openHelpPanel, setOpenHelpPanel] = useState<'positions' | 'designations' | null>(null);

  function toggleHelpPanel(panel: 'positions' | 'designations') {
    setOpenHelpPanel((prev) => (prev === panel ? null : panel));
  }

  const allPositions = useMemo(
    () =>
      findAllShellPositions({
        root,
        quality,
        tuning,
        inversion,
        shapeIds: undefined,
        maxFret: MAX_FRET,
      }),
    [root, quality, tuning, inversion],
  );

  const viablePositions = useMemo(
    () => filterViablePositions(allPositions, ext1, ext2, tuning, MAX_FRET),
    [allPositions, ext1, ext2, tuning],
  );

  const rootPlacementUnavailable =
    dragMode
    && dragRootString !== null
    && !hasViableOnString(viablePositions, dragRootString);

  const alternateRootStrings = useMemo(
    () =>
      rootPlacementUnavailable
        ? viableRootStrings(viablePositions).filter((s) => s !== dragRootString)
        : [],
    [rootPlacementUnavailable, viablePositions, dragRootString],
  );

  const priorityRootString =
    dragMode && dragRootString !== null && !rootPlacementUnavailable
      ? dragRootString
      : null;

  const positionGroups = useMemo(() => {
    if (rootPlacementUnavailable) {
      return groupPositionsByRootString(viablePositions, null).filter(
        (g) => g.stringIdx !== dragRootString,
      );
    }
    return groupPositionsByRootString(viablePositions, priorityRootString);
  }, [
    viablePositions,
    rootPlacementUnavailable,
    dragRootString,
    priorityRootString,
  ]);

  const orderedPositions = useMemo(
    () => positionGroups.flatMap((g) => g.positions),
    [positionGroups],
  );

  const activePosition = useMemo(() => {
    if (selectedPositionId) {
      const byId = viablePositions.find((p) => p.id === selectedPositionId);
      if (byId) return byId;
    }
    return resolveActivePosition(orderedPositions, selectedShapeId);
  }, [selectedPositionId, viablePositions, orderedPositions, selectedShapeId]);

  const extensionNotes = useMemo<FretNote[]>(() => {
    if (!activePosition) return [];
    return findAllExtensionNotes(activePosition, ext1, ext2, tuning, MAX_FRET);
  }, [ext1, ext2, activePosition, tuning]);

  const voicedNotes = useMemo(
    () => (activePosition ? [...activePosition.notes, ...extensionNotes] : []),
    [activePosition, extensionNotes],
  );

  const toneLabels = QUALITY_TONE_LABELS[quality];

  const chordName = (() => {
    const base = displayNote(root) + CHORD_QUALITY_SYMBOL[quality];
    const exts = extensionNotes
      .map((n) => EXTENSION_INTERVALS[
        (n.tone === 'ext1' ? ext1 : ext2) as NonNullable<ExtensionId>
      ].label)
      .join('/');
    return exts ? `${base}(${exts})` : base;
  })();

  function handleRootPlace(note: NoteName, strIdx: number) {
    setRoot(note);
    setDragRootString(strIdx);
    setSelectedPositionId(null);
  }

  const legendShellTones = LEGEND_TONE_ORDER[inversion];

  function legendLabel(tone: 'root' | 'third' | 'seventh'): string {
    if (tone === 'root') return 'Root';
    return toneLabels[tone];
  }

  const showExt1Swatch = ext1 != null && extensionNotes.some((n) => n.tone === 'ext1');
  const showExt2Swatch = ext2 != null && extensionNotes.some((n) => n.tone === 'ext2');
  const positionCount = viablePositions.length;

  const comboDescription = useMemo(() => {
    const parts: string[] = [displayNote(root) + CHORD_QUALITY_SYMBOL[quality]];
    if (inversion !== 'root') {
      const inv = INVERSION_OPTIONS.find((o) => o.id === inversion);
      if (inv) parts.push(inv.label);
    }
    if (ext1) parts.push(EXTENSION_INTERVALS[ext1].label);
    if (ext2) parts.push(EXTENSION_INTERVALS[ext2].label);
    return parts.join(' · ');
  }, [root, quality, inversion, ext1, ext2]);

  const noViableGlobally = viablePositions.length === 0;

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>BariShell</h1>
          <p className="tagline">Deep chords. Clear paths. Better playing.</p>
        </div>
      </header>

      <Controls
        tuning={tuning}
        root={root}
        quality={quality}
        ext1={ext1}
        ext2={ext2}
        inversion={inversion}
        isDragMode={dragMode}
        onTuningChange={(t) => {
          setTuning(t);
          setSelectedShapeId(null);
          setSelectedPositionId(null);
          setDragRootString(null);
        }}
        onRootChange={(r) => {
          setRoot(r);
          setDragRootString(null);
          setSelectedPositionId(null);
        }}
        onQualityChange={(q) => {
          setQuality(q);
          setSelectedShapeId(null);
          setSelectedPositionId(null);
        }}
        onExt1Change={setExt1}
        onExt2Change={setExt2}
        onInversionChange={(inv) => {
          setInversion(inv);
          setSelectedShapeId(null);
          setSelectedPositionId(null);
        }}
        onDragModeToggle={(on) => { setDragMode(on); if (!on) setDragRootString(null); }}
      />

      <section className="chord-hero">
        <h2 className="chord-name">{chordName}</h2>
        <div className="legend legend--hero" aria-label="Chord tone colors">
          {legendShellTones.map((tone) => (
            <span key={tone}>
              <i className={`swatch swatch--${tone}`} />
              {legendLabel(tone)}
            </span>
          ))}
          {showExt1Swatch && (
            <span>
              <i className="swatch swatch--ext1" />
              {EXTENSION_INTERVALS[ext1!].label}
            </span>
          )}
          {showExt2Swatch && (
            <span>
              <i className="swatch swatch--ext2" />
              {EXTENSION_INTERVALS[ext2!].label}
            </span>
          )}
        </div>
        {dragMode && (
          <p className="drag-hint">Click the fretboard to place the root note</p>
        )}
      </section>

      <main className="main">
        <section className="fretboard-section">
          <Fretboard
            tuning={tuning}
            maxFret={MAX_FRET}
            position={activePosition}
            extensions={extensionNotes}
            quality={quality}
            dragMode={dragMode}
            onRootPlace={handleRootPlace}
          />
          {activePosition && (
            <p className="position-caption">
              Shape {getShellShape(activePosition.shapeId).label} · anchor fret{' '}
              {activePosition.anchorFret}
            </p>
          )}
        </section>

        <section className="positions-panel">
          {rootPlacementUnavailable && alternateRootStrings.length > 0 && (
            <RootPlacementNotice
              clickedStringIdx={dragRootString!}
              alternateStringIndices={alternateRootStrings}
              chordDescription={comboDescription}
              onSelectString={(strIdx) => {
                setDragRootString(strIdx);
                setSelectedPositionId(null);
              }}
            />
          )}
          <h2>
            Positions <span className="count">({positionCount})</span>
          </h2>
          <PositionList
            groups={positionGroups}
            priorityStringIdx={priorityRootString}
            selectedPositionId={selectedPositionId ?? activePosition?.id ?? null}
            emptyMessage={
              noViableGlobally
                ? `No voicings support ${comboDescription} for ${displayNote(root)}. Try a different quality, inversion, or extension.`
                : undefined
            }
            onSelect={(id) => {
              const pos = viablePositions.find((p) => p.id === id);
              if (pos) {
                setSelectedPositionId(id);
                setSelectedShapeId(pos.shapeId);
              }
            }}
          />
        </section>

        <div className="help-stack">
          <BoardHelpAccordion
            title="Chord notes & theory"
            open={openHelpPanel === 'positions'}
            onToggle={() => toggleHelpPanel('positions')}
          >
            <p>
              Each position is a different 3-note voicing of the chord (root,{' '}
              {toneLabels.third}, {toneLabels.seventh}) sorted from the lowest fret to the
              highest. Fret offsets automatically adjust across the major-third string interval
              (strings 3→2).
            </p>
          </BoardHelpAccordion>

          <AlternateDesignations
            notes={voicedNotes}
            tuning={tuning}
            selectedRoot={root}
            selectedQuality={quality}
            selectedInversion={inversion}
            selectedExt1={ext1}
            selectedExt2={ext2}
            primaryName={chordName}
            open={openHelpPanel === 'designations'}
            onToggle={() => toggleHelpPanel('designations')}
          />
        </div>
      </main>

      <footer className="footer">
        Baritone strings: 6 (low) through 1 (high). Frets 0–{MAX_FRET} shown.
      </footer>
    </div>
  );
}

export default App;
