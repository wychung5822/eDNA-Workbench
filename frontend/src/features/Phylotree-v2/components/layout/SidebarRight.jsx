import { useTree } from '../../context/TreeContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import '../../styles/layout/Sidebar.css';
import { convertToNewick } from '../../utils/newickUtils.js';

const SidebarRight = ({ isOpen, onToggle }) => {
  const { settings, updateSetting, requestFit } = useUI();
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
    <div className={`sidebar-panel${isOpen ? '' : ' sidebar-panel--collapsed'}`}>
      <div className="sidebar-panel__header__right">
        <button
          className="sidebar-panel__toggle"
          onClick={onToggle}
          title={isOpen ? 'Collapse panel' : 'Expand panel'}
        >
          {isOpen ? '›' : '‹'}
        </button>
        {isOpen && <h2 className="sidebar-panel__title">Controls</h2>}
      </div>

      {isOpen && (
        <div className="sidebar-panel__content">

          <hr className="sidebar-panel__divider" />

          {/* Layout Style */}
          <div className="sidebar-panel__section">
            <h3 className="sidebar-panel__section-title">Layout Style</h3>

            <label className="sidebar-panel__checkbox-label">
              <input
                type="checkbox"
                checked={settings.alignTips === 'right'}
                onChange={(e) => updateSetting('alignTips', e.target.checked ? 'right' : 'left')}
              />
              Align Tips Right
            </label>

            <label className="sidebar-panel__label" style={{ marginTop: '10px' }}>Sort Order</label>
            <select
              className="sidebar-panel__select"
              value={settings.sort || ''}
              onChange={(e) => updateSetting('sort', e.target.value || null)}
            >
              <option value="">None</option>
              <option value="ascending">Ascending</option>
              <option value="descending">Descending</option>
            </select>
          </div>

          <hr className="sidebar-panel__divider" />

          {/* Appearance */}
          <div className="sidebar-panel__section">
            <h3 className="sidebar-panel__section-title">Appearance</h3>

            <label className="sidebar-panel__checkbox-label">
              <input
                type="checkbox"
                checked={settings.showInternalLabels}
                onChange={(e) => updateSetting('showInternalLabels', e.target.checked)}
              />
              Show Internal Labels
            </label>
          </div>

          <hr className="sidebar-panel__divider" />

          {/* Canvas Size */}
          <div className="sidebar-panel__section">
            <h3 className="sidebar-panel__section-title">Canvas Size</h3>

            <label className="sidebar-panel__label">Width ({settings.width}px)</label>
            <input
              type="range" min="200" max="4000" step="50"
              className="sidebar-panel__range"
              value={settings.width}
              onChange={(e) => updateSetting('width', Number(e.target.value))}
            />

            <label className="sidebar-panel__label" style={{ marginTop: '10px' }}>Height ({settings.height}px)</label>
            <input
              type="range" min="200" max="4000" step="50"
              className="sidebar-panel__range"
              value={settings.height}
              onChange={(e) => updateSetting('height', Number(e.target.value))}
            />

            <button className="sidebar-panel__btn-secondary" style={{ marginTop: '10px' }} onClick={requestFit}>
              Fit to View
            </button>
          </div>

          <hr className="sidebar-panel__divider" />

          {/* Actions */}
          <div className="sidebar-panel__section">
            <button className="sidebar-panel__btn-primary" onClick={handleExportNewick}>
              Export Newick
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default SidebarRight;