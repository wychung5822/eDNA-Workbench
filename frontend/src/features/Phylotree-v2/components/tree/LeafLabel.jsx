import { estimateTextWidth } from '../../utils/textWidth';

const LABEL_FONT_SIZE = 14;

/**
 * Renders a single leaf label in one of two modes:
 *
 * alignRight=false (default, "Align Tips Left"):
 *   - No tracer line
 *   - Text sits immediately to the right of the branch tip
 *
 * alignRight=true ("Align Tips Right"):
 *   - Dashed tracer line from branch tip to the right edge
 *   - Text is right-aligned at the fixed right edge (textAnchor="end")
 *
 * Colours come from CSS (.rp-label, .rp-branch-tracer, .rp-label-highlight)
 * so dark-mode is automatically supported.
 *
 * @param {{
 *   x: number,        branch-tip pixel x
 *   y: number,        branch-tip pixel y
 *   labelX: number,   pixel x of the label anchor
 *                      - left mode:  same as x (text starts at tip)
 *                      - right mode: fixed right edge (text ends here)
 *   name: string,
 *   isHighlighted: boolean,
 *   alignRight: boolean,
 * }} props
 */
const LeafLabel = ({ x, y, labelX, name, isHighlighted, alignRight }) => {
  if (!name) return null;

  const textAnchor = alignRight ? 'end' : 'start';
  const textX = alignRight ? labelX - 3 : labelX + 5;
  const hasTracer = alignRight && labelX > x + 2;
  const textLength = estimateTextWidth(name, LABEL_FONT_SIZE);

  // Highlight rect sits behind the text
  const highlightWidth = estimateTextWidth(name, LABEL_FONT_SIZE) + 4;
  const highlightX = alignRight
    ? labelX - highlightWidth - 2
    : textX - 2;

  return (
    <g className='align-dash'>
      {/* Always rendered — x2 collapses to x1 in left mode so CSS transition works */}
      <line
        x1={x + 7}
        x2={hasTracer ? labelX - textLength - 7 : x + 7}
        y1={y}
        y2={y}
        className="rp-branch-tracer"
      />

      {isHighlighted && (
        <rect
          x={highlightX}
          y={y - 9}
          width={highlightWidth}
          height={16}
          className="rp-label-highlight"
        />
      )}

      <text
        x={textX+10}
        y={y}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        className="rp-label"
        style={isHighlighted ? { fill: 'black', fontWeight: 'bold' } : undefined}
      >
        {name}
      </text>
    </g>
  );
};

export default LeafLabel;
