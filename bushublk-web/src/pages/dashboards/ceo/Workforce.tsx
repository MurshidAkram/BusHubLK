// src/pages/dashboards/ceo/WorkforceAnalyticsPage.tsx
import React from 'react';
import {
  HiUsers,
  HiTrendingUp,
  HiColorSwatch,
  HiChartBar,
  HiBriefcase,
  HiUser,
  HiAcademicCap,
  HiClipboardList,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

// --- Mock data ---
const headcountByRegion = [
  { region: 'Western', count: 3200 },
  { region: 'Central', count: 2100 },
  { region: 'Southern', count: 1800 },
  { region: 'Eastern', count: 900 },
  { region: 'North-Western', count: 1900 },
  { region: 'Northern', count: 700 },
  { region: 'North-Central', count: 900 },
  { region: 'Uva', count: 1100 },
  { region: 'Sabaragamu', count: 1800 },
];

const headcountByDistrict = [
  { region: 'Colombo', count: 320 },
  { region: 'Gampaha', count: 210 },
  { region: 'Kaluthara', count: 180 },
  { region: 'Galle', count: 150 },
  { region: 'Matara', count: 100 },
  { region: 'Hambantota', count: 90 },
  { region: 'Kandy', count: 220 },
  { region: 'Nuwara Eliya', count: 80 },
  { region: 'Mathale', count: 70 },
  { region: 'Kurunegala', count: 230 },
  { region: 'Puttalam', count: 100 },
  { region: 'Rathnapura', count: 170 },
  { region: 'Kegalle', count: 145 },
  { region: 'Anuradhapura', count: 130 },
  { region: 'Badulla', count: 85 },
  { region: 'Jaffna', count: 160 },
];

const departmentDistribution = [
  { name: 'Operations', value: 45 },
  { name: 'Maintenance', value: 25 },
  { name: 'HR',         value: 15 },
  { name: 'Finance',    value: 10 },
  { name: 'IT',         value: 5  },
];


const numberOfEmployees = [
  { month: 'Jan', count: 40 },
  { month: 'Feb', count: 29 },
  { month: 'Mar', count: 41 },
  { month: 'Apr', count: 32 },
  { month: 'May', count: 20},
  { month: 'Jun', count: 14 },
];

const ageDistribution = [
  { ageGroup: '<25', count: 800 },
  { ageGroup: '25–34', count: 2600 },
  { ageGroup: '35–44', count: 2400 },
  { ageGroup: '45–54', count: 1200 },
  { ageGroup: '55+', count:   420 },
];


const COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'];

const WorkforceAnalyticsPage: React.FC = () => (
  <div className="p-6 space-y-8">
    {/* Header */}
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold">Workforce Analytics</h2>
      <div className="flex items-center space-x-4 text-gray-600">
        <HiBriefcase className="h-6 w-6" />
        <span>Comprehensive employee insights</span>
      </div>
    </div>

    {/* Top‑line KPIs */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
      <div className="bg-white rounded-xl shadow p-6 flex items-center">
        <HiUsers className="h-8 w-8 text-purple-600 mr-4" />
        <div>
          <p className="text-sm text-gray-500">Total Employees</p>
          <p className="text-xl font-bold text-gray-800">8,420</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex items-center">
        <HiUsers className="h-8 w-8 text-green-600 mr-4" />
        <div>
          <p className="text-sm text-gray-500"> Depot Managers</p>
          <p className="text-xl font-bold text-gray-800">420</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex items-center">
        <HiUsers className="h-8 w-8 text-orange-400 mr-4" />
        <div>
          <p className="text-sm text-gray-500"> Operational Managers</p>
          <p className="text-xl font-bold text-gray-800">670</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex items-center">
        <HiUsers className="h-8 w-8 text-yellow-600 mr-4" />
        <div>
          <p className="text-sm text-gray-500"> Depot Engineers</p>
          <p className="text-xl font-bold text-gray-800">560</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex items-center">
        <HiUsers className="h-8 w-8 text-red-600 mr-4" />
        <div>
          <p className="text-sm text-gray-500"> Drivers & Conductors</p>
          <p className="text-xl font-bold text-gray-800">3,470</p>
        </div>
      </div>
    </div>

    {/* Charts Grid */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Headcount by Region */}
      <div className="bg-white rounded-xl shadow p-6 xl:col-span-2">
        <h3 className="text-lg font-medium mb-4">Headcount by Region</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={headcountByRegion}>
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Training Hours Trend */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-medium mb-4">New Employees</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={numberOfEmployees}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#a11ccaff" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 xl:col-span-3">
        <h3 className="text-lg font-medium mb-4">Headcount by District</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={headcountByDistrict}>
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#15e453ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Age Distribution */}
      <div className="bg-white rounded-xl shadow p-6 xl:col-span-2">
        <h3 className="text-lg font-medium mb-4">Age Distribution</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageDistribution}>
              <XAxis dataKey="ageGroup" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

  </div>
);

export default WorkforceAnalyticsPage;
