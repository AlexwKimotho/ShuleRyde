import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { operator } = useAuth();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex h-screen bg-paper overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-cloud px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-slate text-sm">{greeting},</p>
            <h2 className="text-ink font-semibold text-lg leading-tight">
              {operator?.full_name?.split(' ')[0]}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sage-100 flex items-center justify-center">
              <span className="text-sage-700 font-semibold text-sm">
                {operator?.full_name?.[0] || 'O'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
