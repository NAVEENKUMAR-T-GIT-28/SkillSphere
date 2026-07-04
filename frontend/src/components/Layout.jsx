import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (!user) return [];

    if (user.baseRole === 'student') {
      return [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Profile', href: '/profile' },
        { label: 'Skills', href: '/skills' },
        { label: 'Certifications', href: '/certifications' },
        { label: 'Projects', href: '/projects' },
        { label: 'Internships', href: '/internships' },
        { label: 'Achievements', href: '/achievements' },
        { label: 'Resumes', href: '/resumes' },
        { label: 'Coding', href: '/coding' },
        { label: 'Drives', href: '/drives' },
        { label: 'Notifications', href: '/notifications' },
      ];
    }

    if (user.baseRole === 'faculty') {
      return [
        { label: 'Dashboard', href: '/faculty/dashboard' },
        { label: 'Verification Queue', href: '/faculty/queue' },
        { label: 'Mentees', href: '/faculty/mentees' },
        { label: 'Notifications', href: '/notifications' },
      ];
    }

    if (user.baseRole === 'hod') {
      return [
        { label: 'Dashboard', href: '/hod/dashboard' },
        { label: 'Search students', href: '/hod/search' },
        { label: 'Role assignment', href: '/hod/roles' },
        { label: 'Classes', href: '/hod/classes' },
        { label: 'Placement drives', href: '/hod/drives' },
        { label: 'Verification queue', href: '/hod/queue' },
        { label: 'Mentees', href: '/hod/mentees' },
        { label: 'Audit trail', href: '/hod/audit' },
        { label: 'Notifications', href: '/notifications' },
      ];
    }

    if (user.baseRole === 'admin') {
      return [
        { label: 'Admin Console', href: '/admin/dashboard' },
        { label: 'Notifications', href: '/notifications' },
      ];
    }

    return [];
  };

  const navItems = getNavItems();
  const isActive = (href) => location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 fixed md:static w-64 h-screen bg-surface border-r border-border z-40 transition-transform duration-300 overflow-y-auto`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">SkillSphere</h1>
        </div>

        <nav className="px-4 space-y-2">
          {navItems.map(item => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`block px-4 py-2 rounded-md transition-colors ${
                isActive(item.href)
                  ? 'bg-blue-50 text-primary font-medium'
                  : 'text-text-secondary hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="mb-4">
            <p className="text-sm font-medium text-text-primary">{user?.name}</p>
            <p className="text-xs text-text-muted capitalize">{user?.baseRole}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-text-secondary hover:bg-gray-50 rounded-md transition-colors text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-md"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="text-lg font-semibold text-text-primary hidden md:block">
            SkillSphere
          </div>
          <div className="flex items-center gap-4">
            <Link to="/notifications" className="text-text-secondary hover:text-primary transition-colors relative">
              <Bell size={20} />
            </Link>
            <div className="text-sm text-text-secondary">
              Welcome, {user?.name}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
