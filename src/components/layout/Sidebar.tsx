import { NavLink } from '../ui/NavLink';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, User, Menu, X, BarChart2, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import NotificationsBell from '../ui/NotificationsBell';
import GlobalSearch from '../ui/GlobalSearch';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, id?: string) => void;
}

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'my-tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center justify-between px-6 py-5 border-b ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <span className={`text-lg font-bold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>TaskFlow</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme}
            className={`p-1.5 rounded-lg transition ${dark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <NotificationsBell onNavigate={onNavigate} />
        </div>
      </div>

      {/* Search */}
      <div className={`px-3 py-3 border-b ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
        <GlobalSearch onNavigate={onNavigate} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { onNavigate(id); setMobileOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              currentView === id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-gray-800 pt-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition cursor-pointer group"
          onClick={() => { onNavigate('profile'); setMobileOpen(false); }}>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <User className="w-3 h-3" /> Profile
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-1 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>

        {/* Credit */}
        <div className="mt-4 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-center">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Crafted with ❤️ by
          </p>
          <p className="text-xs font-semibold text-blue-400 tracking-wide">
            Arpit Singh
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-gray-900 border-r border-gray-800 fixed h-full z-20">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">TaskFlow</span>
        </div>
        <button onClick={() => setMobileOpen(v => !v)} className="text-gray-400 hover:text-white transition">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 flex">
          <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col pt-14">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
