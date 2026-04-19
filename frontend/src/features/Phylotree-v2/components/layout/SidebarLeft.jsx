import { useState } from 'react';
import { useTree } from '../../context/TreeContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import '../../styles/layout/Sidebar.css';
import { convertToNewick } from '../../utils/newickUtils.js';

const SidebarLeft = ({ isOpen, onToggle }) => {
  const { state: { loading, error, treeInstance, collapsedNodes, renamedNodes } } = useTree();
  const { searchTerm, setSearchTerm } = useUI();
  const [copyStatus, setCopyStatus] = useState('idle'); // 'idle' | 'success' | 'error'

  const getNewick = () => {
    if (!treeInstance?.nodes) return null;
    return convertToNewick(treeInstance.nodes, collapsedNodes, renamedNodes);
  };

  const handleExportNewick = () => {
    const newick = getNewick();
    if (!newick) { alert('No tree data to export.'); return; }
    try {
      const blob = new Blob([newick], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exported_tree.nwk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Export failed: ${e.message}`);
    }
  };

  const handleCopyNewick = async () => {
    const newick = getNewick();
    if (!newick) { alert('No tree data to copy.'); return; }
    try {
      await navigator.clipboard.writeText(newick);
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleExportPNG = () => {
    const svgEl = document.querySelector('.viewport-scroll svg');
    if (!svgEl) { alert('No tree to export.'); return; }

    // Clone and inline computed styles so CSS variables resolve correctly
    const clone = svgEl.cloneNode(true);
    const origEls  = Array.from(svgEl.querySelectorAll('*'));
    const cloneEls = Array.from(clone.querySelectorAll('*'));
    origEls.forEach((el, i) => {
      const computed = window.getComputedStyle(el);
      const target   = cloneEls[i];
      ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'font-size', 'font-family'].forEach(prop => {
        const val = computed.getPropertyValue(prop);
        if (val) target.setAttribute(prop, val);
      });
    });

    const w = svgEl.width.baseVal.value;
    const h = svgEl.height.baseVal.value;
    clone.setAttribute('width',  w);
    clone.setAttribute('height', h);

    const svgStr  = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url     = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const canvas = document.createElement('canvas');
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      const bg = window.getComputedStyle(document.documentElement).getPropertyValue('--bg-surface').trim();
      ctx.fillStyle = bg || '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'tree.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    };
    img.onerror = () => { URL.revokeObjectURL(url); alert('PNG export failed.'); };
    img.src = url;
  };

  const copyLabel = copyStatus === 'success' ? 'Copied!' : copyStatus === 'error' ? 'Failed' : 'Copy Newick';

  return (
    <div className={`sidebar-panel${isOpen ? '' : ' sidebar-panel--collapsed'}`}>
      <div className="sidebar-panel__header__left">
        {isOpen && <h2 className="sidebar-panel__title">Data &amp; Search</h2>}
        <button
          className="sidebar-panel__toggle"
          onClick={onToggle}
          title={isOpen ? 'Collapse panel' : 'Expand panel'}
        >
          {isOpen ? '‹' : '›'}
        </button>
      </div>

      {isOpen && (
        <div className="sidebar-panel__content">
          <div className="sidebar-panel__section">
            {loading && <p className="sidebar-panel__status">Loading tree...</p>}
            {error   && <p className="sidebar-panel__status sidebar-panel__status--error">Error: {error}</p>}
          </div>

          <hr className="sidebar-panel__divider" />

          <div className="sidebar-panel__section">
            <label className="sidebar-panel__label">Search Nodes</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Species name..."
              className="sidebar-panel__input"
            />
          </div>

          <hr className="sidebar-panel__divider" />

          <div className="sidebar-panel__section">
            <h3 className="sidebar-panel__section-title">Export</h3>
            <div className="sidebar-panel__export-group">
              <button className="sidebar-panel__btn" onClick={handleExportNewick}>
                Export Newick
              </button>
              <button
                className={`sidebar-panel__btn${copyStatus === 'success' ? ' sidebar-panel__btn--success' : copyStatus === 'error' ? ' sidebar-panel__btn--error' : ''}`}
                onClick={handleCopyNewick}
              >
                {copyLabel}
              </button>
              <button className="sidebar-panel__btn" onClick={handleExportPNG}>
                Export as PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarLeft;