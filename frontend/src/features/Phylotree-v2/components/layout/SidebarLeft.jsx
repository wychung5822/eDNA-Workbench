import { useTree } from '../../context/TreeContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import '../../styles/layout/Sidebar.css';

const SidebarLeft = () => {
  const { state: { loading, error } } = useTree();
  const { searchTerm, setSearchTerm } = useUI();

  return (
    <div className="sidebar-panel">
      <h2 className="sidebar-panel__title">Data &amp; Search</h2>

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
    </div>
  );
};

export default SidebarLeft;