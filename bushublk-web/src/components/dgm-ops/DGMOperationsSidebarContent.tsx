import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiHome, 
  HiGlobeAlt,
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
  HiFlag,
  HiOfficeBuilding,
  HiBriefcase,
  HiCurrencyDollar,
  HiLightBulb,
  HiShieldCheck,
  HiAcademicCap
} from 'react-icons/hi';

const DGMOperationsSidebarContent = () => {
  return (
    <div className="space-y-1">
      <NavLink
        to="/dgm-operations"
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
        to="/dgm-operations/national-overview"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiGlobeAlt className="mr-3 flex-shrink-0 h-5 w-5" />
        Daily Duty
      </NavLink>

      <NavLink
        to="/dgm-operations/crew-oversight"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiGlobeAlt className="mr-3 flex-shrink-0 h-5 w-5" />
       Crew
      </NavLink>

      <NavLink
        to="/dgm-operations/communication-center"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiExclamationCircle className="mr-3 flex-shrink-0 h-5 w-5" />
        Contact
      </NavLink>


      <NavLink
        to="/dgm-operations/feedback"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiDocumentReport className="mr-3 flex-shrink-0 h-5 w-5" />
     Issues
      </NavLink>

     

      <NavLink
        to="/dgm-operations/executive-settings"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCog className="mr-3 flex-shrink-0 h-5 w-5" />
        Reports
      </NavLink>
    </div>
  );
};

export default DGMOperationsSidebarContent