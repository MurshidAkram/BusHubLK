import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiHome, 
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
  HiBookOpen
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
        Regional Overview
      </NavLink>

      <NavLink
        to="/regional-technical-officer/depot-management"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiOfficeBuilding className="mr-3 flex-shrink-0 h-5 w-5" />
        Depot Management
      </NavLink>

      <NavLink
        to="/regional-technical-officer/maintenance-coordination"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCog className="mr-3 flex-shrink-0 h-5 w-5" />
        Maintenance Coordination
      </NavLink>

      <NavLink
        to="/regional-technical-officer/quality-assurance"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiClipboardCheck className="mr-3 flex-shrink-0 h-5 w-5" />
        Quality Assurance
      </NavLink>

      <NavLink
        to="/regional-technical-officer/technical-issues"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiExclamationCircle className="mr-3 flex-shrink-0 h-5 w-5" />
        Technical Issues
      </NavLink>

      <NavLink
        to="/regional-technical-officer/fleet-performance"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiTruck className="mr-3 flex-shrink-0 h-5 w-5" />
        Fleet Performance
      </NavLink>

      <NavLink
        to="/regional-technical-officer/resource-allocation"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCollection className="mr-3 flex-shrink-0 h-5 w-5" />
        Resource Allocation
      </NavLink>

      <NavLink
        to="/regional-technical-officer/staff-management"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiUserGroup className="mr-3 flex-shrink-0 h-5 w-5" />
        Technical Staff
      </NavLink>

      <NavLink
        to="/regional-technical-officer/training-development"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiAcademicCap className="mr-3 flex-shrink-0 h-5 w-5" />
        Training & Development
      </NavLink>

      <NavLink
        to="/regional-technical-officer/maintenance-planning"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCalendar className="mr-3 flex-shrink-0 h-5 w-5" />
        Maintenance Planning
      </NavLink>

      <NavLink
        to="/regional-technical-officer/compliance-standards"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiShieldCheck className="mr-3 flex-shrink-0 h-5 w-5" />
        Compliance & Standards
      </NavLink>

      <NavLink
        to="/regional-technical-officer/innovation-improvement"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiLightBulb className="mr-3 flex-shrink-0 h-5 w-5" />
        Innovation & Improvement
      </NavLink>

      <NavLink
        to="/regional-technical-officer/technical-documentation"
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
        to="/regional-technical-officer/performance-analytics"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiChartBar className="mr-3 flex-shrink-0 h-5 w-5" />
        Performance Analytics
      </NavLink>

      <NavLink
        to="/regional-technical-officer/technical-reports"
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

export default RegionalTechnicalOfficerSidebarContent