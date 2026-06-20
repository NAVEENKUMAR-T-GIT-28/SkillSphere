import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { NotificationsAPI } from '../../services/api';
import { formatDate } from '../../utils/date';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);
  const toast = useToast();

  const fetchNotifications = async () => {
    try {
      setFetching(true);
      const { data } = await NotificationsAPI.getNotifications();
      // The API returns the raw array or an object depending on the interceptor.
      // We assume it's just an array based on the mock/backend structure.
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

  const displayedNotifications = filterUnread 
    ? notifications.filter(n => !n.is_read) 
    : notifications;

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-5">
        <h1 className="text-xl font-medium text-text-primary mb-1">Notifications</h1>
        <p className="text-[13px] text-text-secondary">All your alerts in one place</p>
      </div>
      
      <div className="flex gap-2 mb-3.5">
        <button onClick={markAllRead} className="px-2.5 py-1 text-xs font-medium bg-primary text-white border border-primary rounded-md hover:bg-blue-700 transition-colors">
          Mark all read
        </button>
        <button 
          onClick={() => setFilterUnread(!filterUnread)} 
          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
            filterUnread 
              ? 'bg-primary text-white border-primary hover:bg-blue-700' 
              : 'bg-surface border-border text-text-primary hover:bg-gray-50'
          }`}
        >
          {filterUnread ? 'Show all' : 'Filter unread'}
        </button>
      </div>

      <div className="space-y-1.5">
        {displayedNotifications.length === 0 ? (
          <div className="p-8 text-center border border-border rounded-lg bg-surface text-[13px] text-text-secondary">
            No notifications found.
          </div>
        ) : (
          displayedNotifications.map(notif => (
            <div 
              key={notif._id} 
              onClick={() => !notif.is_read && markAsRead(notif._id)}
              className="flex gap-2.5 p-2.5 rounded-md border border-border bg-surface cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                notif.is_read ? 'bg-transparent border border-border' : 'bg-primary'
              }`}></div>
              <div>
                <p className="text-[13px] font-medium mb-0.5 text-text-primary">{notif.title}</p>
                <span className="text-[12px] text-text-secondary">
                  {notif.message} &middot; {formatDate ? formatDate(notif.created_at) : new Date(notif.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
