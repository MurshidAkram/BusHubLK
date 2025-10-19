// pages/dashboards/admin/Employees.tsx
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';
import { 
  HiOutlineSearch, 
  HiOutlineRefresh, 
  HiOutlinePencilAlt, 
  HiOutlineTrash, 
  HiOutlineFilter, 
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineXCircle,
  HiOutlineOfficeBuilding,
  HiOutlineLocationMarker,
  HiOutlineUserGroup,
  HiOutlineAdjustments
} from 'react-icons/hi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  region_id?: number;
  depot_id?: number;
}

interface EditUserData {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_name: string;
  is_active: boolean;
  role_data?: {
    depot_id?: string;
    region_id?: string;
    appointment_date?: string;
  };
}

interface Region {
  region_id: number;
  region_name: string;
}

interface Depot {
  depot_id: number;
  depot_name: string;
  region_id: number;
}

const Employees = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<EditUserData>({
    id: '',
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role_name: '',
    is_active: true,
    role_data: {}
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [regions, setRegions] = useState<Region[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  
  // Enhanced filter states
  const [filters, setFilters] = useState({
    roleFilter: [] as string[],
    statusFilter: null as boolean | null,
    regionFilter: null as string | null,
    depotFilter: null as string | null
  });

  const context = useContext(AppContext);

  // Available roles organized by category
  const roleCategories = {
    'Executive Management': ['ceo', 'dgm_technical', 'dgm_operations'],
    'Regional Officers': ['regional_tech', 'regional_operations'],
    'Depot Management': ['depot_manager', 'depot_operations', 'depot_engineer'],
    'Operations Staff': ['driver', 'conductor'],
    'System': ['admin']
  };

  // Fetch regions
  const fetchRegions = async () => {
    if (!context?.token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/regions`, {
        headers: {
          'Authorization': `Bearer ${context.token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRegions(data.regions || []);
      } else {
        console.error('Failed to fetch regions:', response.status);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  // Fetch depots
  const fetchDepots = async () => {
    if (!context?.token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/depots`, {
        headers: {
          'Authorization': `Bearer ${context.token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDepots(data.depots || []);
      } else {
        console.error('Failed to fetch depots:', response.status);
      }
    } catch (error) {
      console.error('Error fetching depots:', error);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${context?.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setFilteredUsers(data.users);
    } catch (error: any) {
      toast.error(error.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRegions();
    fetchDepots();
  }, []);

  // Apply all filters and search
  useEffect(() => {
    let result = [...users];

    // Debug logging
    console.log('Filtering - Region Filter:', filters.regionFilter, typeof filters.regionFilter);
    console.log('Filtering - Depot Filter:', filters.depotFilter, typeof filters.depotFilter);
    console.log('Sample user with depot:', users.find(u => u.depot_id));

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.first_name.toLowerCase().includes(term) ||
        user.last_name.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      );
    }

    // Apply role filter (multiple selection)
    if (filters.roleFilter.length > 0) {
      result = result.filter(user => filters.roleFilter.includes(user.role));
    }

    // Apply status filter
    if (filters.statusFilter !== null) {
      result = result.filter(user => user.is_active === filters.statusFilter);
    }

    // Apply region filter
    if (filters.regionFilter) {
      const regionId = parseInt(filters.regionFilter!);
      console.log('Filtering by region_id:', regionId);
      result = result.filter(user => {
        console.log(`User ${user.username}: region_id = ${user.region_id} (${typeof user.region_id})`);
        return user.region_id === regionId;
      });
    }

    // Apply depot filter
    if (filters.depotFilter) {
      const depotId = parseInt(filters.depotFilter!);
      console.log('Filtering by depot_id:', depotId);
      result = result.filter(user => {
        console.log(`User ${user.username}: depot_id = ${user.depot_id} (${typeof user.depot_id})`);
        return user.depot_id === depotId;
      });
    }

    console.log('Filtered results:', result.length);
    setFilteredUsers(result);
    setCurrentPage(1);
  }, [searchTerm, filters, users]);

  // Handle role filter toggle
  const toggleRoleFilter = (role: string) => {
    setFilters(prev => {
      const newRoleFilter = prev.roleFilter.includes(role)
        ? prev.roleFilter.filter(r => r !== role)
        : [...prev.roleFilter, role];
      return { ...prev, roleFilter: newRoleFilter };
    });
  };

  // Handle filter changes
  const handleFilterChange = (filterName: string, value: any) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      roleFilter: [],
      statusFilter: null,
      regionFilter: null,
      depotFilter: null
    });
    setSearchTerm('');
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.roleFilter.length > 0) count++;
    if (filters.statusFilter !== null) count++;
    if (filters.regionFilter) count++;
    if (filters.depotFilter) count++;
    if (searchTerm) count++;
    return count;
  };

  // Get filtered depots based on selected region
  const getFilteredDepots = () => {
    if (!filters.regionFilter) return depots;
    return depots.filter(depot => depot.region_id === parseInt(filters.regionFilter!));
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Toggle user active status
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/${currentStatus ? 'deactivate' : 'activate'}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to ${currentStatus ? 'deactivate' : 'activate'} user`);
      }

      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));

      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Error updating user status');
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error deleting user');
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Handle edit click
  const handleEditClick = (user: User) => {
    setCurrentUser(user);
    setEditFormData({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || '',
      role_name: user.role,
      is_active: user.is_active,
      role_data: {}
    });
    setShowEditModal(true);
  };

  // Handle form input changes
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    
    if (editFormErrors[name]) {
      setEditFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle role-specific data changes
  const handleRoleDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      role_data: {
        ...prev.role_data,
        [name]: value
      }
    }));
  };

  // Submit the edit form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${editFormData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: editFormData.first_name,
          last_name: editFormData.last_name,
          phone: editFormData.phone,
          role_name: editFormData.role_name,
          role_data: editFormData.role_data
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const data = await response.json();
      toast.success('User updated successfully');
      
      setUsers(users.map(u => u.id === editFormData.id ? { ...u, ...data.user } : u));
      setShowEditModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Error updating user');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-6">
        {/* Header and actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
            <p className="text-gray-600 text-sm mt-1">Manage and filter employees across regions and depots</p>
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <HiOutlineRefresh className="mr-2" />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiOutlineSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <HiOutlineAdjustments className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              {getActiveFilterCount() > 0 && (
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {getActiveFilterCount()} active
                </span>
              )}
            </div>
            {getActiveFilterCount() > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                <HiOutlineX className="h-4 w-4 mr-1" />
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFilterChange('statusFilter', filters.statusFilter === true ? null : true)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    filters.statusFilter === true
                      ? 'bg-green-100 text-green-800 border-2 border-green-500'
                      : 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => handleFilterChange('statusFilter', filters.statusFilter === false ? null : false)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    filters.statusFilter === false
                      ? 'bg-red-100 text-red-800 border-2 border-red-500'
                      : 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>

            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-1">
                  <HiOutlineLocationMarker className="h-4 w-4" />
                  <span>Region</span>
                </div>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={filters.regionFilter || ''}
                onChange={(e) => {
                  handleFilterChange('regionFilter', e.target.value || null);
                  handleFilterChange('depotFilter', null);
                }}
              >
                <option value="">All Regions</option>
                {regions.map((region) => (
                  <option key={region.region_id} value={region.region_id}>
                    {region.region_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Depot Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-1">
                  <HiOutlineOfficeBuilding className="h-4 w-4" />
                  <span>Depot</span>
                </div>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100"
                value={filters.depotFilter || ''}
                onChange={(e) => handleFilterChange('depotFilter', e.target.value || null)}
                disabled={!filters.regionFilter}
              >
                <option value="">All Depots</option>
                {getFilteredDepots().map((depot) => (
                  <option key={depot.depot_id} value={depot.depot_id}>
                    {depot.depot_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Summary */}
            <div className="flex items-end">
              <div className="w-full p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-900">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'employee' : 'employees'}
                </div>
                <div className="text-xs text-blue-700 mt-0.5">
                  of {users.length} total
                </div>
              </div>
            </div>
          </div>

          {/* Role Filters - Organized by Category */}
          <div className="pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center space-x-1">
                <HiOutlineUserGroup className="h-4 w-4" />
                <span>Roles</span>
              </div>
            </label>
            <div className="space-y-4">
              {Object.entries(roleCategories).map(([category, roles]) => (
                <div key={category}>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {category}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <button
                        key={role}
                        onClick={() => toggleRoleFilter(role)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                          filters.roleFilter.includes(role)
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {role.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Users table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No employees found matching your criteria
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Username
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600">
                                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.phone || 'No phone'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          @{user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.role.includes('admin') ? 'bg-purple-100 text-purple-800' :
                              user.role.includes('manager') || user.role.includes('officer') ? 'bg-blue-100 text-blue-800' :
                              user.role.includes('engineer') || user.role.includes('technical') ? 'bg-green-100 text-green-800' :
                              user.role.includes('driver') || user.role.includes('conductor') ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {user.role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.last_login)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                              className={`p-1 rounded-md ${user.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {user.is_active ? (
                                <HiOutlineXCircle className="h-5 w-5" />
                              ) : (
                                <HiOutlineCheck className="h-5 w-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEditClick(user)}
                              className="text-blue-600 hover:bg-blue-50 p-1 rounded-md"
                              title="Edit"
                            >
                              <HiOutlinePencilAlt className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="text-red-600 hover:bg-red-50 p-1 rounded-md"
                              title="Delete"
                            >
                              <HiOutlineTrash className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastUser, filteredUsers.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredUsers.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === number
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {number}
                        </button>
                      ))}
                      <button
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Employee</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <HiOutlineX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={editFormData.first_name}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={editFormData.last_name}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  name="role_name"
                  value={editFormData.role_name}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {Object.entries(roleCategories).map(([category, roles]) => (
                    <optgroup key={category} label={category}>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {['regional_tech', 'regional_operations', 'depot_manager', 
                'depot_operations', 'depot_engineer', 'driver', 'conductor'].includes(editFormData.role_name) && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Role-Specific Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Region ID
                      </label>
                      <input
                        type="number"
                        name="region_id"
                        value={editFormData.role_data?.region_id || ''}
                        onChange={handleRoleDataChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    {['depot_manager', 'depot_operations', 'depot_engineer', 'driver', 'conductor'].includes(editFormData.role_name) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Depot ID
                        </label>
                        <input
                          type="number"
                          name="depot_id"
                          value={editFormData.role_data?.depot_id || ''}
                          onChange={handleRoleDataChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      name="appointment_date"
                      value={editFormData.role_data?.appointment_date || ''}
                      onChange={handleRoleDataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Update Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;