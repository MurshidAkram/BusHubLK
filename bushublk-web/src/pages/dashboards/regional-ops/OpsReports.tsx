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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DepotReport {
  depot: string;
  totalBuses: number;
  totalCrew: number;
  fleetUtilizationPercent: number;
  routesCovered: number;
  totalRoutes: number;
  activeCrew: number;
  crewOnLeave: number;
}

const depotReports: DepotReport[] = [
  { depot: 'Colombo Depot', totalBuses: 120, totalCrew: 250, fleetUtilizationPercent: 85, routesCovered: 30, totalRoutes: 32, activeCrew: 210, crewOnLeave: 40 },
  { depot: 'Pettah', totalBuses: 80, totalCrew: 160, fleetUtilizationPercent: 72, routesCovered: 22, totalRoutes: 25, activeCrew: 130, crewOnLeave: 30 },
  { depot: 'Nugegoda', totalBuses: 70, totalCrew: 150, fleetUtilizationPercent: 77, routesCovered: 20, totalRoutes: 21, activeCrew: 115, crewOnLeave: 35 },
  { depot: 'Kotte', totalBuses: 65, totalCrew: 140, fleetUtilizationPercent: 79, routesCovered: 18, totalRoutes: 20, activeCrew: 110, crewOnLeave: 30 },
  { depot: 'Dehiwala', totalBuses: 90, totalCrew: 180, fleetUtilizationPercent: 80, routesCovered: 25, totalRoutes: 27, activeCrew: 145, crewOnLeave: 35 },
];

const COLORS = ['#1E3A8A', '#3B82F6']; // Blue palette

// Preprocess data to avoid decimals
const fleetData = depotReports.map((entry) => {
  const activeBuses = Math.round((entry.totalBuses * entry.fleetUtilizationPercent) / 100);
  return {
    ...entry,
    activeBuses,
    maintenanceBuses: entry.totalBuses - activeBuses,
  };
});

const OpsReports = () => {
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Operations Reports - Depot Summary</h1>
        <p className="text-gray-600 mb-6">
          Regional performance reports including fleet usage, crew availability, and route coverage.
        </p>

        {/* View Switch */}
        <div className="flex justify-end mb-4 space-x-2">
          <button
            className={`px-4 py-1 rounded ${
              viewType === 'monthly' ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-800'
            }`}
            onClick={() => setViewType('monthly')}
          >
            Monthly View
          </button>
          <button
            className={`px-4 py-1 rounded ${
              viewType === 'yearly' ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-800'
            }`}
            onClick={() => setViewType('yearly')}
          >
            Yearly View
          </button>
        </div>

        {/* Fleet Summary Bar Chart */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Fleet by Depot</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fleetData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
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

        {/* Crew Summary Bar Chart */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Crew by Depot</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={depotReports} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
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

        {/* Route Coverage Pie Charts */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Route Coverage per Depot</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {depotReports.map(({ depot, routesCovered, totalRoutes }) => {
              const data = [
                { name: 'Covered', value: routesCovered },
                { name: 'Remaining', value: totalRoutes - routesCovered },
              ];
              return (
                <div key={depot} className="text-center bg-gray-100 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{depot}</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={70}
                        fill="#171920ff"
                        dataKey="value"
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="mt-2 text-gray-700 font-medium">
                    {routesCovered} of {totalRoutes} routes covered
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default OpsReports;
