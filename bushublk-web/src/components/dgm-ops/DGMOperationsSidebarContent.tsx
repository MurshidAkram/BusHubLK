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
        Executive Dashboard
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
        National Operations
      </NavLink>

      <NavLink
        to="/dgm-operations/regional-oversight"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiOfficeBuilding className="mr-3 flex-shrink-0 h-5 w-5" />
        Regional Oversight
      </NavLink>

      <NavLink
        to="/dgm-operations/strategic-planning"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiBriefcase className="mr-3 flex-shrink-0 h-5 w-5" />
        Strategic Planning
      </NavLink>

      <NavLink
        to="/dgm-operations/fleet-management"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiTruck className="mr-3 flex-shrink-0 h-5 w-5" />
        Fleet Management
      </NavLink>

      <NavLink
        to="/dgm-operations/network-optimization"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiLocationMarker className="mr-3 flex-shrink-0 h-5 w-5" />
        Network Optimization
      </NavLink>

      <NavLink
        to="/dgm-operations/workforce-management"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiUsers className="mr-3 flex-shrink-0 h-5 w-5" />
        Workforce Management
      </NavLink>

      <NavLink
        to="/dgm-operations/service-quality"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiShieldCheck className="mr-3 flex-shrink-0 h-5 w-5" />
        Service Quality
      </NavLink>

      <NavLink
        to="/dgm-operations/performance-analytics"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiChartBar className="mr-3 flex-shrink-0 h-5 w-5" />
        Performance Analytics
      </NavLink>

      <NavLink
        to="/dgm-operations/operational-excellence"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiTrendingUp className="mr-3 flex-shrink-0 h-5 w-5" />
        Operational Excellence
      </NavLink>

      <NavLink
        to="/dgm-operations/financial-oversight"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCurrencyDollar className="mr-3 flex-shrink-0 h-5 w-5" />
        Financial Oversight
      </NavLink>

      <NavLink
        to="/dgm-operations/risk-management"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiExclamationCircle className="mr-3 flex-shrink-0 h-5 w-5" />
        Risk Management
      </NavLink>

      <NavLink
        to="/dgm-operations/innovation-initiatives"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiLightBulb className="mr-3 flex-shrink-0 h-5 w-5" />
        Innovation Initiatives
      </NavLink>

      <NavLink
        to="/dgm-operations/compliance-governance"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiFlag className="mr-3 flex-shrink-0 h-5 w-5" />
        Compliance & Governance
      </NavLink>

      <NavLink
        to="/dgm-operations/executive-reports"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiDocumentReport className="mr-3 flex-shrink-0 h-5 w-5" />
        Executive Reports
      </NavLink>

      <NavLink
        to="/dgm-operations/training-development"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiAcademicCap className="mr-3 flex-shrink-0 h-5 w-5" />
        Training & Development
      </NavLink>

      <NavLink
        to="/dgm-operations/settings"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-indigo-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCog className="mr-3 flex-shrink-0 h-5 w-5" />
        Executive Settings
      </NavLink>
    </div>
  );
};

export default DGMOperationsSidebarContent