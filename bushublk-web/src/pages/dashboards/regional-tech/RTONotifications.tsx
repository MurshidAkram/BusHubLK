import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  HiOutlineBell,
  HiOutlineExclamationCircle,
  HiOutlineClipboardList,
  HiOutlineCheckCircle
} from 'react-icons/hi';
import { AppContext } from '../../../context/AppContext';

type NotificationSourceType = 'emergency_escalated' | 'manager_chat';

type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

interface RTONotification {
  source_type: NotificationSourceType;
  source_id: number;
  created_at: string;
  title: string;
  message: string;
  status: string;
  bus_id: number | null;
  registration_number: string | null;
  driver_id: number | null;
  depot_id: number | null;
  region_id: number | null;
  priority: NotificationPriority;
  meta?: Record<string, unknown> | null;
  read_at: string | null;
  is_read: boolean;
}

type FetchState = 'idle' | 'loading' | 'error' | 'success';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const buildNotificationsUrl = (path: string = '') => {
  const suffix = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  return `${API_BASE_URL}/api/rto/notifications${suffix}`;
};

const ALLOWED_ROLE_KEYS = new Set(['regional_tech', 'regional_technical_officer']);

const PRIORITY_BADGE: Record<NotificationPriority, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-600'
};

const SOURCE_LABEL: Record<NotificationSourceType, string> = {
  emergency_escalated: 'Escalated Emergency',
  manager_chat: 'Depot Manager'
};

const RTONotifications: React.FC = () => {
  const appContext = useContext(AppContext);
  const token = appContext?.token || null;
  const user = appContext?.user;
  const [notifications, setNotifications] = useState<RTONotification[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [error, setError] = useState<string | null>(null);

  const normalizeRole = (value: string) => value.toLowerCase().replace(/\s+/g, '').replace(/-/g, '_');
  const roleKey = user?.role ? normalizeRole(user.role) : '';

  const formatDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const refreshGlobalCount = () => {
    if (typeof window !== 'undefined' && typeof (window as any).refreshNotificationCount === 'function') {
      (window as any).refreshNotificationCount();
    }
  };

  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    setFetchState('loading');
    setError(null);

    try {
  const response = await fetch(`${buildNotificationsUrl()}?limit=200&includeRead=false`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.json();

      if (payload?.success) {
        setNotifications(payload.notifications || []);
        setFetchState('success');
      } else {
        setFetchState('error');
        setError(payload?.message || 'Failed to load notifications.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error occurred';
      setError(message);
      setFetchState('error');
    }
  }, [token]);

  const markAsRead = useCallback(
    async (notification: RTONotification) => {
      if (!token || notification.is_read) return;

      try {
  const response = await fetch(buildNotificationsUrl('/mark-read'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sourceType: notification.source_type,
            sourceId: notification.source_id
          })
        });

        if (!response.ok) {
          throw new Error(`Mark as read failed with status ${response.status}`);
        }

        const payload = await response.json();

        if (payload?.success) {
          setNotifications((prev) =>
            prev.filter(
              (item) => !(item.source_type === notification.source_type && item.source_id === notification.source_id)
            )
          );
          refreshGlobalCount();
        }
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    },
    [token]
  );

  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    try {
  const response = await fetch(buildNotificationsUrl('/mark-all-read'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Mark all as read failed with status ${response.status}`);
      }

      const payload = await response.json();

      if (payload?.success) {
        setNotifications([]);
        refreshGlobalCount();
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError('Please log in to view notifications.');
      setFetchState('error');
      return;
    }

    if (!roleKey || !ALLOWED_ROLE_KEYS.has(roleKey)) {
      setError('Notifications are only available for regional technical officers.');
      setFetchState('error');
      return;
    }

    fetchNotifications();
  }, [token, roleKey, fetchNotifications]);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.is_read).length, [
    notifications
  ]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <HiOutlineBell className="text-purple-600" />
              RTO Notifications
            </h1>
            <p className="text-sm text-gray-600">
              Escalated emergencies and depot manager updates requiring regional technical review.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white border border-gray-200 rounded-full px-4 py-1 text-sm text-gray-600">
              Unread: <span className="font-semibold text-purple-600">{unreadCount}</span>
            </div>
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            >
              <HiOutlineCheckCircle />
              Mark All as Read
            </button>
          </div>
        </header>

        {fetchState === 'loading' && (
          <section className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-600">
            Loading notifications…
          </section>
        )}

        {fetchState === 'error' && (
          <section className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-start gap-3">
            <HiOutlineExclamationCircle className="text-red-500 mt-1" size={20} />
            <div>
              <p className="font-medium">Unable to load notifications.</p>
              <p className="text-sm">{error}</p>
            </div>
          </section>
        )}

        {fetchState === 'success' && notifications.length === 0 && (
          <section className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            <HiOutlineClipboardList className="mx-auto text-3xl mb-2 text-gray-400" />
            <p className="font-medium">No notifications to display.</p>
            <p className="text-sm">All caught up! Check back later for new activity.</p>
          </section>
        )}

        {fetchState === 'success' && notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const depotName =
                notification.meta &&
                typeof notification.meta === 'object' &&
                notification.meta !== null &&
                'depotName' in notification.meta
                  ? String((notification.meta as Record<string, unknown>).depotName)
                  : null;

              return (
                <article
                  key={`${notification.source_type}-${notification.source_id}`}
                  className={`bg-white rounded-lg border ${
                    notification.is_read ? 'border-gray-200' : 'border-purple-200'
                  } shadow-sm p-5 transition-all`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            PRIORITY_BADGE[notification.priority] || PRIORITY_BADGE.medium
                          }`}
                        >
                          {notification.priority.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                          {SOURCE_LABEL[notification.source_type] || notification.source_type}
                        </span>
                        {!notification.is_read && (
                          <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">New</span>
                        )}
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">{notification.title}</h2>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{notification.message}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>Received: {formatDate(notification.created_at)}</span>
                        {notification.registration_number && <span>Bus: {notification.registration_number}</span>}
                        {notification.status && <span>Status: {notification.status}</span>}
                        {depotName && <span>Depot: {depotName}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:flex-col md:items-end">
                      <button
                        onClick={() => markAsRead(notification)}
                        disabled={notification.is_read}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          notification.is_read
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {notification.is_read ? 'Read' : 'Mark as Read'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RTONotifications;