import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';
import { HiBell } from 'react-icons/hi';

type Notification = {
  id: string;
  type: string;
  title?: string;
  date?: string;
  bus_id?: string;
  incident_type?: string;
  description?: string;
  inspection_type?: string;
  status?: string;
  time?: string;
  text?: string;
};

const Notifications = () => {
  const appContext = useContext(AppContext);
  const depotId = appContext?.user?.depot_id;
  const token = appContext?.token;
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!depotId || !token) return;
    fetch(`http://localhost:5000/api/depot-manager/${depotId}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setNotifications(data.notifications || []));
  }, [depotId, token]);

  const markAsRead = async (notif: Notification) => {
    await fetch(`http://localhost:5000/api/depot-manager/${depotId}/notifications/read`, {
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

  const deleteNotification = async (id: any, type: any) => {
    await fetch(`http://localhost:5000/api/depot-manager/${depotId}/notifications/read`, {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Notifications ({notifications.length})
          </h2>
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
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 p-3 rounded-lg border bg-blue-50 border-blue-200">
                    <HiBell className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                          New
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {notification.date
                          ? new Date(notification.date).toISOString().slice(0, 10)
                          : ''}
                      </span>
                    </div>
                    <div className="mb-2 text-gray-700 text-sm">
                      {notification.type === 'emergency' && (
                        <span>
                          <strong>Bus:</strong> {notification.bus_id} | <strong>Incident:</strong> {notification.incident_type} <br />
                          <em>{notification.description}</em>
                        </span>
                      )}
                      {notification.type === 'inspection' && (
                        <span>
                          <strong>Inspection:</strong> {notification.inspection_type} | <strong>Status:</strong> {notification.status} <br />
                          <em>Date: {notification.date} {notification.time ? `Time: ${notification.time}` : ''}</em>
                        </span>
                      )}
                      {notification.type === 'manager_chat' && (
                        <span>
                          <strong>Depot Engineer has sent a message:</strong> {notification.text}
                        </span>
                      )}
                      {notification.type === 'rto_manager_chat' && (
                        <span>
                          <strong>RTO Officer has sent a message:</strong> {notification.text}
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

export default Notifications;