import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LogOut, Menu, X, Bell, Home, User, Zap, Award, Folder, Briefcase, 
  Trophy, FileText, Code, Car, CheckSquare, Users, Search, UserPlus, 
  BookOpen, Shield, History, ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationsAPI } from '../services/api';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      // Fetch notifications to get unread count
      NotificationsAPI.getNotifications()
        .then(({ data }) => {
          const notifs = Array.isArray(data) ? data : data?.notifications || [];
          setUnreadCount(notifs.filter(n => !n.is_read).length);
        })
        .catch(err => console.error('Failed to fetch notifications for badge', err));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (!user) return [];

    if (user.baseRole === 'student') {
      return [
        { label: 'Dashboard', href: '/dashboard', icon: Home },
        { label: 'Profile', href: '/profile', icon: User },
        { label: 'Skills', href: '/skills', icon: Zap },
        { label: 'Certifications', href: '/certifications', icon: Award },
        { label: 'Projects', href: '/projects', icon: Folder },
        { label: 'Internships', href: '/internships', icon: Briefcase },
        { label: 'Achievements', href: '/achievements', icon: Trophy },
        { label: 'Resumes', href: '/resumes', icon: FileText },
        { label: 'Coding Profiles', href: '/coding', icon: Code },
        { label: 'Drives', href: '/drives', icon: Car },
        { label: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount },
      ];
    }

    if (user.baseRole === 'faculty') {
      return [
        { label: 'Dashboard', href: '/faculty/dashboard', icon: Home },
        { label: 'Verification Queue', href: '/faculty/queue', icon: CheckSquare },
        { label: 'Mentees', href: '/faculty/mentees', icon: Users },
        { label: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount },
      ];
    }

    if (user.baseRole === 'hod') {
      return [
        { label: 'Dashboard', href: '/hod/dashboard', icon: Home },
        { label: 'Search students', href: '/hod/search', icon: Search },
        { label: 'Role assignment', href: '/hod/roles', icon: UserPlus },
        { label: 'Classes', href: '/hod/classes', icon: BookOpen },
        { label: 'Placement drives', href: '/hod/drives', icon: Car },
        { label: 'Verification queue', href: '/hod/queue', icon: CheckSquare },
        { label: 'Mentees', href: '/hod/mentees', icon: Users },
        { label: 'Audit trail', href: '/hod/audit', icon: History },
        { label: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount },
      ];
    }

    if (user.baseRole === 'admin') {
      return [
        { label: 'Admin Console', href: '/admin/dashboard', icon: Shield },
        { label: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount },
      ];
    }

    return [];
  };

  const navItems = getNavItems();
  const isActive = (href) => location.pathname === href || location.pathname.startsWith(href + '/');

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 fixed md:static w-[260px] h-screen bg-white border-r border-slate-200 z-40 transition-transform duration-300 flex flex-col`}>
        
        {/* Branding */}
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg leading-none select-none">S</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">SkillSphere</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-hide pb-4">
          {navItems.map(item => {
            const active = isActive(item.href);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-blue-100/50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon 
                    size={18} 
                    strokeWidth={active ? 2.5 : 2} 
                    className={`transition-colors duration-200 ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                  />
                  <span className="text-[14px] leading-tight">{item.label}</span>
                </div>
                
                {item.badge > 0 && (
                  <div className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 mt-auto">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 font-bold flex items-center justify-center flex-shrink-0">
                  {getInitials(user?.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 capitalize truncate">{user?.baseRole}</p>
                </div>
              </div>
              <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" />
            </div>
            
            <div className="h-px bg-slate-200 w-full"></div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white rounded-l-3xl shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)]">
        {/* Top bar (Mobile only now, or desktop wrapper) */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              SkillSphere
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/notifications" className="text-slate-400 hover:text-blue-600 transition-colors relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </Link>
          </div>
        </header>

        {/* Desktop Top Bar (Clean) */}
        <header className="bg-white px-8 pt-8 pb-4 hidden md:flex items-center justify-between sticky top-0 z-10">
          <div className="text-2xl font-bold text-slate-800">
            {/* The page title would theoretically go here, but since Layout wraps children, we can just show a generic greeting or leave it clean as requested by mockup */}
          </div>
          <div className="flex items-center gap-5">
            <Link to="/notifications" className="text-slate-400 hover:text-blue-600 transition-colors relative bg-slate-50 p-2.5 rounded-full hover:bg-blue-50">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
              )}
            </Link>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              Welcome, <span className="font-semibold text-slate-800">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto bg-slate-50/30">
          <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
