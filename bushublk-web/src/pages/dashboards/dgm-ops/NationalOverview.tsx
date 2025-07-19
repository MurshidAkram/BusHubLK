import React, { useState } from 'react';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi';

interface DepotStats {
  depotName: string;
  routes: number;
  activeBuses: number;
  crewCount: number;
}

interface RegionDepotStats {
  [region: string]: DepotStats[];
}

const mockData: RegionDepotStats = {
  'Northern Region': [
    { depotName: 'Depot 1 - City Center', routes: 5, activeBuses: 12, crewCount: 24 },
    { depotName: 'Depot 2 - North Suburb', routes: 4, activeBuses: 10, crewCount: 20 },
  ],
  'Eastern Region': [
    { depotName: 'Depot 1 - East Central', routes: 6, activeBuses: 15, crewCount: 30 },
    { depotName: 'Depot 2 - Coastal Area', routes: 3, activeBuses: 8, crewCount: 16 },
  ],
};

// Mock detail data
const mockBusDetails = Array.from({ length: 12 }, (_, i) => ({
  number: `NB-100${i + 1}`,
  status: i % 2 === 0 ? 'On Route' : 'Idle',
}));

const mockCrewDetails = Array.from({ length: 24 }, (_, i) => ({
  name: `Crew Member ${i + 1}`,
  role: i % 2 === 0 ? 'Driver' : 'Conductor',
  status: i % 3 === 0 ? 'On Leave' : 'Active',
}));

const mockRoutes = [
  { route: '100 - Colombo – Panadura', buses: 3 },
  { route: '101 - Colombo – Moratuwa', buses: 2 },
  { route: '122 - Colombo – Avissawella', buses: 2 },
  { route: '154 - Colombo – Kiribathgoda', buses: 3 },
  { route: '120 - Colombo – Horana', buses: 2 },
];

const NationalOverview = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('Northern Region');
  const [selectedDepot, setSelectedDepot] = useState<string>('Depot 1 - City Center');

  const [showBuses, setShowBuses] = useState(false);
  const [showCrew, setShowCrew] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);

  const regions = Object.keys(mockData);
  const depots = mockData[selectedRegion];
  const selectedDepotStats = depots.find((d) => d.depotName === selectedDepot);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">National Operations Overview</h1>
        <p className="text-gray-600">Monitor active buses, crew counts, and route distributions across regions and depots.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Select Region</label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2"
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                const firstDepot = mockData[e.target.value][0]?.depotName;
                if (firstDepot) setSelectedDepot(firstDepot);
              }}
            >
              {regions.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Select Depot</label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2"
              value={selectedDepot}
              onChange={(e) => setSelectedDepot(e.target.value)}
            >
              {depots.map((depot) => (
                <option key={depot.depotName} value={depot.depotName}>{depot.depotName}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedDepotStats && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Statistics for {selectedDepot}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Active Buses */}
              <div
                className="bg-blue-50 p-4 rounded-xl shadow-sm cursor-pointer"
                onClick={() => setShowBuses(!showBuses)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm text-gray-500">Active Buses</h3>
                    <p className="text-2xl font-bold text-blue-800">{selectedDepotStats.activeBuses}</p>
                  </div>
                  {showBuses ? <HiChevronUp /> : <HiChevronDown />}
                </div>
                {showBuses && (
                  <ul className="mt-3 space-y-1 text-sm text-blue-900">
                    {mockBusDetails.map((bus) => (
                      <li key={bus.number} className="border-b border-blue-100 py-1">
                        {bus.number} - {bus.status}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Crew Members */}
              <div
                className="bg-green-50 p-4 rounded-xl shadow-sm cursor-pointer"
                onClick={() => setShowCrew(!showCrew)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm text-gray-500">Crew Members</h3>
                    <p className="text-2xl font-bold text-green-800">{selectedDepotStats.crewCount}</p>
                  </div>
                  {showCrew ? <HiChevronUp /> : <HiChevronDown />}
                </div>
                {showCrew && (
                  <ul className="mt-3 space-y-1 text-sm text-green-900">
                    {mockCrewDetails.map((crew, idx) => (
                      <li key={idx} className="border-b border-green-100 py-1">
                        {crew.name} - {crew.role} - {crew.status}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Routes */}
              <div
                className="bg-yellow-50 p-4 rounded-xl shadow-sm cursor-pointer"
                onClick={() => setShowRoutes(!showRoutes)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm text-gray-500">Routes</h3>
                    <p className="text-2xl font-bold text-yellow-800">{selectedDepotStats.routes}</p>
                  </div>
                  {showRoutes ? <HiChevronUp /> : <HiChevronDown />}
                </div>
                {showRoutes && (
                  <ul className="mt-3 space-y-1 text-sm text-yellow-900">
                    {mockRoutes.map((route, idx) => (
                      <li key={idx} className="border-b border-yellow-100 py-1">
                        {route.route} - {route.buses} buses
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NationalOverview;
