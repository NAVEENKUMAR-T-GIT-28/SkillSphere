import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { NotificationsAPI } from '../../services/api';
import { Search, Check, Bell } from 'lucide-react';

// Helper to calculate relative time
const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
};

// Helper to determine icon based on notification content
const getNotificationIcon = (title, message) => {
  const content = `${title} ${message}`.toLowerCase();
  if (content.includes('resume')) return { icon: '📄', color: 'bg-blue-100 text-blue-600' };
  if (content.includes('achievement')) return { icon: '🏆', color: 'bg-yellow-100 text-yellow-600' };
  if (content.includes('certificate') || content.includes('certification')) return { icon: '📜', color: 'bg-orange-100 text-orange-600' };
  if (content.includes('project')) return { icon: '📦', color: 'bg-purple-100 text-purple-600' };
  if (content.includes('internship') || content.includes('job')) return { icon: '💼', color: 'bg-emerald-100 text-emerald-600' };
  if (content.includes('drive') || content.includes('placement')) return { icon: '🎯', color: 'bg-red-100 text-red-600' };
  if (content.includes('readiness') || content.includes('score')) return { icon: '📊', color: 'bg-indigo-100 text-indigo-600' };
  if (content.includes('skill')) return { icon: '⚡', color: 'bg-cyan-100 text-cyan-600' };
  return { icon: '🔔', color: 'bg-slate-100 text-slate-600' };
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  const fetchNotifications = async () => {
    try {
      setFetching(true);
      const { data } = await NotificationsAPI.getNotifications();
      setNotifications(Array.isArray(data) ? data : data?.notifications || []);
    } catch (err) {
      toast.error('Failed to fetch notifications');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await NotificationsAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const markAsRead = async (id) => {
    try {
      await NotificationsAPI.markAsRead(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const displayedNotifications = useMemo(() => {
    if (!searchQuery.trim()) return notifications;
    const query = searchQuery.toLowerCase();
    return notifications.filter(
      n => (n.title?.toLowerCase() || '').includes(query) || 
           (n.message?.toLowerCase() || '').includes(query)
    );
  }, [notifications, searchQuery]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Notifications</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-700">Your updates</span>
            <span>&bull;</span>
            <span>All updates, alerts and messages.</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search notifications..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
          />
        </div>
        <button 
          onClick={markAllRead} 
          disabled={fetching || notifications.length === 0 || notifications.every(n => n.is_read)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          <Check size={16} />
          Mark All Read
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {fetching ? (
          // Loading Skeletons
          [1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-4 p-5 bg-white border border-slate-200 rounded-xl animate-pulse">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex-shrink-0"></div>
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                <div className="h-3 bg-slate-100 rounded w-3/4"></div>
              </div>
              <div className="h-3 bg-slate-100 rounded w-16 mt-2"></div>
            </div>
          ))
        ) : displayedNotifications.length === 0 ? (
          // Empty State
          <div className="py-16 px-6 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <Bell size={32} className={searchQuery ? "opacity-50" : ""} />
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No matching notifications</h3>
                <p className="text-slate-500 max-w-sm">We couldn't find any notifications matching "{searchQuery}".</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-800 mb-2">You're all caught up.</h3>
                <p className="text-slate-500 max-w-sm">No notifications available at the moment.</p>
              </>
            )}
          </div>
        ) : (
          displayedNotifications.map(notif => {
            const { icon, color } = getNotificationIcon(notif.title, notif.message);
            
            return (
              <div 
                key={notif._id} 
                onClick={() => !notif.is_read && markAsRead(notif._id)}
                className={`flex gap-4 p-5 rounded-xl border transition-all cursor-pointer ${
                  notif.is_read 
                    ? 'bg-white border-slate-200 hover:shadow-md' 
                    : 'bg-blue-50/50 border-blue-200 border-l-4 border-l-blue-500 hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${color}`}>
                  {icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`text-base mb-1 text-slate-800 ${notif.is_read ? 'font-medium' : 'font-bold'}`}>
                    {notif.title}
                  </h4>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {notif.message}
                  </p>
                </div>
                
                <div className="text-xs font-medium text-slate-400 whitespace-nowrap pt-1">
                  {getRelativeTime(notif.created_at)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
