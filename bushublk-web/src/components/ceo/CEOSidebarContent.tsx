import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiHome, 
  HiGlobeAlt,
  HiOfficeBuilding,
  HiChartSquareBar,
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
  HiStar
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
        to="/ceo/strategic-dashboard"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiChartSquareBar className="mr-3 flex-shrink-0 h-5 w-5" />
        Strategic Dashboard
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
        to="/ceo/financial-performance"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCurrencyDollar className="mr-3 flex-shrink-0 h-5 w-5" />
        Financial Performance
      </NavLink>

      <NavLink
        to="/ceo/operational-excellence"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiTrendingUp className="mr-3 flex-shrink-0 h-5 w-5" />
        Operational Excellence
      </NavLink>

      <NavLink
        to="/ceo/technical-overview"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCog className="mr-3 flex-shrink-0 h-5 w-5" />
        Technical Overview
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
        to="/ceo/quality-assurance"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiShieldCheck className="mr-3 flex-shrink-0 h-5 w-5" />
        Quality Assurance
      </NavLink>

      <NavLink
        to="/ceo/safety-compliance"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiFlag className="mr-3 flex-shrink-0 h-5 w-5" />
        Safety & Compliance
      </NavLink>

      <NavLink
        to="/ceo/innovation-initiatives"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiLightBulb className="mr-3 flex-shrink-0 h-5 w-5" />
        Innovation Initiatives
      </NavLink>

      <NavLink
        to="/ceo/stakeholder-management"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiSpeakerphone className="mr-3 flex-shrink-0 h-5 w-5" />
        Stakeholder Management
      </NavLink>

      <NavLink
        to="/ceo/risk-management"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiEye className="mr-3 flex-shrink-0 h-5 w-5" />
        Risk Management
      </NavLink>

      <NavLink
        to="/ceo/strategic-planning"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiClipboardList className="mr-3 flex-shrink-0 h-5 w-5" />
        Strategic Planning
      </NavLink>

      <NavLink
        to="/ceo/performance-reviews"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiStar className="mr-3 flex-shrink-0 h-5 w-5" />
        Performance Reviews
      </NavLink>

      <NavLink
        to="/ceo/executive-reports"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiDocumentReport className="mr-3 flex-shrink-0 h-5 w-5" />
        Executive Reports
      </NavLink>

      <NavLink
        to="/ceo/executive-settings"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-purple-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiAdjustments className="mr-3 flex-shrink-0 h-5 w-5" />
        Executive Settings
      </NavLink>
    </div>
  );
};

export default CEOSidebarContent