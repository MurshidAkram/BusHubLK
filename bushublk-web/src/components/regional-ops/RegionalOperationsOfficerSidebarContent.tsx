import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiHome, 
  HiOfficeBuilding,
  HiChartBar,
  HiTruck,
  HiUsers,
  HiClock,
  HiLocationMarker,
  HiExclamationCircle,
  HiDocumentReport,
  HiCog,
  HiCalendar,
  HiPhone,
  HiClipboardList,
  HiTrendingUp,
  HiFlag
} from 'react-icons/hi';

const RegionalOperationsOfficerSidebarContent = () => {
  return (
    <div className="space-y-1">
      <NavLink
        to="/regional-operations-officer"
        end
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiHome className="mr-3 flex-shrink-0 h-5 w-5" />
        Regional Overview
      </NavLink>

      <NavLink
        to="/regional-operations-officer/depot-management"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiOfficeBuilding className="mr-3 flex-shrink-0 h-5 w-5" />
        Depot Management
      </NavLink>

      <NavLink
        to="/regional-operations-officer/fleet-coordination"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiTruck className="mr-3 flex-shrink-0 h-5 w-5" />
        Fleet Coordination
      </NavLink>

      <NavLink
        to="/regional-operations-officer/schedule-oversight"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiClock className="mr-3 flex-shrink-0 h-5 w-5" />
        Schedule Oversight
      </NavLink>

    

      <NavLink
        to="/regional-operations-officer/crew-overview"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiUsers className="mr-3 flex-shrink-0 h-5 w-5" />
        Crew Oversight
      </NavLink>

      <NavLink
        to="/regional-operations-officer/asset-distribution"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiClipboardList className="mr-3 flex-shrink-0 h-5 w-5" />
        Resource Allocation
      </NavLink>


      <NavLink
        to="/regional-operations-officer/incident-tracking"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiExclamationCircle className="mr-3 flex-shrink-0 h-5 w-5" />
        Incident Coordination
      </NavLink>

      <NavLink
        to="/regional-operations-officer/comm-center"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiPhone className="mr-3 flex-shrink-0 h-5 w-5" />
        Communication Hub
      </NavLink>

      <NavLink
        to="/regional-operations-officer/ops-reports"
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
        to="/regional-operations-officer/ops-settings"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCog className="mr-3 flex-shrink-0 h-5 w-5" />
        Regional Settings
      </NavLink>
    </div>
  );
};

export default RegionalOperationsOfficerSidebarContent