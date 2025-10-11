import React, { useState, useEffect, useContext } from 'react';
import { 
  FaBell, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaInfoCircle,
  FaEye,
  FaEyeSlash,
  FaClock,
  FaUser,
  FaMapMarkerAlt,
  FaTimes
} from 'react-icons/fa';
import { HiRefresh } from 'react-icons/hi';
import { AppContext } from '../../../context/AppContext';

interface Notification {
  id: number | string;
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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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
  }, [notifications, categoryFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      if (!token) throw new Error('No authentication token found');

      console.log('Fetching notifications with token:', token);

      // Fetch regular notifications
      const notificationsResponse = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch emergency reports from RTO Issue Tracker
      const emergencyReportsResponse = await fetch('http://localhost:5000/api/rto', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch ALL inspections from main table (we'll filter for scheduled/pending only)
      const inspectionsResponse = await fetch('http://localhost:5000/api/inspections', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Notifications response status:', notificationsResponse.status);
      console.log('Emergency reports response status:', emergencyReportsResponse.status);
      console.log('Inspections response status:', inspectionsResponse.status);

      let allNotifications: Notification[] = [];

      // Process regular notifications
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        console.log('Notifications data:', notificationsData);
        
        if (notificationsData.success && notificationsData.notifications) {
          console.log('Found regular notifications:', notificationsData.notifications.length);
          allNotifications = [...(notificationsData.notifications || [])];
        } else {
          console.log('No regular notifications found or API returned success: false');
        }
      } else {
        console.log('Regular notifications API failed with status:', notificationsResponse.status);
      }

      // Process emergency reports and convert to notifications
      if (emergencyReportsResponse.ok) {
        const emergencyData = await emergencyReportsResponse.json();
        console.log('Emergency reports data:', emergencyData);
        
        if (emergencyData.success && emergencyData.data) {
          console.log('Found emergency reports:', emergencyData.data.length);
          const emergencyNotifications = emergencyData.data.map((report: any) => ({
            id: `emergency_${report.id}`, // Prefix to avoid ID conflicts
            title: `Emergency Report: ${report.incident_type}`,
            message: `${report.description}. Bus: ${report.bus_number || 'N/A'}, Route: ${report.route_number || 'N/A'}, Location: ${report.location || 'Unknown'}. Reported by: ${report.reported_by || 'Unknown'}`,
            type: getPriorityType(report.severity_level),
            is_read: false, // Emergency reports are always unread initially
            created_at: report.created_at || new Date().toISOString(),
            sender_name: report.reported_by || 'Emergency Reporter',
            depot_name: report.depot_name || 'Field Report',
            priority: mapSeverityToPriority(report.severity_level),
            category: 'emergency_report'
          }));

          console.log('Created emergency notifications:', emergencyNotifications.length);
          allNotifications = [...allNotifications, ...emergencyNotifications];
        } else {
          console.log('No emergency reports found or API returned success: false');
        }
      } else {
        console.log('Emergency reports API failed with status:', emergencyReportsResponse.status);
      }

      // Process inspection notifications from main inspections table
      let allInspectionNotifications: any[] = [];

      // Process main inspections table and filter for scheduled/pending only
      if (inspectionsResponse.ok) {
        const inspectionsData = await inspectionsResponse.json();
        console.log('Inspections data:', inspectionsData);
        console.log('Inspections data structure:', {
          success: inspectionsData.success,
          inspections: inspectionsData.inspections,
          data: inspectionsData.data,
          keys: Object.keys(inspectionsData)
        });
        
        // Try different possible response structures
        let inspectionsArray = null;
        if (inspectionsData.success && inspectionsData.inspections) {
          inspectionsArray = inspectionsData.inspections;
          console.log('Found inspections via .inspections:', inspectionsArray.length);
        } else if (inspectionsData.success && inspectionsData.data) {
          inspectionsArray = inspectionsData.data;
          console.log('Found inspections via .data:', inspectionsArray.length);
        } else if (Array.isArray(inspectionsData.inspections)) {
          inspectionsArray = inspectionsData.inspections;
          console.log('Found inspections directly in .inspections:', inspectionsArray.length);
        } else if (Array.isArray(inspectionsData.data)) {
          inspectionsArray = inspectionsData.data;
          console.log('Found inspections directly in .data:', inspectionsArray.length);
        } else if (Array.isArray(inspectionsData)) {
          inspectionsArray = inspectionsData;
          console.log('Found inspections as direct array:', inspectionsArray.length);
        }
        
        if (inspectionsArray && inspectionsArray.length > 0) {
          // Filter for ONLY scheduled and pending inspections (exclude completed)
          const pendingScheduledInspections = inspectionsArray.filter((inspection: any) => {
            const status = inspection.status?.toLowerCase();
            const isScheduledOrPending = status === 'scheduled' || status === 'pending';
            console.log(`Inspection ID: ${inspection.id}, Status: ${status}, IsScheduledOrPending: ${isScheduledOrPending}`);
            return isScheduledOrPending;
          });
          
          console.log('Filtered scheduled/pending inspections:', pendingScheduledInspections.length);
          console.log('Scheduled/pending inspections data:', pendingScheduledInspections);
          
          allInspectionNotifications = [...pendingScheduledInspections];
        } else {
          console.log('No inspections found - checking response structure:', inspectionsData);
        }
      } else {
        console.log('Inspections API failed with status:', inspectionsResponse.status);
      }

      console.log('Total inspection notifications to process:', allInspectionNotifications.length);

      // Convert all inspection data to notifications (only pending inspections)
      if (allInspectionNotifications.length > 0) {
        console.log('Processing inspection notifications:', allInspectionNotifications.length);
        console.log('All inspection data:', allInspectionNotifications);
        
        // Filter for only pending inspections and log details
        const pendingInspections = allInspectionNotifications.filter((inspection: any) => {
          const status = inspection.status?.toLowerCase();
          const isPending = status === 'pending' || status === 'scheduled';
          console.log(`Inspection ID: ${inspection.id}, Status: ${status}, IsPending: ${isPending}`);
          return isPending;
        });
        
        console.log('Filtered pending inspections:', pendingInspections.length);
        console.log('Pending inspections data:', pendingInspections);
        
        if (pendingInspections.length > 0) {
          const inspectionNotifications = pendingInspections.map((inspection: any) => {
            const inspectionDate = new Date(inspection.date);
            const currentDate = new Date();
            const isUpcoming = inspectionDate > currentDate;
            
            let title, message, type, priority;
            
            if (isUpcoming) {
              const daysUntil = Math.ceil((inspectionDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
              title = `Scheduled Inspection: ${inspection.inspection_type}`;
              
              if (daysUntil <= 1) {
                message = `${inspection.inspection_type} inspection is scheduled for tomorrow at ${inspection.depot_name || 'Unknown Depot'}. Time: ${inspection.time || 'N/A'}. Please ensure all preparations are complete.`;
                priority = 'high';
              } else if (daysUntil <= 3) {
                message = `${inspection.inspection_type} inspection is scheduled in ${daysUntil} days at ${inspection.depot_name || 'Unknown Depot'}. Date: ${inspectionDate.toLocaleDateString()} at ${inspection.time || 'N/A'}.`;
                priority = 'medium';
              } else {
                message = `${inspection.inspection_type} inspection is scheduled for ${inspectionDate.toLocaleDateString()} at ${inspection.depot_name || 'Unknown Depot'}. Time: ${inspection.time || 'N/A'}.`;
                priority = 'low';
              }
              type = 'info';
            } else {
              // Overdue inspection
              title = `Overdue Inspection: ${inspection.inspection_type}`;
              message = `${inspection.inspection_type} inspection at ${inspection.depot_name || 'Unknown Depot'} is overdue. Scheduled date was: ${inspectionDate.toLocaleDateString()} at ${inspection.time || 'N/A'}. Immediate action required.`;
              type = 'error';
              priority = 'high';
            }

            console.log(`Creating notification for inspection ID: ${inspection.id}, Title: ${title}`);

            return {
              id: `inspection_${inspection.id}`,
              title,
              message,
              type: type as 'info' | 'warning' | 'error' | 'success',
              is_read: false,
              created_at: inspection.created_at || inspection.scheduled_at || inspection.date || new Date().toISOString(),
              sender_name: inspection.inspector_name || inspection.scheduled_by || 'Inspection System',
              depot_name: inspection.depot_name || 'Unknown Depot',
              priority: priority as 'high' | 'medium' | 'low',
              category: 'inspection'
            };
          });

          console.log('Created inspection notifications:', inspectionNotifications.length);
          console.log('Inspection notifications:', inspectionNotifications);
          allNotifications = [...allNotifications, ...inspectionNotifications];
        } else {
          console.log('No pending inspection notifications to create');
        }
      } else {
        console.log('No inspection notifications to create');
      }

      console.log('Total notifications before fallback:', allNotifications.length);

      // Sort notifications by created_at (newest first)
      allNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('Final notifications count:', allNotifications.length);
      console.log('Final notifications sample:', allNotifications.slice(0, 3));

      if (allNotifications.length > 0) {
        console.log('Setting notifications to state');
        setNotifications(allNotifications);
        
        // Calculate statistics
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const statsData = {
          total: allNotifications.length,
          unread: allNotifications.filter((n: Notification) => !n.is_read).length,
          high_priority: 0, // Remove high priority count as requested
          recent: allNotifications.filter((n: Notification) => new Date(n.created_at) > oneDayAgo).length
        };
        
        console.log('Setting stats:', statsData);
        setStats(statsData);
      } else {
        console.log('No notifications found, using comprehensive fallback data');
        // Use comprehensive fallback data with all types of notifications
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
            priority: 'high' as const,
            category: 'maintenance'
          },
          {
            id: 2,
            title: 'Emergency Report: Accident',
            message: 'Minor collision reported on Route 120. Bus NC-5432, Location: Galle Road Junction. No injuries reported. Reported by: Driver John Silva',
            type: 'error' as const,
            is_read: false,
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            sender_name: 'Driver John Silva',
            depot_name: 'Field Report',
            priority: 'high' as const,
            category: 'emergency_report'
          },
          {
            id: 3,
            title: 'Inspection Completed: Safety Inspection',
            message: 'Safety inspection has been completed at Gampaha Depot. Date: ' + new Date().toLocaleDateString() + '. All buses passed inspection successfully. Inspector: Mr. Kamal Silva',
            type: 'success' as const,
            is_read: false,
            created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            sender_name: 'Mr. Kamal Silva',
            depot_name: 'Gampaha Depot',
            priority: 'medium' as const,
            category: 'inspection'
          },
          {
            id: 4,
            title: 'Emergency Report: Medical',
            message: 'Medical emergency reported. Bus WP-7890, Route: 138, Location: Kandy Bus Stand. Ambulance called. Reported by: Conductor Mary Fernando',
            type: 'warning' as const,
            is_read: false,
            created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            sender_name: 'Conductor Mary Fernando',
            depot_name: 'Field Report',
            priority: 'high' as const,
            category: 'emergency_report'
          },
          {
            id: 5,
            title: 'Upcoming Inspection: Maintenance Check',
            message: 'Maintenance Check inspection is scheduled at Kurunegala Depot. Date: ' + new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString() + ' at 09:00 AM. Please ensure all preparations are complete.',
            type: 'info' as const,
            is_read: false,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            sender_name: 'Inspection System',
            depot_name: 'Kurunegala Depot',
            priority: 'medium' as const,
            category: 'inspection'
          },
          {
            id: 6,
            title: 'Emergency Report: Breakdown',
            message: 'Engine failure reported. Bus KA-1234, Route: 245, Location: Kurunegala Main Road. Bus stopped, passengers transferred. Reported by: Driver Sunil Perera',
            type: 'error' as const,
            is_read: true,
            created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            sender_name: 'Driver Sunil Perera',
            depot_name: 'Field Report',
            priority: 'medium' as const,
            category: 'emergency_report'
          },
          {
            id: 7,
            title: 'Overdue Inspection: Annual Inspection',
            message: 'Annual Inspection at Ratnapura Depot is overdue. Scheduled date was: ' + new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString() + ' at 10:00 AM. Immediate action required.',
            type: 'error' as const,
            is_read: false,
            created_at: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
            sender_name: 'Inspection System',
            depot_name: 'Ratnapura Depot',
            priority: 'high' as const,
            category: 'inspection'
          },
          {
            id: 8,
            title: 'Emergency Report: Fire',
            message: 'Fire hazard reported. Bus CP-9876, Route: 100, Location: Pettah Bus Stand. Fire department notified. Reported by: Station Master',
            type: 'error' as const,
            is_read: true,
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            sender_name: 'Station Master',
            depot_name: 'Field Report',
            priority: 'high' as const,
            category: 'emergency_report'
          },
          {
            id: 9,
            title: 'Inspection Completed: Technical Inspection',
            message: 'Technical inspection has been completed at Kandy Depot. Date: ' + new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString() + '. 3 buses require minor repairs. Inspector: Ms. Sanduni Perera',
            type: 'warning' as const,
            is_read: true,
            created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            sender_name: 'Ms. Sanduni Perera',
            depot_name: 'Kandy Depot',
            priority: 'medium' as const,
            category: 'inspection'
          }
        ];
        
        setNotifications(fallbackNotifications);
        setStats({
          total: fallbackNotifications.length,
          unread: fallbackNotifications.filter(n => !n.is_read).length,
          high_priority: fallbackNotifications.filter(n => n.priority === 'high').length,
          recent: fallbackNotifications.filter(n => new Date(n.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length
        });
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Using demo data.');
      
      // Use comprehensive fallback data with all types on error
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
          priority: 'high' as const,
          category: 'maintenance'
        },
        {
          id: 2,
          title: 'Emergency Report: Accident',
          message: 'Minor collision reported on Route 120. Bus NC-5432, Location: Galle Road Junction. No injuries reported. Reported by: Driver John Silva',
          type: 'error' as const,
          is_read: false,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          sender_name: 'Driver John Silva',
          depot_name: 'Field Report',
          priority: 'high' as const,
          category: 'emergency_report'
        },
        {
          id: 3,
          title: 'Inspection Completed: Safety Inspection',
          message: 'Safety inspection has been completed at Gampaha Depot. Date: ' + new Date().toLocaleDateString() + '. All buses passed inspection successfully. Inspector: Mr. Kamal Silva',
          type: 'success' as const,
          is_read: false,
          created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          sender_name: 'Mr. Kamal Silva',
          depot_name: 'Gampaha Depot',
          priority: 'medium' as const,
          category: 'inspection'
        },
        {
          id: 4,
          title: 'Upcoming Inspection: Maintenance Check',
          message: 'Maintenance Check inspection is scheduled at Kurunegala Depot. Date: ' + new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString() + ' at 09:00 AM. Please ensure all preparations are complete.',
          type: 'info' as const,
          is_read: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sender_name: 'Inspection System',
          depot_name: 'Kurunegala Depot',
          priority: 'medium' as const,
          category: 'inspection'
        },
        {
          id: 5,
          title: 'Overdue Inspection: Annual Inspection',
          message: 'Annual Inspection at Ratnapura Depot is overdue. Scheduled date was: ' + new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString() + ' at 10:00 AM. Immediate action required.',
          type: 'error' as const,
          is_read: false,
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          sender_name: 'Inspection System',
          depot_name: 'Ratnapura Depot',
          priority: 'high' as const,
          category: 'inspection'
        },
        {
          id: 6,
          title: 'Emergency Report: Fire',
          message: 'Fire hazard reported. Bus CP-9876, Route: 100, Location: Pettah Bus Stand. Fire department notified. Reported by: Station Master',
          type: 'error' as const,
          is_read: true,
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          sender_name: 'Station Master',
          depot_name: 'Field Report',
          priority: 'high' as const,
          category: 'emergency_report'
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

  // Helper function to map severity levels to notification types
  const getPriorityType = (severityLevel: string): 'info' | 'warning' | 'error' | 'success' => {
    switch (severityLevel?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'warning';
    }
  };

  // Helper function to map severity levels to priority
  const mapSeverityToPriority = (severityLevel: string): 'high' | 'medium' | 'low' => {
    switch (severityLevel?.toLowerCase()) {
      case 'critical':
        return 'high';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(notification => notification.category === categoryFilter);
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId: number | string) => {
    try {
      if (!token) return;

      // Update locally first for immediate feedback
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true }
          : notification
      ));
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));

      // Only try to update via API if it's a regular notification (not inspection or emergency)
      if (typeof notificationId === 'number' || (typeof notificationId === 'string' && !notificationId.includes('_'))) {
        const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.warn('Failed to update notification via API, but local update succeeded');
        }
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAsUnread = async (notificationId: number | string) => {
    try {
      if (!token) return;

      // Update locally first for immediate feedback
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: false }
          : notification
      ));
      setStats(prev => ({ ...prev, unread: prev.unread + 1 }));

      // Only try to update via API if it's a regular notification (not inspection or emergency)
      if (typeof notificationId === 'number' || (typeof notificationId === 'string' && !notificationId.includes('_'))) {
        const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/unread`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.warn('Failed to update notification via API, but local update succeeded');
        }
      }
    } catch (err) {
      console.error('Error marking notification as unread:', err);
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
    setCategoryFilter('all');
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
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filter by Category</h2>
            <button
              onClick={clearFilters}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FaTimes className="w-4 h-4 mr-2" />
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="emergency_report">Emergency Reports</option>
                <option value="inspection">Inspections</option>
                <option value="maintenance">Maintenance</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
        </div>

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
                {categoryFilter !== 'all'
                  ? 'Try adjusting your category filter'
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