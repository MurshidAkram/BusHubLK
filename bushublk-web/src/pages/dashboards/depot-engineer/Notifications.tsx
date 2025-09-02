import React, { useState, useEffect, useContext } from 'react';
import { FaBell, FaExclamationTriangle, FaClock, FaCheckCircle, FaTimes, FaCalendarAlt, FaExclamationCircle, FaWrench } from 'react-icons/fa';
import { AppContext } from '../../../context/AppContext';

interface Notification {
  id: number | string;
  title: string;
  message: string;
  type: 'inspection' | 'urgent' | 'info' | 'success' | 'warning' | 'overdue' | 'critical_overdue' | 'schedule' | 'maintenance' | 'due_today';
  read: boolean;
  created_at: string;
  inspection_id?: number;
  schedule_id?: number;
  bus_registration?: string;
  assigned_by?: string;
  category?: 'inspection' | 'scheduling' | 'maintenance' | 'general';
  priority?: number; // 1 = highest priority (critical), 4 = lowest priority
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<string>('all'); // all, unread, read
  const [categoryFilter, setCategoryFilter] = useState<string>('all'); 

  const context = useContext(AppContext);

  // Fetch notifications on component mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!context?.token) {
          setError('Authentication required');
          return;
        }

        // Fetch all notifications including scheduling ones
        const requests = [
          // Fetch general notifications
          fetch('http://localhost:5000/api/notifications', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${context.token}`,
              'Content-Type': 'application/json'
            }
          }),
          // Fetch scheduling statistics to create notifications
          fetch('http://localhost:5000/api/depot-engineer/service-schedules/stats', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${context.token}`,
              'Content-Type': 'application/json'
            }
          })
        ];

        // Add inspection notifications fetch if available
        try {
          requests.push(
            fetch('http://localhost:5000/api/inspections/depot-engineer', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${context.token}`,
                'Content-Type': 'application/json'
              }
            })
          );
        } catch (e) {
          console.log('Inspection API not available, continuing with other notifications');
        }

        const responses = await Promise.all(requests.map(req => 
          req.catch(err => {
            console.log('Request failed:', err);
            return { ok: false, json: () => Promise.resolve({ success: false }) };
          })
        ));

        const generalData = await responses[0].json();
        const schedulingData = await responses[1].json();
        const inspectionData = responses[2] ? await responses[2].json() : { success: false };

        if (!responses[0].ok && !generalData.success) {
          console.warn('General notifications failed, continuing with other sources');
        }

        let allNotifications = [];

        // Add general notifications
        if (generalData.success) {
          console.log('📧 Raw general notifications from API:', generalData.notifications);
          
          const generalNotifications = (generalData.notifications || []).map((notif: any) => {
            const mappedNotif = {
              ...notif,
              // Set category based on notification type or content if not already set
              category: notif.category || 
                       (notif.type === 'inspection' ? 'inspection' : 
                        notif.title?.toLowerCase().includes('inspection') ? 'inspection' :
                        notif.message?.toLowerCase().includes('inspection') ? 'inspection' :
                        notif.type === 'urgent' ? 'general' : 
                        notif.type === 'warning' ? 'general' : 'general'),
              // Set priority based on type
              priority: notif.priority || 
                       (notif.type === 'urgent' ? 2 : 
                        notif.type === 'warning' ? 3 : 
                        notif.type === 'inspection' ? 3 : 5) // Normal priority for general notifications
            };
            
            if (notif.type === 'inspection' || mappedNotif.category === 'inspection') {
              console.log('🔍 Found inspection notification:', {
                id: mappedNotif.id,
                title: mappedNotif.title,
                type: mappedNotif.type,
                category: mappedNotif.category,
                original_category: notif.category
              });
            }
            
            return mappedNotif;
          });
          
          allNotifications = generalNotifications;
          console.log('📊 Notification categories:', {
            inspection: generalNotifications.filter((n: any) => n.category === 'inspection').length,
            general: generalNotifications.filter((n: any) => n.category === 'general').length,
            total: generalNotifications.length
          });
        }

        // Add inspection-specific notifications if available
        if (inspectionData.success && inspectionData.inspections) {
          const inspectionNotifications = inspectionData.inspections
            .filter((inspection: any) => inspection.needs_attention || inspection.status === 'pending')
            .map((inspection: any) => ({
              id: `inspection_${inspection.id}_${Date.now()}`,
              title: `Inspection Required: ${inspection.bus_registration}`,
              message: `Bus ${inspection.bus_registration} requires inspection. ${inspection.notes || 'Please complete the inspection as soon as possible.'}`,
              type: 'inspection',
              category: 'inspection',
              read: false,
              created_at: inspection.created_at || new Date().toISOString(),
              inspection_id: inspection.id,
              bus_registration: inspection.bus_registration,
              priority: 3
            }));
          
          allNotifications.push(...inspectionNotifications);
          console.log('Inspection-specific notifications added:', inspectionNotifications.length);
        }

        // Create scheduling notifications from statistics
        if (schedulingData.success && schedulingData.stats) {
          const stats = schedulingData.stats;
          
          // Create critical overdue notification (highest priority)
          if (stats.critical_overdue_count > 0) {
            allNotifications.push({
              id: `critical_overdue_${Date.now()}`,
              title: 'Critical Overdue Services',
              message: `You have ${stats.critical_overdue_count} critical overdue service${stats.critical_overdue_count > 1 ? 's' : ''} that require immediate attention.`,
              type: 'critical_overdue',
              category: 'scheduling',
              read: false,
              created_at: new Date().toISOString(),
              schedule_id: null,
              priority: 1
            });
          }

          // Create overdue notification (high priority)
          if (stats.overdue_count > 0) {
            allNotifications.push({
              id: `overdue_${Date.now()}`,
              title: 'Overdue Services',
              message: `You have ${stats.overdue_count} overdue service${stats.overdue_count > 1 ? 's' : ''} that need to be addressed.`,
              type: 'overdue',
              category: 'scheduling',
              read: false,
              created_at: new Date().toISOString(),
              schedule_id: null,
              priority: 2
            });
          }

          // Create due today notification (high priority)
          if (stats.due_today_count > 0) {
            allNotifications.push({
              id: `due_today_${Date.now()}`,
              title: 'Services Due Today',
              message: `You have ${stats.due_today_count} service${stats.due_today_count > 1 ? 's' : ''} scheduled for today that need attention.`,
              type: 'due_today',
              category: 'scheduling',
              read: false,
              created_at: new Date().toISOString(),
              schedule_id: null,
              priority: 3
            });
          }

          // Create upcoming services notification (normal priority)
          if (stats.upcoming_count > 0) {
            allNotifications.push({
              id: `upcoming_${Date.now()}`,
              title: 'Upcoming Services',
              message: `You have ${stats.upcoming_count} service${stats.upcoming_count > 1 ? 's' : ''} scheduled for the next 7 days.`,
              type: 'schedule',
              category: 'scheduling',
              read: false,
              created_at: new Date().toISOString(),
              schedule_id: null,
              priority: 4
            });
          }
        }

        const sortedNotifications = allNotifications.sort((a: Notification, b: Notification) => {
          // Sort by priority first (1 = highest priority)
          const priorityA = a.priority || 999;
          const priorityB = b.priority || 999;
          
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          
          // Then sort by read status (unread first)
          if (a.read !== b.read) {
            return a.read ? 1 : -1;
          }
          
          // Finally sort by creation time (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        console.log('🎯 Final notification summary:', {
          total: sortedNotifications.length,
          byCategory: {
            inspection: sortedNotifications.filter((n: Notification) => n.category === 'inspection').length,
            scheduling: sortedNotifications.filter((n: Notification) => n.category === 'scheduling').length,
            maintenance: sortedNotifications.filter((n: Notification) => n.category === 'maintenance').length,
            general: sortedNotifications.filter((n: Notification) => n.category === 'general').length,
            uncategorized: sortedNotifications.filter((n: Notification) => !n.category).length
          }
        });

        setNotifications(sortedNotifications);
      } catch (err: any) {
        console.error('Error fetching notifications:', err);
        setError(err.message || 'Failed to load notifications');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [context?.token]);

  // Mark notification as read
  const markAsRead = async (notificationId: number | string) => {
    try {
      // Skip API call for generated notifications (string IDs)
      if (typeof notificationId === 'string') {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        // Refresh navbar notification count
        if ((window as any).refreshNotificationCount) {
          (window as any).refreshNotificationCount();
        }
        return;
      }

      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        // Refresh navbar notification count
        if ((window as any).refreshNotificationCount) {
          (window as any).refreshNotificationCount();
        }
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        // Refresh navbar notification count
        if ((window as any).refreshNotificationCount) {
          (window as any).refreshNotificationCount();
        }
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: number | string) => {
    try {
      // For generated notifications (string IDs), just remove from state
      if (typeof notificationId === 'string') {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        // Refresh navbar notification count
        if ((window as any).refreshNotificationCount) {
          (window as any).refreshNotificationCount();
        }
        return;
      }

      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        // Refresh navbar notification count
        if ((window as any).refreshNotificationCount) {
          (window as any).refreshNotificationCount();
        }
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inspection':
        return <FaExclamationTriangle className="text-blue-500" />;
      case 'urgent':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'critical_overdue':
        return <FaExclamationCircle className="text-red-600" />;
      case 'overdue':
        return <FaExclamationTriangle className="text-orange-500" />;
      case 'due_today':
        return <FaClock className="text-yellow-600" />;
      case 'schedule':
        return <FaCalendarAlt className="text-blue-500" />;
      case 'maintenance':
        return <FaWrench className="text-purple-500" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      case 'info':
        return <FaBell className="text-blue-400" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    // Filter by read/unread status
    let passesStatusFilter = true;
    if (filter === 'unread') passesStatusFilter = !notification.read;
    if (filter === 'read') passesStatusFilter = notification.read;
    
    // Filter by category
    let passesCategoryFilter = true;
    if (categoryFilter !== 'all') {
      passesCategoryFilter = notification.category === categoryFilter;
    }
    
    return passesStatusFilter && passesCategoryFilter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading notifications...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Notifications</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
              <p className="text-gray-600">
                {unreadCount > 0 
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All notifications are read'
                }
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'unread', label: 'Unread', count: unreadCount },
                { key: 'read', label: 'Read', count: notifications.length - unreadCount }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Category</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Categories', icon: FaBell },
                { key: 'inspection', label: 'Inspections', icon: FaExclamationTriangle },
                { key: 'scheduling', label: 'Scheduling', icon: FaCalendarAlt },
                { key: 'maintenance', label: 'Maintenance', icon: FaWrench },
                { key: 'general', label: 'General', icon: FaBell }
              ].map(category => {
                const categoryCount = category.key === 'all' 
                  ? notifications.length 
                  : notifications.filter(n => n.category === category.key).length;
                
                return (
                  <button
                    key={category.key}
                    onClick={() => setCategoryFilter(category.key)}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      categoryFilter === category.key
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <category.icon className="mr-2 h-4 w-4" />
                    {category.label} ({categoryCount})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border-l-4 p-6 ${
                  notification.read 
                    ? 'border-gray-300' 
                    : notification.type === 'critical_overdue' 
                      ? 'border-red-600 bg-red-50'
                      : notification.type === 'urgent' 
                        ? 'border-red-500 bg-red-50'
                        : notification.type === 'overdue'
                          ? 'border-orange-500 bg-orange-50'
                          : notification.type === 'due_today'
                            ? 'border-yellow-600 bg-yellow-50'
                            : notification.type === 'warning'
                              ? 'border-yellow-500 bg-yellow-50'
                              : notification.type === 'success'
                                ? 'border-green-500 bg-green-50'
                                : notification.type === 'schedule'
                                  ? 'border-blue-500 bg-blue-50'
                                  : notification.type === 'maintenance'
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-medium ${notification.read ? 'text-gray-900' : 'text-blue-900'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                        {(notification.type === 'critical_overdue' || notification.type === 'overdue' || notification.type === 'due_today') && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            notification.type === 'critical_overdue' 
                              ? 'bg-red-100 text-red-800'
                              : notification.type === 'overdue'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {notification.type === 'critical_overdue' ? 'URGENT' : 
                             notification.type === 'overdue' ? 'HIGH PRIORITY' : 
                             'DUE TODAY'}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-2">{notification.message}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <FaClock className="mr-1" />
                          {new Date(notification.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {notification.assigned_by && (
                          <span>Assigned by: {notification.assigned_by}</span>
                        )}
                        {notification.bus_registration && (
                          <span>Bus: {notification.bus_registration}</span>
                        )}
                        {notification.category && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            notification.category === 'scheduling' 
                              ? 'bg-blue-100 text-blue-800'
                              : notification.category === 'inspection'
                                ? 'bg-yellow-100 text-yellow-800'
                                : notification.category === 'maintenance'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}>
                            {notification.category.charAt(0).toUpperCase() + notification.category.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete notification"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FaBell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">
                {filter === 'unread' 
                  ? "You don't have any unread notifications."
                  : filter === 'read'
                  ? "You don't have any read notifications."
                  : "You don't have any notifications yet."
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
