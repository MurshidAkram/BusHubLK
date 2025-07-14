// pages/dashboards/admin/DepotAndRegions.tsx
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';
import { 
  HiOutlineSearch, 
  HiOutlineRefresh, 
  HiOutlinePlus, 
  HiOutlinePencilAlt, 
  HiOutlineTrash, 
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineLocationMarker,
  HiOutlineOfficeBuilding
} from 'react-icons/hi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Region {
  region_id: string;
  region_name: string;
  created_at?: string;
  updated_at?: string;
}

interface Depot {
  depot_id: string;
  depot_name: string;
  region_id: string;
  region_name: string;
  address: string;
  contact_phone: string;
  latitude: number;
  longitude: number;
  created_at?: string;
  updated_at?: string;
}

const DepotAndRegions = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'depots' | 'regions'>('depots');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState<Depot | Region | null>(null);
  const context = useContext(AppContext);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    region_id: '',
    address: '',
    contact_phone: '',
    latitude: '',
    longitude: ''
  });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch regions
      const regionsResponse = await fetch('http://localhost:5000/api/regions', {
        headers: {
          'Authorization': `Bearer ${context?.token}`
        }
      });
      const regionsData = await regionsResponse.json();
      setRegions(regionsData);

      // Fetch depots
      const depotsResponse = await fetch('http://localhost:5000/api/depots', {
        headers: {
          'Authorization': `Bearer ${context?.token}`
        }
      });
      const depotsData = await depotsResponse.json();
      setDepots(depotsData);
    } catch (error: any) {
      toast.error(error.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter items based on search term
  const filteredItems = activeTab === 'depots' 
    ? depots.filter(depot => 
        depot.depot_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        depot.region_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        depot.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : regions.filter(region => 
        region.region_name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      region_id: '',
      address: '',
      contact_phone: '',
      latitude: '',
      longitude: ''
    });
    setCurrentItem(null);
    setEditMode(false);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let response;
      const url = activeTab === 'depots' 
        ? editMode 
          ? `http://localhost:5000/api/depots/${currentItem?.depot_id}`
          : 'http://localhost:5000/api/depots'
        : editMode
          ? `http://localhost:5000/api/regions/${currentItem?.region_id}`
          : 'http://localhost:5000/api/regions';

      const method = editMode ? 'PUT' : 'POST';
      const body = activeTab === 'depots'
        ? {
            depot_name: formData.name,
            region_id: formData.region_id,
            address: formData.address,
            contact_phone: formData.contact_phone,
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude)
          }
        : {
            region_name: formData.name
          };

      response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(editMode ? 'Failed to update' : 'Failed to create');
      }

      const data = await response.json();
      toast.success(editMode ? 'Updated successfully' : 'Created successfully');
      
      // Update local state
      if (activeTab === 'depots') {
        if (editMode) {
          setDepots(depots.map(d => 
            d.depot_id === currentItem?.depot_id ? data : d
          ));
        } else {
          setDepots([...depots, data]);
        }
      } else {
        if (editMode) {
          setRegions(regions.map(r => 
            r.region_id === currentItem?.region_id ? data : r
          ));
        } else {
          setRegions([...regions, data]);
        }
      }

      resetForm();
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Error submitting form');
    }
  };

  // Edit item
  const handleEdit = (item: Depot | Region) => {
    setCurrentItem(item);
    setEditMode(true);
    setShowForm(true);
    
    if (activeTab === 'depots') {
      const depot = item as Depot;
      setFormData({
        name: depot.depot_name,
        region_id: depot.region_id,
        address: depot.address,
        contact_phone: depot.contact_phone,
        latitude: depot.latitude.toString(),
        longitude: depot.longitude.toString()
      });
    } else {
      const region = item as Region;
      setFormData({
        name: region.region_name,
        region_id: '',
        address: '',
        contact_phone: '',
        latitude: '',
        longitude: ''
      });
    }
  };

  // Delete item
  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab === 'depots' ? 'depot' : 'region'}?`)) return;

    try {
      const url = activeTab === 'depots' 
        ? `http://localhost:5000/api/depots/${id}`
        : `http://localhost:5000/api/regions/${id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${context?.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      // Update local state
      if (activeTab === 'depots') {
        setDepots(depots.filter(d => d.depot_id !== id));
      } else {
        setRegions(regions.filter(r => r.region_id !== id));
      }

      toast.success('Deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error deleting');
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-6">
        {/* Header and tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Depot & Region Management</h1>
          
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setActiveTab('depots');
                resetForm();
              }}
              className={`px-4 py-2 rounded-md ${activeTab === 'depots' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Depots
            </button>
            <button
              onClick={() => {
                setActiveTab('regions');
                resetForm();
              }}
              className={`px-4 py-2 rounded-md ${activeTab === 'regions' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Regions
            </button>
          </div>
        </div>

        {/* Search and actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative rounded-md shadow-sm w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiOutlineSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={fetchData}
              className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <HiOutlineRefresh className="mr-2" />
              Refresh
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
            >
              <HiOutlinePlus className="mr-2" />
              Add {activeTab === 'depots' ? 'Depot' : 'Region'}
            </button>
          </div>
        </div>

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editMode ? 'Edit' : 'Add'} {activeTab === 'depots' ? 'Depot' : 'Region'}
                </h2>
                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <HiOutlineX className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {activeTab === 'depots' ? 'Depot Name' : 'Region Name'} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {activeTab === 'depots' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Region *
                      </label>
                      <select
                        name="region_id"
                        value={formData.region_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Region</option>
                        {regions.map(region => (
                          <option key={region.region_id} value={region.region_id}>
                            {region.region_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        name="contact_phone"
                        value={formData.contact_phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Latitude *
                        </label>
                        <input
                          type="number"
                          name="latitude"
                          value={formData.latitude}
                          onChange={handleInputChange}
                          step="any"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Longitude *
                        </label>
                        <input
                          type="number"
                          name="longitude"
                          value={formData.longitude}
                          onChange={handleInputChange}
                          step="any"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editMode ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {activeTab === 'depots' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Depot Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Region
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          No depots found
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((depot) => (
                        <tr key={depot.depot_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <HiOutlineOfficeBuilding className="h-5 w-5" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {depot.depot_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {depot.depot_id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{depot.region_name}</div>
                            <div className="text-sm text-gray-500">ID: {depot.region_id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {depot.address}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {depot.contact_phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {depot.latitude}, {depot.longitude}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(depot.updated_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(depot)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <HiOutlinePencilAlt className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(depot.depot_id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <HiOutlineTrash className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Region Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Depot Count
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No regions found
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((region) => (
                        <tr key={region.region_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <HiOutlineLocationMarker className="h-5 w-5" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {region.region_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {region.region_id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {depots.filter(d => d.region_id === region.region_id).length} depots
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(region.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(region.updated_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(region)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <HiOutlinePencilAlt className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(region.region_id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <HiOutlineTrash className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepotAndRegions