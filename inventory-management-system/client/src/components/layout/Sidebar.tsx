import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button, Layout, Menu } from 'antd';
import { LogoutOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { sidebarItems } from '../../constant/sidebarItems';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logoutUser } from '../../redux/services/authSlice';
import { selectCurrentTheme, toggleTheme } from '../../redux/services/themeSlice';
import Logo from './Logo';
import AICopilot from '../AICopilot/AICopilot';

const { Content, Sider } = Layout;

const getSelectedKey = (pathname: string): string => {
  if (pathname === '/' || !pathname) return 'Dashboard';
  if (pathname.startsWith('/demand-forecast')) return 'Demand Forecast';
  if (pathname.startsWith('/create-product')) return 'Add Product';
  if (pathname.startsWith('/product-search')) return 'Products';
  if (pathname.startsWith('/products')) return 'Manage Products';
  if (pathname.startsWith('/sales-history')) return 'Manage Sales';
  if (pathname.startsWith('/sales')) return 'Manage Sales';
  if (pathname.startsWith('/sellers')) return 'Manage Seller';
  if (pathname.startsWith('/purchases')) return 'Manage Purchase';
  if (
    pathname.startsWith('/profile') ||
    pathname.startsWith('/edit-profile') ||
    pathname.startsWith('/change-password')
  ) {
    return 'Profile';
  }
  return 'Dashboard';
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const currentTheme = useAppSelector(selectCurrentTheme);
  const isDark = currentTheme === 'dark';

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: isDark ? '#0F172A' : '#F8FAFC' }}>
      <Sider
        breakpoint='lg'
        collapsedWidth='80'
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width='260px'
        theme={isDark ? 'dark' : 'light'}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          boxShadow: isDark ? '0 0 15px 0 rgba(0,0,0,0.5)' : '0 0 15px 0 rgba(0,0,0,0.05)',
          zIndex: 100,
          borderRight: isDark ? '1px solid #1E293B' : '1px solid #F1F5F9',
        }}
      >
        <div
          onClick={() => navigate('/')}
          className='sidebar-logo-container'
          role='button'
          tabIndex={0}
          title='InventraAI Dashboard'
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/');
            }
          }}
          style={{
            padding: collapsed ? '16px 0' : '24px',
            textAlign: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <Logo size={collapsed ? 24 : 32} collapsed={collapsed} />
        </div>
        
        <Menu
          theme={isDark ? 'dark' : 'light'}
          mode='inline'
          style={{ 
            borderRight: 0, 
            padding: '8px',
            marginTop: '1rem'
          }}
          selectedKeys={[getSelectedKey(location.pathname)]}
          items={sidebarItems}
        />

        <div
          style={{
            position: 'absolute',
            bottom: '120px',
            left: 0,
            right: 0,
            padding: '0 16px',
            transition: 'all 0.2s'
          }}
        >
          <Button
            type='text'
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={() => dispatch(toggleTheme())}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              height: '40px',
              borderRadius: '8px',
              fontWeight: 500,
              color: isDark ? '#F1F5F9' : '#475569'
            }}
          >
            {!collapsed && (isDark ? 'Light Mode' : 'Dark Mode')}
          </Button>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            left: 0,
            right: 0,
            padding: '0 16px',
            transition: 'all 0.2s'
          }}
        >
          <Button
            type='text'
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              height: '40px',
              borderRadius: '8px',
              fontWeight: 500
            }}
          >
            {!collapsed && 'Sign Out'}
          </Button>
        </div>
      </Sider>
      
      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s', background: 'transparent' }}>
        <Content style={{ padding: '2rem' }}>
          <div
            style={{
              padding: '1.5rem',
              minHeight: 'calc(100vh - 4rem)',
              background: 'transparent',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
      <AICopilot />
    </Layout>
  );
};

export default Sidebar;
