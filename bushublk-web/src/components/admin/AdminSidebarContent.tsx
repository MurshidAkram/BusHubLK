import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiHome, 
  HiUserAdd, 
  HiCog, 
  HiUsers, 
  HiChartBar,
  HiDocumentReport,
  HiOutlineLocationMarker,
  HiOutlineTruck
} from 'react-icons/hi';

const AdminSidebarContent = () => {
  return (
    <div className="space-y-1">
      <NavLink
        to="/admin"
        end
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-blue-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiHome className="mr-3 flex-shrink-0 h-5 w-5" />
        Dashboard Overview
      </NavLink>
      <NavLink
        to="/admin/create-account"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-blue-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiUserAdd className="mr-3 flex-shrink-0 h-5 w-5" />
        Create Account
      </NavLink>
      <NavLink
        to="/admin/employees"
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
            ? 'bg-blue-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
        }
      >
        <HiUsers className="mr-3 flex-shrink-0 h-5 w-5" />
        Employee Management
      </NavLink>
      <NavLink
  to="/admin/depot-and-regions"
  className={({ isActive }) =>
    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
      ? 'bg-blue-700 text-white' 
      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
>
  <HiOutlineLocationMarker className="mr-3 flex-shrink-0 h-5 w-5" />
  Depots & Regions
</NavLink>

 <NavLink
  to="/admin/routes"
  className={({ isActive }) =>
    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
      ? 'bg-blue-700 text-white' 
      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
  }
>
  <HiDocumentReport className="mr-3 flex-shrink-0 h-5 w-5" />
  Route Management
</NavLink>


<NavLink
  to="/admin/buses"
  className={({ isActive }) =>
    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive 
      ? 'bg-blue-700 text-white' 
      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
  }
>

  <HiOutlineTruck className="mr-3 flex-shrink-0 h-5 w-5" />
  Bus Management
</NavLink>
    </div>
  );
};



export default AdminSidebarContent;