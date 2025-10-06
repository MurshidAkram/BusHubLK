import React, { useState, useEffect, useContext } from 'react';
import { FaEye, FaTimes } from 'react-icons/fa';
import { AppContext } from '../../../context/AppContext';

interface DepotData {
  depot: string;
  depot_id: number;
  region_name: string;
  active: number;
  in_service: number;
  out_of_service: number;
  under_maintenance: number;
  lastInspection: string;
}

const Regionservicemonitor: React.FC = () => {
  const context = useContext(AppContext);
  const token = context?.token;
  
  const [data, setData] = useState<DepotData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepot, setSelectedDepot] = useState<DepotData | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DepotData | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Helper function to format numbers properly
  const formatNumber = (num: number): string => {
    return Number(num).toLocaleString();
  };

  // Fetch depot service monitor data
  useEffect(() => {
    const fetchDepotData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!token) {
          setError('Authentication token is missing');
          return;
        }

        const response = await fetch('http://localhost:5000/api/depots/service-monitor', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result.depots || []);
      } catch (err) {
        console.error('Error fetching depot data:', err);
        setError('Failed to fetch depot data');
      } finally {
        setLoading(false);
      }
    };

    fetchDepotData();
  }, [token]);

  const handleDepotClick = (depot: DepotData) => {
    setSelectedDepot(depot);
  };

  const handleDetailsClick = (depot: DepotData) => {
    setSelectedDetail(depot);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDetail(null);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center text-gray-500">Loading depot data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  // Group depots by region
  const regions = Array.from(new Set(data.map(d => d.region_name)));
  const depotsByRegion: { [region: string]: DepotData[] } = {};
  regions.forEach(region => {
    depotsByRegion[region] = data.filter(d => d.region_name === region);
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Service status by Depot</h1>

        {/* Regions List */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Regions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {regions.map(region => (
              <div
                key={region}
                className={`p-4 rounded-lg cursor-pointer transition-colors duration-200 border ${selectedDepot && selectedDepot.region_name === region ? 'bg-blue-100 border-blue-300 text-blue-800' : 'hover:bg-gray-50 border-gray-200'}`}
                onClick={() => setSelectedDepot(null)}
              >
                <div className="font-medium text-lg">{region}</div>
                <div className="text-sm text-gray-600 mt-2">{depotsByRegion[region].length} Depots</div>
              </div>
            ))}
          </div>
        </div>

        {/* Depots List */}
        {!selectedDepot && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Depots</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map(depot => (
                <div
                  key={depot.depot_id}
                  className="p-4 rounded-lg cursor-pointer transition-colors duration-200 border hover:bg-blue-50 border-gray-200"
                  onClick={() => handleDepotClick(depot)}
                >
                  <div className="font-medium text-base">{depot.depot}</div>
                  <div className="text-sm text-gray-500 mt-1">Region: {depot.region_name}</div>
                  <div className="flex justify-between items-center mt-3 text-sm">
                    <span className="text-gray-600">Active: {formatNumber(depot.active)}</span>
                    <span className="text-gray-600">In Service: {formatNumber(depot.in_service)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm">
                    <span className="text-red-600">Out: {formatNumber(depot.out_of_service)}</span>
                    <span className="text-yellow-600">Maint: {formatNumber(depot.under_maintenance)}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">Last Inspection: {depot.lastInspection}</div>
                  {/* <button
                    onClick={e => { e.stopPropagation(); handleDetailsClick(depot); }}
                    className="mt-3 inline-flex items-center px-3 py-1 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaEye className="w-3 h-3 mr-1" />
                    Details
                  </button> */}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Depot Details */}
        {selectedDepot && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{selectedDepot.depot} Depot</h3>
                <p className="text-sm text-gray-600 mt-1">Region: {selectedDepot.region_name}</p>
              </div>
              <button
                onClick={() => setSelectedDepot(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Active</div>
                <div className="text-xl font-bold text-green-600">{formatNumber(selectedDepot.active)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">In Service</div>
                <div className="text-xl font-bold text-blue-600">{formatNumber(selectedDepot.in_service)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Out of Service</div>
                <div className="text-xl font-bold text-red-600">{formatNumber(selectedDepot.out_of_service)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Under Maintenance</div>
                <div className="text-xl font-bold text-yellow-600">{formatNumber(selectedDepot.under_maintenance)}</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">Last Inspection: {selectedDepot.lastInspection}</div>
            <div className="mt-4 text-lg font-semibold text-blue-700">Total Vehicles: {formatNumber(selectedDepot.active + selectedDepot.in_service + selectedDepot.out_of_service + selectedDepot.under_maintenance)}</div>
          </div>
        )}

        {/* Detail Modal */}
        {showModal && selectedDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedDetail.depot} Depot Details
                </h3>
                <button 
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Vehicles:</span>
                    <span className="font-medium text-green-600">{formatNumber(selectedDetail.active)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">In Service:</span>
                    <span className="font-medium text-blue-600">{formatNumber(selectedDetail.in_service)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Out of Service:</span>
                    <span className="font-medium text-red-600">{formatNumber(selectedDetail.out_of_service)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Under Maintenance:</span>
                    <span className="font-medium text-yellow-600">{formatNumber(selectedDetail.under_maintenance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Inspection:</span>
                    <span className="font-medium">
                      {selectedDetail.lastInspection === 'Never' ? (
                        <span className="text-red-500">Never</span>
                      ) : (
                        selectedDetail.lastInspection
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-4">
                    <span className="text-gray-600 font-semibold">Total Vehicles:</span>
                    <span className="font-medium text-blue-600">
                      {formatNumber(selectedDetail.active + selectedDetail.in_service + selectedDetail.out_of_service + selectedDetail.under_maintenance)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Regionservicemonitor;