import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiHome,
  HiMap,
  HiCalendar,
  HiClipboardList,
  HiDocumentSearch,
  HiChartBar,
  HiCog,
  HiExclamationCircle,
  HiUserGroup,
  HiShieldCheck,
  HiUsers,
  HiBell
} from 'react-icons/hi';

const RegionalTechnicalOfficerSidebarContent = () => {
  return (
    <div className="space-y-1">
      <NavLink
        to="/regional-technical-officer"
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
        to="/regional-technical-officer/notifications"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
         <HiBell className="mr-3 flex-shrink-0 h-5 w-5" />
      Notification
      </NavLink>

      <NavLink
        to="/regional-technical-officer/Regionservicemonitor"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiMap className="mr-3 flex-shrink-0 h-5 w-5" />
        Region-Wide Service Monitor
      </NavLink>

      <NavLink
        to="/regional-technical-officer/Inspectionschedular"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCalendar className="mr-3 flex-shrink-0 h-5 w-5" />
        Inspection Scheduler
      </NavLink>

      <NavLink
        to="/regional-technical-officer/Rtoissuetracker"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiExclamationCircle className="mr-3 flex-shrink-0 h-5 w-5" />
         Issue Tracker
      </NavLink>
      <NavLink
        to="/regional-technical-officer/Regioncommunityhub"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
         <HiUsers className="mr-3 flex-shrink-0 h-5 w-5" />
      Communcation Hub
      </NavLink>
     
    

      
    </div>
  );
};

export default RegionalTechnicalOfficerSidebarContent;