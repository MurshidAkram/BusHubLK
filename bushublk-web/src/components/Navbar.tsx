import React, { useState, useContext, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { HiBell } from 'react-icons/hi';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';

const Navbar = () => {
  const { user, token, logout } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const normalizeRole = (role?: string) =>
    role ? role.toLowerCase().replace(/\s+/g, '').replace(/-/g, '_') : '';
  const roleKey = normalizeRole(user?.role);
  const depotId = user?.depot_id;

  // Check if we're in a dashboard route
  const isDashboard =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/depot-manager') ||
    location.pathname.startsWith('/depot-operations-manager') ||
    location.pathname.startsWith('/depot-engineer') ||
    location.pathname.startsWith('/regional-technical-officer') ||
    location.pathname.startsWith('/regional-operations-officer') ||
    location.pathname.startsWith('/dgm-technical') ||
    location.pathname.startsWith('/dgm-operations') ||
    location.pathname.startsWith('/ceo') ||
    location.pathname.startsWith('/driver') ||
    location.pathname.startsWith('/conductor');

  // Fetch notification count function
  const fetchNotificationCount = async () => {
    if (!token || !isDashboard) {
      setNotificationCount(0);
      return;
    }

    try {
      let response;
      if (roleKey === 'depot_engineer') {
        response = await fetch('http://localhost:5000/api/depot-engineer/notifications/unread-count', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } else if (roleKey === 'regional_tech' || roleKey === 'regional_technical_officer') {
        response = await fetch('http://localhost:5000/api/rto/notifications/unread-count', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } else if (roleKey === 'depot_operations' && depotId) {
        response = await fetch(`http://localhost:5000/api/depot/${depotId}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (roleKey === 'depot_manager' && depotId) {
        response = await fetch(`http://localhost:5000/api/depot-manager/${depotId}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await fetch('http://localhost:5000/api/notifications/unread-count', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      if (response.ok) {
        const data = await response.json();
        // Handle different response structures
        const count =
          roleKey === 'depot_operations' || roleKey === 'depot_manager'
            ? data.notifications?.length || 0
            : data.unreadCount || 0;
        setNotificationCount(count);
      } else {
        setNotificationCount(0);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
      // Fallback to general notifications
      try {
        const response = await fetch('http://localhost:5000/api/notifications/unread-count', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setNotificationCount(data.unreadCount || 0);
        } else {
          setNotificationCount(0);
        }
      } catch (fallbackError) {
        console.error('Error fetching fallback notification count:', fallbackError);
        setNotificationCount(0);
      }
    }
  };

  // Fetch notification count on mount and every 30 seconds
  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, [token, isDashboard, roleKey, depotId]);

  // Handle notification click
  const handleNotificationClick = () => {
    console.log('User role:', user?.role); // Debug log
    if (roleKey === 'depot_engineer') {
      navigate('/depot-engineer/notifications');
    } else if (roleKey === 'depot_manager') {
      navigate('/depot-manager/notifications');
    } else if (roleKey === 'regional_tech' || roleKey === 'regional_technical_officer') {
      navigate('/regional-technical-officer/notifications');
    } else if (roleKey === 'depot_operations') {
      navigate('/depot-operations-manager/notificationscenter');
    } else {
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
    window.refreshNotificationCount = refreshNotificationCount;
    return () => {
      delete window.refreshNotificationCount;
    };
  }, [token, isDashboard, roleKey, depotId]);

  // Function to get dashboard route based on user role
  const getDashboardRoute = (role) => {
    const normalizedRole = normalizeRole(role);
    switch (normalizedRole) {
      case 'admin':
        return '/admin';
      case 'depot_manager':
        return '/depot-manager';
      case 'depot_operations':
      case 'depot-operations-manager':
        return '/depot-operations-manager';
      case 'depot_engineer':
        return '/depot-engineer';
      case 'regional_tech':
      case 'regional-technical-officer':
      case 'regional_technical_officer':
        return '/regional-technical-officer';
      case 'regional-operations-officer':
        return '/regional-operations-officer';
      case 'dgm-technical':
        return '/dgm-technical';
      case 'dgm-operations':
        return '/dgm-operations';
      case 'ceo':
        return '/ceo';
      case 'driver':
        return '/driver';
      case 'conductor':
        return '/conductor';
      default:
        return '/';
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 ${
        isDashboard
          ? 'bg-white shadow-sm border-b border-gray-200'
          : 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200'
      }`}
    >
      <div className={isDashboard ? 'px-6' : 'max-w-7xl mx-auto px-6 lg:px-8'}>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-500 bg-clip-text text-transparent">
              <a href="/">BusHubLK</a>
            </h1>
          </div>

          {/* Public Navigation (only show when not in dashboard) */}
          {!isDashboard && (
            <div className="hidden md:flex items-center space-x-8">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    Home
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                    )}
                  </>
                )}
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    About Us
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                    )}
                  </>
                )}
              </NavLink>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    Contact Us
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
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
              <div className="relative group">
                <div className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-full hover:bg-gray-100 transition-all duration-200">
                  <img
                    className="w-9 h-9 rounded-full border-2 border-gray-200 hover:border-blue-400 transition-all duration-200"
                    src={assets.avatar}
                    alt="Profile"
                  />
                  {isDashboard && (
                    <div className="hidden md:block text-left">
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      <span className="block text-xs text-gray-500">{user.role}</span>
                    </div>
                  )}
                  <svg
                    className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors duration-200"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => navigate('/my-profile')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                  >
                    My Profile
                  </button>
                  {!isDashboard && (
                    <button
                      onClick={() => navigate(getDashboardRoute(user.role))}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                    >
                      Dashboard
                    </button>
                  )}
                  {isDashboard && (
                    <button
                      onClick={() => navigate('/')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                    >
                      Back to Home
                    </button>
                  )}
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                  >
                    Settings
                  </button>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-blue-700 to-blue-700 hover:from-blue-500 hover:to-blue-500 text-white px-6 py-2.5 rounded-full font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Sign In
              </button>
            )}

            {/* Mobile menu button (only show when not in dashboard) */}
            {!isDashboard && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="md:hidden ml-4 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showMenu ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation (only show when not in dashboard) */}
        {!isDashboard && showMenu && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`
                }
                onClick={() => setShowMenu(false)}
              >
                Home
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`
                }
                onClick={() => setShowMenu(false)}
              >
                About Us
              </NavLink>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
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
  );
};

export default Navbar;