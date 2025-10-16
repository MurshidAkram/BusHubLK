import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiHome, 
  HiTruck,
  HiCog,
  HiCalendar,
  HiChartBar,
  HiArrowUp,
  HiArrowRight,
  HiArrowCircleRight,
  HiClipboardCheck,
  HiUsers,
  HiRefresh,
  HiBell
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
        Overview
      </NavLink>

      <NavLink
        to="/depot-engineer/notifications"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiBell className="mr-3 flex-shrink-0 h-5 w-5" />
        Notifications
      </NavLink>

      <NavLink
        to="/depot-engineer/Busmanagement"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiTruck className="mr-3 flex-shrink-0 h-5 w-5" />
        Bus Management
      </NavLink>

      <NavLink
        to="/depot-engineer/Busavailability"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiRefresh className="mr-3 flex-shrink-0 h-5 w-5" />
        Bus Availability
      </NavLink>

      <NavLink
        to="/depot-engineer/scheduling"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiCalendar className="mr-3 flex-shrink-0 h-5 w-5" />
        Schedule
      </NavLink>
      <NavLink
        to="/depot-engineer/Autoforwardbusstatus"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiArrowCircleRight className="mr-3 flex-shrink-0 h-5 w-5" />
        Bus Condition Reports
      </NavLink>

      <NavLink
          to="/depot-engineer/DepotEscalateissues"
          className={({ isActive }) =>
           `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
           isActive 
            ? 'bg-green-700 text-white' 
           : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`
         }
        >
       <HiArrowUp className="mr-3 flex-shrink-0 h-5 w-5" />
       Issue tracker
      </NavLink>


      <NavLink
        to="/depot-engineer/Spareparts"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiChartBar className="mr-3 flex-shrink-0 h-5 w-5" />
        Spare Parts
      </NavLink>
      <NavLink
        to="/depot-engineer/Depotcommunityhub"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
         <HiUsers className="mr-3 flex-shrink-0 h-5 w-5" />
      Communication Hub
      </NavLink>
      <NavLink
        to="/depot-engineer/Depotinspection"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-green-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
         <HiClipboardCheck className="mr-3 flex-shrink-0 h-5 w-5" />
      Inspections
      </NavLink>
    </div>
  );
};

export default DepotEngineerSidebarContent;