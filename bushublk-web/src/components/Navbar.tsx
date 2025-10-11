import React, { useState, useContext, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { HiBell, HiSearch } from 'react-icons/hi'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showMenu, setShowMenu] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  
  // Get authentication state from context (you'll need to add this to your AppContext)
  // const { user, token, logout } = useContext(AppContext)
  
  // For now, using local state - replace with context values
  const { user, token, logout } = useContext(AppContext);

  // Check if we're in a dashboard route
  const isDashboard = location.pathname.startsWith('/admin') || 
                     location.pathname.startsWith('/depot-manager') ||
                     location.pathname.startsWith('/depot-operations-manager') ||
                     location.pathname.startsWith('/depot-engineer') ||
                     location.pathname.startsWith('/regional-technical-officer') ||
                     location.pathname.startsWith('/regional-operations-officer') ||
                     location.pathname.startsWith('/dgm-technical') ||
                     location.pathname.startsWith('/dgm-operations') ||
                     location.pathname.startsWith('/ceo') ||
                     location.pathname.startsWith('/driver') || 
                     location.pathname.startsWith('/conductor')

  // Fetch notification count function
  const fetchNotificationCount = async () => {
    if (token && isDashboard) {
      try {
        const requests = [
          fetch('http://localhost:5000/api/notifications/unread-count', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ];

        // Add scheduling stats request only for depot engineers
        if (user?.role === 'depot_engineer' || user?.role === 'depot-engineer') {
          requests.push(
            fetch('http://localhost:5000/api/depot-engineer/service-schedules/stats', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
          );
          
          // Add bus condition reports count
          requests.push(
            fetch('http://localhost:5000/api/bus-condition-reports', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
          );
          
          // Add emergency reports count
          requests.push(
            fetch('http://localhost:5000/api/depot/emergency', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
          );
        }

        // Add emergency reports count for RTO
        if (user?.role === 'regional-technical-officer' || user?.role === 'regional_tech') {
          requests.push(
            fetch('http://localhost:5000/api/rto', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
          );
          
          // Add inspections count for RTO
          requests.push(
            fetch('http://localhost:5000/api/inspections', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
          );
        }

        const responses = await Promise.all(requests);
        let totalUnreadCount = 0;
        
        // Add general notification count
        if (responses[0] && responses[0].ok) {
          const generalData = await responses[0].json();
          const generalCount = generalData.unreadCount || 0;
          totalUnreadCount += generalCount;
          console.log('General notifications count:', generalCount);
        }
        
        // Add scheduling notification count (only for depot engineers)
        if (responses[1] && responses[1].ok && (user?.role === 'depot_engineer' || user?.role === 'depot-engineer')) {
          const schedulingData = await responses[1].json();
          if (schedulingData.success && schedulingData.stats) {
            const stats = schedulingData.stats;
            console.log('Scheduling stats:', stats);
            
            let schedulingCount = 0;
            // Count scheduling notifications that would be created
            if (stats.critical_overdue_count > 0) schedulingCount += 1;
            if (stats.overdue_count > 0) schedulingCount += 1;
            if (stats.due_today_count > 0) schedulingCount += 1;
            if (stats.upcoming_count > 0) schedulingCount += 1;
            
            totalUnreadCount += schedulingCount;
            console.log('Scheduling notifications count:', schedulingCount);
          }
        }
        
        // Add bus condition reports count (only for depot engineers)
        if (responses[2] && responses[2].ok && (user?.role === 'depot_engineer' || user?.role === 'depot-engineer')) {
          const conditionData = await responses[2].json();
          if (conditionData.success && conditionData.data) {
            // Count unreviewed condition reports only
            const conditionCount = conditionData.data.filter((report: any) => {
              return report.review_status === 'pending' || !report.review_status;
            }).length;
            
            totalUnreadCount += conditionCount;
            console.log('Condition reports notifications count:', conditionCount);
          }
        }
        
        // Add emergency reports count (only for depot engineers)
        if (responses[3] && responses[3].ok && (user?.role === 'depot_engineer' || user?.role === 'depot-engineer')) {
          const emergencyData = await responses[3].json();
          if (emergencyData.success && emergencyData.data) {
            // Count emergency reports with exactly "Pending" status
            const emergencyCount = emergencyData.data.filter((report: any) => {
              return report.status === 'Pending';
            }).length;
            
            totalUnreadCount += emergencyCount;
            console.log('Emergency reports notifications count:', emergencyCount);
          }
        }
        
        // Add emergency reports count for RTO
        if (user?.role === 'regional-technical-officer' || user?.role === 'regional_tech') {
          // Check for RTO emergency reports
          let rtoEmergencyIndex = -1;
          let rtoInspectionIndex = -1;
          
          if (user?.role === 'depot_engineer' || user?.role === 'depot-engineer') {
            // For depot engineers, RTO responses start at index 4
            rtoEmergencyIndex = responses.length >= 5 ? 4 : -1;
            rtoInspectionIndex = responses.length >= 6 ? 5 : -1;
          } else {
            // For RTO users, responses start at index 1
            rtoEmergencyIndex = responses.length >= 2 ? 1 : -1;
            rtoInspectionIndex = responses.length >= 3 ? 2 : -1;
          }
          
          // Process RTO emergency reports
          if (rtoEmergencyIndex !== -1 && responses[rtoEmergencyIndex] && responses[rtoEmergencyIndex].ok) {
            const rtoEmergencyData = await responses[rtoEmergencyIndex].json();
            if (rtoEmergencyData.success && rtoEmergencyData.data) {
              // Count unread emergency reports
              const rtoEmergencyCount = rtoEmergencyData.data.filter((report: any) => {
                return !report.is_read; // Assuming emergency reports have is_read field
              }).length;
              
              totalUnreadCount += rtoEmergencyCount;
              console.log('RTO emergency reports notifications count:', rtoEmergencyCount);
            }
          }
          
          // Process RTO inspections
          if (rtoInspectionIndex !== -1 && responses[rtoInspectionIndex] && responses[rtoInspectionIndex].ok) {
            const rtoInspectionData = await responses[rtoInspectionIndex].json();
            let inspectionsArray = null;
            
            // Handle different response structures
            if (rtoInspectionData.success && rtoInspectionData.inspections) {
              inspectionsArray = rtoInspectionData.inspections;
            } else if (rtoInspectionData.success && rtoInspectionData.data) {
              inspectionsArray = rtoInspectionData.data;
            } else if (Array.isArray(rtoInspectionData.inspections)) {
              inspectionsArray = rtoInspectionData.inspections;
            } else if (Array.isArray(rtoInspectionData.data)) {
              inspectionsArray = rtoInspectionData.data;
            } else if (Array.isArray(rtoInspectionData)) {
              inspectionsArray = rtoInspectionData;
            }
            
            if (inspectionsArray && inspectionsArray.length > 0) {
              // Count only pending/scheduled inspections
              const rtoInspectionCount = inspectionsArray.filter((inspection: any) => {
                const status = inspection.status?.toLowerCase();
                return status === 'pending' || status === 'scheduled';
              }).length;
              
              totalUnreadCount += rtoInspectionCount;
              console.log('RTO inspection notifications count:', rtoInspectionCount);
            }
          }
        }
        
        console.log('Total notification count:', totalUnreadCount);
        setNotificationCount(totalUnreadCount);
      } catch (error) {
        console.error('Error fetching notification count:', error);
        // Fallback to just general notifications
        try {
          const response = await fetch('http://localhost:5000/api/notifications/unread-count', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setNotificationCount(data.unreadCount || 0);
          }
        } catch (fallbackError) {
          console.error('Error fetching fallback notification count:', fallbackError);
        }
      }
    }
  };

  // Fetch notification count
  useEffect(() => {
    fetchNotificationCount();
    
    // Refresh notification count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    
    return () => clearInterval(interval);
  }, [token, isDashboard, user?.role]);

  // Handle notification click
  const handleNotificationClick = () => {
    console.log('User role:', user?.role); // Debug log
    console.log('Attempting to navigate to notifications...'); // Debug log
    
    // Check for different possible role values
    if (user?.role === 'depot-engineer' || user?.role === 'depot_engineer') {
      console.log('Navigating to depot engineer notifications');
      navigate('/depot-engineer/notifications');
    } else if (user?.role === 'depot_manager' || user?.role === 'depot-manager' || user?.role === 'depot_manager') {
      console.log('Navigating to depot manager notifications');
      navigate('/depot-manager/notifications');
    } else if (user?.role === 'regional_tech' || user?.role === 'regional-technical-officer' || user?.role === 'regional-tech' || user?.role?.includes('regional')) {
      console.log('Navigating to RTO notifications');
      navigate('/regional-technical-officer/RTONotifications');
    } else {
      // Fallback for any role - navigate to their dashboard and show alert
      console.log('Notifications not implemented for this role yet:', user?.role);
      alert('Notifications feature is not yet implemented for your role.');
    }
  };

  // Function to refresh notification count (can be called from other components)
  const refreshNotificationCount = () => {
    if (token && isDashboard) {
      fetchNotificationCount();
    }
  };

  // Expose refresh function globally for other components to use
  useEffect(() => {
    (window as any).refreshNotificationCount = refreshNotificationCount;
    return () => {
      delete (window as any).refreshNotificationCount;
    };
  }, [token, isDashboard, user?.role]);


  // Function to get dashboard route based on user role
  const getDashboardRoute = (role: string) => {
    switch (role) {
      case 'admin':
        return '/admin'
      case 'depot_manager':
        return '/depot-manager'
      case 'depot-operations-manager':
        return '/depot-operations-manager'
      case 'depot-engineer':
        return '/depot-engineer'
      case 'regional-technical-officer':
        return '/regional-technical-officer'
      case 'regional_tech':
        return '/regional-technical-officer'
      case 'regional-operations-officer':
        return '/regional-operations-officer'
      case 'dgm-technical':
        return '/dgm-technical'
      case 'dgm-operations':
        return '/dgm-operations'
      case 'ceo':
        return '/ceo'
      case 'driver':
        return '/driver'
      default:
        return '/'
    }
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${
      isDashboard 
        ? 'bg-white shadow-sm border-b border-gray-200' 
        : 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200'
    }`}>
      <div className={isDashboard ? 'px-6' : 'max-w-7xl mx-auto px-6 lg:px-8'}>
        <div className='flex items-center justify-between h-16'>
          
          {/* Logo */}
          <div className='flex-shrink-0'>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-500 bg-clip-text text-transparent'>
              <a href='/'>BusHubLK</a>
            </h1>
          </div>

          {/* Dashboard Search Bar (only show in dashboard) */}
        

          {/* Public Navigation (only show when not in dashboard) */}
          {!isDashboard && (
            <div className='hidden md:flex items-center space-x-8'>
              <NavLink 
                to='/' 
                className={({isActive}) => 
                  `relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`
                }
              >
                {({isActive}) => (
                  <>
                    Home
                    {isActive && (
                      <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600'></div>
                    )}
                  </>
                )}
              </NavLink>
              
              <NavLink 
                to='/about' 
                className={({isActive}) => 
                  `relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`
                }
              >
                {({isActive}) => (
                  <>
                    About Us
                    {isActive && (
                      <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600'></div>
                    )}
                  </>
                )}
              </NavLink>
              
              <NavLink 
                to='/contact' 
                className={({isActive}) => 
                  `relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`
                }
              >
                {({isActive}) => (
                  <>
                    Contact Us
                    {isActive && (
                      <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600'></div>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          )}

          {/* Right Side Actions */}
          <div className='flex items-center space-x-4'>
            
            {/* Dashboard Notifications (only show in dashboard) */}
            {isDashboard && token && (
              <button 
                onClick={handleNotificationClick}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative"
              >
                <HiBell className="h-6 w-6" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            )}

            {/* User Authentication */}
            {token ? (
              <div className='relative group'>
                <div className='flex items-center gap-3 cursor-pointer px-3 py-2 rounded-full hover:bg-gray-100 transition-all duration-200'>
                  <img 
                    className='w-9 h-9 rounded-full border-2 border-gray-200 hover:border-blue-400 transition-all duration-200' 
                    src={user.avatar} 
                    alt="Profile"
                  />
                  {isDashboard && (
                    <div className="hidden md:block text-left">
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      <span className="block text-xs text-gray-500">{user.role}</span>
                    </div>
                  )}
                  <svg className='w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors duration-200' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clipRule='evenodd' />
                  </svg>
                </div>
                
                {/* Dropdown Menu */}
                <div className='absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0'>
                  <div className='px-4 py-2 border-b border-gray-100'>
                    <p className='text-sm font-medium text-gray-900'>{user.name}</p>
                    <p className='text-xs text-gray-500'>{user.email}</p>
                  </div>
                  
                  <button 
                    onClick={() => navigate('/my-profile')} 
                    className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150'
                  >
                    My Profile
                  </button>
                  
                  {!isDashboard && (
                    <button 
                      onClick={() => navigate(getDashboardRoute(user.role))} 
                      className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150'
                    >
                      Dashboard
                    </button>
                  )}
                  
                  {isDashboard && (
                    <button 
                      onClick={() => navigate('/')} 
                      className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150'
                    >
                      Back to Home
                    </button>
                  )}
                  
                  <button 
                    className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150'
                  >
                    Settings
                  </button>
                  
                  <div className='border-t border-gray-100 mt-1 pt-1'>
                    <button 
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150'
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => navigate('/login')} 
                className='bg-gradient-to-r from-blue-700 to-blue-700 hover:from-blue-500 hover:to-blue-500 text-white px-6 py-2.5 rounded-full font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200'
              >
                Sign In
              </button>
            )}

            {/* Mobile menu button (only show when not in dashboard) */}
            {!isDashboard && (
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className='md:hidden ml-4 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200'
              >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  {showMenu ? (
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  ) : (
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation (only show when not in dashboard) */}
        {!isDashboard && showMenu && (
          <div className='md:hidden border-t border-gray-200 bg-white'>
            <div className='px-2 pt-2 pb-3 space-y-1'>
              <NavLink 
                to='/' 
                className={({isActive}) => 
                  `block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`
                }
                onClick={() => setShowMenu(false)}
              >
                Home
              </NavLink>
              <NavLink 
                to='/about' 
                className={({isActive}) => 
                  `block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`
                }
                onClick={() => setShowMenu(false)}
              >
                About Us
              </NavLink>
              <NavLink 
                to='/contact' 
                className={({isActive}) => 
                  `block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`
                }
                onClick={() => setShowMenu(false)}
              >
                Contact Us
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar