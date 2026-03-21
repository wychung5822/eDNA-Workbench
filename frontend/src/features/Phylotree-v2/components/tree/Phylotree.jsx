import { scaleLinear } from 'd3-scale';
import { useMemo } from 'react';
import { useTree } from '../../context/TreeContext';
import { useUI } from '../../context/UIContext';
import { useTooltip } from '../../hooks/useTooltip';
import { useTreeLayout } from '../../hooks/useTreeLayout';
import { estimateTextWidth } from '../../utils/textWidth';
import BranchTooltip from '../ui/BranchTooltip';
import Branch from './Branch';
import LeafLabel from './LeafLabel';
import Node from './Node';

import { collectInternalNodes, getHiddenBranches, shouldHideInternalNode } from '../../utils/TreeUtils';

const Phylotree = ({ onNodeRename }) => {
  const { state: { treeInstance, collapsedNodes, renamedNodes, merged }, openContextMenu } = useTree();
  const { settings, searchTerm } = useUI();
  const { tooltip, showTooltip, hideTooltip } = useTooltip();

  // 1. 計算佈局 (這會給每個節點加上 x, y 座標)
  const processedTree = useTreeLayout(treeInstance, settings, collapsedNodes, merged);

  const { xScale, yScale, nodes, links, leafLabelData } = useMemo(() => {
    if (!processedTree) return { nodes: [], links: [], leafLabelData: new Map() };

    const padding = 20;
    const LABEL_FONT_SIZE = 14;
    const TRANSLATE_X = 20;  // matches <g transform="translate(20, 0)">
    const RIGHT_MARGIN = 30; // breathing room from SVG right edge
    const LABEL_GAP = 5;     // px between tip/tracer and text

    const alignRight = settings.alignTips === 'right';
    // rightEdge is in the g's local coordinate system
    const rightEdge = settings.width - TRANSLATE_X - RIGHT_MARGIN;

    // --- Per-leaf text widths ---
    const allLinks = processedTree.links;
    const leafLinks = allLinks.filter(
      l => !l.target.children || l.target.children.length === 0
    );

    const textWidths = new Map();
    leafLinks.forEach(link => {
      const name = link.target.data?.name ?? '';
      textWidths.set(link.target.unique_id, estimateTextWidth(name, LABEL_FONT_SIZE));
    });

    // --- rightmost: branch drawing area width ---
    // Constraint: tip_px + textWidth <= rightEdge   (left mode)
    //          or tip_px <= rightEdge - textWidth   (right mode, same formula)
    // tip_px = abstract_x * rightmost / max_x
    // → rightmost <= (rightEdge - textWidth - LABEL_GAP) * max_x / abstract_x
    let rightmost = rightEdge;
    if (processedTree.max_x > 0 && leafLinks.length > 0) {
      const candidates = leafLinks
        .filter(l => (l.target.x ?? l.target.data?.abstract_x) > 0)
        .map(l => {
          const tw = textWidths.get(l.target.unique_id) ?? 0;
          const ax = l.target.x ?? l.target.data?.abstract_x;
          return ((rightEdge - tw - LABEL_GAP) * processedTree.max_x) / ax;
        });
      if (candidates.length > 0) {
        rightmost = Math.max(50, Math.min(...candidates));
      }
    }

    // --- Scales ---
    const xScale = scaleLinear()
      .domain([0, processedTree.max_x])
      .range([0, rightmost]);

    const yScale = scaleLinear()
      .domain([0, processedTree.max_y])
      .range([padding, settings.height - padding]);

    // --- leafLabelData: pixel positions per leaf ---
    const leafLabelData = new Map();
    leafLinks.forEach(link => {
      const name = link.target.data?.name ?? '';
      if (!name) return;
      const tipX = xScale(link.target.x ?? link.target.data?.abstract_x ?? 0);
      leafLabelData.set(link.target.unique_id, {
        name,
        labelX: alignRight ? rightEdge : tipX,
      });
    });

    // --- Visible links & nodes ---
    const hiddenBranches = getHiddenBranches(processedTree.nodes, collapsedNodes);
    const visibleLinks = processedTree.links.filter(
      link => !hiddenBranches.has(link.target.unique_id)
    );

    const internalNodesMap = collectInternalNodes(processedTree.nodes);
    const visibleNodes = Array.from(internalNodesMap.entries())
      .filter(([id, nodeInfo]) => !shouldHideInternalNode(id, nodeInfo, collapsedNodes));

    return { xScale, yScale, nodes: visibleNodes, links: visibleLinks, leafLabelData };
  }, [processedTree, settings, collapsedNodes]);

  if (!processedTree) return null;

  // Align-right positioning for internal labels (mirrors LeafLabel logic)
  const alignRight = settings.alignTips === 'right';
  const labelXForNodes = alignRight ? (settings.width - 20 - 30) : 0; // TRANSLATE_X=20, RIGHT_MARGIN=30

  return (
    <g transform="translate(20, 0)">
      {/* 繪製分支 */}
      {links.map((link) => (
        <Branch 
          key={`branch-${link.source.unique_id}-${link.target.unique_id}`}
          link={link}
          xScale={xScale}
          yScale={yScale}
          settings={settings}
          searchTerm={searchTerm}
          onClick={() => console.log('Branch clicked', link)}
          onContextMenu={(e) => openContextMenu(e, link.target.unique_id, link.target, false)}
          onMouseMove={(e, targetNode) => {
            const svg = e.currentTarget.ownerSVGElement;
            const rect = svg.getBoundingClientRect();
            showTooltip(e.clientX - rect.left, e.clientY - rect.top, targetNode);
          }}
          onMouseLeave={hideTooltip}
        />
      ))}

      {/* 繪製節點 (內部節點 + 葉子節點) */}
      {nodes.map(([id, nodeInfo]) => (
        <Node
          key={`node-${id}`}
          id={id}
          data={nodeInfo}
          x={xScale(nodeInfo.x)}
          y={yScale(nodeInfo.y)}
          isCollapsed={collapsedNodes.has(id)}
          renamedLabel={renamedNodes.get(id)}
          showInternalLabels={settings.showInternalLabels}
          alignRight={alignRight}
          labelX={labelXForNodes}
          onRename={(newName) => onNodeRename(id, newName)}
          onContextMenu={(e) => openContextMenu(e, id, nodeInfo, collapsedNodes.has(id))}
        />
      ))}

      {/* 繪製葉節點 Labels (tracer + text) */}
      {links
        .filter(link => !link.target.children || link.target.children.length === 0)
        .filter(link => !collapsedNodes.has(link.target.unique_id))  // collapsed 節點由 Node.jsx 處理，避免重疊
        .map(link => {
          const info = leafLabelData.get(link.target.unique_id);
          if (!info?.name) return null;
          const renamedLabel = renamedNodes.get(link.target.unique_id);
          const displayName  = renamedLabel ?? info.name;
          const isHighlighted = !!(searchTerm && displayName.toLowerCase().includes(searchTerm.toLowerCase()));
          return (
            <LeafLabel
              key={`label-${link.target.unique_id}`}
              x={xScale(link.target.x ?? link.target.data?.abstract_x ?? 0)}
              y={yScale(link.target.y ?? link.target.data?.abstract_y ?? 0)}
              labelX={info.labelX}
              name={info.name}
              renamedLabel={renamedLabel}
              isHighlighted={isHighlighted}
              alignRight={settings.alignTips === 'right'}
              onRename={(newName) => onNodeRename(link.target.unique_id, newName)}
            />
          );
        })}

      {/* Tooltip — 永遠渲染在最上層 */}
      <BranchTooltip
        tooltip={tooltip}
        svgWidth={settings.width}
        svgHeight={settings.height}
      />
    </g>
  );
};

export default Phylotree;