
import { useEffect, useRef } from 'react';
import { useTree } from '../../context/TreeContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { convertToNewick, getSubtreeNewick } from '../../utils/newickUtils.js';
import { findNodeById, replaceNodeWithSubtree, rerootTree } from '../../utils/treeOps.js';
import Phylotree from '../tree/Phylotree.jsx';
import ContextMenu from '../ui/ContextMenu.jsx';

const TreeViewer = () => {
  const { state, loadNewick, loadNewFile, loadWithState, updateMergedKeys, toggleCollapse, unmergeNode, closeContextMenu, setMergedNode, renameNode } = useTree();
  const { treeInstance, contextMenu } = state;
  const { settings } = useUI();

  // Phase 1: set by handleMoveToRoot, consumed after loadNewFile render.
  const pendingRemap = useRef(null);
  // Phase 2: set by phase 1 handler, consumed after loadWithState + handleMerged render.
  // At that point useTreeLayout has assigned the correct X|Y id to the merged node.
  const pendingKeyFix = useRef(null);

  // Helper: walk child-index path from tree root, return node or null.
  const walkPath = (root, pathIndices) => {
    let node = root;
    for (const idx of pathIndices) {
      if (!node.children || idx >= node.children.length) return null;
      node = node.children[idx];
    }
    return node;
  };

  // After reroot: two-phase useEffect to correctly remap merged-node state.
  //
  // Phase 1 (pendingRemap) fires after loadNewFile.  The merged node is a
  // plain-numeric leaf at this point, so newId will be e.g. "1".  We pass
  // this to loadWithState so that useTreeLayout.handleMerged can convert it
  // back to a pseudo-internal node with an X|Y id.
  //
  // Phase 2 (pendingKeyFix) fires after loadWithState + handleMerged.  The
  // merged node now has its correct X|Y id.  We re-walk the same paths to get
  // the new ids and call updateMergedKeys (no re-parse) to fix state.merged.
  useEffect(() => {
    if (!treeInstance) return;

    // ── Phase 2 ──────────────────────────────────────────────────────────────
    if (pendingKeyFix.current) {
      const { mergedPathMap, originalOldMerged } = pendingKeyFix.current;
      pendingKeyFix.current = null;

      const fixedMerged = {};
      const fixedCollapsed = new Set();
      const fixedRenamed = new Map();

      for (const [origId, data] of Object.entries(originalOldMerged)) {
        const pathIndices = mergedPathMap[String(origId)] ?? mergedPathMap[Number(origId)];
        if (!pathIndices) continue;

        const node = walkPath(treeInstance.nodes, pathIndices);
        if (!node || node.unique_id == null) continue;

        const newId = String(node.unique_id);
        const newParentId = node.parent?.unique_id != null
          ? String(node.parent.unique_id)
          : data.parent;
        const newSiblingIndex = node.parent?.children?.findIndex(c => c === node) ?? data.siblingIndex;

        // Children IDs are threshold|index values assigned by useTreeLayout.
        // After reroot the whole tree is re-laid-out (entirely new abstract_x/y values),
        // so the old child IDs have no valid mapping to the new ID space.
        // They are only used as a blocklist by assignThresholdIds; clearing them is safe:
        // - The collapsed node still gets its X|Y id via parent+siblingIndex (setNodeAsNonLeaf)
        // - Unmerge uses subtreeNewick → loadNewick → initialize rebuilds IDs from scratch
        const newChildren = new Set();

        fixedMerged[newId] = { ...data, parent: newParentId, siblingIndex: newSiblingIndex, children: newChildren };
        fixedCollapsed.add(newId);
        if (data.rename) fixedRenamed.set(newId, data.rename);
      }

      console.group('── pendingKeyFix: fixed merged keys ──');
      for (const [id, data] of Object.entries(fixedMerged)) {
        console.log(`  merged id=${id} rename=${data.rename} children=[${[...data.children].join(', ')}]`);
      }
      console.groupEnd();

      updateMergedKeys(fixedMerged, fixedCollapsed, fixedRenamed);
      return;
    }

    // ── Phase 1 ──────────────────────────────────────────────────────────────
    if (!pendingRemap.current) return;
    const { mergedPathMap, oldMerged, newNewick } = pendingRemap.current;
    pendingRemap.current = null;

    const newMerged = {};
    const newCollapsed = new Set();
    const newRenamed = new Map();

    for (const [oldId, data] of Object.entries(oldMerged)) {
      const pathIndices = mergedPathMap[String(oldId)] ?? mergedPathMap[Number(oldId)];
      if (!pathIndices) { console.warn(`[phase1 skip] oldId=${oldId}: no pathIndices`); continue; }

      const targetNode = walkPath(treeInstance.nodes, pathIndices);
      if (!targetNode || targetNode.unique_id == null) { console.warn(`[phase1 skip] oldId=${oldId}: path walk failed`); continue; }

      const newId = String(targetNode.unique_id);
      const newParentId = targetNode.parent?.unique_id != null
        ? String(targetNode.parent.unique_id)
        : data.parent;
      const newSiblingIndex = targetNode.parent?.children?.findIndex(c => c === targetNode) ?? data.siblingIndex;

      console.log(`[phase1] oldId=${oldId} → newId=${newId} (plain leaf) parent=${newParentId} sibIdx=${newSiblingIndex}`);

      // Pass empty children — old IDs are invalid in the new tree layout.
      // handleMerged only needs parent+siblingIndex to call setNodeAsNonLeaf.
      // Phase 2 will write the final empty Set as well (children are cleared after reroot).
      newMerged[newId] = { ...data, parent: newParentId, siblingIndex: newSiblingIndex, children: new Set() };
      newCollapsed.add(newId);
      if (data.rename) newRenamed.set(newId, data.rename);
    }

    // Stash original merged data for phase 2 (children offset remap needs origId X|Y)
    pendingKeyFix.current = { mergedPathMap, originalOldMerged: oldMerged };

    loadWithState(newNewick, newMerged, newCollapsed, newRenamed);
  }, [treeInstance, loadWithState, updateMergedKeys]);
  
  if (!treeInstance) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p style={{ color: '#888' }}>Please upload a Newick file to start.</p>
      </div>
    );
  }

  /* Handlers */
  const handleCollapseSubtree = () => {
    const { nodeId, isNodeCollapsed } = contextMenu;
    if (!nodeId) return closeContextMenu();

    if (isNodeCollapsed) {
      // Expand (Unmerge)
      if (state.merged[nodeId]) {
        const subtreeNewick = state.merged[nodeId].subtreeNewick;
        const updatedNewick = replaceNodeWithSubtree(
          treeInstance, 
          nodeId,
          subtreeNewick
        );
        
        if (updatedNewick) {
          unmergeNode(nodeId);
          loadNewick(updatedNewick);
        }
      } else {
        toggleCollapse(nodeId);
      }
    } else {
      // Collapse (Merge)
      // Logic to calculate subtreeNewick for merge is complex, usually done in NodeRename but here we just collapse visually if no rename
      // If we want detailed Merge like v1, we need to replicate handleNodeRename logic or similar
      // For now, simple toggle
      toggleCollapse(nodeId);
    }
    closeContextMenu();
  };

  const handleMoveToRoot = () => {
    const { nodeId } = contextMenu;
    if (!nodeId) return closeContextMenu();

    const { merged } = state;

    // Identify top-level merged nodes: those NOT nested inside another merged node's subtree
    const allChildrenIds = new Set();
    // allChildrenIds collects the IDs of all nodes that are children of any merged node
    for (const data of Object.values(merged)) {
      data.children.forEach(id => allChildrenIds.add(String(id)));
    }
    const topLevelMergedIds = Object.keys(merged).filter(id => !allChildrenIds.has(String(id)));

    const result = rerootTree(treeInstance, state.newick, nodeId, topLevelMergedIds);
    if (!result.success) {
      console.error(result.message);
      closeContextMenu();
      return;
    }

    // If there are merged nodes, stash remap data; the useEffect will apply it
    // once useTreeLayout has assigned new ids to the rerooted treeInstance.
    if (Object.keys(merged).length > 0) {
      pendingRemap.current = {
        mergedPathMap: result.mergedPathMap,
        oldMerged: merged,
        newNewick: result.newNewick,
      };
    }

    loadNewFile(result.newNewick);
    closeContextMenu();
  };

  const handleNodeRename = (nodeId, newName) => {
    const { treeInstance, collapsedNodes, merged } = state;
    
    // Find the node
    const targetNode = findNodeById(treeInstance.nodes, nodeId);
    if (!targetNode) return;

    const isCollapsed = collapsedNodes.has(nodeId);

    // 1. 處理空字串：恢復預設名稱 
    // 目前根本不會進來
    if (newName.trim() === "") {
      renameNode(nodeId, ""); 
    
      if (isCollapsed) {
        // 準備未來的 renamedNodes 狀態以供生成 Newick
        const nextRenamed = new Map(state.renamedNodes);
        nextRenamed.delete(nodeId);

        const newNewick = convertToNewick(treeInstance.nodes, collapsedNodes, nextRenamed);
        if (newNewick) {
          loadNewick(newNewick);
        }
      }
      return;
    }

    // 2. 如果節點「尚未被折疊」（包含末端葉節點），則單純重新命名，不啟動收合
    if (!isCollapsed) {
      renameNode(nodeId, newName);
      return;
    }

    // 3. 節點已折疊且有新名稱，執行「重新命名並打包成 Merged」的邏輯
    // 1. Collect children IDs
    const childrenIds = new Set();
    const collectChildrenIds = (childNode) => {
      if (!childNode) return;
      if (childNode.unique_id && childNode !== targetNode) {
        childrenIds.add(childNode.unique_id);
      }
      if (childNode.children) {
        childNode.children.forEach(collectChildrenIds);
      }
    };
    if (targetNode.children) {
      targetNode.children.forEach(collectChildrenIds);
    }

    // 2. Calculate Subtree Newick
    const subtreeNewick = getSubtreeNewick(targetNode);

    // 3. Find index in parent (for restoring later)
    let siblingIndex = -1;
    if (targetNode.parent && targetNode.parent.children) {
        siblingIndex = targetNode.parent.children.findIndex(child => child.unique_id === targetNode.unique_id);
    }

    // 4. Create merged data object
    const mergedData = {
        children: childrenIds,
        subtreeNewick: subtreeNewick,
        rename: newName,
        parent: targetNode.parent ? targetNode.parent.unique_id : null,
        siblingIndex: siblingIndex
    };

    // 5. Update state: Set merged data, add to collapsed, and set rename
    // We update the state locally first to generate the new Newick string immediately
    // imitating V1 behavior where merge triggers a tree reload to fix layout issues.
    
    // Prepare next state for conversion
    const nextCollapsed = new Set(collapsedNodes);
    nextCollapsed.add(nodeId);
    
    const nextRenamed = new Map(state.renamedNodes);
    nextRenamed.set(nodeId, newName);

    // Update Context State
    setMergedNode(nodeId, mergedData); 
    renameNode(nodeId, newName);

    // Generate new Newick string with the node collapsed (treated as leaf)
    // and reload the tree
    const newNewick = convertToNewick(treeInstance.nodes, nextCollapsed, nextRenamed);
    if (newNewick) {
      loadNewick(newNewick);
    }
  };

  return (
    <div className="viewport-container" style={{ padding: '20px', minWidth: '100%', minHeight: '100%', position: 'relative' }}>
      <ContextMenu 
        visible={contextMenu.visible}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onCollapseSubtree={handleCollapseSubtree}
        onMoveToRoot={handleMoveToRoot}
        isNodeCollapsed={contextMenu.isNodeCollapsed}
      />
      <svg width={settings.width} height={settings.height}>
        <Phylotree onNodeRename={handleNodeRename} />
      </svg>
    </div>
  );
};

export default TreeViewer;