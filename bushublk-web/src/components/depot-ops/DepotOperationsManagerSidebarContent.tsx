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
  HiPhone,
  HiBell
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
        Dashboard
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
        Daily duties
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
        Schedule
      </NavLink>

      <NavLink
        to="/depot-operations-manager/crew-management"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiUsers className="mr-3 flex-shrink-0 h-5 w-5" />
        Crew 
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
        Lost found portal
      </NavLink>

      <NavLink
              to="/depot-operations-manager/notificationscenter"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
                  ? 'bg-green-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
              }
            >
              <HiBell className="mr-3 flex-shrink-0 h-5 w-5" />
              Notifications
            </NavLink>

      <NavLink
        to="/depot-operations-manager/announcement-center"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiPhone className="mr-3 flex-shrink-0 h-5 w-5" />
       Community hub
      </NavLink>

      <NavLink
        to="/depot-operations-manager/passenger-complaints"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiDocumentReport className="mr-3 flex-shrink-0 h-5 w-5" />
        Complaints
      </NavLink>

      
  
    </div>
  );
};

export default DepotOperationsManagerSidebarContent