// pages/dashboard/admin/ManageRoles.tsx
import React, { useState } from 'react';
import { HiCog, HiChevronDown, HiCheck } from 'react-icons/hi';

const rolePermissions = {
  'Depot Manager': ['View Dashboard', 'Manage Staff', 'Create Announcements', 'View Reports'],
  'Operations Manager': ['Assign Duties', 'Track Buses', 'Manage Schedules', 'View Reports'],
  'Depot Engineer': ['Maintenance Records', 'Parts Inventory', 'Service Approvals'],
  'Regional Officer': ['View Regional Data', 'Generate Reports', 'Escalate Issues'],
  'DGM (Operations)': ['All Operations Access', 'Cross-Depot View', 'Strategic Planning'],
  'DGM (Technical)': ['All Technical Access', 'Fleet Analytics', 'Maintenance Oversight'],
};

const ManageRoles = () => {
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Role Permissions</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {Object.entries(rolePermissions).map(([role, permissions]) => (
          <div key={role} className="border-b border-gray-200 last:border-b-0">
            <button
              className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
              onClick={() => setExpandedRole(expandedRole === role ? null : role)}
            >
              <div className="flex items-center">
                <HiCog className="h-5 w-5 text-blue-500 mr-3" />
                <span className="font-medium">{role}</span>
              </div>
              <HiChevronDown className={`h-5 w-5 transform ${expandedRole === role ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedRole === role && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissions.map((permission) => (
                    <div key={permission} className="flex items-center">
                      <div className="h-4 w-4 border border-gray-300 rounded mr-2 flex items-center justify-center">
                        <HiCheck className="h-3 w-3 text-blue-500" />
                      </div>
                      <span className="text-sm">{permission}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    Edit Permissions
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-medium mb-3">Add New Role</h2>
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="Role Name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Add Role
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageRoles