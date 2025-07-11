import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiHome, 
  HiGlobeAlt,
  HiOfficeBuilding,
  HiCog,
  HiClipboardCheck,
  HiExclamationCircle,
  HiChartBar,
  HiDocumentReport,
  HiTruck,
  HiCollection,
  HiAcademicCap,
  HiShieldCheck,
  HiLightBulb,
  HiUserGroup,
  HiCalendar,
  HiBookOpen,
  HiCurrencyDollar,
  HiTrendingUp,
  HiChatAlt2
} from 'react-icons/hi';

const DGMTechnicalSidebarContent = () => {
  return (
    <div className="space-y-1">
      <NavLink
        to="/dgm-technical"
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
        to="/dgm-technical/Fleetmonitor"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiGlobeAlt className="mr-3 flex-shrink-0 h-5 w-5" />
        Fleet health Monitor
      </NavLink>

      <NavLink
        to="/dgm-technical/Servicehistoryexplorer"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiOfficeBuilding className="mr-3 flex-shrink-0 h-5 w-5" />
        Service History Explorer
      </NavLink>

      {/* <NavLink
        to="/dgm-technical/Inspectionandmaintenance"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiTruck className="mr-3 flex-shrink-0 h-5 w-5" />
        Inspection and Maintenance Schedule
      </NavLink> */}

      <NavLink
        to="/dgm-technical/Dgmtechnicalissue"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCog className="mr-3 flex-shrink-0 h-5 w-5" />
        Issue Tracker
      </NavLink>

      <NavLink
        to="/dgm-technical/GenerateReports"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiClipboardCheck className="mr-3 flex-shrink-0 h-5 w-5" />
        Reports
      </NavLink>

      

    </div>
  );
};

export default DGMTechnicalSidebarContent