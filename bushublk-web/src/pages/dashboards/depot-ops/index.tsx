import React, { useEffect, useState, useRef } from 'react';
import { HiClock, HiTruck, HiUsers } from 'react-icons/hi';
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
  Legend,
  Label
} from 'recharts';

type CrewStatus = 'Off Duty' | 'On Duty' | 'On Break';

interface CrewMember {
  id: number;
  name: string;
  contact: string;
  role: 'Driver' | 'Conductor';
  status: CrewStatus;
}

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

const DepotOperationsManagerDashboard = () => {
  const [crewList, setCrewList] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [graphView, setGraphView] = useState<'monthly' | 'yearly'>('monthly');
  const chartRef = useRef<HTMLDivElement>(null);

  const depotId = 1;
  const regionId = 1;

  useEffect(() => {
    const fetchCrew = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `http://localhost:5000/api/crew?depot_id=${depotId}&region_id=${regionId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (!res.ok) throw new Error('Failed to fetch crew');
        const data = await res.json();
        setCrewList(
          data.map((member: any) => ({
            id: member.person_id,
            name: member.name,
            contact: member.contact,
            role: member.role,
            status: member.status,
          }))
        );
      } catch (err) {
        setCrewList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCrew();
  }, [depotId, regionId]);

  const onDutyDrivers = crewList.filter(
    (member) => member.role === 'Driver' && member.status === 'On Duty'
  ).length;
  const onDutyConductors = crewList.filter(
    (member) => member.role === 'Conductor' && member.status === 'On Duty'
  ).length;

  return (
    <div className="space-y-6 ">
      <div className="bg-white rounded-lg shadow-sm p-6">
         <h1 className="text-3xl font-bold text-gray-900 mb-2">Depot Operations Center</h1>
        <p className="text-gray-600 text-lg">Monitoring and coordination of depot operations</p>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <HiTruck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Buses</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <HiClock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Drivers</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : onDutyDrivers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <HiUsers className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Conductors</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : onDutyConductors}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Status */}
        <div className="bg-white rounded-xl shadow-md flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Schedule Status</h2>
              <HiClock className="w-6 h-6 text-gray-400" />
            </div>
          </div>
          <div className="p-6 space-y-4 flex-1">
            {[
              { route: "Route 138", status: "On Time", delay: "0 min", bus: "NP-1234", color: "green" },
              { route: "Route 101", status: "Delayed", delay: "12 min", bus: "NY-8901", color: "red" },
              { route: "Route 154", status: "On Time", delay: "0 min", bus: "LA-9871", color: "green" },
              { route: "Route 122", status: "Early", delay: "-3 min", bus: "NC-1234", color: "blue" },
              { route: "Route 120", status: "Delayed", delay: "8 min", bus: "NP-3456", color: "red" },
            ].map((schedule, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    schedule.color === 'green' ? 'bg-green-500' :
                    schedule.color === 'red' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{schedule.route}</p>
                    <p className="text-xs text-gray-500">Bus: {schedule.bus}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    schedule.color === 'green' ? 'bg-green-100 text-green-800' :
                    schedule.color === 'red' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {schedule.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{schedule.delay}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Buses Deployed */}
        <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Total Buses Deployed ({graphView})
            </h2>
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={graphView}
              onChange={e => setGraphView(e.target.value as 'monthly' | 'yearly')}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="flex-1 flex items-center" ref={chartRef}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={graphView === 'monthly' ? monthlyData : yearlyData}>
                <XAxis 
                  dataKey={graphView === 'monthly' ? 'month' : 'year'} 
                  label={{ value: graphView === 'monthly' ? 'Month' : 'Year', position: 'insideBottom', offset: -5 }} 
                />
                <YAxis 
                  label={{ value: 'Number of Buses', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="active" fill="#1d25bd" name="Active Buses" />
                <Bar dataKey="inService" fill="#3561f0" name="In Service" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distance Travelled */}
        <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Distance Travelled ({graphView})
            </h2>
          </div>
          <div className="flex-1 flex items-center">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={graphView === 'monthly' ? monthlyData : yearlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={graphView === 'monthly' ? 'month' : 'year'} 
                  label={{ value: graphView === 'monthly' ? 'Month' : 'Year', position: 'insideBottom', offset: -5 }} 
                />
                <YAxis 
                  label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="distance"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Distance Travelled"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepotOperationsManagerDashboard;