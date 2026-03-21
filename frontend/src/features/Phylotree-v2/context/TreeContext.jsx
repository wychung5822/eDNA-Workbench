import { phylotree } from 'phylotree';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';

const TreeContext = createContext();

const initialState = {
  newick: "(((((Tr_2_1,gaV2R_11)100,MF_2_1)100,(Dr_2_1_F1,(Cha21,Cha22)100)97)100,Ssa44)100,(((((Dan043,(((((Gfa013,Ema080)99,Ema092)100,Ema091)99,Gta016)97,(((((Ule033,Ule054)100,(Bwa066,Bwa071)97)95,(Ule045,Bwa008)96)96,Ame006)84,((Lmi004,Lmi021)100,Lmi023)100)83)81)72,((Gfa072,Ema086)100,Ema061)81)95,((((((((Ama010,Aja073)99,aa068)100,(((((Ama019,aa066)100,(Aja100,aa067)100)99,aa071)76,((((Ama032,(Aja048,aa073)100)95,(Aja011,aa072)100)80,Aja092)80,(Aja009,aa065)99)84)79,aa070)40)36,((Aja075,aa079)100,aa076)88)79,aa078)80,(Ama052,Aja044)99)93,aa069)79,(Aja087,(aa074,aa075)100)99)94)92,aa077)92,Aja091)99);",
  treeInstance: null,
  collapsedNodes: new Set(),
  renamedNodes: new Map(),
  merged: {},
  loading: false,
  error: null,
  contextMenu: {
    visible: false,
    position: { x: 0, y: 0 },
    nodeId: null,
    nodeData: null,
    isNodeCollapsed: false,
  },
}

const treeReducer = (state, action) => {
  switch (action.type) {
    case 'SET_NEWICK':
      return { ...state, newick: action.payload, loading: true };
    case 'LOAD_NEW_FILE':
      return {
        ...initialState,
        newick: action.payload,
        loading: true,
      };
    case 'PARSE_SUCCESS':
      return { ...state, treeInstance: action.payload, loading: false, error: null };
    case 'PARSE_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'TOGGLE_COLLAPSE': {
      const newSet = new Set(state.collapsedNodes);
      if (newSet.has(action.payload)) newSet.delete(action.payload);
      else newSet.add(action.payload);
      return { ...state, collapsedNodes: newSet };
    }
    case 'RENAME_NODE': {
      const newMap = new Map(state.renamedNodes);
      if (action.payload.name.trim() === "") {
        newMap.delete(action.payload.id);
      } else {
        newMap.set(action.payload.id, action.payload.name);
      }
      return { ...state, renamedNodes: newMap };
    }
    case 'MERGE_NODES': {
      const newMerged = { ...state.merged };
      newMerged[action.payload.id] = action.payload.merged;
      // Also ensure it's collapsed
      const newCollapsed = new Set(state.collapsedNodes);
      newCollapsed.add(action.payload.id);
      return { ...state, merged: newMerged, collapsedNodes: newCollapsed };
    }
    case 'UNMERGE_NODE': {
      const newMerged = { ...state.merged };
      delete newMerged[action.payload];
      const newCollapsed = new Set(state.collapsedNodes);
      newCollapsed.delete(action.payload);
      return { ...state, merged: newMerged, collapsedNodes: newCollapsed };
    }
    case 'OPEN_CONTEXT_MENU':
      return { ...state, contextMenu: { ...action.payload, visible: true } };
    case 'CLOSE_CONTEXT_MENU':
      return { ...state, contextMenu: { ...state.contextMenu, visible: false } };
    default:
      return state;
  }
};

export const TreeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(treeReducer, initialState);

  // Auto-reparse when Newick changes
  useEffect(() => {
    if (!state.newick) return;
    try {
      const tree = new phylotree(state.newick);
      dispatch({ type: 'PARSE_SUCCESS', payload: tree });
    } catch (e) {
      dispatch({ type: 'PARSE_ERROR', payload: e.message });
    }
  }, [state.newick]); // This depends on state.newick which is updated by reducer

  // Wrap actions in useCallback to stable references
  const loadNewick = useCallback((newickStr) => dispatch({ type: 'SET_NEWICK', payload: newickStr }), []);
  const loadNewFile = useCallback((newickStr) => dispatch({ type: 'LOAD_NEW_FILE', payload: newickStr }), []);
  const toggleCollapse = useCallback((nodeId) => dispatch({ type: 'TOGGLE_COLLAPSE', payload: nodeId }), []);;
  const renameNode = useCallback((id, name) => dispatch({ type: 'RENAME_NODE', payload: { id, name } }), []);
  
  const openContextMenu = useCallback((event, nodeId, nodeData, isNodeCollapsed) => {
    event.preventDefault();
    dispatch({ 
      type: 'OPEN_CONTEXT_MENU', 
      payload: { 
        position: { x: event.clientX, y: event.clientY }, 
        nodeId, 
        nodeData,
        isNodeCollapsed
      } 
    });
  }, []);
  
  const closeContextMenu = useCallback(() => dispatch({ type: 'CLOSE_CONTEXT_MENU' }), []);

  const setMergedNode = useCallback((id, mergedData) => dispatch({ type: 'MERGE_NODES', payload: { id, merged: mergedData } }), []);
  const unmergeNode = useCallback((id) => dispatch({ type: 'UNMERGE_NODE', payload: id }), []);

  const contextValue = useMemo(() => ({ 
    state,
    dispatch,
    loadNewick,
    loadNewFile,
    toggleCollapse,
    renameNode,
    openContextMenu,
    closeContextMenu,
    setMergedNode,
    unmergeNode
  }), [state, loadNewick, loadNewFile, toggleCollapse, renameNode, openContextMenu, closeContextMenu, setMergedNode, unmergeNode]);

  return (
    <TreeContext.Provider value={contextValue}>
      {children}
    </TreeContext.Provider>
  )
}

export const useTree = () => useContext(TreeContext);