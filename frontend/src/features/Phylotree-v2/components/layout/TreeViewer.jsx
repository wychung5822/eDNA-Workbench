
import { useTree } from '../../context/TreeContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { convertToNewick, findNodeById, getSubtreeNewick, replaceNodeWithSubtree, rerootTree } from '../../utils/TreeUtils.js';
import Phylotree from '../tree/Phylotree.jsx';
import ContextMenu from '../ui/ContextMenu.jsx';

const TreeViewer = () => {
  const { state, loadNewick, toggleCollapse, unmergeNode, closeContextMenu, setMergedNode, renameNode } = useTree();
  const { treeInstance, contextMenu } = state;
  const { settings } = useUI();
  
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

    const result = rerootTree(treeInstance, state.newick, nodeId);
    if (result.success) {
      loadNewick(result.newNewick);
    } else {
      console.error(result.message);
    }
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