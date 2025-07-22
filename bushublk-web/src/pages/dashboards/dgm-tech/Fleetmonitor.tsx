import { useState } from 'react';
import { HiEye, HiPencil, HiFilter, HiDownload, HiChevronDown, HiChevronUp, HiSearch, HiX } from 'react-icons/hi';

interface Bus {
  id: string;
  model: string;
  status: 'Active' | 'Maintenance' | 'Inactive';
  lastService: string;
  nextService: string;
  issues: string;
  mileage?: number;
  fuelType?: string;
  capacity?: number;
  registrationDate?: string;
  manufacturer?: string;
}

interface Depot {
  name: string;
  buses: number;
  underMaintenance: number;
}

interface RegionData {
  depots: number;
  buses: number;
  depotsList: Depot[];
}

interface BusData {
  [region: string]: {
    [depot: string]: Bus[];
  };
}

interface RegionsData {
  [region: string]: RegionData;
}

interface ExpandedRegions {
  'Western Province': boolean;
  'Central Province': boolean;
  'Southern Province': boolean;
  'Northern Province': boolean;
  'Eastern Province': boolean;
  'North Western Province': boolean;
  'North Central Province': boolean;
  'Uva Province': boolean;
  'Sabaragamuwa Province': boolean;
}

const FleetMonitor = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('Western Province');
  const [selectedDepot, setSelectedDepot] = useState<string>('Colombo Central Depot');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedRegions, setExpandedRegions] = useState<ExpandedRegions>({
    'Western Province': true,
    'Central Province': false,
    'Southern Province': false,
    'Northern Province': false,
    'Eastern Province': false,
    'North Western Province': false,
    'North Central Province': false,
    'Uva Province': false,
    'Sabaragamuwa Province': false
  });
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // SLTB Regions Data - Updated to match Sri Lankan provinces
  const regionsData: RegionsData = {
    'Western Province': {
      depots: 8,
      buses: 450,
      depotsList: [
        { name: 'Colombo Central Depot', buses: 85, underMaintenance: 7 },
        { name: 'Pettah Depot', buses: 65, underMaintenance: 5 },
        { name: 'Narahenpita Depot', buses: 55, underMaintenance: 3 },
        { name: 'Ratmalana Depot', buses: 60, underMaintenance: 4 },
        { name: 'Kollupitiya Depot', buses: 45, underMaintenance: 2 },
        { name: 'Borella Depot', buses: 50, underMaintenance: 3 },
        { name: 'Dehiwala Depot', buses: 40, underMaintenance: 2 },
        { name: 'Gampaha Main Depot', buses: 50, underMaintenance: 3 }
      ]
    },
    'Central Province': {
      depots: 6,
      buses: 350,
      depotsList: [
        { name: 'Kandy Central Depot', buses: 80, underMaintenance: 7 },
        { name: 'Peradeniya Depot', buses: 60, underMaintenance: 5 },
        { name: 'Katugastota Depot', buses: 55, underMaintenance: 4 },
        { name: 'Gampola Depot', buses: 50, underMaintenance: 3 },
        { name: 'Nuwara Eliya Depot', buses: 50, underMaintenance: 3 },
        { name: 'Matale Main Depot', buses: 55, underMaintenance: 4 }
      ]
    },
    'Southern Province': {
      depots: 6,
      buses: 320,
      depotsList: [
        { name: 'Galle Main Depot', buses: 70, underMaintenance: 6 },
        { name: 'Matara Main Depot', buses: 60, underMaintenance: 5 },
        { name: 'Hambantota Depot', buses: 50, underMaintenance: 4 },
        { name: 'Ambalangoda Depot', buses: 45, underMaintenance: 3 },
        { name: 'Tangalle Depot', buses: 50, underMaintenance: 3 },
        { name: 'Tissamaharama Depot', buses: 45, underMaintenance: 3 }
      ]
    },
    'Northern Province': {
      depots: 5,
      buses: 280,
      depotsList: [
        { name: 'Jaffna Main Depot', buses: 70, underMaintenance: 6 },
        { name: 'Vavuniya Depot', buses: 60, underMaintenance: 5 },
        { name: 'Kilinochchi Depot', buses: 50, underMaintenance: 4 },
        { name: 'Mannar Depot', buses: 50, underMaintenance: 3 },
        { name: 'Point Pedro Depot', buses: 50, underMaintenance: 3 }
      ]
    },
    'Eastern Province': {
      depots: 5,
      buses: 250,
      depotsList: [
        { name: 'Batticaloa Depot', buses: 60, underMaintenance: 5 },
        { name: 'Trincomalee Depot', buses: 55, underMaintenance: 4 },
        { name: 'Ampara Depot', buses: 50, underMaintenance: 3 },
        { name: 'Kalmunai Depot', buses: 45, underMaintenance: 3 },
        { name: 'Akkaraipattu Depot', buses: 40, underMaintenance: 2 }
      ]
    },
    'North Western Province': {
      depots: 5,
      buses: 230,
      depotsList: [
        { name: 'Kurunegala Depot', buses: 60, underMaintenance: 5 },
        { name: 'Puttalam Depot', buses: 50, underMaintenance: 4 },
        { name: 'Chilaw Depot', buses: 45, underMaintenance: 3 },
        { name: 'Kuliyapitiya Depot', buses: 40, underMaintenance: 2 },
        { name: 'Nikaweratiya Depot', buses: 35, underMaintenance: 2 }
      ]
    },
    'North Central Province': {
      depots: 4,
      buses: 200,
      depotsList: [
        { name: 'Anuradhapura Main Depot', buses: 70, underMaintenance: 6 },
        { name: 'Polonnaruwa Depot', buses: 50, underMaintenance: 4 },
        { name: 'Medawachchiya Depot', buses: 45, underMaintenance: 3 },
        { name: 'Kekirawa Depot', buses: 35, underMaintenance: 2 }
      ]
    },
    'Uva Province': {
      depots: 5,
      buses: 180,
      depotsList: [
        { name: 'Badulla Depot', buses: 60, underMaintenance: 5 },
        { name: 'Monaragala Depot', buses: 50, underMaintenance: 4 },
        { name: 'Bandarawela Depot', buses: 35, underMaintenance: 2 },
        { name: 'Haputale Depot', buses: 20, underMaintenance: 1 },
        { name: 'Wellawaya Depot', buses: 15, underMaintenance: 1 }
      ]
    },
    'Sabaragamuwa Province': {
      depots: 5,
      buses: 200,
      depotsList: [
        { name: 'Ratnapura Depot', buses: 60, underMaintenance: 5 },
        { name: 'Kegalle Depot', buses: 50, underMaintenance: 4 },
        { name: 'Balangoda Depot', buses: 40, underMaintenance: 3 },
        { name: 'Embilipitiya Depot', buses: 30, underMaintenance: 2 },
        { name: 'Kuruwita Depot', buses: 20, underMaintenance: 1 }
      ]
    }
  };

  // SLTB Bus Data with common Sri Lankan bus models
  const getBusData = (region: string, depot: string): Bus[] => {
    const busData: BusData = {
      'Western Province': {
        'Colombo Central Depot': [
          { 
            id: 'SLTB-CC-101', 
            model: 'Leyland Titan', 
            status: 'Active', 
            lastService: '15 Jun 2023', 
            nextService: '15 Sep 2023', 
            issues: 'None',
            mileage: 245430,
            fuelType: 'Diesel',
            capacity: 60,
            registrationDate: '10 Jan 2018',
            manufacturer: 'Leyland'
          },
          { 
            id: 'SLTB-CC-102', 
            model: 'Ashok Leyland JanBus', 
            status: 'Maintenance', 
            lastService: '10 May 2023', 
            nextService: '10 Aug 2023', 
            issues: 'Engine overheating',
            mileage: 187650,
            fuelType: 'Diesel',
            capacity: 52,
            registrationDate: '22 Mar 2019',
            manufacturer: 'Ashok Leyland'
          },
          { 
            id: 'SLTB-CC-103', 
            model: 'TATA Starbus', 
            status: 'Active', 
            lastService: '22 Jun 2023', 
            nextService: '22 Sep 2023', 
            issues: 'AC not cooling',
            mileage: 195200,
            fuelType: 'Diesel',
            capacity: 50,
            registrationDate: '05 Aug 2020',
            manufacturer: 'TATA'
          }
        ],
        'Pettah Depot': [
          { 
            id: 'SLTB-PT-201', 
            model: 'Leyland Lynx', 
            status: 'Active', 
            lastService: '20 Jun 2023', 
            nextService: '20 Sep 2023', 
            issues: 'None',
            mileage: 212300,
            fuelType: 'Diesel',
            capacity: 48,
            registrationDate: '12 Feb 2017',
            manufacturer: 'Leyland'
          },
          { 
            id: 'SLTB-PT-202', 
            model: 'Ashok Leyland Oyster', 
            status: 'Maintenance', 
            lastService: '15 May 2023', 
            nextService: '15 Aug 2023', 
            issues: 'Brake system',
            mileage: 234780,
            fuelType: 'Diesel',
            capacity: 52,
            registrationDate: '08 Jul 2018',
            manufacturer: 'Ashok Leyland'
          }
        ]
      },
      'Central Province': {
        'Kandy Central Depot': [
          { 
            id: 'SLTB-KD-301', 
            model: 'TATA LPO 1613', 
            status: 'Active', 
            lastService: '12 Jun 2023', 
            nextService: '12 Sep 2023', 
            issues: 'None',
            mileage: 202450,
            fuelType: 'Diesel',
            capacity: 52,
            registrationDate: '25 Jan 2019',
            manufacturer: 'TATA'
          },
          { 
            id: 'SLTB-KD-302', 
            model: 'Ashok Leyland Viking', 
            status: 'Maintenance', 
            lastService: '08 May 2023', 
            nextService: '08 Aug 2023', 
            issues: 'Suspension',
            mileage: 256700,
            fuelType: 'Diesel',
            capacity: 48,
            registrationDate: '14 Sep 2017',
            manufacturer: 'Ashok Leyland'
          }
        ]
      },
      'Southern Province': {
        'Galle Main Depot': [
          { 
            id: 'SLTB-GL-401', 
            model: 'Leyland Tiger', 
            status: 'Active', 
            lastService: '28 Jun 2023', 
            nextService: '28 Sep 2023', 
            issues: 'None',
            mileage: 187650,
            fuelType: 'Diesel',
            capacity: 52,
            registrationDate: '03 May 2020',
            manufacturer: 'Leyland'
          },
          { 
            id: 'SLTB-GL-402', 
            model: 'TATA LPO 1618', 
            status: 'Active', 
            lastService: '25 Jun 2023', 
            nextService: '25 Sep 2023', 
            issues: 'Minor electrical issues',
            mileage: 165200,
            fuelType: 'Diesel',
            capacity: 50,
            registrationDate: '19 Mar 2021',
            manufacturer: 'TATA'
          }
        ]
      }
    };
    
    return busData[region]?.[depot] || [];
  };

  const toggleRegion = (regionName: keyof ExpandedRegions) => {
    setExpandedRegions(prev => ({
      ...prev,
      [regionName]: !prev[regionName]
    }));
  };

  const handleRegionClick = (regionName: string) => {
    setSelectedRegion(regionName);
    // Auto-select first depot of the region
    if (regionsData[regionName]?.depotsList.length > 0) {
      setSelectedDepot(regionsData[regionName].depotsList[0].name);
    }
  };

  const handleDepotClick = (depotName: string) => {
    setSelectedDepot(depotName);
  };

  const handleViewBus = (bus: Bus) => {
    setSelectedBus(bus);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBus(null);
  };

  const getStatusBadge = (status: Bus['status']) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'Active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Maintenance':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'Inactive':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const filteredBuses = getBusData(selectedRegion, selectedDepot).filter(bus =>
    bus.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">SLTB Fleet Monitoring Dashboard</h1>
        <p className="text-gray-600">Monitor and manage SLTB fleet across all provinces</p>
      </div>

      {/* Regions and Depots Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Select Province and Depot</h2>
        </div>
        
        <div className="p-4">
          {/* Regions */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">SLTB Provinces</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(regionsData).map(([regionName, regionData]) => (
                <div 
                  key={regionName}
                  onClick={() => handleRegionClick(regionName)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedRegion === regionName
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{regionName}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {regionData.depots} depots • {regionData.buses} buses
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRegion(regionName as keyof ExpandedRegions);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedRegions[regionName as keyof ExpandedRegions] ? (
                        <HiChevronUp className="w-5 h-5" />
                      ) : (
                        <HiChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Depots */}
          {selectedRegion && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Depots in {selectedRegion}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {regionsData[selectedRegion]?.depotsList.map((depot) => (
                  <div
                    key={depot.name}
                    onClick={() => handleDepotClick(depot.name)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedDepot === depot.name
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900">{depot.name}</h4>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-gray-600">
                        <span className="font-medium text-gray-800">{depot.buses}</span> buses
                      </span>
                      <span className="text-gray-600">
                        <span className="font-medium text-yellow-600">{depot.underMaintenance}</span> in maintenance
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buses Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Buses in {selectedDepot}
            </h2>
            <p className="text-sm text-gray-500">
              {filteredBuses.length} buses found
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search buses..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1">
                <HiFilter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bus ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Issues
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBuses.length > 0 ? (
                filteredBuses.map((bus) => (
                  <tr key={bus.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{bus.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bus.model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(bus.status)}>{bus.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bus.lastService}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bus.nextService}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bus.issues}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleViewBus(bus)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View details"
                        >
                          <HiEye className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No buses found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bus Details Modal */}
      {isModalOpen && selectedBus && (
        <div
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}
      >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedBus.id}</h2>
                  <p className="text-gray-600">{selectedBus.model}</p>
                </div>
                <button 
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <HiX className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Manufacturer</p>
                      <p className="text-gray-800">{selectedBus.manufacturer || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={getStatusBadge(selectedBus.status)}>{selectedBus.status}</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration Date</p>
                      <p className="text-gray-800">{selectedBus.registrationDate || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Passenger Capacity</p>
                      <p className="text-gray-800">{selectedBus.capacity || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Technical Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Mileage</p>
                      <p className="text-gray-800">{selectedBus.mileage ? `${selectedBus.mileage.toLocaleString()} km` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fuel Type</p>
                      <p className="text-gray-800">{selectedBus.fuelType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Service</p>
                      <p className="text-gray-800">{selectedBus.lastService}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Next Service</p>
                      <p className="text-gray-800">{selectedBus.nextService}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Issues</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className={selectedBus.issues === 'None' ? 'text-green-600' : 'text-gray-800'}>
                    {selectedBus.issues}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetMonitor;