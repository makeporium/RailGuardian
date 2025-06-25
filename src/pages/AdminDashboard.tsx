import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/dashboard/UserMenu';
import { Home, ClipboardList, Train, Users, AlertTriangle, Settings, Search } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Overview', icon: Home, path: '/dashboard/admin' },
    { name: 'Hygiene Map', icon: ClipboardList, path: '/dashboard/admin/hygiene-map' },
    { name: 'Manage', icon: ClipboardList, path: '/dashboard/admin/manage' },
    { name: 'Trains', icon: Train, path: '/dashboard/admin/trains' },
    { name: 'Staff', icon: Users, path: '/dashboard/admin/staff' },
    { name: 'Alerts', icon: AlertTriangle, path: '/dashboard/admin/alerts' },
    { name: 'Settings', icon: Settings, path: '/dashboard/admin/settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-violet-600 rounded-lg flex items-center justify-center">
            <Train className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">RailGuardian</h1>
            <p className="text-slate-400 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.name}
            variant="ghost"
            onClick={() => navigate(item.path)}
            className={`w-full justify-start text-sm font-medium h-12 transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-gradient-to-r from-pink-500/20 to-violet-600/20 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <item.icon className="w-5 h-5 mr-4" />
            {item.name}
          </Button>
        ))}
      </nav>

      <div className="p-4">
        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <h3 className="text-white font-semibold text-sm mb-1">RailGuardian v1.0</h3>
            <p className="text-slate-400 text-xs"></p>
        </div>
      </div>
    </aside>
  );
};

const Header = () => {
    const location = useLocation();
    const pathParts = location.pathname.split('/').filter(p => p);
    const pageName = pathParts.length > 2 ? pathParts[2] : 'Overview';

    return (
        <header className="flex-shrink-0 bg-slate-950/50 backdrop-blur-xl border-b border-slate-800 p-4 flex justify-between items-center">
            <div>
                <p className="text-slate-400 text-sm">Dashboard / {pageName.charAt(0).toUpperCase() + pageName.slice(1)}</p>
                <h1 className="text-white text-xl font-semibold">Admin Dashboard</h1>
            </div>
             <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search..." className="bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm w-64 text-white placeholder-slate-400 focus:outline-none focus:border-pink-500" />
                </div>
                <UserMenu />
            </div>
        </header>
    );
};

const AdminDashboardPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex text-white">
      <Sidebar />
      <main className="flex-1 flex flex-col max-h-screen">
        <Header />
        <div className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;