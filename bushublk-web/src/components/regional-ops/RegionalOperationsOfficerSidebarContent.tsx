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
        Dashboard
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
        Daily Duties
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
        Crew 
      </NavLink>

      


      

      <NavLink
        to="/regional-operations-officer/communication-hub"
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
         Reports
      </NavLink>

     
    </div>
  );
};

export default RegionalOperationsOfficerSidebarContent