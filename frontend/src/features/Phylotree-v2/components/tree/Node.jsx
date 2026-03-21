import { useEffect, useRef, useState } from 'react';
import { estimateTextWidth } from '../../utils/textWidth';

const LABEL_FONT_SIZE = 14;

const Node = ({ id, data, x, y, isCollapsed, renamedLabel, onRename, onContextMenu, showInternalLabels, alignRight = false, labelX = 0 }) => {
  const isInternal = data.children && data.children.length > 0;
  // Show label only for:
  //   - collapsed nodes (renamed placeholder)
  //   - internal nodes when showInternalLabels is on
  // Leaf node text is handled exclusively by LeafLabel.jsx
  const showLabel = isCollapsed || (isInternal && showInternalLabels && data.data.name);
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const inputRef = useRef(null);

  const radius = isInternal ? 4 : 3;
  const fill = isCollapsed ? 'red' : (isInternal ? '#555' : '#999');
  
  let labelText = data.data.name;
  let displayPlaceholder = false;

  if (renamedLabel) {
    labelText = renamedLabel;
  } else if (isCollapsed) {
    labelText = "Double click to name"; 
    displayPlaceholder = true;
  }

  // Align-right mode: internal node label gets a tracer + right-edge text (same as leaf labels)
  const useAlignRight = alignRight && isInternal && showInternalLabels && !isCollapsed && labelX > x;
  const textLength = useAlignRight ? estimateTextWidth(labelText ?? '', LABEL_FONT_SIZE) : 0;
  // Coordinates in node-local space (origin = node position)
  // Mirror v1: tracer ends at (labelX - textLength), text starts 8px after
  const tracerX2   = useAlignRight ? Math.max(7, labelX - x - textLength) : 7;
  const textLocalX = useAlignRight ? Math.max(8, tracerX2 + 8) : 8;

  useEffect(() => {
    if (isEditing && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    // If it's a placeholder, start with empty string. Otherwise use the existing name.
    setTempName(displayPlaceholder ? "" : labelText);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
        finishEditing();
    } else if (e.key === 'Escape') {
        setIsEditing(false);
    }
  };

  const finishEditing = () => {
    onRename(tempName);
    setIsEditing(false);
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Single Node Circle with transparent stroke for hit area - ONLY for Internal or Collapsed */}
      {(isInternal || isCollapsed) && (
        <circle
          r={radius}
          fill={fill}
          stroke="transparent"
          strokeWidth="10" 
          onClick={onContextMenu}
          style={{ cursor: isInternal ? 'pointer' : 'default' }}
        />
      )}

      {/* Label or Input */}
      {showLabel && (
        isEditing ? (
            <foreignObject x="8" y="-10" width="150" height="24">
                <input
                    ref={inputRef}
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={finishEditing}
                    onKeyDown={handleKeyDown}
                    className="rp-label-input"
                />
            </foreignObject>
        ) : useAlignRight ? (
            /* Align-right mode: tracer to right edge + right-aligned text */
            <g className="align-dash">
              <line
                x1={7}
                x2={tracerX2}
                y1={0}
                y2={0}
                className="rp-branch-tracer"
              />
              <text
                x={textLocalX}
                y={0}
                textAnchor="start"
                dominantBaseline="middle"
                className="rp-label"
                onDoubleClick={handleDoubleClick}
                style={{ cursor: 'text', userSelect: 'none' }}
              >
                {labelText}
              </text>
            </g>
        ) : (
            <text
              onDoubleClick={handleDoubleClick}
              x={8}
              y={4}
              style={{ 
                  fontSize: '12px', 
                  fontFamily: 'Arial',
                  fill: 'var(--text)',
                  cursor: isCollapsed ? 'text' : 'default',
                  userSelect: 'none'
              }}
            >
              {labelText}
            </text>
        )
      )}

      {/* Debug ID (Only for internal/collapsed nodes as requested) */}
      {/* {(isInternal || isCollapsed) && (
        <text
          x="8"
          y="4"
          fill="red"
          style={{
            marginLeft: "10px",
            fontSize: "10px",
            fontWeight: "bold",
          }}
        >
          {id}
        </text>
      )} */}
    </g>
  );
};

export default Node;
