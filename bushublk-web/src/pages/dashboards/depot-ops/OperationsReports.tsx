import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

const monthlyData = [
  { month: 'Jan', active: 12, inService: 8, distance: 900 },
  { month: 'Feb', active: 15, inService: 10, distance: 1100 },
  { month: 'Mar', active: 14, inService: 9, distance: 1000 },
  { month: 'Apr', active: 18, inService: 10, distance: 1300 },
  { month: 'May', active: 16, inService: 8, distance: 1250 },
  { month: 'Jun', active: 17, inService: 9, distance: 1350 },
];

const yearlyData = [
  { year: '2022', active: 140, inService: 100, distance: 11500 },
  { year: '2023', active: 160, inService: 100, distance: 12400 },
  { year: '2024', active: 170, inService: 105, distance: 13000 },
  { year: '2025', active: 180, inService: 109, distance: 14500 },
];

const OperationsReports = () => {
  const [view, setView] = useState<'monthly' | 'yearly'>('monthly');
  const data = view === 'monthly' ? monthlyData : yearlyData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Operations Report</h1>
          <p className="text-sm text-gray-600">View operations data and trends.</p>
        </div>
        <select
          className="border rounded px-3 py-2 text-sm"
          value={view}
          onChange={e => setView(e.target.value as 'monthly' | 'yearly')}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {/* Summary Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Buses Deployed */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Total Buses Deployed ({view})
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <XAxis dataKey={view === 'monthly' ? 'month' : 'year'} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="active" stackId="a" fill="#1d25bdff" name="Active" />
              <Bar dataKey="inService" stackId="a" fill="#3561f0ff" name="In Service" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distance Travelled */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Distance Travelled ({view})
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={view === 'monthly' ? 'month' : 'year'} />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="distance"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* New Buses */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">New Buses Assigned</h2>
        <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
          <li>Bus NP-1256 – Added on 2025-07-08</li>
          <li>Bus NM-8764 – Added on 2025-07-07</li>
        </ul>
      </div>
    </div>
  );
};

export default OperationsReports;
