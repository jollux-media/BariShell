import { useRef, useState } from 'react';
import { displayNote, pitchAt, TUNINGS } from '../lib/music';
import type { ChordQuality, FretNote, NoteName, ShellPosition, TuningId } from '../lib/types';

const TONE_COLORS: Record<FretNote['tone'], string> = {
  root:    'var(--tone-root)',
  third:   'var(--tone-third)',
  seventh: 'var(--tone-seventh)',
  ext1:    'var(--tone-ext1)',
  ext2:    'var(--tone-ext2)',
};

// Layout constants
const LEFT    = 52;   // left margin for open-note labels
const FRET_W  = 52;   // width of each fret space
const TOP     = 22;   // top margin for fret numbers
const STR_GAP = 26;   // vertical gap between strings
const N_STRINGS = 6;

const rowY       = (r: number) => TOP + r * STR_GAP + STR_GAP / 2;
const rowToIdx   = (r: number) => N_STRINGS - 1 - r;
const fretCentreX = (f: number) => LEFT + (f - 0.5) * FRET_W;
const fretBarX   = (f: number) => LEFT + f * FRET_W;

const SVG_H = TOP + N_STRINGS * STR_GAP + 6;

const SINGLE_MARKER_FRETS = [3, 5, 7, 9, 15, 17];
const DOUBLE_MARKER_FRET  = 12;
const STRING_WIDTHS       = [0.7, 1.0, 1.4, 1.8, 2.3, 2.9];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// The open-string label circle sits just left of the nut
const OPEN_CX = LEFT - 20;

interface GhostPos { row: number; fret: number }

interface FretboardProps {
  tuning:        TuningId;
  maxFret:       number;
  position:      ShellPosition | null;
  extensions?:   FretNote[];
  quality?:      ChordQuality;
  dragMode?:     boolean;
  onRootPlace?:  (note: NoteName, strIdx: number, fret: number) => void;
}

export function Fretboard({
  tuning,
  maxFret,
  position,
  extensions = [],
  dragMode = false,
  onRootPlace,
}: FretboardProps) {
  const [ghost, setGhost] = useState<GhostPos | null>(null);
  const isDragging = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const openStrings = TUNINGS[tuning].open;

  const activeByStringIdx = new Map<number, FretNote>();
  if (position) {
    for (const note of position.notes) {
      activeByStringIdx.set(note.string, note);
    }
  }

  const extByStringIdx = new Map<number, FretNote>();
  for (const ext of extensions) {
    extByStringIdx.set(ext.string, ext);
  }

  const frets  = Array.from({ length: maxFret + 1 }, (_, i) => i);
  const svgW   = fretBarX(maxFret) + 12;
  const topY   = rowY(0);
  const botY   = rowY(N_STRINGS - 1);
  const midY   = (rowY(2) + rowY(3)) / 2;
  const upperY = (rowY(0) + rowY(1)) / 2;
  const lowerY = (rowY(N_STRINGS - 2) + rowY(N_STRINGS - 1)) / 2;

  /**
   * Convert a screen-space pointer position to fretboard row + fret.
   * Uses the SVG's own CTM so viewBox scaling, preserveAspectRatio offsets,
   * and CSS transforms are all handled correctly.
   */
  function screenToFretboard(clientX: number, clientY: number): GhostPos {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return { row: 0, fret: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const { x: svgX, y: svgY } = pt.matrixTransform(ctm.inverse());
    const row  = clamp(Math.round((svgY - TOP - STR_GAP / 2) / STR_GAP), 0, N_STRINGS - 1);
    const fret = clamp(Math.round((svgX - LEFT) / FRET_W), 0, maxFret);
    return { row, fret };
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragMode || !onRootPlace) return;
    e.preventDefault(); // stop browser text-selection on drag
    // Capture keeps pointerMove/Up firing even if cursor leaves the SVG
    svgRef.current?.setPointerCapture(e.pointerId);
    isDragging.current = true;
    setGhost(null);
    const { row, fret } = screenToFretboard(e.clientX, e.clientY);
    onRootPlace(pitchAt(rowToIdx(row), fret, tuning), rowToIdx(row), fret);
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragMode) return;
    if (isDragging.current && onRootPlace) {
      // Live chord update during drag — chord dots are the visual feedback
      const { row, fret } = screenToFretboard(e.clientX, e.clientY);
      onRootPlace(pitchAt(rowToIdx(row), fret, tuning), rowToIdx(row), fret);
    } else {
      // Not dragging — show ghost preview
      setGhost(screenToFretboard(e.clientX, e.clientY));
    }
  }

  function handlePointerUp() {
    if (!dragMode) return;
    isDragging.current = false;
    setGhost(null);
  }

  function handlePointerLeave() {
    // Pointer capture keeps events flowing during drag; only clear ghost on hover-leave
    if (!isDragging.current) setGhost(null);
  }

  const ghostX = ghost != null
    ? (ghost.fret === 0 ? OPEN_CX : fretCentreX(ghost.fret))
    : null;
  const ghostY = ghost != null ? rowY(ghost.row) : null;

  return (
    <div className="fretboard-wrap">
      <svg
        ref={svgRef}
        className={`fretboard${dragMode ? ' fretboard--drag' : ''}`}
        viewBox={`0 0 ${svgW} ${SVG_H}`}
        role="img"
        aria-label="Guitar fretboard"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        <defs>
          <linearGradient id="rosewood-board" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a2e1e" />
            <stop offset="35%" stopColor="#3a2218" />
            <stop offset="70%" stopColor="#2e1a12" />
            <stop offset="100%" stopColor="#1f120c" />
          </linearGradient>
          <linearGradient id="rosewood-grain" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#000" stopOpacity="0.08" />
            <stop offset="25%" stopColor="#fff" stopOpacity="0.03" />
            <stop offset="50%" stopColor="#000" stopOpacity="0.06" />
            <stop offset="75%" stopColor="#fff" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.07" />
          </linearGradient>
          <filter id="note-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="board-shadow" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.45" />
          </filter>
        </defs>

        <rect
          x={LEFT}
          y={topY - 8}
          width={fretBarX(maxFret) - LEFT}
          height={botY - topY + 16}
          fill="url(#rosewood-board)"
          rx={6}
          filter="url(#board-shadow)"
        />
        <rect
          x={LEFT}
          y={topY - 8}
          width={fretBarX(maxFret) - LEFT}
          height={botY - topY + 16}
          fill="url(#rosewood-grain)"
          rx={6}
          opacity={0.9}
        />

        {/* Fret bars */}
        {frets.map((fret) => (
          <line
            key={`fret-${fret}`}
            x1={fretBarX(fret)} y1={topY}
            x2={fretBarX(fret)} y2={botY}
            className={fret === 0 ? 'nut-line' : 'fret-line'}
          />
        ))}

        {/* Position marker dots */}
        {SINGLE_MARKER_FRETS.filter((f) => f <= maxFret).map((f) => (
          <circle key={`marker-${f}`} cx={fretCentreX(f)} cy={midY} r={5} className="pos-marker" />
        ))}
        {DOUBLE_MARKER_FRET <= maxFret && (
          <>
            <circle cx={fretCentreX(DOUBLE_MARKER_FRET)} cy={upperY} r={5} className="pos-marker" />
            <circle cx={fretCentreX(DOUBLE_MARKER_FRET)} cy={lowerY} r={5} className="pos-marker" />
          </>
        )}

        {/* Fret numbers */}
        {frets.filter((f) => f > 0).map((f) => (
          <text key={`fnum-${f}`} x={fretCentreX(f)} y={TOP - 4} textAnchor="middle" className="fret-number">
            {f}
          </text>
        ))}

        {/* Strings, labels, and dots */}
        {Array.from({ length: N_STRINGS }, (_, row) => {
          const stringIdx = rowToIdx(row);
          const y         = rowY(row);
          const endX      = fretBarX(maxFret);
          const active    = activeByStringIdx.get(stringIdx);
          const extNote   = extByStringIdx.get(stringIdx);
          const openNote  = openStrings[stringIdx];
          const isOpenActive = active?.fret === 0;
          const isMuted =
            position != null
            && !activeByStringIdx.has(stringIdx)
            && !extByStringIdx.has(stringIdx);

          return (
            <g key={`string-${row}`}>

              {/* Muted string, open active, or plain open label */}
              {isMuted ? (
                <text x={LEFT - 8} y={y + 4} textAnchor="end" className="muted-label">
                  ×
                </text>
              ) : isOpenActive ? (
                <>
                  <circle
                    cx={OPEN_CX} cy={y} r={10}
                    fill={TONE_COLORS[active!.tone]}
                    className="note-dot"
                    filter="url(#note-glow)"
                  />
                  <text
                    x={OPEN_CX} y={y + 4}
                    textAnchor="middle"
                    className="note-label note-label--open"
                  >
                    {displayNote(openNote)}
                  </text>
                </>
              ) : (
                <text x={LEFT - 8} y={y + 4} textAnchor="end" className="open-label">
                  {displayNote(openNote)}
                </text>
              )}

              {/* String line */}
              <line
                x1={LEFT} y1={y} x2={endX} y2={y}
                className="string-line"
                strokeWidth={STRING_WIDTHS[row]}
              />

              {/* Shell chord note dot (fret > 0 only; fret 0 is handled above) */}
              {active != null && active.fret > 0 && (
                <g>
                  <circle
                    cx={fretCentreX(active.fret)} cy={y} r={10}
                    fill={TONE_COLORS[active.tone]}
                    className="note-dot"
                    filter="url(#note-glow)"
                  />
                  <text
                    x={fretCentreX(active.fret)} y={y + 4}
                    textAnchor="middle"
                    className="note-label"
                  >
                    {displayNote(active.pitch)}
                  </text>
                </g>
              )}

              {/* Extension note dot — outlined, dashed, smaller */}
              {extNote != null && !activeByStringIdx.has(stringIdx) && (() => {
                const dotX = extNote.fret === 0
                  ? OPEN_CX
                  : fretCentreX(extNote.fret);
                return (
                  <g>
                    <circle
                      cx={dotX} cy={y} r={8}
                      fill="var(--surface)"
                      stroke={TONE_COLORS[extNote.tone]}
                      strokeWidth={1.5}
                      strokeDasharray="3 2"
                      className="ext-dot"
                    />
                    <text
                      x={dotX} y={y + 4}
                      textAnchor="middle"
                      className="ext-label"
                      fill={TONE_COLORS[extNote.tone]}
                    >
                      {displayNote(extNote.pitch)}
                    </text>
                  </g>
                );
              })()}
            </g>
          );
        })}

        {/* Drag ghost indicator */}
        {dragMode && ghostX != null && ghostY != null && (
          <g className="ghost-dot" style={{ pointerEvents: 'none' }}>
            <circle
              cx={ghostX} cy={ghostY} r={10}
              fill="var(--tone-root)"
              opacity={0.4}
            />
            <text
              x={ghostX} y={ghostY + 4}
              textAnchor="middle"
              className="note-label"
              opacity={0.7}
            >
              {displayNote(pitchAt(rowToIdx(ghost!.row), ghost!.fret, tuning))}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
