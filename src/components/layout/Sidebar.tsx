import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  CalendarDays,
  Shield,
} from 'lucide-react';

const NAV = [
  { to: '/', label: 'Home', icon: LayoutDashboard, exact: true },
  { to: '/accounts', label: 'Accounts', icon: Building2 },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/weekly', label: 'Weekly Review', icon: CalendarDays },
];

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 flex flex-col h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">CS Command</p>
            <p className="text-indigo-300 text-xs font-medium">Center</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-700">
        <p className="text-slate-500 text-xs">Data stored locally</p>
      </div>
    </aside>
  );
}
