import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LogOut, Menu, X, Bell, Home, User, Zap, Award, Folder, Briefcase, 
  Trophy, FileText, Code, Car, CheckSquare, Users, Search, UserPlus, 
  BookOpen, Shield, History, ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationsAPI } from '../services/api';
import Logo from '../assets/skillsphere-logo.png';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchBadge = () => {
      if (!user) return;
      NotificationsAPI.getNotifications()
        .then(({ data }) => {
          const notifs = Array.isArray(data) ? data : data?.notifications || [];
          setUnreadCount(notifs.filter(n => !n.is_read).length);
        })
        .catch(err => console.error('Failed to fetch notifications for badge', err));
    };

    fetchBadge();

    window.addEventListener('notificationsRead', fetchBadge);
    return () => window.removeEventListener('notificationsRead', fetchBadge);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (!user) return [];

    if (user.baseRole === 'student') {
      return [
        { label: 'Dashboard', subtitle: 'Your placement readiness at a glance', href: '/dashboard', icon: Home },
        { label: 'Profile', subtitle: 'Manage your personal profile and academic information', href: '/profile', icon: User },
        { label: 'Skills', subtitle: 'Manage and verify your technical skills', href: '/skills', icon: Zap },
        { label: 'Certifications', subtitle: 'Track your certifications and verification status', href: '/certifications', icon: Award },
        { label: 'Projects', subtitle: 'Manage your projects and portfolio', href: '/projects', icon: Folder },
        { label: 'Internships', subtitle: 'Track your internship experience', href: '/internships', icon: Briefcase },
        { label: 'Achievements', subtitle: 'Showcase your awards, hackathons and recognitions', href: '/achievements', icon: Trophy },
        { label: 'Resumes', subtitle: 'Manage your resume versions', href: '/resumes', icon: FileText },
        { label: 'Coding Profiles', subtitle: 'Track and manage your coding platform profiles', href: '/coding', icon: Code },
        { label: 'Drives', subtitle: 'Campus placement opportunities', href: '/drives', icon: Car },
        { label: 'Notifications', subtitle: 'Your updates, alerts and messages', href: '/notifications', icon: Bell, badge: unreadCount },
      ];
    }

    if (user.baseRole === 'faculty') {
      return [
        { label: 'Dashboard', subtitle: 'Faculty overview and quick actions', href: '/faculty/dashboard', icon: Home },
        { label: 'Verification Queue', subtitle: 'Review and approve student submissions', href: '/faculty/queue', icon: CheckSquare },
        { label: 'Mentees', subtitle: 'Manage and monitor your assigned students', href: '/faculty/mentees', icon: Users },
        { label: 'Notifications', subtitle: 'Your updates, alerts and messages', href: '/notifications', icon: Bell, badge: unreadCount },
      ];
    }

    if (user.baseRole === 'hod') {
      return [
        { label: 'Dashboard', subtitle: 'Department overview and analytics', href: '/hod/dashboard', icon: Home },
        { label: 'Search students', subtitle: 'Find and view student profiles', href: '/hod/search', icon: Search },
        { label: 'Role assignment', subtitle: 'Manage faculty and student roles', href: '/hod/roles', icon: UserPlus },
        { label: 'Classes', subtitle: 'Manage department classes and batches', href: '/hod/classes', icon: BookOpen },
        { label: 'Placement drives', subtitle: 'Monitor active and upcoming drives', href: '/hod/drives', icon: Car },
        { label: 'Verification queue', subtitle: 'Review pending verifications', href: '/hod/queue', icon: CheckSquare },
        { label: 'Mentees', subtitle: 'Overview of department mentees', href: '/hod/mentees', icon: Users },
        { label: 'Audit trail', subtitle: 'Track system activities and changes', href: '/hod/audit', icon: History },
        { label: 'Notifications', subtitle: 'Your updates, alerts and messages', href: '/notifications', icon: Bell, badge: unreadCount },
      ];
    }

    if (user.baseRole === 'admin') {
      return [
        { label: 'Admin Console', subtitle: 'System administration and configuration', href: '/admin/dashboard', icon: Shield },
        { label: 'Notifications', subtitle: 'Your updates, alerts and messages', href: '/notifications', icon: Bell, badge: unreadCount },
      ];
    }

    return [];
  };

  const navItems = getNavItems();
  const isActive = (href) => location.pathname === href || location.pathname.startsWith(href + '/');

  // Find current active item for the global header
  const currentNavItem = navItems.find(item => isActive(item.href)) || { 
    label: 'SkillSphere', 
    subtitle: 'Welcome to your portal', 
    icon: Home 
  };
  const CurrentIcon = currentNavItem.icon;

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
        <div className="flex items-center px-5 py-4">
          <img src={Logo} alt="SkillSphere" className="w-44 h-auto object-contain" />
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
        
        {/* Mobile Top Bar */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center">
              <span className="font-bold text-slate-800">{currentNavItem.label}</span>
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

        {/* Global Page Header (Desktop) */}
        <header className="bg-white px-8 py-5 hidden md:flex items-center justify-between sticky top-0 z-10 border-b border-slate-200 shadow-sm">
          {/* Left: Page Context */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50/80 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100/50">
              <CurrentIcon size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-[28px] font-bold text-slate-800 leading-tight tracking-tight">{currentNavItem.label}</h1>
              <p className="text-[15px] text-slate-500 mt-0.5">{currentNavItem.subtitle}</p>
            </div>
          </div>

          {/* Center: Reserved for Search (Empty) */}
          <div className="flex-1 px-12"></div>

          {/* Right: User Actions */}
          <div className="flex items-center gap-6">
            <Link to="/notifications" className="text-slate-400 hover:text-blue-600 transition-colors relative bg-slate-50 p-2.5 rounded-full hover:bg-blue-50 border border-slate-100">
              <Bell size={20} strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </Link>
            
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200 cursor-pointer group relative">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize mt-0.5">{user?.baseRole}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center flex-shrink-0 border border-blue-200">
                {getInitials(user?.name)}
              </div>
              <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />

              {/* Simple logout dropdown hack for now, could be extracted to a proper dropdown component */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-sm font-medium"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto bg-slate-50/50">
          <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
