import { ROOT_STRING_LABELS } from '../lib/shells';

interface RootPlacementNoticeProps {
  clickedStringIdx:       number;
  alternateStringIndices: number[];
  chordDescription:       string;
  onSelectString:         (stringIdx: number) => void;
}

export function RootPlacementNotice({
  clickedStringIdx,
  alternateStringIndices,
  chordDescription,
  onSelectString,
}: RootPlacementNoticeProps) {
  const clickedLabel = ROOT_STRING_LABELS[clickedStringIdx];

  return (
    <div className="root-placement-notice" role="status">
      <p className="root-placement-notice__lead">
        <strong>{chordDescription}</strong> isn&apos;t possible with the root on the{' '}
        <strong>{clickedLabel} string</strong>.
      </p>
      <p className="root-placement-notice__alternates">
        These positions place the root on strings where it works:{' '}
        {alternateStringIndices.map((strIdx, i) => (
          <span key={strIdx}>
            {i > 0 && (i < alternateStringIndices.length - 1 ? ', ' : ' and ')}
            <button
              type="button"
              className="root-placement-notice__link"
              onClick={() => onSelectString(strIdx)}
            >
              {ROOT_STRING_LABELS[strIdx]} string
            </button>
          </span>
        ))}
        .
      </p>
    </div>
  );
}
