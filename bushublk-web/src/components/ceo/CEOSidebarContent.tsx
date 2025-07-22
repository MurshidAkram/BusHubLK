import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiHome, 
  HiGlobeAlt,
  HiOfficeBuilding,
  HiExclamationCircle,
  HiTrendingUp,
  HiCurrencyDollar,
  HiUsers,
  HiCog,
  HiShieldCheck,
  HiDocumentReport,
  HiLightBulb,
  HiSpeakerphone,
  HiBriefcase,
  HiCalendar,
  HiClipboardList,
  HiEye,
  HiAdjustments,
  HiCollection,
  HiFlag,
  HiPhone
} from 'react-icons/hi';

const CEOSidebarContent = () => {
  return (
    <div className="space-y-1">
      <NavLink
        to="/ceo"
        end
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiHome className="mr-3 flex-shrink-0 h-5 w-5" />
        Executive Overview
      </NavLink>

      <NavLink
        to="/ceo/regional-overview"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiGlobeAlt className="mr-3 flex-shrink-0 h-5 w-5" />
        Regional Overview
      </NavLink>

      <NavLink
        to="/ceo/depot-overview"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiOfficeBuilding className="mr-3 flex-shrink-0 h-5 w-5" />
        Depot Overview
      </NavLink>

      <NavLink
        to="/ceo/operational-overview"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCollection className="mr-3 flex-shrink-0 h-5 w-5" />
        Operational Overview
      </NavLink>

      <NavLink
        to="/ceo/workforce-analytics"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiUsers className="mr-3 flex-shrink-0 h-5 w-5" />
        Workforce Analytics
      </NavLink>

      

      <NavLink
        to="/ceo/accident-breakdowns"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiExclamationCircle className="mr-3 flex-shrink-0 h-5 w-5" />
        Accident & Breakdowns
      </NavLink>
      
      <NavLink
        to="/ceo/announcement-center"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiPhone className="mr-3 flex-shrink-0 h-5 w-5" />
        Announcement Center
      </NavLink>

    </div>
  );
};

export default CEOSidebarContent