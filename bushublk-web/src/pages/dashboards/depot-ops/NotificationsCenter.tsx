import React, { useState, useEffect, useContext, type ReactNode } from 'react';
import { 
  HiCog, 
  HiClock, 
  HiExclamationCircle, 
  HiInformationCircle,
  HiBell,
  HiCheck,
  HiTrash
} from 'react-icons/hi';
import { AppContext } from '../../../context/AppContext';

type Notification = {
  description: ReactNode;
  bus_number: ReactNode;
  item_category: ReactNode;
  route_number: ReactNode;
  date: any;
  person_name: ReactNode;
  id: string | number;
  type: string;
  title: string;
  message: string;
  priority: string;
  timestamp: string | number | Date;
  read: boolean;
};

const NotificationsCenter = () => {
  const appContext = useContext(AppContext);
  const depotId = appContext?.user?.depot_id;
  const token = appContext?.token;
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!depotId || !token) return;
    fetch(`http://localhost:5000/api/depot/${depotId}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setNotifications(data.notifications || []));
  }, [depotId, token]);

  const getNotificationIcon = (type: any) => {
    switch (type) {
      case 'maintenance':
        return <HiCog className="w-5 h-5" />;
      case 'schedule':
        return <HiClock className="w-5 h-5" />;
      case 'alert':
        return <HiExclamationCircle className="w-5 h-5" />;
      case 'info':
        return <HiInformationCircle className="w-5 h-5" />;
      default:
        return <HiBell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: any) => {
    switch (type) {
      case 'maintenance':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'schedule':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'alert':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'info':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: any) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTime = (timestamp: any) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const markAsRead = async (notif: any) => {
    await fetch(`http://localhost:5000/api/depot/${depotId}/notifications/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        notification_type: notif.type,
        notification_id: notif.id
      })
    });
    setNotifications(notifications.filter(n => n.id !== notif.id));
  };

  const markAllAsRead = () => {
    setNotifications([]);
  };

  const deleteNotification = async (id: any, type: string) => {
    await fetch(`http://localhost:5000/api/depot/${depotId}/notifications/read`, {
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
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <HiBell className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications Center</h1>
              <p className="text-gray-600 mt-1">
                {notifications.length > 0 
                  ? `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`
                  : 'All caught up!'
                }
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4 lg:mt-0">
            <button
              onClick={markAllAsRead}
              disabled={notifications.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <HiCheck className="w-4 h-4" />
              Mark All Read
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Notifications ({notifications.length})
            </h2>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <HiBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No notifications found</p>
              <p className="text-gray-400 text-sm mt-2">All clear for now!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex gap-4">
                  {/* Notification Icon */}
                  <div className={`flex-shrink-0 p-3 rounded-lg border ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                            New
                          </span>
                        )}
                        <span className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`}></span>
                      </div>
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {notification.date
                          ? new Date(notification.date).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric' })
                          : ''}
                      </span>
                    </div>
                    
                    {/* Show details */}
                    <div className="mb-2 text-gray-700 text-sm">
                      {notification.type === 'complaint' && (
                        <span>
                          <strong>{notification.person_name}</strong> from <strong>Route: {notification.route_number}</strong>, <strong>Bus: {notification.bus_number}</strong> has submitted a complaint: <em>{notification.description}</em>
                        </span>
                      )}
                      {notification.type === 'lost_found' && (
                        <span>
                          <strong>{notification.person_name}</strong> reported a lost item (<strong>{notification.item_category}</strong>) on <strong>Route: {notification.route_number}</strong>: <em>{notification.description}</em>
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => markAsRead(notification)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Mark as read
                      </button>
                      <button
                        onClick={() => deleteNotification(notification.id, notification.type)}
                        className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsCenter;