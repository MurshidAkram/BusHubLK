import React, { useState } from 'react';

type ServiceHistory = {
  date: string;
  type: string;
  cost: number;
  description: string;
};

type PartChange = {
  date: string;
  part: string;
  quantity: number;
  cost: number;
};

type Alert = {
  type: string;
  message: string;
};

type Bus = {
  id: string;
  registrationNumber: string;
  model: string;
  year: number;
  capacity: number;
  currentRoute: string;
  status: string;
  lastService: string;
  nextService: string;
  mileage: number;
  fuelEfficiency: number;
  driver: string;
  conductor: string;
  location: string;
  serviceHistory: ServiceHistory[];
  partChanges: PartChange[];
  alerts: Alert[];
};

const mockBuses: Bus[] =  [
  {
    id: 'BUS-001',
    registrationNumber: 'NC-1234',
    model: 'A',
    year: 2020,
    capacity: 45,
    currentRoute: 'Pettah - Dehiwala',
    status: 'Active',
    lastService: '2024-06-15',
    nextService: '2024-07-15',
    mileage: 125000,
    fuelEfficiency: 8.5,
    driver: 'Kasun Perera',
    conductor: 'Saman Silva',
    location: 'Pettah Depot',
    serviceHistory: [
      { date: '2024-06-15', type: 'Regular Service', cost: 15000, description: 'Oil change, brake inspection' },
      { date: '2024-05-20', type: 'Repair', cost: 8500, description: 'Engine cooling system repair' },
      { date: '2024-04-10', type: 'Regular Service', cost: 12000, description: 'Tire rotation, air filter change' }
    ],
    partChanges: [
      { date: '2024-06-15', part: 'Engine Oil', quantity: 1, cost: 3500 },
      { date: '2024-05-20', part: 'Radiator', quantity: 1, cost: 6500 },
      { date: '2024-04-10', part: 'Air Filter', quantity: 2, cost: 2000 }
    ],
    alerts: [
      { type: 'warning', message: 'Service due in 5 days' }
    ]
  },
  {
    id: 'BUS-002',
    registrationNumber: 'NC-5678',
    model: 'B',
    year: 2019,
    capacity: 52,
    currentRoute: 'Pettah - Wellawatte',
    status: 'In Service',
    lastService: '2024-06-20',
    nextService: '2024-07-20',
    mileage: 98000,
    fuelEfficiency: 9.2,
    driver: 'Nimal Fernando',
    conductor: 'Priya Jayawardena',
    location: 'En Route',
    serviceHistory: [
      { date: '2024-06-20', type: 'Regular Service', cost: 14000, description: 'Complete inspection, brake pad replacement' },
      { date: '2024-05-15', type: 'Repair', cost: 5500, description: 'Transmission fluid change' }
    ],
    partChanges: [
      { date: '2024-06-20', part: 'Brake Pads', quantity: 4, cost: 8000 },
      { date: '2024-05-15', part: 'Transmission Fluid', quantity: 1, cost: 2500 }
    ],
    alerts: []
  },
  {
    id: 'BUS-003',
    registrationNumber: 'NC-9012',
    model: 'A',
    year: 2021,
    capacity: 38,
    currentRoute: 'Colombo - Panadura',
    status: 'Maintenance',
    lastService: '2024-06-25',
    nextService: '2024-07-25',
    mileage: 67000,
    fuelEfficiency: 10.1,
    driver: 'Chamara Rathnayake',
    conductor: 'Dilani Perera',
    location: 'Maintenance Bay',
    serviceHistory: [
      { date: '2024-06-25', type: 'Major Service', cost: 25000, description: 'Engine overhaul, suspension check' }
    ],
    partChanges: [
      { date: '2024-06-25', part: 'Engine Gaskets', quantity: 1, cost: 12000 },
      { date: '2024-06-25', part: 'Shock Absorbers', quantity: 4, cost: 8000 }
    ],
    alerts: [
      { type: 'error', message: 'Under maintenance - ETA 2 days' }
    ]
  }
];

const Busmanagement: React.FC = () => {
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showDetails, setShowDetails] = useState(false);

  const filteredBuses = mockBuses.filter((bus) => {
    const matchesSearch =
      bus.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || bus.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function getStatusColor(status: string): string {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'In Service':
        return 'bg-blue-100 text-blue-800';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'Out of Service':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  const handleViewDetails = (bus: Bus) => {
    setSelectedBus(bus);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedBus(null);
  };

  const fleetStats = {
    total: mockBuses.length,
    active: mockBuses.filter((b) => b.status === 'Active').length,
    inService: mockBuses.filter((b) => b.status === 'In Service').length,
    maintenance: mockBuses.filter((b) => b.status === 'Maintenance').length,
    avgFuelEfficiency: (
      mockBuses.reduce((sum, b) => sum + b.fuelEfficiency, 0) / mockBuses.length
    ).toFixed(1),
  };

  return (
    <div className="space-y-6">
     

      {/* Fleet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Buses" value={fleetStats.total} color="text-blue-600" />
        <StatCard label="Active/In Service" value={fleetStats.active + fleetStats.inService} color="text-green-600" />
        <StatCard label="In Maintenance" value={fleetStats.maintenance} color="text-yellow-600" />
        <StatCard label="Avg Fuel Efficiency" value={`${fleetStats.avgFuelEfficiency} km/l`} color="text-purple-600" />
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by model"
            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Filter:</span>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="In Service">In Service</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Out of Service">Out of Service</option>
            </select>
          </div>
        </div>

        {/* Bus Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBuses.map((bus) => (
            <div key={bus.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{bus.registrationNumber}</h3>
                  <p className="text-sm text-gray-600">
                    {bus.model} ({bus.year})
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bus.status)}`}>
                  {bus.status}
                </span>
              </div>

              {bus.alerts.length > 0 && (
                <div className="mb-4">
                  {bus.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className="flex items-center text-sm text-yellow-700 bg-yellow-50 p-2 rounded"
                    >
                      <span className="mr-2">⚠️</span>
                      <span>{alert.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="mr-2">📍</span>
                  {bus.location}
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🛣️</span>
                  Route: {bus.currentRoute}
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📅</span>
                  Next Service: {bus.nextService}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <InfoPair label="Mileage" value={`${bus.mileage.toLocaleString()} km`} />
                <InfoPair label="Fuel Efficiency" value={`${bus.fuelEfficiency} km/l`} />
                <InfoPair label="Capacity" value={`${bus.capacity} seats`} />
                
              </div>

              <button
                onClick={() => handleViewDetails(bus)}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View Details
              </button>
            </div>
          ))}
        </div>

        {filteredBuses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No buses found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showDetails && selectedBus && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedBus.registrationNumber}</h2>
                  <p className="text-gray-600">
                    {selectedBus.model} ({selectedBus.year})
                  </p>
                </div>
                <button onClick={closeDetails} className="text-gray-400 hover:text-gray-600 text-2xl">
                  ×
                </button>
              </div>

              {/* Basic and Performance Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <DetailsSection title="Basic Information" data={[
                  ['Registration', selectedBus.registrationNumber],
                  ['Model', selectedBus.model],
                  ['Year', selectedBus.year],
                  ['Capacity', `${selectedBus.capacity} seats`],
                 
                ]} />

                <DetailsSection title="Performance" data={[
                  ['Total Mileage', `${selectedBus.mileage.toLocaleString()} km`],
                  ['Fuel Efficiency', `${selectedBus.fuelEfficiency} km/l`],
                  ['Last Service', selectedBus.lastService],
                  ['Next Service', selectedBus.nextService],
                  ['Status', (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedBus.status)}`}>
                      {selectedBus.status}
                    </span>
                  )]
                ]} />
              </div>

              {/* Tables */}
              <TableSection title="🔧 Service History" columns={['Date', 'Type', 'Description', 'Cost (LKR)']} rows={
                selectedBus.serviceHistory.map(item => [item.date, item.type, item.description, item.cost.toLocaleString()])
              } />

              <TableSection title="⚙️ Recent Part Changes" columns={['Date', 'Part', 'Quantity', 'Cost (LKR)']} rows={
                selectedBus.partChanges.map(item => [item.date, item.part, item.quantity, item.cost.toLocaleString()])
              } />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Components
const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center">
      <div className={`${color} text-2xl mr-3`}>📊</div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const InfoPair = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-gray-500">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

const DetailsSection = ({ title, data }: { title: string; data: [string, React.ReactNode][] }) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    <div className="space-y-3">
      {data.map(([label, value], idx) => (
        <div key={idx} className="flex justify-between">
          <span className="text-gray-600">{label}:</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  </div>
);

const TableSection = ({ title, columns, rows }: {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-4 flex items-center">{title}</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>{columns.map((col, i) => <th key={i} className="px-4 py-2 text-left">{col}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-2 ${j === row.length - 1 ? 'text-right' : ''}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default Busmanagement;
