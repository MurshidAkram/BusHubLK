import React, { useEffect, useState, useRef, useContext } from 'react';
import { HiClock, HiTruck, HiUsers } from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AppContext } from '../../../context/AppContext';
import axios from 'axios';

type CrewStatus = 'Off Duty' | 'On Duty' | 'On Break';

interface CrewMember {
  id: number;
  name: string;
  contact: string;
  role: 'Driver' | 'Conductor';
  status: CrewStatus;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DepotOperationsManagerDashboard = () => {
  const [crewList, setCrewList] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [busStatsData, setBusStatsData] = useState<any[]>([]);
  const [busStatsLoading, setBusStatsLoading] = useState(false);
  const [busHealth, setBusHealth] = useState([]);
  const [monthlyDistance, setMonthlyDistance] = useState<{ month: string, totalDistance: number }[]>([]);
  const [activeBuses, setActiveBuses] = useState(0);
  const [fleetStatus, setFleetStatus] = useState<{
    active: number;
    inService: number;
    maintenance: number;
    outOfService: number;
    total: number;
  }>({
    active: 0,
    inService: 0,
    maintenance: 0,
    outOfService: 0,
    total: 0
  });
  const [distanceListing, setDistanceListing] = useState<
  { registration_number: string; driver_name: string; total_distance_km: number }[]
>([]);
  const chartRef = useRef<HTMLDivElement>(null);

  const appContext = useContext(AppContext);
  const user = appContext?.user;
  const token = appContext?.token;

  useEffect(() => {
    if (!user || !token) return;
    setLoading(true);
    axios.get(
      `http://localhost:5000/api/crew?depot_id=${user.depot_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )
      .then(res => {
        setCrewList(
          res.data.map((member: any) => ({
            id: member.person_id,
            name: member.name,
            contact: member.contact,
            role: member.role,
            status: member.status,
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        setCrewList([]);
        setLoading(false);
      });
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) return;
    setScheduleLoading(true);
    axios.get(`http://localhost:5000/api/live-summary/depot/${user.depot_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setScheduleStatus(res.data.data ?? []);
        setScheduleLoading(false);
      })
      .catch(() => {
        setScheduleStatus([]);
        setScheduleLoading(false);
      });
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) return;
    setBusStatsLoading(true);
    axios.get(`http://localhost:5000/api/bus-stats/depot/${user.depot_id}/bus-stats?period=monthly`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setBusStatsData(res.data.data ?? []);
        setBusStatsLoading(false);
      })
      .catch(() => {
        setBusStatsData([]);
        setBusStatsLoading(false);
      });
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) return;
    axios.get(`/api/depot-dashboard/bus-health/${user.depot_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const health = res.data.health ?? [];
        // Case-insensitive match
        const active = health.find((h: any) => h.status.toLowerCase() === 'active');
        setActiveBuses(active ? active.count : 0);
      })
      .catch(() => setActiveBuses(0));
  }, [user, token]);

  

//bus status 
  useEffect(() => {
    if (!user || !token) return;
    axios.get(`http://localhost:5000/api/depot-ops-dashboard/depot/${user.depot_id}/fleet-status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setFleetStatus(res.data))
      .catch(() => setFleetStatus({
        active: 0,
        inService: 0,
        maintenance: 0,
        outOfService: 0,
        total: 0
      }));
  }, [user, token]);

  const onDutyDrivers = crewList.filter(
    (member) => member.role === 'Driver' && member.status === 'On Duty'
  ).length;
  const onDutyConductors = crewList.filter(
    (member) => member.role === 'Conductor' && member.status === 'On Duty'
  ).length;

  const CREW_COLORS = ['#10b981', '#f59e42', '#6366f1', '#f87171'];
  const crewStatusSummary = [
    {
      status: 'Drivers On Duty',
      count: crewList.filter(c => c.role === 'Driver' && c.status === 'On Duty').length
    },
    {
      status: 'Drivers On Break',
      count: crewList.filter(c => c.role === 'Driver' && c.status === 'On Break').length
    },
    {
      status: 'Conductors On Duty',
      count: crewList.filter(c => c.role === 'Conductor' && c.status === 'On Duty').length
    },
    {
      status: 'Conductors On Break',
      count: crewList.filter(c => c.role === 'Conductor' && c.status === 'On Break').length
    }
  ];

  return (
    <div className="space-y-6 ">
      <div className="bg-white rounded-lg shadow-sm p-6">
         <h1 className="text-3xl font-bold text-gray-900 mb-2">Depot Operations Center</h1>
        <p className="text-gray-600 text-lg">Monitor the depot operations</p>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <HiTruck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Buses Today</p>
              <p className="text-2xl font-bold text-gray-900">{fleetStatus.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <HiClock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Drivers Today</p>
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
              <p className="text-sm font-medium text-gray-500">Active Conductors Today</p>
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
              <h2 className="text-xl font-semibold text-gray-900">Schedule Status </h2>
              <HiClock className="w-6 h-6 text-gray-400" />
            </div>
          </div>
          <div className="p-6 space-y-4 flex-1">
            {scheduleLoading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : (
              scheduleStatus.length === 0 ? (
                <div className="text-center text-gray-500">No schedules available</div>
              ) : (
                scheduleStatus.map((trip, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        trip.arrival_status === 'On Time' ? 'bg-green-500' :
                        trip.arrival_status === 'Delayed' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Route {trip.route_number}</p>
                        <p className="text-xs text-gray-500">Bus: {trip.registration_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        trip.arrival_status === 'On Time' ? 'bg-green-100 text-green-800' :
                        trip.arrival_status === 'Delayed' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {trip.arrival_status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{trip.arrival_time_difference}</p>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Total Buses Deployed */}
        <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Total Buses Deployed
            </h2>
          </div>
          <div className="flex-1 flex items-center" ref={chartRef}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={busStatsData}>
                <XAxis 
                  dataKey="month"
                  label={{ value: 'Month', position: 'insideBottom', offset: -5 }} 
                />
                <YAxis 
                  label={{ value: 'Number of Buses', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="active" fill="#1d25bd" name=" Buses purchased and active " />
                 </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Crew Update Pie Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Today's Crew Update</h2>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={crewStatusSummary}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={false}
                  labelLine={false}
                >
                  {crewStatusSummary.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={CREW_COLORS[idx % CREW_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total distance */}
        <div className="bg-white rounded-xl shadow-md flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Total Distance travelled  </h2>
              <HiClock className="w-6 h-6 text-gray-400" />
            </div>
          </div>
          <div className="p-6 space-y-4 flex-1">
            {scheduleLoading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : (
              scheduleStatus.length === 0 ? (
                <div className="text-center text-gray-500">No distance data available.</div>
              ) : (
                scheduleStatus.map((trip, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        trip.arrival_status === 'On Time' ? 'bg-green-500' :
                        trip.arrival_status === 'Delayed' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Route {trip.route_number}</p>
                        <p className="text-xs text-gray-500">Bus: {trip.registration_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-900">{trip.total_distance_km} km </p>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
                     

        {/* Fleet Status - Added Section */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Bus Status</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-green-600">Active Buses </span>
                <span className="text-sm font-medium text-green-600">
                  {fleetStatus.active}/{fleetStatus.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full"
                  style={{ width: `${fleetStatus.total ? (fleetStatus.active / fleetStatus.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-blue-600">In Service Buses</span>
                <span className="text-sm font-medium text-blue-600">
                  {fleetStatus.inService}/{fleetStatus.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full"
                  style={{ width: `${fleetStatus.total ? (fleetStatus.inService / fleetStatus.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-yellow-600">Maintenance Buses</span>
                <span className="text-sm font-medium text-yellow-600">
                  {fleetStatus.maintenance}/{fleetStatus.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-500 h-2.5 rounded-full"
                  style={{ width: `${fleetStatus.total ? (fleetStatus.maintenance / fleetStatus.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-red-600">Out of Service Buses</span>
                <span className="text-sm font-medium text-red-600">
                  {fleetStatus.outOfService}/{fleetStatus.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-red-500 h-2.5 rounded-full"
                  style={{ width: `${fleetStatus.total ? (fleetStatus.outOfService / fleetStatus.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepotOperationsManagerDashboard;