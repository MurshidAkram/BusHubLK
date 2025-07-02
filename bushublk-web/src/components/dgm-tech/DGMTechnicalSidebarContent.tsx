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
        Strategic Overview
      </NavLink>

      <NavLink
        to="/dgm-technical/regional-performance"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiGlobeAlt className="mr-3 flex-shrink-0 h-5 w-5" />
        Regional Performance
      </NavLink>

      <NavLink
        to="/dgm-technical/depot-network"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiOfficeBuilding className="mr-3 flex-shrink-0 h-5 w-5" />
        Depot Network
      </NavLink>

      <NavLink
        to="/dgm-technical/fleet-analytics"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiTruck className="mr-3 flex-shrink-0 h-5 w-5" />
        Fleet Analytics
      </NavLink>

      <NavLink
        to="/dgm-technical/maintenance-strategy"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCog className="mr-3 flex-shrink-0 h-5 w-5" />
        Maintenance Strategy
      </NavLink>

      <NavLink
        to="/dgm-technical/quality-oversight"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiClipboardCheck className="mr-3 flex-shrink-0 h-5 w-5" />
        Quality Oversight
      </NavLink>

      <NavLink
        to="/dgm-technical/critical-issues"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiExclamationCircle className="mr-3 flex-shrink-0 h-5 w-5" />
        Critical Issues
      </NavLink>

      <NavLink
        to="/dgm-technical/resource-planning"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCollection className="mr-3 flex-shrink-0 h-5 w-5" />
        Resource Planning
      </NavLink>

      <NavLink
        to="/dgm-technical/budget-analysis"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCurrencyDollar className="mr-3 flex-shrink-0 h-5 w-5" />
        Budget Analysis
      </NavLink>

      <NavLink
        to="/dgm-technical/technical-workforce"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiUserGroup className="mr-3 flex-shrink-0 h-5 w-5" />
        Technical Workforce
      </NavLink>

      <NavLink
        to="/dgm-technical/training-oversight"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiAcademicCap className="mr-3 flex-shrink-0 h-5 w-5" />
        Training Oversight
      </NavLink>

      <NavLink
        to="/dgm-technical/strategic-planning"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCalendar className="mr-3 flex-shrink-0 h-5 w-5" />
        Strategic Planning
      </NavLink>

      <NavLink
        to="/dgm-technical/compliance-monitoring"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiShieldCheck className="mr-3 flex-shrink-0 h-5 w-5" />
        Compliance Monitoring
      </NavLink>

      <NavLink
        to="/dgm-technical/innovation-initiatives"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiLightBulb className="mr-3 flex-shrink-0 h-5 w-5" />
        Innovation Initiatives
      </NavLink>

      <NavLink
        to="/dgm-technical/performance-trends"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiTrendingUp className="mr-3 flex-shrink-0 h-5 w-5" />
        Performance Trends
      </NavLink>

      <NavLink
        to="/dgm-technical/stakeholder-communication"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiChatAlt2 className="mr-3 flex-shrink-0 h-5 w-5" />
        Stakeholder Communication
      </NavLink>

      <NavLink
        to="/dgm-technical/technical-documentation"
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
        to="/dgm-technical/executive-reports"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiDocumentReport className="mr-3 flex-shrink-0 h-5 w-5" />
        Executive Reports
      </NavLink>

      <NavLink
        to="/dgm-technical/analytics-dashboard"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiChartBar className="mr-3 flex-shrink-0 h-5 w-5" />
        Analytics Dashboard
      </NavLink>
    </div>
  );
};

export default DGMTechnicalSidebarContent