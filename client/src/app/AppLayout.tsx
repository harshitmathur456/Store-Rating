import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  LayoutDashboard,
  Users,
  Store,
  Settings,
  LogOut,
  Menu,
  X,
  Star,
  ChevronDown,
} from 'lucide-react';

const navItems = {
  ADMIN: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/stores', label: 'Stores', icon: Store },
  ],
  USER: [
    { to: '/stores', label: 'Stores', icon: Store },
  ],
  OWNER: [
    { to: '/owner', label: 'Dashboard', icon: LayoutDashboard },
  ],
};

const roleBadge: Record<string, { label: string; className: string }> = {
  ADMIN: { label: 'Admin', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  USER: { label: 'User', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  OWNER: { label: 'Owner', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (!user) return null;

  const items = navItems[user.role] || [];
  const badge = roleBadge[user.role];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-zinc-200 flex flex-col transition-transform duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-14 flex items-center px-5 border-b border-zinc-100">
          <Star className="w-5 h-5 text-accent mr-2.5 flex-shrink-0" />
          <span className="font-semibold text-[15px] text-zinc-900 tracking-tight">StoreRating</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1 rounded-md hover:bg-zinc-100"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/owner'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/8 text-accent'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-zinc-100 p-3 space-y-0.5">
          <NavLink
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-accent/8 text-accent'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              }`
            }
          >
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-zinc-200 flex items-center px-4 lg:px-6 gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 -ml-1.5 rounded-md hover:bg-zinc-100"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5 text-zinc-600" />
          </button>

          <div className="flex-1" />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-zinc-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-accent">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-[13px] font-medium text-zinc-700 hidden sm:block max-w-[120px] truncate">
                {user.name.split(' ')[0]}
              </span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium hidden sm:block ${badge.className}`}>
                {badge.label}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-50" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg border border-zinc-200 shadow-lg z-50 py-1">
                  <div className="px-3 py-2.5 border-b border-zinc-100">
                    <p className="text-[13px] font-medium text-zinc-900 truncate">{user.name}</p>
                    <p className="text-[12px] text-zinc-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-zinc-700 hover:bg-zinc-50"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
