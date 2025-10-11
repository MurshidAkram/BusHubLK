// src/pages/dashboards/ceo/RoutePerformancePage.tsx
import React from 'react';
import {
  HiClock,
  HiTrendingUp,
  HiSpeakerphone,
  HiUserGroup,
  HiChartBar,
  HiThumbUp,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// --- MOCK DATA ---

// Top‐level KPIs
const overallOTP = 88;            // on‑time performance %
const avgLoadFactor = 72;         // % seats filled
const avgFuelEff = 4.5;           // km per liter
const avgSpeed = 38;              // km/h
const avgRidership = 1500;        // passengers per day per route

// OTP trend over last 6 months
const otpTrend = [
  { month: 'Feb', otp: 85 },
  { month: 'Mar', otp: 87 },
  { month: 'Apr', otp: 90 },
  { month: 'May', otp: 88 },
  { month: 'Jun', otp: 89 },
  { month: 'Jul', otp: 88 },
];

// Load factor by route
const loadByRoute = [
  { route: 'Colombo–Galle', load: 75 },
  { route: 'Colombo–Kandy', load: 68 },
  { route: 'Colombo–Matara', load: 72 },
  { route: 'Gampaha–Negombo', load: 65 },
  { route: 'Kandy–Matale', load: 55 },
];

// Route performance table
const routeStats = [
  { id: 1, name: 'Colombo–Galle', otp: 90, load: 75, fuel: 4.8, speed: 40 },
  { id: 2, name: 'Colombo–Kandy', otp: 85, load: 68, fuel: 4.2, speed: 35 },
  { id: 3, name: 'Galle–Matara', otp: 88, load: 72, fuel: 4.5, speed: 38 },
  { id: 4, name: 'Negombo–Gampaha', otp: 82, load: 65, fuel: 4.1, speed: 36 },
  { id: 5, name: 'Kandy–Matale', otp: 80, load: 55, fuel: 4.0, speed: 32 },
];

// On‑time performance distribution
const otpDistribution = [
  { category: '90–100%', value: 3 },
  { category: '80–89%',  value: 12 },
  { category: '70–79%',  value: 5 },
  { category: '<70%',    value: 2 },
];
const PIE_COLORS = ['#10B981', '#3B82F6', '#FBBF24', '#EF4444'];

export default function RoutePerformancePage() {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Route Performance</h2>
        <div className="flex items-center space-x-4 text-gray-600">
          <HiChartBar className="h-6 w-6" />
          <p>Key metrics & trends by bus route</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <HiClock className="h-8 w-8 text-green-600 mr-4" />
          <div>
            <p className="text-sm text-gray-500">On‑Time %</p>
            <p className="text-xl font-bold text-gray-800">{overallOTP}%</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <HiUserGroup className="h-8 w-8 text-blue-600 mr-4" />
          <div>
            <p className="text-sm text-gray-500">Avg. Load Factor</p>
            <p className="text-xl font-bold text-gray-800">{avgLoadFactor}%</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <HiThumbUp className="h-8 w-8 text-yellow-600 mr-4" />
          <div>
            <p className="text-sm text-gray-500">Fuel Eff. (km/L)</p>
            <p className="text-xl font-bold text-gray-800">{avgFuelEff}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <HiSpeakerphone className="h-8 w-8 text-purple-600 mr-4" />
          <div>
            <p className="text-sm text-gray-500">Avg. Speed (km/h)</p>
            <p className="text-xl font-bold text-gray-800">{avgSpeed}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <HiTrendingUp className="h-8 w-8 text-red-600 mr-4" />
          <div>
            <p className="text-sm text-gray-500">Avg. Ridership</p>
            <p className="text-xl font-bold text-gray-800">{avgRidership}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OTP Trend */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-medium mb-4">OTP Trend (6 mo.)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={otpTrend}>
                <XAxis dataKey="month" />
                <YAxis domain={[70,100]} />
                <Tooltip formatter={val => `${val}%`} />
                <Line type="monotone" dataKey="otp" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Load Factor by Route */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-medium mb-4">Load % by Route</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loadByRoute}>
                <XAxis dataKey="route" tick={{ fontSize: 10 }} />
                <YAxis domain={[0,100]} unit="%" />
                <Tooltip formatter={val => `${val}%`} />
                <Bar dataKey="load" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OTP Distribution */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-medium mb-4">OTP Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={otpDistribution}
                  dataKey="value"
                  nameKey="category"
                  innerRadius={40}
                  outerRadius={60}
                  label
                >
                  {otpDistribution.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={val => `${val} routes`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Route Table */}
      <div className="bg-white rounded-xl shadow p-6 overflow-auto">
        <h3 className="text-lg font-medium mb-4">Route Details</h3>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Route</th>
              <th className="px-4 py-2 text-left">OTP %</th>
              <th className="px-4 py-2 text-left">Load %</th>
              <th className="px-4 py-2 text-left">Fuel (km/L)</th>
              <th className="px-4 py-2 text-left">Speed (km/h)</th>
            </tr>
          </thead>
          <tbody>
            {routeStats.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2">{r.otp}%</td>
                <td className="px-4 py-2">{r.load}%</td>
                <td className="px-4 py-2">{r.fuel}</td>
                <td className="px-4 py-2">{r.speed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
