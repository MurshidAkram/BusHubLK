import React from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

// Define types for data
type OperationsSummary = {
  day: string;
  routesAssigned: number;
};

type FleetServiceHistory = {
  bus: string;
  services: number;
  partsChanged: number;
};

// Mock Data
const fleetServiceHistory: FleetServiceHistory[] = [
  { bus: 'Bus 01', services: 5, partsChanged: 2 },
  { bus: 'Bus 02', services: 8, partsChanged: 3 },
  { bus: 'Bus 03', services: 4, partsChanged: 1 },
  { bus: 'Bus 04', services: 7, partsChanged: 4 },
];

const operationsSummary: OperationsSummary[] = [
  { day: 'Mon', routesAssigned: 12 },
  { day: 'Tue', routesAssigned: 15 },
  { day: 'Wed', routesAssigned: 10 },
  { day: 'Thu', routesAssigned: 18 },
  { day: 'Fri', routesAssigned: 14 },
];

const Reports: React.FC = () => {
  return (
    <div className="space-y-6 ">
      {/* Depot Reports Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Depot Reports</h1>
        <p className="text-gray-600">View overall overview.</p>
      </div>

      {/* Operations Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Operations Overview</h2>
        <p className="text-gray-600 mb-4">Routes assigned throughout the week.</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={operationsSummary}>
            <Line type="monotone" dataKey="routesAssigned" stroke="#3b82f6" strokeWidth={3} />
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Fleet Monitoring */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Fleet Monitoring</h2>
        <p className="text-gray-600 mb-4">Service and parts replacement summary per bus.</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fleetServiceHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bus" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="services" fill="#10b981" name="Services Done" />
            <Bar dataKey="partsChanged" fill="#f59e0b" name="Parts Replaced" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Reports;
