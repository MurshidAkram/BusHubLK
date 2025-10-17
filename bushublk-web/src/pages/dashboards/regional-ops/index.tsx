import React, { useEffect, useState, useContext, useMemo, type JSX } from 'react';
import axios from 'axios';
import { AppContext } from '../../../context/AppContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import {
  HiOfficeBuilding, HiTruck, HiUsers, HiChartBar, HiExclamationCircle
} from 'react-icons/hi';

const CREW_COLORS = ['#10b981', '#f59e42', '#6366f1', '#f87171'];

type FleetStats = {
  active: number;
  in_service: number;
  maintenance: number;
  out_of_service: number;
  total: number;
};

type CrewCounts = {
  drivers_on_duty: number;
  drivers_on_break: number;
  conductors_on_duty: number;
  conductors_on_break: number;
};

type IncidentItem = {
  id: number;
  depot: string;
  type: string;
  severity: string;
  time?: string | null;
};

type DepotPerf = {
  depot_id: number;
  depot: string;
  buses: number;
  crews: number;
  status?: string;
};

const RegionalOperationsOfficerDashboard = (): JSX.Element => {
  const { user, token } = useContext(AppContext) || {};
  const regionId = (user as any)?.region_id || (user as any)?.regionId || Number(localStorage.getItem('region_id')) || 1;

  const [fleetStats, setFleetStats] = useState<FleetStats>({ active: 0, in_service: 0, maintenance: 0, out_of_service: 0, total: 0 });
  const [crewCounts, setCrewCounts] = useState<CrewCounts>({ drivers_on_duty: 0, drivers_on_break: 0, conductors_on_duty: 0, conductors_on_break: 0 });
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [depotsPerformance, setDepotsPerformance] = useState<DepotPerf[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // new: total depots
  const [totalDepots, setTotalDepots] = useState<number>(0);

  // incidents pagination
  const [incidentPage, setIncidentPage] = useState<number>(1);
  const [incidentPageSize] = useState<number>(5);

  // depots pagination
  const [depotsPage, setDepotsPage] = useState<number>(1);
  const [depotsPageSize] = useState<number>(6);

  useEffect(() => {
    if (!regionId) return;
    if (!token) return;
    let cancelled = false;
    const fetchOverview = async () => {
      setLoading(true);
      setError(null);
      try {
        const overviewRes = await axios.get(`http://localhost:5000/api/regional-dashboard/region/${regionId}/overview`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!overviewRes.data || overviewRes.data.success !== true) {
          throw new Error(overviewRes.data?.error || 'Invalid overview response');
        }

        const { fleetStats: f = {}, crewCounts: c = {}, incidents: inc = [], depotsPerformance: dp = [], depotsCount = 0 } = overviewRes.data.data || {};

        if (!cancelled) {
          setFleetStats({
            active: Number(f.active || 0),
            in_service: Number(f.in_service || 0),
            maintenance: Number(f.maintenance || 0),
            out_of_service: Number(f.out_of_service || 0),
            total: Number(f.total || 0),
          });

          setCrewCounts({
            drivers_on_duty: Number(c.drivers_on_duty || 0),
            drivers_on_break: Number(c.drivers_on_break || 0),
            conductors_on_duty: Number(c.conductors_on_duty || 0),
            conductors_on_break: Number(c.conductors_on_break || 0),
          });

          setIncidents(Array.isArray(inc) ? inc : []);
          setDepotsPerformance(Array.isArray(dp) ? dp : []);
          setTotalDepots(Number(depotsCount || (Array.isArray(dp) ? dp.length : 0))); // prefer server count
        }
      } catch (err: any) {
        console.error('regional overview fetch error', err);
        setError(err?.response?.data?.error || err.message || 'Failed to fetch overview');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOverview();
    return () => { cancelled = true; };
  }, [regionId, token]);

  // derived crew data for pie
  const crewDataForPie = [
    { name: 'Drivers On Duty', value: crewCounts.drivers_on_duty },
    { name: 'Drivers On Break', value: crewCounts.drivers_on_break },
    { name: 'Conductors On Duty', value: crewCounts.conductors_on_duty },
    { name: 'Conductors On Break', value: crewCounts.conductors_on_break },
  ];

  const pct = (v: number) => (fleetStats.total ? Math.round((v / fleetStats.total) * 100) : 0);

  // pagination only (no filtering)
  const incidentTotalPages = Math.max(1, Math.ceil(incidents.length / incidentPageSize));
  useEffect(() => { if (incidentPage > incidentTotalPages) setIncidentPage(1); }, [incidentTotalPages]);

  const paginatedIncidents = useMemo(() => {
    const start = (incidentPage - 1) * incidentPageSize;
    return incidents.slice(start, start + incidentPageSize);
  }, [incidents, incidentPage, incidentPageSize]);

  const depotsTotalPages = Math.max(1, Math.ceil(depotsPerformance.length / depotsPageSize));
  useEffect(() => { if (depotsPage > depotsTotalPages) setDepotsPage(1); }, [depotsTotalPages]);

  const paginatedDepots = useMemo(() => {
    const start = (depotsPage - 1) * depotsPageSize;
    return depotsPerformance.slice(start, start + depotsPageSize);
  }, [depotsPerformance, depotsPage, depotsPageSize]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Regional Operations Center</h1>
        <p className="text-gray-600">Monitoring operations across all depots in your region</p>
        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <HiOfficeBuilding className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total buses </p>
              <p className="text-2xl font-bold text-gray-900">{fleetStats.total}</p>
            </div>
          </div>
        </div>

        {/* Changed: show total depots instead of Active Buses */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <HiTruck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Depots</p>
              <p className="text-2xl font-bold text-gray-900">{totalDepots}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <HiUsers className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Drivers (on duty)</p>
              <p className="text-2xl font-bold text-gray-900">{crewCounts.drivers_on_duty}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <HiChartBar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Conductors (on duty)</p>
              <p className="text-2xl font-bold text-gray-900">{crewCounts.conductors_on_duty}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Depots overview and Crew pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Regional overview of Depots</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {paginatedDepots.length === 0 ? (
                <div className="text-sm text-gray-500">No depot data</div>
              ) : (
                paginatedDepots.map((depot) => (
                  <div key={depot.depot_id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${depot.status === 'excellent' ? 'bg-green-500' : depot.status === 'good' ? 'bg-blue-500' : depot.status === 'average' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{depot.depot}</p>
                        <p className="text-xs text-gray-500">{depot.buses} buses • {depot.crews} crews</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* depots pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">Showing {Math.min((depotsPage-1)*depotsPageSize+1, depotsPerformance.length)} - {Math.min(depotsPage*depotsPageSize, depotsPerformance.length)} of {depotsPerformance.length}</div>
              <div className="space-x-2">
                <button disabled={depotsPage <= 1} onClick={() => setDepotsPage(p => Math.max(1, p-1))} className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50">Prev</button>
                <button disabled={depotsPage >= depotsTotalPages} onClick={() => setDepotsPage(p => Math.min(depotsTotalPages, p+1))} className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Crew Status in the Region</h2>
              <HiUsers className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={crewDataForPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={36} label={false}>
                    {crewDataForPie.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={CREW_COLORS[i % CREW_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} persons`} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {crewDataForPie.map((c, i) => (
                <div key={c.name} className="flex items-center space-x-3">
                  <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: CREW_COLORS[i] }} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.value} persons</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Incidents + Fleet Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Regional Incidents</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : paginatedIncidents.length === 0 ? (
                <div className="text-sm text-gray-500">No recent incidents</div>
              ) : (
                paginatedIncidents.map((incident) => (
                  <div key={incident.id} className={`flex items-start space-x-3 p-3 rounded-lg ${incident.severity === 'High' ? 'bg-red-50' : incident.severity === 'Medium' ? 'bg-orange-50' : 'bg-yellow-50'}`}>
                    <HiExclamationCircle className={`w-5 h-5 mt-0.5 ${incident.severity === 'High' ? 'text-red-600' : incident.severity === 'Medium' ? 'text-orange-600' : 'text-yellow-600'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{incident.type}</p>
                      <p className="text-xs text-gray-600">{incident.depot}</p>
                      <p className="text-xs text-gray-500">{incident.time ? new Date(incident.time).toLocaleString() : ''}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${incident.severity === 'High' ? 'bg-red-100 text-red-800' : incident.severity === 'Medium' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>{incident.severity}</span>
                  </div>
                ))
              )}
            </div>

            {/* incidents pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">Showing {Math.min((incidentPage-1)*incidentPageSize+1, incidents.length)} - {Math.min(incidentPage*incidentPageSize, incidents.length)} of {incidents.length}</div>
              <div className="space-x-2">
                <button disabled={incidentPage <= 1} onClick={() => setIncidentPage(p => Math.max(1, p-1))} className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50">Prev</button>
                <button disabled={incidentPage >= incidentTotalPages} onClick={() => setIncidentPage(p => Math.min(incidentTotalPages, p+1))} className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Regional Bus Fleet Status</h2>
              <HiTruck className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-xl font-semibold text-gray-900">{fleetStats.active}</p>
              </div>
              <div className="w-2/5 bg-gray-100 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: `${pct(fleetStats.active)}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">In Service</p>
                <p className="text-xl font-semibold text-gray-900">{fleetStats.in_service}</p>
              </div>
              <div className="w-2/5 bg-gray-100 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${pct(fleetStats.in_service)}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Maintenance</p>
                <p className="text-xl font-semibold text-gray-900">{fleetStats.maintenance}</p>
              </div>
              <div className="w-2/5 bg-gray-100 rounded-full h-3">
                <div className="bg-yellow-500 h-3 rounded-full" style={{ width: `${pct(fleetStats.maintenance)}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Out of Service</p>
                <p className="text-xl font-semibold text-gray-900">{fleetStats.out_of_service}</p>
              </div>
              <div className="w-2/5 bg-gray-100 rounded-full h-3">
                <div className="bg-red-500 h-3 rounded-full" style={{ width: `${pct(fleetStats.out_of_service)}%` }} />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">Total buses: <span className="font-semibold text-gray-900">{fleetStats.total}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalOperationsOfficerDashboard;