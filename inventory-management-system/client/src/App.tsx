import { RouterProvider } from 'react-router-dom';
import { router } from './routes/routes';
import { ConfigProvider, theme as antTheme } from 'antd';
import { useAppSelector } from './redux/hooks';
import { selectCurrentTheme } from './redux/services/themeSlice';
import { useEffect } from 'react';

const App = () => {
  const currentTheme = useAppSelector(selectCurrentTheme);
  const isDark = currentTheme === 'dark';

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <>
      <ConfigProvider
        theme={{
          algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
          token: {
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            colorPrimary: '#6366F1', // Electric Indigo
            borderRadius: 12,
            colorBgContainer: isDark ? '#0B0F19' : '#ffffff', // Clean dark container
            colorBgLayout: isDark ? '#05070C' : '#F8FAFC', // Deep dark space background
            colorBorder: isDark ? '#1E293B' : '#E2E8F0',
            colorTextBase: isDark ? '#F1F5F9' : '#1E293B',
          },
          components: {
            Button: {
              fontWeight: 600,
              controlHeight: 38,
            },
            Table: {
              headerBg: isDark ? '#0B0F19' : '#F8FAFC',
              headerColor: isDark ? '#94A3B8' : '#475569',
              rowHoverBg: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
            },
            Card: {
              colorBgContainer: isDark ? 'rgba(11, 15, 25, 0.8)' : '#ffffff',
            },
            Input: {
              controlHeight: 38,
            },
            Select: {
              controlHeight: 38,
            }
          },
        }}
      >
        <RouterProvider router={router} />
      </ConfigProvider>
    </>
  );
};

export default App;
