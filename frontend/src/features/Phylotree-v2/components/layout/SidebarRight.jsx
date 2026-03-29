import { useTree } from '../../context/TreeContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { convertToNewick } from '../../utils/newickUtils.js';
import '../../styles/layout/Sidebar.css';

const SidebarRight = () => {
  const { settings, updateSetting } = useUI();
  const { state: { treeInstance, collapsedNodes, renamedNodes } } = useTree();

  const handleExportNewick = () => {
    if (!treeInstance?.nodes) {
      alert('No tree data to export.');
      return;
    }

    try {
      const newickString = convertToNewick(
        treeInstance.nodes,
        collapsedNodes,
        renamedNodes
      );

      const blob = new Blob([newickString], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exported_tree.nwk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Export failed: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px' }}>Controls</h2>

      {/* Layout Style */}
      <div className="control-group" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Layout Style</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            <input 
              type="checkbox" 
              checked={settings.alignTips === 'right'}
              onChange={(e) => updateSetting('alignTips', e.target.checked ? 'right' : 'left')}
            /> Align Tips Right
          </label>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Sort Order:</label>
          <select 
            value={settings.sort || ''} 
            onChange={(e) => updateSetting('sort', e.target.value || null)}
            style={{ width: '100%', marginTop: '5px' }}
          >
            <option value="">None</option>
            <option value="ascending">Ascending</option>
            <option value="descending">Descending</option>
          </select>
        </div>
      </div>

      <hr style={{ margin: '20px 0', borderTop: '1px solid #ddd' }} />

      {/* Appearance */}
      <div className="control-group" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Appearance</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Width ({settings.width}px)</label>
          <input 
            type="range" min="300" max="2000" step="50"
            value={settings.width}
            onChange={(e) => updateSetting('width', Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Height ({settings.height}px)</label>
          <input 
            type="range" min="300" max="2000" step="50"
            value={settings.height}
            onChange={(e) => updateSetting('height', Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        
        <div>
          <label>
            <input 
              type="checkbox"
              checked={settings.showInternalLabels}
              onChange={(e) => updateSetting('showInternalLabels', e.target.checked)}
            /> Show Internal Labels
          </label>
        </div>
      </div>

      <hr style={{ margin: '20px 0', borderTop: '1px solid #ddd' }} />

      {/* Actions */}
      <div className="control-group">
        <button 
          onClick={handleExportNewick}
          style={{ 
            width: '100%', padding: '10px', 
            background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' 
          }}
        >
          Export Newick
        </button>
      </div>
    </div>
  );
};

export default SidebarRight;