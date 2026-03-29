// utils/treeOps.js
// High-level tree structural operations (reroot, graft, prune).
// These operate on live phylotree instances and may produce new Newick strings.
import { phylotree } from "phylotree";
import {
  convertToNewick,
  getSubtreeNewick,
  moveSubtreeToRoot,
  removeSubtreeFromNewick,
} from "./newickUtils.js";

/**
 * Find a node in the tree by its unique_id (depth-first).
 * @param {Object}        rootNode
 * @param {string|number} nodeId
 * @returns {Object|null}
 */
export const findNodeById = (rootNode, nodeId) => {
  if (!rootNode) return null;
  if (rootNode.unique_id === nodeId) return rootNode;

  if (rootNode.children) {
    for (const child of rootNode.children) {
      const found = findNodeById(child, nodeId);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Move a subtree to the root level (pseudo-reroot).
 * @param {Object}        treeInstance   - live phylotree instance
 * @param {string}        originalNewick
 * @param {string|number} nodeId         - node to move
 * @returns {Object} - { success, newNewick, message, ... }
 */
export const rerootTree = (treeInstance, originalNewick, nodeId) => {
  if (!nodeId || !treeInstance)
    throw new Error("缺少必要信息：nodeId 或 treeInstance");

  try {
    const targetNode = findNodeById(treeInstance.nodes, nodeId);
    if (!targetNode) throw new Error("找不到目標節點");

    const subtreeNewick = getSubtreeNewick(targetNode);
    const modifiedNewick = removeSubtreeFromNewick(originalNewick, targetNode);
    const newNewick = moveSubtreeToRoot(modifiedNewick, subtreeNewick);

    return {
      success: true,
      newNewick,
      subtreeNewick,
      modifiedNewick,
      message: "成功移動子樹到根節點級別",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      newNewick: originalNewick,
      message: `移動子樹時出錯: ${error.message}`,
    };
  }
};

/**
 * Replace a leaf node in `tree` with a parsed subtree (in-place, then re-serialise).
 * @param {Object}        tree        - live phylotree instance
 * @param {string|number} leafNodeId
 * @param {string}        newNewick   - Newick of the replacement subtree
 * @returns {string|null}             - updated full Newick, or null on failure
 */
export const replaceNodeWithSubtree = (tree, leafNodeId, newNewick) => {
  let targetNode = null;
  tree.traverse_and_compute((node) => {
    if (node.unique_id === leafNodeId) {
      targetNode = node;
      return false;
    }
    return true;
  });

  if (!targetNode) {
    console.error("找不到目標節點");
    return null;
  }

  const parentNode = targetNode.parent;
  if (!parentNode) {
    console.error("目標節點沒有父節點，無法替換");
    return null;
  }

  const indexInParent = parentNode.children.findIndex(
    (child) => child.unique_id === targetNode.unique_id
  );
  if (indexInParent === -1) {
    console.error("無法在父節點的子節點列表中找到目標節點");
    return null;
  }

  const subtreeRoot = new phylotree(newNewick).nodes;
  subtreeRoot.parent = parentNode;
  subtreeRoot.data.attribute = targetNode.data.attribute;

  // Fix: phylotree auto-assigns "root" as the default name for the parsed root node.
  // Extract the actual root name from the Newick string to avoid introducing a stray "root" label.
  const lastParen = newNewick.lastIndexOf(')');
  if (lastParen !== -1) {
    const afterParen = newNewick.substring(lastParen + 1);
    const nameMatch = afterParen.match(/^([^:;]*)/);
    subtreeRoot.data.name = nameMatch ? nameMatch[1] : "";
  }

  parentNode.children[indexInParent] = subtreeRoot;

  return convertToNewick(tree.nodes, new Set(), new Map());
};
