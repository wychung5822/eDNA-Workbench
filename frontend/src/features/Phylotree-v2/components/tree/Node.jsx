import { useEffect, useRef, useState } from 'react';

const Node = ({ id, data, x, y, isCollapsed, renamedLabel, onRename, onContextMenu, showInternalLabels }) => {
  const isInternal = data.children && data.children.length > 0;
  // Show label if leaf, collapsed, or if internal labels are explicitly requested
  const showLabel = (!isInternal && data.data.name) || isCollapsed || (isInternal && showInternalLabels && data.data.name);
  
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
                    style={{
                        width: "100%",
                        fontSize: "12px",
                        padding: "2px",
                        border: "1px solid var(--border)",
                        borderRadius: "2px",
                        outline: "none"
                    }}
                />
            </foreignObject>
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
