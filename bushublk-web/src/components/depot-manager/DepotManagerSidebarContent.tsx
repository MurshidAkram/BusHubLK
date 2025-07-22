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
        Dashboard
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
        Fleet 
      </NavLink>

      {/*
  <NavLink
    to="/depot-manager/checklist-verification"
    className={({ isActive }) =>
      `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
        ? 'bg-green-700 text-white' 
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
    }
  >
    <HiClipboardList className="mr-3 flex-shrink-0 h-5 w-5" />
    Checklist Verification
  </NavLink>
*/}


      <NavLink
        to="/depot-manager/driver-management"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiUsers className="mr-3 flex-shrink-0 h-5 w-5" />
        Crew
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
        Daily duty
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
       Contact
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
        Issues
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
       Reports
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
         Settings
      </NavLink>
    </div>
  );
};

export default DepotManagerSidebarContent