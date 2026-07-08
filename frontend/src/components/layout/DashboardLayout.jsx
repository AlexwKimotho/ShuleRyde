import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { operator } = useAuth();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = operator?.full_name?.split(' ')[0] || '';

  return (
    <div className="flex h-screen bg-paper overflow-hidden">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 lg:relative lg:z-auto flex-shrink-0
        transition-transform duration-300 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
          onMobileClose={() => setMobileOpen(false)}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Frosted-glass top bar */}
        <header className="
          glass border-b border-black/[0.06]
          px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0
          shadow-[0_1px_0_rgba(0,0,0,0.04)]
          sticky top-0 z-10
        ">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 -ml-1 rounded-lg text-slate hover:text-ink hover:bg-black/[0.05] transition-all"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <p className="text-slate text-[11px] font-medium tracking-wide leading-none">{greeting}</p>
              <h2 className="text-ink font-semibold text-base leading-snug tracking-tight">
                {firstName}
              </h2>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            {/* Date chip */}
            <span className="hidden sm:block text-[11px] text-slate/80 font-medium bg-black/[0.04] rounded-full px-3 py-1 tabular-nums">
              {new Date().toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-border/60 flex-shrink-0">
              {operator?.profile_picture_url ? (
                <img
                  src={operator.profile_picture_url}
                  alt={operator.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-sage-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {firstName[0] || 'O'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
