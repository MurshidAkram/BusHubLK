// pages/dashboard/admin/Employees.tsx
import React, { useState } from 'react';
import { HiSearch, HiOutlinePencilAlt, HiOutlineTrash } from 'react-icons/hi';

const employees = [
  { id: 1, name: 'John D.', email: 'john@slbt.lk', role: 'Depot Manager', depot: 'Colombo', status: 'Active' },
  { id: 2, name: 'Sarah K.', email: 'sarah@slbt.lk', role: 'Operations Manager', depot: 'Kandy', status: 'Active' },
  { id: 3, name: 'Mike T.', email: 'mike@slbt.lk', role: 'Depot Engineer', depot: 'Galle', status: 'Inactive' },
  // ...more mock data
];

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Employee Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Add Employee
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search employees..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depot</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{employee.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{employee.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.depot}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <HiOutlinePencilAlt className="h-5 w-5 inline" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <HiOutlineTrash className="h-5 w-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Employees