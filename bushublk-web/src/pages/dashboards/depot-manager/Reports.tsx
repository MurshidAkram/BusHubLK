import React, { useState } from 'react';
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

// Types
type OperationsSummary = {
  label: string;
  routesAssigned: number;
};

type FleetServiceHistory = {
  bus: string;
  services: number;
  partsChanged: number;
};

// Mock Fleet Data
const fleetServiceHistory: FleetServiceHistory[] = [
  { bus: 'NP1123', services: 5, partsChanged: 2 },
  { bus: 'NP6754', services: 8, partsChanged: 3 },
  { bus: 'NC3489', services: 4, partsChanged: 1 },
  { bus: 'NB9876', services: 7, partsChanged: 4 },
];

// Weekly & Monthly Operation Data
const weeklyData: OperationsSummary[] = [
  { label: 'Mon', routesAssigned: 12 },
  { label: 'Tue', routesAssigned: 15 },
  { label: 'Wed', routesAssigned: 10 },
  { label: 'Thu', routesAssigned: 18 },
  { label: 'Fri', routesAssigned: 14 },
];

const monthlyData: OperationsSummary[] = [
  { label: 'Week 1', routesAssigned: 58 },
  { label: 'Week 2', routesAssigned: 62 },
  { label: 'Week 3', routesAssigned: 49 },
  { label: 'Week 4', routesAssigned: 70 },
];

const Reports: React.FC = () => {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

  const handleViewChange = (selected: 'weekly' | 'monthly') => {
    setView(selected);
  };

  const chartData = view === 'weekly' ? weeklyData : monthlyData;

  return (
    <div className="space-y-6">
      {/* Depot Reports Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Depot Reports</h1>
        <p className="text-sm text-gray-600">View overall overview.</p>
      </div>

      {/* Operations Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Operations Overview</h2>
            <p className="text-sm text-gray-600">Routes assigned ({view} view).</p>
          </div>
          <div className="space-x-2">
            <button
              className={`px-3 py-1 text-sm rounded ${
                view === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => handleViewChange('weekly')}
            >
              Weekly
            </button>
            <button
              className={`px-3 py-1 text-sm rounded ${
                view === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => handleViewChange('monthly')}
            >
              Monthly
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <Line type="monotone" dataKey="routesAssigned" stroke="#3b82f6" strokeWidth={3} />
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Fleet Monitoring */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Fleet Monitoring</h2>
        <p className="text-sm text-gray-600 mb-4">Service and parts replacement summary per bus.</p>
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
