import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../state/useUIStore';
import { useAuthStore } from '../state/useAuthStore';
import {
  BookOpen,
  GraduationCap,
  Route,
  Award,
  MessageSquare,
  FileSpreadsheet,
  Bell,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UploadCloud,
  TrendingUp,
  FolderLock
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const DashboardLayout: React.FC = () => {
  const { sidebarOpen, toggleSidebar, theme, toggleTheme } = useUIStore();
  const { activeRole, setActiveRole } = useAuthStore();
  const location = useLocation();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync class dark on mount
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Sidebar items based on role
  const studentItems: MenuItem[] = [
    { name: 'Kho khóa học', path: '/courses', icon: BookOpen },
    { name: 'Lớp học của tôi', path: '/classes', icon: GraduationCap },
    { name: 'Lộ trình học', path: '/learning/roadmap', icon: Route },
    { name: 'Năng lực học tập', path: '/learning/mastery', icon: Award },
    { name: 'AI Tutor Chat', path: '/chat', icon: MessageSquare },
    { name: 'Bài thi & Kiểm tra', path: '/assessments', icon: FileSpreadsheet },
  ];

  const teacherItems: MenuItem[] = [
    { name: 'Quản lý Khóa học', path: '/courses', icon: BookOpen },
    { name: 'Quản lý Lớp học', path: '/classes', icon: GraduationCap },
    { name: 'Tài liệu & Upload', path: '/learning/materials', icon: UploadCloud },
    { name: 'Theo dõi Học sinh', path: '/learning/mastery', icon: TrendingUp },
    { name: 'Quản lý Đề thi', path: '/assessments/manage', icon: FolderLock },
  ];

  const menuItems = activeRole === 'teacher' ? teacherItems : studentItems;

  const handleLinkClick = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300">
      
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex flex-col bg-card border-r border-border h-screen sticky top-0 z-20 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-border h-16">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-violet-500 text-white font-bold shadow-md shadow-primary/20">
              <span className="font-outfit text-xl">Ed</span>
            </div>
            {sidebarOpen && (
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent font-outfit whitespace-nowrap">
                EdTech AI
              </span>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15 font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon size={20} className={isActive ? '' : 'text-muted-foreground group-hover:text-foreground'} />
                {sidebarOpen && (
                  <span className="text-sm tracking-wide font-outfit transition-opacity duration-300">
                    {item.name}
                  </span>
                )}
                
                {/* Tooltip when collapsed */}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-30 shadow-lg border border-slate-800">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-3 overflow-hidden">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 w-full">
              <UserButton afterSignOutUrl="/sign-in" />
              <Link to="/profile" className="flex flex-col min-w-0 hover:text-primary transition-colors cursor-pointer">
                <span className="text-xs font-semibold truncate">
                  {user?.fullName || 'User'}
                </span>
                <span className="text-[10px] text-muted-foreground capitalize">
                  {activeRole}
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Navigation (Sidebar Backdrop & Drawer) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-30 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-card border-r border-border z-40 p-4 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold">
                    <span className="font-outfit text-lg">Ed</span>
                  </div>
                  <span className="font-bold text-lg font-outfit text-primary">
                    EdTech AI
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Menu List */}
              <nav className="flex-1 space-y-1.5">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold shadow-md'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-sm font-outfit">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile User Profile info */}
              <div className="pt-4 border-t border-border flex items-center gap-3 mt-auto">
                <UserButton afterSignOutUrl="/sign-in" />
                <Link to="/profile" onClick={handleLinkClick} className="flex flex-col hover:text-primary transition-colors cursor-pointer">
                  <span className="text-xs font-semibold">{user?.fullName || 'User'}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{activeRole}</span>
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Header */}
        <header className="bg-card border-b border-border h-16 flex items-center justify-between px-4 sticky top-0 z-10">
          
          {/* Header Left (Mobile Menu Button & Breadcrumbs / Role title) */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground md:hidden transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Role indicator tag */}
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold font-outfit uppercase tracking-wider ${
                activeRole === 'teacher' 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                  : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
              }`}>
                {activeRole === 'teacher' ? 'Giáo viên' : 'Học sinh'}
              </span>
            </div>
          </div>

          {/* Header Right Controls */}
          <div className="flex items-center gap-3">
            
            {/* Quick Search */}
            <div className="hidden sm:flex items-center relative max-w-xs">
              <Search className="absolute left-3 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Tìm nhanh..."
                className="w-48 xl:w-64 pl-9 pr-3 py-1.5 bg-muted/50 border border-input rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition-all"
              />
            </div>

            {/* Role Switch Button (if User role allows, or as a mock dashboard toggle) */}
            <button
              onClick={() => setActiveRole(activeRole === 'student' ? 'teacher' : 'student')}
              title="Chuyển đổi vai trò hiển thị"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-accent border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <Sparkles size={14} className="text-primary animate-pulse" />
              <span className="hidden md:inline">Xem vai</span> {activeRole === 'student' ? 'Giáo viên' : 'Học sinh'}
            </button>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border"
              title="Đổi giao diện"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification Bell */}
            <button className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card animate-ping" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
            </button>

            {/* Clerk User Button in header (Mobile) */}
            <div className="md:hidden">
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-background/50 p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
