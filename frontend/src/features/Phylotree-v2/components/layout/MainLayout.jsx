import '../../styles/MainLayout.css';
import SidebarLeft from './SidebarLeft.jsx';
import SidebarRight from './SidebarRight.jsx';
import TreeViewer from './TreeViewer.jsx';

const MainLayout = () => {
  return (
// 使用 CSS Grid 定義三欄：左(280px) 中(自適應) 右(300px)
    <div style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr 320px',
      height: '100%',
      overflow: 'hidden'
    }}>
      <div style={{ borderRight: '1px solid #e5e7eb', background: '#f9fafb', overflowY: 'auto', height: '100%' }}>
        <SidebarLeft />
      </div>

      <div style={{ overflow: 'auto', background: '#ffffff', position: 'relative' }}>
        <TreeViewer />
      </div>

      <div style={{ borderLeft: '1px solid #e5e7eb', background: '#f9fafb', overflowY: 'auto' }}>
        <SidebarRight />
      </div>
    </div>
  );
};

export default MainLayout;