import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DepotReport {
  depot: string;
  region: string;
  totalBuses: number;
  totalCrew: number;
  fleetUtilizationPercent: number;
  routesCovered: number;
  totalRoutes: number;
  activeCrew: number;
  crewOnLeave: number;
}

// 🔧 Mock Monthly and Yearly Data
const mockDepotReports: Record<'monthly' | 'yearly', DepotReport[]> = {
  monthly: [
    { depot: 'Colombo Depot', region: 'Western', totalBuses: 120, totalCrew: 250, fleetUtilizationPercent: 85, routesCovered: 30, totalRoutes: 32, activeCrew: 210, crewOnLeave: 40 },
    { depot: 'Pettah', region: 'Western', totalBuses: 80, totalCrew: 160, fleetUtilizationPercent: 72, routesCovered: 22, totalRoutes: 25, activeCrew: 130, crewOnLeave: 30 },
    { depot: 'Nugegoda', region: 'Western', totalBuses: 70, totalCrew: 150, fleetUtilizationPercent: 77, routesCovered: 20, totalRoutes: 21, activeCrew: 115, crewOnLeave: 35 },
    { depot: 'Kotte', region: 'Central', totalBuses: 65, totalCrew: 140, fleetUtilizationPercent: 79, routesCovered: 18, totalRoutes: 20, activeCrew: 110, crewOnLeave: 30 },
    { depot: 'Dehiwala', region: 'Central', totalBuses: 90, totalCrew: 180, fleetUtilizationPercent: 80, routesCovered: 25, totalRoutes: 27, activeCrew: 145, crewOnLeave: 35 },
  ],
  yearly: [
    { depot: 'Colombo Depot', region: 'Western', totalBuses: 125, totalCrew: 270, fleetUtilizationPercent: 87, routesCovered: 31, totalRoutes: 32, activeCrew: 230, crewOnLeave: 40 },
    { depot: 'Pettah', region: 'Western', totalBuses: 85, totalCrew: 170, fleetUtilizationPercent: 75, routesCovered: 24, totalRoutes: 25, activeCrew: 135, crewOnLeave: 35 },
    { depot: 'Nugegoda', region: 'Western', totalBuses: 75, totalCrew: 160, fleetUtilizationPercent: 79, routesCovered: 21, totalRoutes: 22, activeCrew: 120, crewOnLeave: 40 },
    { depot: 'Kotte', region: 'Central', totalBuses: 70, totalCrew: 150, fleetUtilizationPercent: 80, routesCovered: 19, totalRoutes: 20, activeCrew: 115, crewOnLeave: 35 },
    { depot: 'Dehiwala', region: 'Central', totalBuses: 95, totalCrew: 190, fleetUtilizationPercent: 83, routesCovered: 26, totalRoutes: 27, activeCrew: 150, crewOnLeave: 40 },
    { depot: 'Negombo', region: 'Northern', totalBuses: 60, totalCrew: 130, fleetUtilizationPercent: 70, routesCovered: 16, totalRoutes: 18, activeCrew: 100, crewOnLeave: 30 },
    { depot: 'Jaffna', region: 'Northern', totalBuses: 55, totalCrew: 120, fleetUtilizationPercent: 65, routesCovered: 14, totalRoutes: 16, activeCrew: 90, crewOnLeave: 30 },
  ],
};

const OpsReports = () => {
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedDepot, setSelectedDepot] = useState<string>('All');

  const depotReports = mockDepotReports[viewType].map((entry) => {
    const activeBuses = Math.round((entry.totalBuses * entry.fleetUtilizationPercent) / 100);
    return {
      ...entry,
      activeBuses,
      maintenanceBuses: entry.totalBuses - activeBuses,
    };
  });

  const regions = ['All', ...Array.from(new Set(depotReports.map((d) => d.region)))];
  const depots = ['All', ...Array.from(new Set(depotReports.map((d) => d.depot)))];

  const filteredDepots = depotReports.filter((d) =>
    (selectedRegion === 'All' || d.region === selectedRegion) &&
    (selectedDepot === 'All' || d.depot === selectedDepot)
  );

  const groupedByRegion = filteredDepots.reduce<Record<string, typeof filteredDepots>>((acc, curr) => {
    if (!acc[curr.region]) acc[curr.region] = [];
    acc[curr.region].push(curr);
    return acc;
  }, {});

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Operations Reports - Depot Summary</h1>
        <p className="text-gray-600 mb-6">
          Regional performance reports including fleet usage, crew availability, and route coverage.
        </p>

        {/* View Switch */}
        <div className="flex justify-between mb-4">
          <div className="space-x-2">
            <button
              className={`px-4 py-1 rounded ${viewType === 'monthly' ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setViewType('monthly')}
            >
              Monthly View
            </button>
            <button
              className={`px-4 py-1 rounded ${viewType === 'yearly' ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setViewType('yearly')}
            >
              Yearly View
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select className="border rounded px-2 py-1" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            <select className="border rounded px-2 py-1" value={selectedDepot} onChange={(e) => setSelectedDepot(e.target.value)}>
              {depots.map((depot) => (
                <option key={depot} value={depot}>
                  {depot}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Charts */}
        {Object.entries(groupedByRegion).map(([regionName, depots]) => (
          <div key={regionName} className="mb-12">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">{regionName} Region</h2>

            {/* Fleet Chart */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-2">Fleet by Depot</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={depots} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="depot" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="activeBuses" name="Active Buses" fill="#1E40AF" />
                  <Bar dataKey="maintenanceBuses" name="In Maintenance" fill="#60A5FA" />
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* Crew Chart */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-2">Crew by Depot</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={depots} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="depot" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="activeCrew" fill="#6276afff" name="Active Crew" />
                  <Bar dataKey="crewOnLeave" fill="#1b569fff" name="On Leave" />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OpsReports;
