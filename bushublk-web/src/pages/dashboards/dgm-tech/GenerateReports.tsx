import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DepotReport {
  region: string;
  depot: string;
  totalBuses: number;
  totalCrew: number;
  fleetUtilizationPercent: number;
  routesCovered: number;
  totalRoutes: number;
}

const depotReports: DepotReport[] = [
  { region: 'Western', depot: 'Colombo Depot', totalBuses: 120, totalCrew: 250, fleetUtilizationPercent: 85, routesCovered: 30, totalRoutes: 32 },
  { region: 'Western', depot: 'Pettah', totalBuses: 80, totalCrew: 160, fleetUtilizationPercent: 72, routesCovered: 22, totalRoutes: 25 },
  { region: 'Western', depot: 'Nugegoda', totalBuses: 70, totalCrew: 150, fleetUtilizationPercent: 77, routesCovered: 20, totalRoutes: 21 },
  { region: 'Southern', depot: 'Kotte', totalBuses: 65, totalCrew: 140, fleetUtilizationPercent: 79, routesCovered: 18, totalRoutes: 20 },
  { region: 'Southern', depot: 'Dehiwala', totalBuses: 90, totalCrew: 180, fleetUtilizationPercent: 80, routesCovered: 25, totalRoutes: 27 },
];

const groupByRegion = (reports: DepotReport[]) => {
  const grouped: { [region: string]: DepotReport[] } = {};
  for (const report of reports) {
    if (!grouped[report.region]) {
      grouped[report.region] = [];
    }
    grouped[report.region].push(report);
  }
  return grouped;
};

const calculateRegionStats = (depots: DepotReport[]) => {
  const totalBuses = depots.reduce((sum, d) => sum + d.totalBuses, 0);
  const totalCrew = depots.reduce((sum, d) => sum + d.totalCrew, 0);
  const avgUtil = depots.reduce((sum, d) => sum + d.fleetUtilizationPercent, 0) / depots.length;
  const totalRoutes = depots.reduce((sum, d) => sum + d.totalRoutes, 0);
  const coveredRoutes = depots.reduce((sum, d) => sum + d.routesCovered, 0);
  const coveragePercent = (coveredRoutes / totalRoutes) * 100;

  return {
    totalBuses,
    totalCrew,
    avgUtil: parseFloat(avgUtil.toFixed(2)),
    coveragePercent: parseFloat(coveragePercent.toFixed(2)),
  };
};

const GenerateReports = () => {
  const regions = groupByRegion(depotReports);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Region-wise Depot Reports</h1>
      <p className="text-gray-600 mb-6">
        Summarized operational reports by region including fleet stats and visual comparison between depots.
      </p>

      {Object.entries(regions).map(([regionName, depots]) => {
        const stats = calculateRegionStats(depots);

        return (
          <section key={regionName} className="border rounded-lg p-4 shadow-sm">
            <h2 className="text-xl font-bold mb-2 text-blue-800">{regionName} Region Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 text-gray-700">
              <div className="bg-gray-100 p-3 rounded-lg">Total Buses: <strong>{stats.totalBuses}</strong></div>
              <div className="bg-gray-100 p-3 rounded-lg">Total Crew: <strong>{stats.totalCrew}</strong></div>
              <div className="bg-gray-100 p-3 rounded-lg">Fleet Utilization: <strong>{stats.avgUtil}%</strong></div>
              <div className="bg-gray-100 p-3 rounded-lg">Route Coverage: <strong>{stats.coveragePercent}%</strong></div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={depots} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="depot" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="fleetUtilizationPercent" fill="#3182CE" name="Fleet Utilization (%)" />
              </BarChart>
            </ResponsiveContainer>
          </section>
        );
      })}
    </div>
  );
};

export default GenerateReports;