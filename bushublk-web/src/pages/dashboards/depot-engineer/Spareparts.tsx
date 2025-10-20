import React, { useState, useEffect, useContext } from 'react';
import { FaSearch, FaBoxes, FaTools, FaPlusCircle, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { AppContext } from '../../../context/AppContext';
import axios, { AxiosError } from 'axios';

interface SparePart {
  id: string;
  part_id: string;
  part_name: string;
  current_stock: number;
  last_restocked: string;
  unit: string;
  created_at: string;
}

interface Bus {
  bus_id: number;
  registration_number: string;
  depot_id: number;
  class: string;
  manufacturer: string;
  model?: string;
  year?: number;
  status: string;
  depot_name?: string;
  region_name?: string;
}

interface AppContextType {
  user: { role: string; userId: string; depot_id?: string; } | null;
  token: string | null;
}


const SparePartsInventory: React.FC = () => {
  // @ts-ignore
  const context = useContext(AppContext) as AppContextType | null;
  const token = context?.token;

  // State management
  const [parts, setParts] = useState<SparePart[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedBusId, setSelectedBusId] = useState<string>('');

  // Modal states
  const [showUsePartModal, setShowUsePartModal] = useState<boolean>(false);
  const [showRestockModal, setShowRestockModal] = useState<boolean>(false);
  const [showAddPartModal, setShowAddPartModal] = useState<boolean>(false);
  const [restockQuantity, setRestockQuantity] = useState<number>(0);
  const [newPart, setNewPart] = useState<{
    part_name: string;
    current_stock: number;
    unit: string;
  }>({
    part_name: '',
    current_stock: 0,
    unit: ''
  });

  // Sample bus data for dropdown
  // const buses = [
  //   { id: '17', Reg_number: 'NC-1234' },
  //   { id: '23', Reg_number: 'NP-3456' },
  //   { id: '21', Reg_number: 'LA-9831' }
  // ];

  // Send notification when part goes out of stock
  const sendOutOfStockNotification = async (partId: string, partName: string) => {
    try {
      console.log('📢 Sending out of stock notification for:', partName);
      
      if (!token) {
        console.log('❌ No token available for notification');
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/depot-engineer/notifications/out-of-stock`,
        {
          part_id: partId,
          part_name: partName,
          message: `Spare part "${partName}" (ID: ${partId}) is now out of stock and requires immediate restocking.`,
          type: 'out_of_stock',
          priority: 'high'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.data.success) {
        console.log('✅ Out of stock notification sent successfully');
      } else {
        console.error('❌ Failed to send notification:', response.data.message);
      }
    } catch (err) {
      console.error('💥 Send notification error:', err);
    }
  };

  // Fetch buses from API
  const fetchBuses = async () => {
    try {
      console.log('🚌 Fetching buses...');
      
      if (!token) {
        console.log('❌ No token available for fetching buses');
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/depot-engineer/buses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('📥 Buses response:', response.data);

      if (response.data.success && response.data.buses) {
        console.log('✅ Buses fetched:', response.data.buses);

        const depotId = context?.user?.depot_id;
        const maintenanceBuses = response.data.buses.filter((bus: Bus) => {
          const isMaintenance = (bus.status || '').toLowerCase() === 'maintenance';
          const isSameDepot = depotId ? String(bus.depot_id) === String(depotId) : true;
          return isMaintenance && isSameDepot;
        });

        setBuses(maintenanceBuses);
      } else {
        console.error('❌ Failed to fetch buses:', response.data.message);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('💥 Fetch buses error:', axiosError);
      console.error('💥 Error response:', axiosError.response?.data);
    }
  };

  // Fetch spare parts from API
  const fetchSpareParts = async () => {
    try {
      console.log('🔄 Fetching spare parts...');
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      setLoading(true);
      setError(null);
      
      if (!token) {
        setError('Authentication token is missing. Please log in.');
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/depot-engineer/spare-parts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('📥 Fetch response:', response.data);

      if (response.data.success) {
        console.log('✅ Parts fetched:', response.data.parts);
        setParts(response.data.parts);
      } else {
        console.error('❌ Fetch failed:', response.data.message);
        setError(response.data.message || 'Failed to fetch spare parts');
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('💥 Fetch spare parts error:', axiosError);
      console.error('💥 Error response:', axiosError.response?.data);
      console.error('💥 Error status:', axiosError.response?.status);
      setError('Failed to fetch spare parts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Add new spare part
  const addSparePart = async () => {
    try {
      console.log('🔧 Adding spare part:', newPart);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      if (!newPart.part_name.trim() || !newPart.unit.trim()) {
        setError('Part name and unit are required');
        return;
      }

      if (!token) {
        setError('Authentication token is missing. Please log in.');
        return;
      }

      const requestData = {
        part_name: newPart.part_name,
        current_stock: newPart.current_stock,
        unit: newPart.unit
      };
      console.log('📤 Request data:', requestData);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/depot-engineer/spare-parts`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log('📥 Response:', response.data);

      if (response.data.success) {
        console.log('✅ Part added successfully');
        await fetchSpareParts(); // Refresh the list
        setShowAddPartModal(false);
        setNewPart({
          part_name: '',
          current_stock: 0,
          unit: ''
        });
        setError(null);
      } else {
        console.error('❌ Backend error:', response.data.message);
        setError(response.data.message || 'Failed to add spare part');
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('💥 Add spare part error:', axiosError);
      console.error('💥 Error response:', axiosError.response?.data);
      console.error('💥 Error status:', axiosError.response?.status);
      const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Unknown error';
      setError(`Failed to add spare part: ${errorMessage}`);
    }
  };

  // Restock spare part
  const restockSparePart = async () => {
    if (!selectedPart || restockQuantity <= 0) return;

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/depot-engineer/spare-parts/${selectedPart.part_id}/restock`,
        {
          current_stock: selectedPart.current_stock + restockQuantity
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        await fetchSpareParts(); // Refresh the list
        setShowRestockModal(false);
        setSelectedPart(null);
        setRestockQuantity(0);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to restock spare part');
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Restock spare part error:', axiosError);
      setError('Failed to restock spare part. Please try again later.');
    }
  };

  // Use spare part
  const useSparePart = async () => {
    if (!selectedPart || quantity <= 0 || !selectedBusId) return;

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/depot-engineer/spare-parts/${selectedPart.part_id}/use`,
        {
          quantity_used: quantity,
          bus_id: selectedBusId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Check if part will be out of stock after this usage
        const newStock = selectedPart.current_stock - quantity;
        if (newStock === 0) {
          // Send out of stock notification
          await sendOutOfStockNotification(selectedPart.part_id, selectedPart.part_name);
        }
        
        await fetchSpareParts(); // Refresh the list
        setShowUsePartModal(false);
        setSelectedPart(null);
        setQuantity(1);
        setSelectedBusId('');
        setError(null);
      } else {
        setError(response.data.message || 'Failed to use spare part');
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Use spare part error:', axiosError);
      setError('Failed to use spare part. Please try again later.');
    }
  };

  // Delete spare part
  const deleteSparePart = async (partId: string, partName: string) => {
    if (!confirm(`Are you sure you want to delete "${partName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting spare part:', partId);
      
      if (!token) {
        setError('Authentication token is missing. Please log in.');
        return;
      }

      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/depot-engineer/spare-parts/${partId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('📥 Delete response:', response.data);

      if (response.data.success) {
        console.log('✅ Part deleted successfully');
        await fetchSpareParts(); // Refresh the list
        setError(null);
      } else {
        console.error('❌ Backend error:', response.data.message);
        setError(response.data.message || 'Failed to delete spare part');
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('💥 Delete spare part error:', axiosError);
      console.error('💥 Error response:', axiosError.response?.data);
      console.error('💥 Error status:', axiosError.response?.status);
      const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Unknown error';
      setError(`Failed to delete spare part: ${errorMessage}`);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchSpareParts();
    fetchBuses();
  }, [token]);

  // Check for out of stock parts when parts data changes
  useEffect(() => {
    if (parts.length > 0) {
      const outOfStockParts = parts.filter(p => p.current_stock === 0);
      if (outOfStockParts.length > 0) {
        console.log(`⚠️ Found ${outOfStockParts.length} out of stock parts:`, outOfStockParts);
        // Automatically send notifications for out of stock parts
        outOfStockParts.forEach(part => {
          sendOutOfStockNotification(part.part_id, part.part_name);
        });
      }
    }
  }, [parts]);

  // Filter parts based on search and low stock filter
  const filteredParts = parts.filter(part => {
    const matchesSearch = 
      part.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.part_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPartTypes = parts.length;
  const totalUnitsInStock = parts.reduce((sum, part) => sum + (Number(part.current_stock) || 0), 0);
  const lowStockCount = parts.filter(part => part.current_stock > 0 && part.current_stock < 10).length;
  const outOfStockCount = parts.filter(part => part.current_stock === 0).length;
  const inStockCount = parts.filter(part => part.current_stock > 0).length;

  // Get stock status color
  const getStockStatus = (part: SparePart) => {
    if (part.current_stock === 0) return 'bg-red-100 text-red-800';
    if (part.current_stock < 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <FaBoxes className="text-2xl text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Spare Parts Inventory</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-grow">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
            
            {/* Low Stock Toggle */}
            {/* <label className="flex items-center space-x-2 whitespace-nowrap">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Low Stock Only</span>
            </label> */}
            
            {/* Add Part Button */}
            <button
              onClick={() => setShowAddPartModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors"
            >
              <FaPlusCircle />
              Add New Part
            </button>
          </div>
        </div>

        {/* Inventory Snapshot */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              {/* <h2 className="text-lg font-semibold text-gray-800">Inventory Snapshot</h2> */}
              <p className="text-sm text-gray-500"> overview of spare parts availability</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-6">
            {/* <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Part Types</div>
              <div className="mt-2 text-2xl font-semibold text-blue-900">{totalPartTypes}</div>
              <p className="text-xs text-blue-700 mt-1">Unique items tracked</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
              <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Units In Stock</div>
              <div className="mt-2 text-2xl font-semibold text-indigo-900">{totalUnitsInStock.toLocaleString()}</div>
              <p className="text-xs text-indigo-700 mt-1">Available quantity across all parts</p>
            </div> */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">In Stock</div>
              <div className="mt-2 text-2xl font-semibold text-emerald-900">{inStockCount}</div>
              <p className="text-xs text-emerald-700 mt-1">Parts currently available</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Low Stock</div>
              <div className="mt-2 text-2xl font-semibold text-amber-900">{lowStockCount}</div>
              <p className="text-xs text-amber-700 mt-1">Below safety threshold of 10 units</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <div className="text-xs font-semibold text-red-600 uppercase tracking-wide">Out of Stock</div>
              <div className="mt-2 text-2xl font-semibold text-red-900">{outOfStockCount}</div>
              <p className="text-xs text-red-700 mt-1">Require immediate restock</p>
            </div>
          </div>
        </div>

        {/* Out of Stock Notifications */}
        {parts.filter(p => p.current_stock === 0).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  ⚠️ Urgent: Parts Out of Stock
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {parts.filter(p => p.current_stock === 0).map((part) => (
                      <li key={part.id} className="flex items-center justify-between">
                        <span>
                          <strong>{part.part_name}</strong> (ID: {part.part_id})
                        </span>
                        <button
                          onClick={() => {
                            setSelectedPart(part);
                            setShowRestockModal(true);
                          }}
                          className="ml-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          Restock Now
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Low Stock Warnings intentionally removed */}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-700">{error}</div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-center">
              <div className="text-gray-500">Loading spare parts...</div>
            </div>
          </div>
        )}

        {/* Parts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {/*    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part ID</th>*/}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Restocked</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredParts.length > 0 ? (
                  filteredParts.map((part) => (
                    <tr key={part.id} className="hover:bg-gray-50">
                   {/*   <td className="px-6 py-4">
                        <div className="font-medium text-blue-600">{part.part_id}</div>
                      </td>
                   */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{part.part_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStockStatus(part)}`}>
                            {part.current_stock} {part.unit}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {part.last_restocked ? formatDate(part.last_restocked) : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPart(part);
                              setShowUsePartModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
                            disabled={part.current_stock === 0}
                          >
                            <FaTools size={12} />
                            Use
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPart(part);
                              setShowRestockModal(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Restock
                          </button>
                          <button
                            onClick={() => deleteSparePart(part.part_id, part.part_name)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
                          >
                            <FaTrash size={12} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      {loading ? 'Loading...' : 'No spare parts found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Use Part Modal */}
        {showUsePartModal && selectedPart && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Use Spare Part</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part</label>
                  <p className="text-gray-900">{selectedPart.part_name} ({selectedPart.part_id})</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Stock</label>
                  <p className="text-gray-900">{selectedPart.current_stock} {selectedPart.unit}</p>
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity to Use
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedPart.current_stock}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="busSelect" className="block text-sm font-medium text-gray-700 mb-1">
                    Bus
                  </label>
                  <select
                    id="busSelect"
                    value={selectedBusId}
                    onChange={(e) => setSelectedBusId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Bus</option>
                    {buses.map(bus => (
                      <option key={bus.bus_id} value={bus.bus_id}>{bus.registration_number}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowUsePartModal(false);
                    setSelectedPart(null);
                    setQuantity(1);
                    setSelectedBusId('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={useSparePart}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  disabled={quantity <= 0 || !selectedBusId || quantity > selectedPart.current_stock}
                >
                  Use Part
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Restock Modal */}
        {showRestockModal && selectedPart && (
           <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Restock Spare Part</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part</label>
                  <p className="text-gray-900">{selectedPart.part_name} ({selectedPart.part_id})</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <p className="text-gray-900">{selectedPart.current_stock} {selectedPart.unit}</p>
                </div>
                <div>
                  <label htmlFor="restockQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity to Add
                  </label>
                  <input
                    id="restockQuantity"
                    type="number"
                    min="1"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRestockModal(false);
                    setSelectedPart(null);
                    setRestockQuantity(0);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={restockSparePart}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  disabled={restockQuantity <= 0}
                >
                  Restock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Part Modal */}
        {showAddPartModal && (
           <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add New Spare Part</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="partName" className="block text-sm font-medium text-gray-700 mb-1">
                    Part Name
                  </label>
                  <input
                    id="partName"
                    type="text"
                    value={newPart.part_name}
                    onChange={(e) => setNewPart({...newPart, part_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Brake Pads"
                  />
                </div>
                <div>
                  <label htmlFor="initialStock" className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Stock
                  </label>
                  <input
                    id="initialStock"
                    type="number"
                    min="0"
                    value={newPart.current_stock}
                    onChange={(e) => setNewPart({...newPart, current_stock: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <input
                    id="unit"
                    type="text"
                    value={newPart.unit}
                    onChange={(e) => setNewPart({...newPart, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., pieces,dozen"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddPartModal(false);
                    setNewPart({
                      part_name: '',
                      current_stock: 0,
                      unit: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addSparePart}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  disabled={!newPart.part_name.trim() || !newPart.unit.trim()}
                >
                  Add Part
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SparePartsInventory;
