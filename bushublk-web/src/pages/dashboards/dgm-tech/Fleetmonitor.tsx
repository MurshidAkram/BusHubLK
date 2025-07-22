import { useState } from 'react';
import { HiEye, HiFilter, HiChevronDown, HiChevronUp, HiSearch, HiX } from 'react-icons/hi';

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
  'Colombo': boolean;
  'Gampaha': boolean;
  'Kaluthara': boolean;
  'Wayamba': boolean;
  'Mahanuwara': boolean;
  'Sabaragamuwa': boolean;
  'Southern': boolean;
  'Rajarata': boolean;
  'Uva': boolean;
  'Northern': boolean;
  'Eastern': boolean;
}

const FleetMonitor = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('Colombo');
  const [selectedDepot, setSelectedDepot] = useState<string>('Colombo Central Depot');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedRegions, setExpandedRegions] = useState<ExpandedRegions>({
    'Colombo': true,
    'Gampaha': false,
    'Kaluthara': false,
    'Wayamba': false,
    'Mahanuwara': false,
    'Sabaragamuwa': false,
    'Southern': false,
    'Rajarata': false,
    'Uva': false,
    'Northern': false,
    'Eastern': false
  });
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toggle region expansion
  const toggleRegion = (region: keyof ExpandedRegions) => {
    setExpandedRegions(prev => ({
      ...prev,
      [region]: !prev[region]
    }));
  };

  // Handle region selection
  const handleRegionClick = (regionName: string) => {
    setSelectedRegion(regionName);
    // Select the first depot in the region by default
    if (regionsData[regionName]?.depotsList.length > 0) {
      setSelectedDepot(regionsData[regionName].depotsList[0].name);
    }
  };

  // Handle depot selection
  const handleDepotClick = (depotName: string) => {
    setSelectedDepot(depotName);
  };

  // Get status badge styling
  const getStatusBadge = (status: 'Active' | 'Maintenance' | 'Inactive') => {
    switch (status) {
      case 'Active':
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800';
      case 'Maintenance':
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800';
      case 'Inactive':
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800';
      default:
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800';
    }
  };

  // Handle viewing bus details
  const handleViewBus = (bus: Bus) => {
    setSelectedBus(bus);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBus(null);
  };

  // Updated to match the 11 regions from the image
  const regionsData: RegionsData = {
    'Colombo': {
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
        { name: 'Fort Depot', buses: 50, underMaintenance: 3 }
      ]
    },
    'Gampaha': {
      depots: 6,
      buses: 350,
      depotsList: [
        { name: 'Gampaha Main Depot', buses: 80, underMaintenance: 7 },
        { name: 'Negombo Depot', buses: 60, underMaintenance: 5 },
        { name: 'Katunayake Depot', buses: 55, underMaintenance: 4 },
        { name: 'Mirigama Depot', buses: 50, underMaintenance: 3 },
        { name: 'Veyangoda Depot', buses: 50, underMaintenance: 3 },
        { name: 'Minuwangoda Depot', buses: 55, underMaintenance: 4 }
      ]
    },
    'Kaluthara': {
      depots: 5,
      buses: 300,
      depotsList: [
        { name: 'Kaluthara Main Depot', buses: 70, underMaintenance: 6 },
        { name: 'Panadura Depot', buses: 60, underMaintenance: 5 },
        { name: 'Horana Depot', buses: 50, underMaintenance: 4 },
        { name: 'Matugama Depot', buses: 50, underMaintenance: 3 },
        { name: 'Beruwala Depot', buses: 70, underMaintenance: 5 }
      ]
    },
    'Wayamba': {
      depots: 5,
      buses: 280,
      depotsList: [
        { name: 'Kurunegala Depot', buses: 70, underMaintenance: 6 },
        { name: 'Puttalam Depot', buses: 60, underMaintenance: 5 },
        { name: 'Chilaw Depot', buses: 50, underMaintenance: 4 },
        { name: 'Kuliyapitiya Depot', buses: 50, underMaintenance: 3 },
        { name: 'Nikaweratiya Depot', buses: 50, underMaintenance: 3 }
      ]
    },
    'Mahanuwara': {
      depots: 6,
      buses: 320,
      depotsList: [
        { name: 'Kandy Central Depot', buses: 80, underMaintenance: 7 },
        { name: 'Peradeniya Depot', buses: 60, underMaintenance: 5 },
        { name: 'Katugastota Depot', buses: 55, underMaintenance: 4 },
        { name: 'Gampola Depot', buses: 50, underMaintenance: 3 },
        { name: 'Nuwara Eliya Depot', buses: 50, underMaintenance: 3 },
        { name: 'Matale Main Depot', buses: 25, underMaintenance: 2 }
      ]
    },
    'Sabaragamuwa': {
      depots: 5,
      buses: 250,
      depotsList: [
        { name: 'Ratnapura Depot', buses: 70, underMaintenance: 6 },
        { name: 'Kegalle Depot', buses: 60, underMaintenance: 5 },
        { name: 'Balangoda Depot', buses: 50, underMaintenance: 4 },
        { name: 'Embilipitiya Depot', buses: 40, underMaintenance: 3 },
        { name: 'Kuruwita Depot', buses: 30, underMaintenance: 2 }
      ]
    },
    'Southern': {
      depots: 6,
      buses: 300,
      depotsList: [
        { name: 'Galle Main Depot', buses: 70, underMaintenance: 6 },
        { name: 'Matara Main Depot', buses: 60, underMaintenance: 5 },
        { name: 'Hambantota Depot', buses: 50, underMaintenance: 4 },
        { name: 'Ambalangoda Depot', buses: 45, underMaintenance: 3 },
        { name: 'Tangalle Depot', buses: 45, underMaintenance: 3 },
        { name: 'Tissamaharama Depot', buses: 30, underMaintenance: 2 }
      ]
    },
    'Rajarata': {
      depots: 5,
      buses: 270,
      depotsList: [
        { name: 'Anuradhapura Main Depot', buses: 80, underMaintenance: 7 },
        { name: 'Polonnaruwa Depot', buses: 60, underMaintenance: 5 },
        { name: 'Medawachchiya Depot', buses: 50, underMaintenance: 4 },
        { name: 'Kekirawa Depot', buses: 40, underMaintenance: 3 },
        { name: 'Habarana Depot', buses: 40, underMaintenance: 3 }
      ]
    },
    'Uva': {
      depots: 4,
      buses: 200,
      depotsList: [
        { name: 'Badulla Depot', buses: 70, underMaintenance: 6 },
        { name: 'Monaragala Depot', buses: 60, underMaintenance: 5 },
        { name: 'Bandarawela Depot', buses: 40, underMaintenance: 3 },
        { name: 'Haputale Depot', buses: 30, underMaintenance: 2 }
      ]
    },
    'Northern': {
      depots: 5,
      buses: 250,
      depotsList: [
        { name: 'Jaffna Main Depot', buses: 70, underMaintenance: 6 },
        { name: 'Vavuniya Depot', buses: 60, underMaintenance: 5 },
        { name: 'Kilinochchi Depot', buses: 50, underMaintenance: 4 },
        { name: 'Mannar Depot', buses: 40, underMaintenance: 3 },
        { name: 'Point Pedro Depot', buses: 30, underMaintenance: 2 }
      ]
    },
    'Eastern': {
      depots: 5,
      buses: 240,
      depotsList: [
        { name: 'Batticaloa Depot', buses: 70, underMaintenance: 6 },
        { name: 'Trincomalee Depot', buses: 60, underMaintenance: 5 },
        { name: 'Ampara Depot', buses: 50, underMaintenance: 4 },
        { name: 'Kalmunai Depot', buses: 40, underMaintenance: 3 },
        { name: 'Akkaraipattu Depot', buses: 20, underMaintenance: 1 }
      ]
    }
  };

  // SLTB Bus Data with common Sri Lankan bus models
  const getBusData = (region: string, depot: string): Bus[] => {
    const busData: BusData = {
      'Colombo': {
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
          }
        ]
      },
      'Gampaha': {
        'Gampaha Main Depot': [
          { 
            id: 'SLTB-GP-301', 
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
          }
        ]
      },
      'Kaluthara': {
        'Kaluthara Main Depot': [
          { 
            id: 'SLTB-KL-401', 
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
          }
        ]
      }
    };
    
    return busData[region]?.[depot] || [];
  };

  // Filter buses based on search term
  const filteredBuses = getBusData(selectedRegion, selectedDepot).filter(bus => 
    bus.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">SLTB Fleet Monitoring Dashboard</h1>
        <p className="text-gray-600">Monitor and manage SLTB fleet across all regions</p>
      </div>

      {/* Regions and Depots Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Select Region and Depot</h2>
        </div>
        
        <div className="p-4">
          {/* Regions */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">SLTB Regions</h3>
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