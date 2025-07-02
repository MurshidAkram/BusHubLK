import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiHome, 
  HiClipboardList,
  HiClock,
  HiUsers,
  HiTruck,
  HiLocationMarker,
  HiChartBar,
  HiDocumentReport,
  HiExclamationCircle,
  HiCog,
  HiCalendar,
  HiPhone
} from 'react-icons/hi';

const DepotOperationsManagerSidebarContent = () => {
  return (
    <div className="space-y-1">
      <NavLink
        to="/depot-operations-manager"
        end
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiHome className="mr-3 flex-shrink-0 h-5 w-5" />
        Dashboard Overview
      </NavLink>

      <NavLink
        to="/depot-operations-manager/daily-operations"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiClipboardList className="mr-3 flex-shrink-0 h-5 w-5" />
        Daily Operations
      </NavLink>

      <NavLink
        to="/depot-operations-manager/schedule-monitoring"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiClock className="mr-3 flex-shrink-0 h-5 w-5" />
        Schedule Monitoring
      </NavLink>

      <NavLink
        to="/depot-operations-manager/crew-coordination"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiUsers className="mr-3 flex-shrink-0 h-5 w-5" />
        Crew Coordination
      </NavLink>

      <NavLink
        to="/depot-operations-manager/fleet-tracking"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiTruck className="mr-3 flex-shrink-0 h-5 w-5" />
        Fleet Tracking
      </NavLink>

      <NavLink
        to="/depot-operations-manager/route-optimization"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiLocationMarker className="mr-3 flex-shrink-0 h-5 w-5" />
        Route Optimization
      </NavLink>

      <NavLink
        to="/depot-operations-manager/shift-planning"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCalendar className="mr-3 flex-shrink-0 h-5 w-5" />
        Shift Planning
      </NavLink>

      <NavLink
        to="/depot-operations-manager/incident-management"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiExclamationCircle className="mr-3 flex-shrink-0 h-5 w-5" />
        Incident Management
      </NavLink>

      <NavLink
        to="/depot-operations-manager/communication-center"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiPhone className="mr-3 flex-shrink-0 h-5 w-5" />
        Communication Center
      </NavLink>

      <NavLink
        to="/depot-operations-manager/performance-analytics"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiChartBar className="mr-3 flex-shrink-0 h-5 w-5" />
        Performance Analytics
      </NavLink>

      <NavLink
        to="/depot-operations-manager/operations-reports"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiDocumentReport className="mr-3 flex-shrink-0 h-5 w-5" />
        Operations Reports
      </NavLink>

      <NavLink
        to="/depot-operations-manager/settings"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCog className="mr-3 flex-shrink-0 h-5 w-5" />
        Operations Settings
      </NavLink>
    </div>
  );
};

export default DepotOperationsManagerSidebarContent