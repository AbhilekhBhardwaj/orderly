import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, ShoppingBag, Bell, LogOut, Menu, X, Package, ChevronDown
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
];

function SidebarNav({ onNavigate }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          data-testid={`nav-${label.toLowerCase()}`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <Icon className="w-5 h-5 shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]" data-testid="app-layout">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-[#0A2540] z-40" data-testid="sidebar">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Orderly</span>
        </div>
        <SidebarNav />
        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            data-testid="sidebar-logout-button"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all w-full"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-[#0A2540] border-none">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">App navigation sidebar</SheetDescription>
          <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Orderly</span>
          </div>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="md:ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-4 md:px-8" data-testid="app-header">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMobileOpen(true)}
              data-testid="mobile-menu-button"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:bg-slate-50 rounded-lg px-3 py-2 transition-colors" data-testid="user-menu-trigger">
                <div className="w-8 h-8 rounded-full bg-[#0A2540] flex items-center justify-center text-white text-sm font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700">{user?.name || 'User'}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} data-testid="dropdown-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
