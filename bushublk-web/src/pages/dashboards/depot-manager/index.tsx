import React, { useEffect, useState, useContext } from 'react';
import { 
  HiTruck, 
  HiUsers, 
  HiExclamationCircle, 
  HiClipboardCheck,
  HiClock,
  HiChartBar
} from 'react-icons/hi';
import axios from 'axios';
import { AppContext } from '../../../context/AppContext';

const DepotManagerDashboard = () => {
  const appContext = useContext(AppContext);
  const user = appContext?.user;
  const token = appContext?.token;
  const [metrics, setMetrics] = useState<any>(null);
  const [fleetStatus, setFleetStatus] = useState<any>(null);
  const [sparePartsDetails, setSparePartsDetails] = useState<any[]>([]);
  const [todaysSchedule, setTodaysSchedule] = useState<any[]>([]);
  const [sparePartsSummary, setSparePartsSummary] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any>(null);

  useEffect(() => {
    if (!user || !token) return;
    axios.get(`http://localhost:5000/api/depot-dashboard/depot/${user.depot_id}/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setMetrics(res.data.data))
      .catch(() => setMetrics(null));
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) return;
    axios.get(`http://localhost:5000/api/depot-dashboard/depot/${user.depot_id}/fleet-status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setFleetStatus(res.data.data))
      .catch(() => setFleetStatus(null));
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) return;
    axios.get(`http://localhost:5000/api/depot-dashboard/depot/${user.depot_id}/spare-parts-details`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setSparePartsDetails(res.data.data ?? []))
      .catch(() => setSparePartsDetails([]));
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) return;
    axios.get(`http://localhost:5000/api/depot-dashboard/depot/${user.depot_id}/todays-schedule`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setTodaysSchedule(res.data.data ?? []))
      .catch(() => setTodaysSchedule([]));
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) return;
    axios.get(`http://localhost:5000/api/depot-dashboard/depot/${user.depot_id}/spare-parts-summary`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setSparePartsSummary(res.data.data ?? []))
      .catch(() => setSparePartsSummary([]));
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) return;
    axios.get(`http://localhost:5000/api/depot-dashboard/depot/${user.depot_id}/recent-activities`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setRecentActivities(res.data.data))
      .catch(() => setRecentActivities(null));
  }, [user, token]);

  function capitalizeFirst(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Depot Manager Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening at your depot today.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <HiTruck className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Buses</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics?.activeBuses || 0}</p>
             <p className="text-sm text-blue-600">Available for fleet</p>
               </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <HiUsers className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Staff on Duty</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics?.staffOnDuty?.total || 0}</p>
              <p className="text-sm text-gray-500">
                Drivers: {metrics?.staffOnDuty?.drivers}, Conductors: {metrics?.staffOnDuty?.conductors}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <HiExclamationCircle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Maintenance Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics?.maintenanceAlerts || 0} buses</p>
              <p className="text-sm text-orange-600">Needs attention</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <HiClipboardCheck className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Spare Parts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.spareParts
                  ? metrics.spareParts
                      .filter((sp: { unit: string }) => sp.unit === 'pieces')
                      .reduce((sum: number, sp: { total_stock: number }) => sum + Number(sp.total_stock), 0)
                  : 0}

                  pieces
              </p>
              <p className="text-sm text-purple-600">Available in stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
              <HiClock className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {todaysSchedule.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  <HiClipboardCheck className="w-8 h-8 text-gray-300 mb-2 mx-auto" />
                  <p className="text-sm">No assignments scheduled for today.</p>
                </div>
              ) : (
                todaysSchedule.map((schedule, index) => (
                  <div key={schedule.assignment_id || index} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Route {schedule.route_number} - {schedule.route_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Bus: {schedule.registration_number} | Driver: {schedule.driver_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {schedule.shift_start_time?.slice(0,5)} - {schedule.shift_end_time?.slice(0,5)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        schedule.status === 'On Time'
                          ? 'bg-green-100 text-green-800'
                          : schedule.status === 'Delayed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {schedule.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{schedule.arrival_time_difference}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Fleet Status */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Fleet Status</h2>
              <HiChartBar className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Buses</span>
                <span className="text-sm font-medium text-green-600">
                  {fleetStatus?.active || 0}/{fleetStatus?.total || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: `${fleetStatus?.total ? (fleetStatus.active / fleetStatus.total) * 100 : 0}%`}}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Maintenance</span>
                <span className="text-sm font-medium text-orange-600">
                  {fleetStatus?.maintenance || 0}/{fleetStatus?.total || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{width: `${fleetStatus?.total ? (fleetStatus.maintenance / fleetStatus.total) * 100 : 0}%`}}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Out of Service</span>
                <span className="text-sm font-medium text-red-600">
                  {fleetStatus?.outOfService || 0}/{fleetStatus?.total || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{width: `${fleetStatus?.total ? (fleetStatus.outOfService / fleetStatus.total) * 100 : 0}%`}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities and Spare Parts Details Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {!recentActivities ? (
                <div className="text-gray-500 text-center py-8">
                  <HiClipboardCheck className="w-8 h-8 text-gray-300 mb-2 mx-auto" />
                  <p className="text-sm">No recent activities found for today.</p>
                </div>
              ) : (
                <>
                  {recentActivities.assignment && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full mt-2 bg-blue-500"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Route assignment updated</p>
                        <p className="text-sm text-gray-500">
                          Route {recentActivities.assignment.route_number} assigned to Bus {recentActivities.assignment.registration_number}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(recentActivities.assignment.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {recentActivities.sparePart && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full mt-2 bg-purple-500"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Spare part restocked</p>
                        <p className="text-sm text-gray-500">
                          {capitalizeFirst(recentActivities.sparePart.part_name)} ({recentActivities.sparePart.unit}) - {recentActivities.sparePart.current_stock} units
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(recentActivities.sparePart.last_restocked).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {recentActivities.inspection && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full mt-2 bg-green-500"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Inspection completed</p>
                        <p className="text-sm text-gray-500">
                          Bus {recentActivities.inspection.bus_id} inspected
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(recentActivities.inspection.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {recentActivities.emergency && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full mt-2 bg-red-500"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Emergency reported</p>
                        <p className="text-sm text-gray-500">
                          {recentActivities.emergency.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(recentActivities.emergency.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Spare Parts Details */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Spare Parts Details</h2>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Part Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Last Restocked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sparePartsSummary.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-gray-500 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <HiClipboardCheck className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-sm">No spare parts found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sparePartsSummary.map((part, idx) => (
                    <tr key={part.part_name + part.unit + idx}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{capitalizeFirst(part.part_name)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">{part.total_stock}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{part.unit}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {part.last_restocked ? new Date(part.last_restocked).toLocaleDateString() : <span className="text-gray-400">-</span>}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepotManagerDashboard;