import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiHome, 
  HiCog,
  HiClipboardCheck,
  HiExclamationCircle,
  HiCalendar,
  HiDocumentReport,
  HiChartBar,
  HiLightBulb,
  HiTruck,
  HiCollection,
  HiBookOpen,
  HiShieldCheck
} from 'react-icons/hi';

const DepotEngineerSidebarContent = () => {
  return (
    <div className="space-y-1">
      <NavLink
        to="/depot-engineer"
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
        to="/depot-engineer/maintenance-management"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCog className="mr-3 flex-shrink-0 h-5 w-5" />
        Maintenance Management
      </NavLink>

      <NavLink
        to="/depot-engineer/inspection-checklist"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiClipboardCheck className="mr-3 flex-shrink-0 h-5 w-5" />
        Inspection Checklist
      </NavLink>

      <NavLink
        to="/depot-engineer/fault-diagnosis"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiExclamationCircle className="mr-3 flex-shrink-0 h-5 w-5" />
        Fault Diagnosis
      </NavLink>

      <NavLink
        to="/depot-engineer/preventive-maintenance"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCalendar className="mr-3 flex-shrink-0 h-5 w-5" />
        Preventive Maintenance
      </NavLink>

      <NavLink
        to="/depot-engineer/repair-tracking"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiLightBulb className="mr-3 flex-shrink-0 h-5 w-5" />
        Repair Tracking
      </NavLink>

      <NavLink
        to="/depot-engineer/vehicle-history"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiTruck className="mr-3 flex-shrink-0 h-5 w-5" />
        Vehicle History
      </NavLink>

      <NavLink
        to="/depot-engineer/parts-inventory"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCollection className="mr-3 flex-shrink-0 h-5 w-5" />
        Parts Inventory
      </NavLink>

      <NavLink
        to="/depot-engineer/technical-documentation"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiBookOpen className="mr-3 flex-shrink-0 h-5 w-5" />
        Technical Documentation
      </NavLink>

      <NavLink
        to="/depot-engineer/safety-compliance"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiShieldCheck className="mr-3 flex-shrink-0 h-5 w-5" />
        Safety & Compliance
      </NavLink>

      <NavLink
        to="/depot-engineer/maintenance-analytics"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiChartBar className="mr-3 flex-shrink-0 h-5 w-5" />
        Maintenance Analytics
      </NavLink>

      <NavLink
        to="/depot-engineer/technical-reports"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiDocumentReport className="mr-3 flex-shrink-0 h-5 w-5" />
        Technical Reports
      </NavLink>
    </div>
  );
};

export default DepotEngineerSidebarContent