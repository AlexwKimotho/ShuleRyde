import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AdminLayout = () => {
  const { admin, signout } = useAdminAuth();
  const navigate = useNavigate();

  const handleSignout = () => {
    signout();
    navigate('/admin/signin');
  };

  return (
    <div className="flex h-screen bg-paper overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-ink flex flex-col h-screen">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">ShuleRyde</p>
            <p className="text-red-400 text-xs font-medium">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-red-600 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Operators
          </NavLink>
        </nav>

        <div className="border-t border-white/10 px-2 py-3 flex flex-col gap-2">
          <div className="px-3 py-2">
            <p className="text-white text-sm font-medium truncate">{admin?.full_name}</p>
            <p className="text-white/40 text-xs truncate">{admin?.email}</p>
          </div>
          <button
            onClick={handleSignout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white text-sm transition-colors"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
