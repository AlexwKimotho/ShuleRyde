import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navSections = [
  {
    items: [
      {
        label: 'Dashboard',
        to: '/dashboard',
        permission: null,
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Payments',
        to: '/dashboard/payments',
        permission: 'parents',
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        ),
      },
      {
        label: 'Manifest',
        to: '/dashboard/manifest',
        permission: 'parents',
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
      },
      {
        label: 'Parents',
        to: '/dashboard/parents',
        permission: 'parents',
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        label: 'Schools',
        to: '/dashboard/schools',
        permission: 'parents',
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        ),
      },
      {
        label: 'Vehicles',
        to: '/dashboard/vehicles',
        permission: 'vehicles',
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M8 17H6a2 2 0 01-2-2V9a2 2 0 012-2h1M8 17h8M8 17v-1a1 1 0 011-1h6a1 1 0 011 1v1m0 0h2a2 2 0 002-2V9a2 2 0 00-2-2h-1m-9 0V6a4 4 0 018 0v1m-8 0h8" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Reports',
    items: [
      {
        label: 'Finance',
        to: '/dashboard/finance',
        permission: 'finance',
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        label: 'Compliance',
        to: '/dashboard/compliance',
        permission: 'compliance',
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
      },
    ],
  },
];

const Sidebar = ({ collapsed, onToggle, onMobileClose }) => {
  const { operator, signout } = useAuth();
  const navigate = useNavigate();

  const handleSignout = () => {
    signout();
    navigate('/signin');
  };

  const hasPermission = (permission) =>
    !permission || operator?.permissions?.[permission] !== false;

  const initial = operator?.full_name?.[0] || 'O';

  return (
    <aside className={`
      h-screen flex flex-col
      transition-[width] duration-300 ease-out overflow-hidden
      ${collapsed ? 'w-[64px]' : 'w-[220px]'}
    `}
      style={{ background: 'linear-gradient(180deg, #1e2d27 0%, #1a2620 100%)' }}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-white/[0.07] px-3 py-4 flex-shrink-0
        ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 bg-sage-500 rounded-lg flex items-center justify-center flex-shrink-0
            shadow-[0_2px_8px_rgba(107,144,128,0.4)]">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          {!collapsed && (
            <span className="font-display font-semibold text-white text-[15px] tracking-tight truncate">
              ShuleRyde
            </span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onMobileClose}
            className="lg:hidden text-white/30 hover:text-white/70 transition-colors p-1 rounded-md flex-shrink-0"
            aria-label="Close menu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 flex flex-col overflow-y-auto gap-0.5 overflow-x-hidden">
        {navSections.map((section, si) => {
          const visible = section.items.filter(item => hasPermission(item.permission));
          if (!visible.length) return null;
          return (
            <div key={si} className={si > 0 ? 'mt-2' : ''}>
              {/* Section label */}
              {si > 0 && !collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25 px-3 mb-1 mt-1">
                  {section.label}
                </p>
              )}
              {si > 0 && collapsed && (
                <div className="mx-3 h-px bg-white/[0.08] mb-2" />
              )}
              {visible.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  onClick={onMobileClose}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) => `
                    flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium
                    transition-all duration-150 ease-out
                    ${collapsed ? 'justify-center' : ''}
                    ${isActive
                      ? 'bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'text-white/50 hover:text-white/90 hover:bg-white/[0.07]'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.07] px-2 py-3 flex flex-col gap-0.5 flex-shrink-0">
        {/* Settings */}
        <NavLink
          to="/dashboard/settings"
          onClick={onMobileClose}
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) => `
            flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium
            transition-all duration-150
            ${collapsed ? 'justify-center' : ''}
            ${isActive
              ? 'bg-white/[0.12] text-white'
              : 'text-white/50 hover:text-white/90 hover:bg-white/[0.07]'
            }
          `}
        >
          <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!collapsed && <span className="truncate">Settings</span>}
        </NavLink>

        {/* User identity */}
        {!collapsed && (
          <div className="flex items-center gap-2 px-2.5 py-2 mt-0.5">
            <div className="w-6 h-6 rounded-full bg-sage-500/70 flex items-center justify-center flex-shrink-0">
              {operator?.profile_picture_url ? (
                <img src={operator.profile_picture_url} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-white text-[10px] font-semibold">{initial}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white/80 text-[12px] font-medium truncate leading-none">{operator?.full_name}</p>
              <p className="text-white/35 text-[10px] truncate leading-tight mt-0.5">{operator?.business_name}</p>
            </div>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignout}
          title="Sign out"
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium
            text-white/40 hover:text-white/80 hover:bg-white/[0.07]
            transition-all duration-150
            ${collapsed ? 'justify-center' : ''}`}
        >
          <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span className="truncate">Sign out</span>}
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand' : 'Collapse'}
          className={`hidden lg:flex items-center gap-2.5 px-2.5 py-2 rounded-xl
            text-white/25 hover:text-white/60 hover:bg-white/[0.07]
            text-[13px] transition-all duration-150
            ${collapsed ? 'justify-center' : ''}`}
        >
          <svg className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
          </svg>
          {!collapsed && <span className="truncate">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
