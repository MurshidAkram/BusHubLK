import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  HiBell,
  HiChatAlt2,
  HiCheck,
  HiExclamationCircle,
  HiInformationCircle,
  HiSpeakerphone,
  HiTrash
} from 'react-icons/hi';
import { AppContext } from '../../../context/AppContext';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const buildDepotNotificationsUrl = (depotId: number | string) => `https://bushublk.duckdns.org/api/depot/${depotId}/notifications`;

const buildDepotReadUrl = (depotId: number | string) => `https://bushublk.duckdns.org/api/depot/${depotId}/notifications/read`;

type NotificationType = 'complaint' | 'lost_found' | 'announcement' | 'direct_message';

type Notification = {
  id: number | string;
  type: NotificationType;
  title: string;
  message?: string;
  priority?: 'high' | 'medium' | 'low' | string;
  created_at?: string;
  read?: boolean;
  person_name?: string;
  route_number?: string;
  bus_number?: string;
  item_category?: string;
  item_description?: string;
  description?: string;
  contact?: string;
  contact_email?: string;
  incident_date?: string;
  incident_time?: string;
  report_type?: 'Lost' | 'Found' | string;
  approximate_location?: string;
  status?: string;
  meta?: Record<string, unknown>;
};

const SOURCE_LABEL: Record<NotificationType, string> = {
  complaint: 'Complaint',
  lost_found: 'Lost & Found',
  announcement: 'Announcement',
  direct_message: 'Direct Message'
};

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700'
};

const DEFAULT_BADGE = 'bg-gray-100 text-gray-600';

const formatRelativeTime = (value?: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const resolveTimestamp = (notification: Notification): string | undefined => {
  if (notification.created_at) return notification.created_at;
  if (notification.incident_date && notification.incident_time) {
    return `${notification.incident_date}T${notification.incident_time}`;
  }
  if (notification.incident_date) return notification.incident_date;
  return undefined;
};

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'complaint':
      return <HiExclamationCircle className="w-5 h-5" />;
    case 'lost_found':
      return <HiInformationCircle className="w-5 h-5" />;
    case 'announcement':
      return <HiSpeakerphone className="w-5 h-5" />;
    case 'direct_message':
      return <HiChatAlt2 className="w-5 h-5" />;
    default:
      return <HiBell className="w-5 h-5" />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'complaint':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'lost_found':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'announcement':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'direct_message':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const NotificationsCenter: React.FC = () => {
  const appContext = useContext(AppContext);
  const depotId = appContext?.user?.depot_id;
  const token = appContext?.token;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshGlobalCount = useCallback(() => {
    if (typeof window !== 'undefined' && typeof (window as any).refreshNotificationCount === 'function') {
      (window as any).refreshNotificationCount();
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!depotId || !token) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildDepotNotificationsUrl(depotId), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (err) {
      console.error('Failed to fetch depot notifications:', err);
      setError('Unable to load notifications right now. Please try again.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [depotId, token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markNotificationOnServer = useCallback(
    async (type: NotificationType, id: number | string) => {
      if (!depotId || !token) return false;

      try {
        const response = await fetch(buildDepotReadUrl(depotId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            notification_type: type,
            notification_id: id
          })
        });

        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        setError(null);
        return true;
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
        setError('Unable to update notification. Please try again.');
        return false;
      }
    },
    [depotId, token]
  );

  const removeNotificationFromState = useCallback((id: number | string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const markAsRead = async (notification: Notification) => {
    const success = await markNotificationOnServer(notification.type, notification.id);
    if (success) {
      removeNotificationFromState(notification.id);
      refreshGlobalCount();
    }
  };

  const deleteNotification = async (id: number | string, type: NotificationType) => {
    const success = await markNotificationOnServer(type, id);
    if (success) {
      removeNotificationFromState(id);
      refreshGlobalCount();
    }
  };

  const markAllAsRead = async () => {
    if (notifications.length === 0) return;
    await Promise.all(notifications.map((notif) => markNotificationOnServer(notif.type, notif.id)));
    setNotifications([]);
    refreshGlobalCount();
  };

  const unreadCount = notifications.length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <HiBell className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications Center</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} notification${unreadCount !== 1 ? 's' : ''} awaiting review` : 'All caught up!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            >
              <HiCheck />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Notifications ({unreadCount})</h2>
          {loading && (
            <span className="text-sm text-gray-500">Refreshing…</span>
          )}
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center gap-2">
            <HiExclamationCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {notifications.length === 0 && !loading ? (
          <div className="text-center py-12">
            <HiBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No notifications found</p>
            <p className="text-gray-400 text-sm mt-2">All clear for now!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => {
              const timestamp = resolveTimestamp(notification);
              const priorityClass = PRIORITY_BADGE[notification.priority || ''] || DEFAULT_BADGE;
              const senderRoleLabel = typeof notification.meta?.senderRoleLabel === 'string'
                ? notification.meta.senderRoleLabel
                : undefined;
              const channelName = typeof notification.meta?.channelName === 'string'
                ? notification.meta.channelName
                : undefined;
              const rawReportType = typeof notification.report_type === 'string' ? notification.report_type : '';
              const normalizedReportType = rawReportType.toLowerCase() === 'found' ? 'found' : 'lost';
              const itemName = notification.item_description || notification.item_category || '';
              const locationLabel = typeof notification.approximate_location === 'string' && notification.approximate_location.trim().length > 0
                ? notification.approximate_location.trim()
                : '';
              const detailText = (() => {
                const detail = notification.description || notification.message;
                if (!detail) {
                  return '';
                }
                if (itemName && detail.trim().toLowerCase() === itemName.trim().toLowerCase()) {
                  return '';
                }
                return detail;
              })();

              return (
                <div
                  key={`${notification.type}-${notification.id}`}
                  className={`p-6 transition-colors ${!notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex gap-4">
                    <div className={`flex-shrink-0 p-3 rounded-lg border ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-2">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                            <span className={`px-2 py-1 rounded-full ${priorityClass}`}>
                              {(notification.priority || 'medium').toString().toUpperCase()}
                            </span>
                            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                              {SOURCE_LABEL[notification.type] || notification.type}
                            </span>
                            {!notification.read && (
                              <span className="px-2 py-1 rounded-full bg-blue-500 text-white">New</span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                          <div className="text-sm text-gray-700 whitespace-pre-line">
                            {notification.type === 'complaint' && (
                              <span>
                                <strong>{notification.person_name}</strong> raised a complaint on <strong>Route {notification.route_number}</strong>
                                {notification.bus_number ? ` (Bus ${notification.bus_number})` : ''}: <em>{notification.description || notification.message}</em>
                              </span>
                            )}
                            {notification.type === 'lost_found' && (
                              <span>
                                <strong>{notification.person_name || 'Passenger'}</strong>
                                {locationLabel ? (
                                  <>
                                    {' from '}
                                    <strong>{locationLabel}</strong>
                                  </>
                                ) : null}
                                {` has reported a ${normalizedReportType} item`}
                                {itemName ? (
                                  <>
                                    {' ('}
                                    <strong>{itemName}</strong>
                                    {')'}
                                  </>
                                ) : null}
                                {notification.route_number ? (
                                  <>
                                    {' on '}
                                    <strong>Route {notification.route_number}</strong>
                                  </>
                                ) : null}
                                {detailText ? (
                                  <>
                                    {': '}
                                    <em>{detailText}</em>
                                  </>
                                ) : null}
                              </span>
                            )}
                            {notification.type === 'announcement' && (
                              <span>{notification.message}</span>
                            )}
                            {notification.type === 'direct_message' && (
                              <span>{notification.message}</span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            {timestamp && <span>Received: {formatRelativeTime(timestamp)}</span>}
                            {notification.contact && <span>Contact: {notification.contact}</span>}
                            {notification.contact_email && <span>Email: {notification.contact_email}</span>}
                            {notification.status && <span>Status: {notification.status}</span>}
                            {senderRoleLabel && <span>Sender Role: {senderRoleLabel}</span>}
                            {channelName && <span>Channel: {channelName}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => markAsRead(notification)}
                            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                          >
                            Mark as Read
                          </button>
                          <button
                            onClick={() => deleteNotification(notification.id, notification.type)}
                            className="px-3 py-2 rounded-md border border-gray-200 text-sm text-gray-600 hover:text-red-600 hover:border-red-200"
                            title="Dismiss notification"
                          >
                            <HiTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsCenter;
