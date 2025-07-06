import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiHome, 
  HiTruck,
  HiUsers,
  HiClipboardList,
  HiClock,
  HiChartBar,
  HiCog,
  HiDocumentReport,
  HiLocationMarker,
  HiExclamationCircle
} from 'react-icons/hi';

const DepotManagerSidebarContent = () => {
  return (
    <div className="space-y-1">
      <NavLink
        to="/depot-manager"
        end
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiHome className="mr-3 flex-shrink-0 h-5 w-5" />
        Dashboard Overview
      </NavLink>

      <NavLink
        to="/depot-manager/fleet-management"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiTruck className="mr-3 flex-shrink-0 h-5 w-5" />
        Fleet Management
      </NavLink>

      <NavLink
        to="/depot-manager/driver-management"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiUsers className="mr-3 flex-shrink-0 h-5 w-5" />
        Driver & Conductor Management
      </NavLink>

      <NavLink
        to="/depot-manager/schedules"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiClock className="mr-3 flex-shrink-0 h-5 w-5" />
        Route Schedules
      </NavLink>

      <NavLink
        to="/depot-manager/assignments"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiClipboardList className="mr-3 flex-shrink-0 h-5 w-5" />
        Daily Assignments
      </NavLink>

      <NavLink
        to="/depot-manager/announcements"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiLocationMarker className="mr-3 flex-shrink-0 h-5 w-5" />
       Announcements
      </NavLink>

      <NavLink
        to="/depot-manager/maintenance"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiExclamationCircle className="mr-3 flex-shrink-0 h-5 w-5" />
        Maintenance Alerts
      </NavLink>

      <NavLink
        to="/depot-manager/reports"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiDocumentReport className="mr-3 flex-shrink-0 h-5 w-5" />
        Depot Reports
      </NavLink>

     

      <NavLink
        to="/depot-manager/settings"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCog className="mr-3 flex-shrink-0 h-5 w-5" />
        Depot Settings
      </NavLink>
    </div>
  );
};

export default DepotManagerSidebarContent