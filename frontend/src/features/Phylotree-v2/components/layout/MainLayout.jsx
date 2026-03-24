import '../../styles/layout/MainLayout.css';
import SidebarLeft from './SidebarLeft.jsx';
import SidebarRight from './SidebarRight.jsx';
import TreeViewer from './TreeViewer.jsx';

const MainLayout = () => {
  return (
    <div className='phylotree-viewer'>
      <div className='sidebar-left'>
        <SidebarLeft />
      </div>

      <div className='tree-viewer'>
        <TreeViewer />
      </div>

      <div className='sidebar-right'>
        <SidebarRight />
      </div>
    </div>
  );
};

export default MainLayout;