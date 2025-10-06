import React, { useState, useEffect, useContext } from 'react';
import { 
  FaBell, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaInfoCircle,
  FaEye,
  FaEyeSlash,
  FaTrash,
  FaFilter,
  FaSearch,
  FaClock,
  FaUser,
  FaMapMarkerAlt,
  FaTimes
} from 'react-icons/fa';
import { HiRefresh } from 'react-icons/hi';
import { AppContext } from '../../../context/AppContext';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  depot_name?: string;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
}

const RTONotifications: React.FC = () => {
  const context = useContext(AppContext);
  const token = context?.token;

  // State management
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // UI states
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    high_priority: 0,
    recent: 0
  });

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [notifications, searchTerm, typeFilter, statusFilter, priorityFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      if (!token) throw new Error('No authentication token found');

      console.log('Fetching notifications with token:', token); // Debug log

      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status); // Debug log

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data); // Debug log
        
        if (data.success) {
          const notificationsData = data.notifications || [];
          setNotifications(notificationsData);
          
          // Calculate statistics
          const now = new Date();
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          
          setStats({
            total: notificationsData.length,
            unread: notificationsData.filter((n: Notification) => !n.is_read).length,
            high_priority: notificationsData.filter((n: Notification) => n.priority === 'high').length,
            recent: notificationsData.filter((n: Notification) => new Date(n.created_at) > oneDayAgo).length
          });
        } else {
          console.log('API returned success: false', data);
          // Use fallback data if API returns no data
          const fallbackNotifications = [
            {
              id: 1,
              title: 'Bus Breakdown Alert',
              message: 'Bus WP-2001 has reported a mechanical failure at Colombo Depot. Immediate attention required.',
              type: 'error' as const,
              is_read: false,
              created_at: new Date().toISOString(),
              sender_name: 'Depot Engineer',
              depot_name: 'Colombo Depot',
              priority: 'high' as const
            },
            {
              id: 2,
              title: 'Inspection Completed',
              message: 'Monthly safety inspection completed for Fleet Section A. All buses passed inspection.',
              type: 'success' as const,
              is_read: false,
              created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              sender_name: 'Safety Inspector',
              depot_name: 'Gampaha Depot',
              priority: 'medium' as const
            },
            {
              id: 3,
              title: 'Maintenance Schedule Update',
              message: 'Scheduled maintenance for Route 120 buses has been rescheduled to next week due to parts availability.',
              type: 'warning' as const,
              is_read: true,
              created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
              sender_name: 'Maintenance Supervisor',
              depot_name: 'Colombo Depot',
              priority: 'low' as const
            }
          ];
          
          setNotifications(fallbackNotifications);
          setStats({
            total: fallbackNotifications.length,
            unread: fallbackNotifications.filter(n => !n.is_read).length,
            high_priority: fallbackNotifications.filter(n => n.priority === 'high').length,
            recent: fallbackNotifications.length
          });
        }
      } else {
        console.log('API request failed with status:', response.status);
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Using demo data.');
      
      // Use fallback data on error
      const fallbackNotifications = [
        {
          id: 1,
          title: 'Bus Breakdown Alert',
          message: 'Bus WP-2001 has reported a mechanical failure at Colombo Depot. Immediate attention required.',
          type: 'error' as const,
          is_read: false,
          created_at: new Date().toISOString(),
          sender_name: 'Depot Engineer',
          depot_name: 'Colombo Depot',
          priority: 'high' as const
        },
        {
          id: 2,
          title: 'Inspection Completed',
          message: 'Monthly safety inspection completed for Fleet Section A. All buses passed inspection.',
          type: 'success' as const,
          is_read: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sender_name: 'Safety Inspector',
          depot_name: 'Gampaha Depot',
          priority: 'medium' as const
        },
        {
          id: 3,
          title: 'Maintenance Schedule Update',
          message: 'Scheduled maintenance for Route 120 buses has been rescheduled to next week due to parts availability.',
          type: 'warning' as const,
          is_read: true,
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          sender_name: 'Maintenance Supervisor',
          depot_name: 'Colombo Depot',
          priority: 'low' as const
        },
        {
          id: 4,
          title: 'Daily Report',
          message: 'Daily operational report for Western Region is now available for review.',
          type: 'info' as const,
          is_read: true,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          sender_name: 'Operations Manager',
          depot_name: 'Regional Office',
          priority: 'low' as const
        }
      ];
      
      setNotifications(fallbackNotifications);
      setStats({
        total: fallbackNotifications.length,
        unread: fallbackNotifications.filter(n => !n.is_read).length,
        high_priority: fallbackNotifications.filter(n => n.priority === 'high').length,
        recent: fallbackNotifications.filter(n => new Date(n.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.depot_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(notification => notification.type === typeFilter);
    }

    // Status filter
    if (statusFilter === 'read') {
      filtered = filtered.filter(notification => notification.is_read);
    } else if (statusFilter === 'unread') {
      filtered = filtered.filter(notification => !notification.is_read);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(notification => notification.priority === priorityFilter);
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId: number) => {
    try {
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        ));
        setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAsUnread = async (notificationId: number) => {
    try {
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/unread`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: false }
            : notification
        ));
        setStats(prev => ({ ...prev, unread: prev.unread + 1 }));
      }
    } catch (err) {
      console.error('Error marking notification as unread:', err);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const deletedNotification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
          unread: deletedNotification && !deletedNotification.is_read ? prev.unread - 1 : prev.unread
        }));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(notification => ({ ...notification, is_read: true })));
        setStats(prev => ({ ...prev, unread: 0 }));
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleBulkAction = async (action: 'read' | 'unread' | 'delete') => {
    if (selectedNotifications.length === 0) return;

    try {
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/notifications/bulk-${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notification_ids: selectedNotifications })
      });

      if (response.ok) {
        if (action === 'delete') {
          setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
        } else {
          setNotifications(prev => prev.map(notification => 
            selectedNotifications.includes(notification.id)
              ? { ...notification, is_read: action === 'read' }
              : notification
          ));
        }
        setSelectedNotifications([]);
        fetchNotifications(); // Refresh to update stats
      }
    } catch (err) {
      console.error(`Error performing bulk ${action}:`, err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <FaExclamationTriangle className="text-yellow-500" />;
      case 'error': return <FaExclamationTriangle className="text-red-500" />;
      case 'success': return <FaCheckCircle className="text-green-500" />;
      default: return <FaInfoCircle className="text-blue-500" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading notifications...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <FaExclamationTriangle className="text-red-400 mt-1" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Notifications</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button 
                  onClick={fetchNotifications} 
                  className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaBell className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RTO Notifications</h1>
                <p className="text-gray-600">Manage your notifications and alerts</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchNotifications}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <HiRefresh className="w-4 h-4 mr-2" />
                Refresh
              </button>
              {stats.unread > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaCheckCircle className="w-4 h-4 mr-2" />
                  Mark All Read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Notifications</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FaBell className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-3xl font-bold text-gray-900">{stats.unread}</p>
              </div>
              <FaEyeSlash className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-3xl font-bold text-gray-900">{stats.high_priority}</p>
              </div>
              <FaExclamationTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recent (24h)</p>
                <p className="text-3xl font-bold text-gray-900">{stats.recent}</p>
              </div>
              <FaClock className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filter & Search</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FaFilter className="w-4 h-4 mr-2" />
                Filters
              </button>
              <button
                onClick={clearFilters}
                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FaTimes className="w-4 h-4 mr-2" />
                Clear
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications by title, message, sender, or depot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="success">Success</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedNotifications.length} notification(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('read')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Mark Read
                </button>
                <button
                  onClick={() => handleBulkAction('unread')}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                >
                  Mark Unread
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNotifications(prev => [...prev, notification.id]);
                        } else {
                          setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                        }
                      }}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />

                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`text-lg font-medium ${
                              !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {notification.title}
                            </h3>
                            {notification.priority && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                                {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-600 mb-3 leading-relaxed">
                            {notification.message}
                          </p>

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <FaClock className="w-4 h-4 mr-1" />
                              {formatTimeAgo(notification.created_at)}
                            </div>
                            {notification.sender_name && (
                              <div className="flex items-center">
                                <FaUser className="w-4 h-4 mr-1" />
                                {notification.sender_name}
                              </div>
                            )}
                            {notification.depot_name && (
                              <div className="flex items-center">
                                <FaMapMarkerAlt className="w-4 h-4 mr-1" />
                                {notification.depot_name}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2 ml-4">
                          {!notification.is_read ? (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => markAsUnread(notification.id)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Mark as unread"
                            >
                              <FaEyeSlash className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete notification"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <FaBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'You have no notifications at the moment'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RTONotifications;