// src/pages/dashboards/ceo/SafetyCompliancePage.tsx
import React from 'react';
import {
  HiShieldCheck,
  HiExclamationCircle,
  HiCog,
  HiChip,
} from 'react-icons/hi';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

// --- MOCK DATA ---

// KPI values
const totalIncidents = 49;
const breakdowns = 21;       // out of 100
const accidents = 28;   // out of 100

// Incident trend (last 6 months)
const incidentTrend = [
  { month: 'Feb', incidents: 8 },
  { month: 'Mar', incidents: 10 },
  { month: 'Apr', incidents: 7 },
  { month: 'May', incidents: 9 },
  { month: 'Jun', incidents: 5 },
  { month: 'Jul', incidents: 3 },
];

// Audit scores by region
const incidentsByRegion = [
  { region: 'Western', count: 15 },
  { region: 'Central', count: 10 },
  { region: 'Southern', count: 8 },
  { region: 'Eastern', count: 5 },
  { region: 'Northern', count: 4 },
];

// Recent incident log
const recentIncidents = [
  { id: 301, date: '2025-07-15', number: 'NA-3401', depot: 'Galle', type: 'Breakdown', status: 'Resolved' },
  { id: 302, date: '2025-07-12', number: 'NE-9458', depot: 'Colombo', type: 'Accident', status: 'Under Investigation' },
  { id: 303, date: '2025-07-10', number: 'NC-1903', depot: 'Kandy', type: 'Break Down', status: 'Resolved' },
  { id: 304, date: '2025-07-08', number: 'NB-8207', depot: 'Matara', type: 'Accident', status: 'Pending' },
  { id: 305, date: '2025-07-05', number: 'ND-7004', depot: 'Gampaha', type: 'Breakdown', status: 'Resolved' },
];

// Compliance progress bars (defined once)
const complianceCategories = [
  { name: 'Vehicle Inspections', pct: 100 },
  { name: 'Driver Certifications', pct: 96 },
  { name: 'Safety Trainings', pct: 92 },
  { name: 'Environmental Checks', pct: 88 },
];

export default function AccidentBreakdownPage() {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Accidents &amp; Breakdowns</h2>
        <div className="flex items-center space-x-4 text-gray-600">
          <HiShieldCheck className="h-6 w-6" />
          <p>Overview of accidents &amp; breakdowns</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Incidents */}
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <HiExclamationCircle className="h-8 w-8 text-red-600 mr-4" />
          <div>
            <p className="text-sm text-gray-500">Total Incidents</p>
            <p className="text-xl font-bold text-gray-800">{totalIncidents}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <HiExclamationCircle className="h-8 w-8 text-red-600 mr-4" />
          <div>
            <p className="text-sm text-gray-500">Breakdowns</p>
            <p className="text-xl font-bold text-gray-800">{breakdowns}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <HiExclamationCircle className="h-8 w-8 text-red-600 mr-4" />
          <div>
            <p className="text-sm text-gray-500">Accidents</p>
            <p className="text-xl font-bold text-gray-800">{accidents}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Trend */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-medium mb-4">Incident Trend (Last 6 months)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incidentTrend}>
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="incidents" stroke="#DC2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-medium mb-4">Incidents by Region (Last 6 months)</h3>
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incidentsByRegion}>
                    <XAxis dataKey="region" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={value => `${value} incidents`} />
                    <Bar dataKey="count" fill="#EF4444" />
                </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Recent Incident Log */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-medium mb-4">Recent Incident Log</h3>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Depot</th>
                <th className="px-4 py-2 text-left">Vehicle Number</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentIncidents.map((inc, i) => (
                <tr key={inc.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2">{inc.date}</td>
                  <td className="px-4 py-2">{inc.depot}</td>
                  <td className="px-4 py-2">{inc.number}</td>
                  <td className="px-4 py-2">{inc.type}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        inc.status === 'Resolved'
                          ? 'bg-green-100 text-green-700'
                          : inc.status === 'Under Investigation'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}