const Logo = ({
  color = '#2563EB',
  size = 32,
  collapsed = false,
}: {
  color?: string;
  size?: number;
  collapsed?: boolean;
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : '8px',
      }}
    >
      <div
        className='logo-icon-wrapper'
        style={{
          backgroundColor: `${color}10`,
          padding: '8px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={color}
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'></path>
          <polyline points='3.27 6.96 12 12.01 20.73 6.96'></polyline>
          <line x1='12' y1='22.08' x2='12' y2='12'></line>
        </svg>
      </div>
      {!collapsed && (
        <span
          className='logo-text'
          style={{
            fontSize: `${size * 0.75}px`,
            fontWeight: 800,
            fontFamily: 'Poppins, sans-serif',
            letterSpacing: '-0.5px',
            whiteSpace: 'nowrap',
          }}
        >
          Inventra<span style={{ color: color }}>AI</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
