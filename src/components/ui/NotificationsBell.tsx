import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Notification } from '../../lib/database.types';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';

interface NotificationsBellProps {
  onNavigate: (view: string, id?: string) => void;
}

export default function NotificationsBell({ onNavigate }: NotificationsBellProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Real-time subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setNotifications(data as Notification[]);
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ read: true }).eq('user_id', user!.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  async function clearAll() {
    await supabase.from('notifications').delete().eq('user_id', user!.id);
    setNotifications([]);
  }

  function handleNotifClick(n: Notification) {
    markRead(n.id);
    if (n.link_project_id) onNavigate('project', n.link_project_id);
    setOpen(false);
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  const typeIcon: Record<string, string> = {
    task_assigned: '📋',
    task_done: '✅',
    task_overdue: '⚠️',
    member_added: '👋',
    comment: '💬',
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} title="Mark all read"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition">
                  <CheckCheck className="w-3.5 h-3.5" /> All read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} title="Clear all"
                  className="text-gray-500 hover:text-red-400 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-800">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800/60 transition group ${!n.read ? 'bg-blue-950/20' : ''}`}
                  onClick={() => handleNotifClick(n)}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{typeIcon[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${!n.read ? 'text-white' : 'text-gray-300'}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                    {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                    <button onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                      className="text-gray-600 hover:text-red-400 p-0.5 transition">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
