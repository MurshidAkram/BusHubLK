import React from 'react';

type Alert = {
  type: 'warning' | 'error';
  message: string;
};

type Bus = {
  id: string;
  registrationNumber: string;
  model: string;
  year: number;
  status: string;
  location: string;
  nextService: string;
  alerts: Alert[];
};

const mockBuses: Bus[] = [
  {
    id: 'BUS-001',
    registrationNumber: 'NC-1234',
    model: 'Ashok Leyland Viking',
    year: 2020,
    status: 'Active',
    location: 'Pettah Depot',
    nextService: '2024-07-15',
    alerts: [
      { type: 'warning', message: 'Service due in 5 days' }
    ]
  },
  {
    id: 'BUS-002',
    registrationNumber: 'NC-5678',
    model: 'Tata Marcopolo',
    year: 2019,
    status: 'In Service',
    location: 'En Route',
    nextService: '2024-07-20',
    alerts: []
  },
  {
    id: 'BUS-003',
    registrationNumber: 'NC-9012',
    model: 'Eicher Skyline',
    year: 2021,
    status: 'Maintenance',
    location: 'Maintenance Bay',
    nextService: '2024-07-25',
    alerts: [
      { type: 'error', message: 'Under maintenance - ETA 2 days' }
    ]
  }
];

const MaintenanceAlerts: React.FC = () => {
  const maintenanceBuses = mockBuses.filter(bus => bus.status === 'Maintenance');
  const busesWithAlerts = mockBuses.filter(bus => bus.alerts && bus.alerts.length > 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Maintenance Alerts</h1>
        <p className="text-gray-600">View all buses that are under maintenance or require urgent service attention.</p>
      </div>

      {/* Buses under maintenance */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-yellow-800 mb-4">Currently Under Maintenance</h2>
        {maintenanceBuses.length > 0 ? (
          <ul className="space-y-4">
            {maintenanceBuses.map(bus => (
              <li key={bus.id} className="border border-yellow-200 p-4 rounded-md bg-yellow-50">
                <p className="text-gray-900 font-semibold">{bus.registrationNumber} - {bus.model}</p>
                <p className="text-sm text-gray-700">Location: {bus.location}</p>
                <p className="text-sm text-gray-600">
                  {bus.alerts.find(alert => alert.type === 'error')?.message || 'In maintenance'}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No buses are currently under maintenance.</p>
        )}
      </div>

      {/* Buses with service alerts */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-4"> Upcoming Service Alerts</h2>
        {busesWithAlerts.length > 0 ? (
          <ul className="space-y-4">
            {busesWithAlerts.map(bus => (
              <li key={bus.id} className="border border-red-200 p-4 rounded-md bg-red-50">
                <p className="text-gray-900 font-semibold">{bus.registrationNumber} - {bus.model}</p>
                {bus.alerts.map((alert, index) => (
                  <p key={index} className="text-sm text-red-700"> {alert.message}</p>
                ))}
                <p className="text-sm text-gray-700">Next Service: {bus.nextService}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No upcoming service alerts.</p>
        )}
      </div>
    </div>
  );
};

export default MaintenanceAlerts;
