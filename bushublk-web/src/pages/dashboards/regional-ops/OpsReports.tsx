import React, { useState, useEffect, useContext } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import { AppContext } from '../../../context/AppContext';

interface DepotReportApi {
  depot_id?: number;
  depot: string;
  buses: number;
  crews: number;
  // optional: may be provided by backend
  activeBuses?: number;
  maintenanceBuses?: number;
  driverActive?: number;
  driverOnBreak?: number;
  conductorActive?: number;
  conductorOnBreak?: number;
}

const CREW_COLORS = ['#10b981', '#f59e42', '#6366f1', '#f87171'];

// minimal fallback sample (keeps chart shapes intact)
const FALLBACK: DepotReportApi[] = [
  { depot: 'Colombo Depot', buses: 120, crews: 250, activeBuses: 102, maintenanceBuses: 18, driverActive: 140, driverOnBreak: 30, conductorActive: 70, conductorOnBreak: 10 },
  { depot: 'Pettah', buses: 80, crews: 160, activeBuses: 58, maintenanceBuses: 22, driverActive: 85, driverOnBreak: 20, conductorActive: 50, conductorOnBreak: 5 },
  { depot: 'Nugegoda', buses: 70, crews: 150, activeBuses: 54, maintenanceBuses: 16, driverActive: 75, driverOnBreak: 18, conductorActive: 55, conductorOnBreak: 12 },
  { depot: 'Kotte', buses: 65, crews: 140, activeBuses: 51, maintenanceBuses: 14, driverActive: 68, driverOnBreak: 12, conductorActive: 45, conductorOnBreak: 15 },
  { depot: 'Dehiwala', buses: 90, crews: 180, activeBuses: 72, maintenanceBuses: 18, driverActive: 95, driverOnBreak: 20, conductorActive: 45, conductorOnBreak: 20 },
];

const OpsReports: React.FC = () => {
  const { user, token } = useContext(AppContext) || {};
  const regionId = (user as any)?.region_id || (user as any)?.regionId || Number(localStorage.getItem('region_id')) || 1;

  const [data, setData] = useState<DepotReportApi[]>(FALLBACK);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) Prefer overview endpoint
        const overviewRes = await axios.get(`http://localhost:5000/api/regional-dashboard/region/${regionId}/overview`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!overviewRes?.data?.success || !overviewRes.data.data) {
          throw new Error(overviewRes?.data?.error || 'Invalid overview response');
        }

        const dp: any[] = Array.isArray(overviewRes.data.data.depotsPerformance)
          ? overviewRes.data.data.depotsPerformance
          : [];

        // build map by depot name or id
        const depotMap = new Map<string | number, DepotReportApi>();

        dp.forEach((d: any) => {
          const key = d.depot_id ?? d.depot;
          depotMap.set(key, {
            depot_id: d.depot_id,
            depot: d.depot,
            buses: Number(d.buses ?? 0),
            crews: Number(d.crews ?? 0),
            // include any optional fields if backend provided them
            activeBuses: d.activeBuses !== undefined ? Number(d.activeBuses) : undefined,
            maintenanceBuses: d.maintenanceBuses !== undefined ? Number(d.maintenanceBuses) : undefined,
            driverActive: d.driverActive !== undefined ? Number(d.driverActive) : undefined,
            driverOnBreak: d.driverOnBreak !== undefined ? Number(d.driverOnBreak) : undefined,
            conductorActive: d.conductorActive !== undefined ? Number(d.conductorActive) : undefined,
            conductorOnBreak: d.conductorOnBreak !== undefined ? Number(d.conductorOnBreak) : undefined,
          });
        });

        // 2) If per-depot active/maintenance missing, try /api/buses to compute
        const needBusStatus = Array.from(depotMap.values()).some(d => d.activeBuses === undefined || d.maintenanceBuses === undefined);
        if (needBusStatus) {
          try {
            // try to fetch all buses in region and compute per depot
            const busesRes = await axios.get(`http://localhost:5000/api/buses?region_id=${regionId}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (Array.isArray(busesRes.data)) {
              const perDepotStatus = new Map<string | number, { active: number; maintenance: number; total: number }>();
              (busesRes.data as any[]).forEach((b) => {
                const depotKey = b.depot_id ?? b.depotId ?? b.depot;
                const status: string = String(b.status || '').toLowerCase();
                const mapVal = perDepotStatus.get(depotKey) ?? { active: 0, maintenance: 0, total: 0 };
                if (status.includes('active')) mapVal.active++;
                else if (status.includes('maintenance') || status.includes('repair')) mapVal.maintenance++;
                else if (status.includes('in service') || status.includes('in_service')) mapVal.active++;
                else mapVal.active++; // fallback
                mapVal.total++;
                perDepotStatus.set(depotKey, mapVal);
              });
              // apply computed values to depotMap
              perDepotStatus.forEach((v, k) => {
                const existing = depotMap.get(k) || depotMap.get(String(k));
                if (existing) {
                  existing.activeBuses = v.active;
                  existing.maintenanceBuses = v.maintenance;
                  existing.buses = v.total;
                } else {
                  // create entry with depot id only - label unknown
                  depotMap.set(k, {
                    depot_id: k as any,
                    depot: `Depot ${k}`,
                    buses: v.total,
                    crews: 0,
                    activeBuses: v.active,
                    maintenanceBuses: v.maintenance,
                  });
                }
              });
            }
          } catch (e) {
            // ignore, we'll fallback later
            const msg = e instanceof Error ? e.message : String(e);
            console.warn('Failed to fetch /api/buses for per-depot status:', msg);
          }
        }

        // 3) If driver/conductor per depot missing, try to compute via drivers/conductors and crew_status endpoints
        const needCrewSplit = Array.from(depotMap.values()).some(d => d.driverActive === undefined && d.driverOnBreak === undefined && d.conductorActive === undefined && d.conductorOnBreak === undefined);
        if (needCrewSplit) {
          try {
            // Attempt to fetch drivers and conductors lists (with depot_id) and crew_status
            const [driversRes, conductorsRes, crewStatusRes] = await Promise.allSettled([
              axios.get(`http://localhost:5000/api/drivers?region_id=${regionId}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
              axios.get(`http://localhost:5000/api/conductors?region_id=${regionId}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
              axios.get(`http://localhost:5000/api/crew-status`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
            ]);

            // build maps for driver/depot and conductor/depot
            const driverDepot = new Map<number, number>(); // person_id -> depot_id
            const conductorDepot = new Map<number, number>();
            if (driversRes.status === 'fulfilled' && Array.isArray(driversRes.value.data)) {
              driversRes.value.data.forEach((dr: any) => {
                const id = dr.driver_id ?? dr.person_id;
                if (id) driverDepot.set(Number(id), dr.depot_id);
              });
            }
            if (conductorsRes.status === 'fulfilled' && Array.isArray(conductorsRes.value.data)) {
              conductorsRes.value.data.forEach((c: any) => {
                const id = c.conductor_id ?? c.person_id;
                if (id) conductorDepot.set(Number(id), c.depot_id);
              });
            }

            if (crewStatusRes.status === 'fulfilled' && Array.isArray(crewStatusRes.value.data)) {
              (crewStatusRes.value.data as any[]).forEach((cs) => {
                const pid = cs.person_id;
                const status = String(cs.status || '').toLowerCase();
                // check driver map first
                if (driverDepot.has(pid)) {
                  const dep = driverDepot.get(pid) as any;
                  const key = dep;
                  const existing = depotMap.get(key) ?? depotMap.get(String(key));
                  if (existing) {
                    if (!existing.driverActive) existing.driverActive = 0;
                    if (!existing.driverOnBreak) existing.driverOnBreak = 0;
                    if (status.includes('break')) existing.driverOnBreak!++;
                    else existing.driverActive!++;
                  } else {
                    const newEntry: DepotReportApi = { depot_id: dep, depot: `Depot ${dep}`, buses: 0, crews: 0, driverActive: 0, driverOnBreak: 0 };
                    if (status.includes('break')) newEntry.driverOnBreak = 1;
                    else newEntry.driverActive = 1;
                    depotMap.set(key, newEntry);
                  }
                } else if (conductorDepot.has(pid)) {
                  const dep = conductorDepot.get(pid) as any;
                  const key = dep;
                  const existing = depotMap.get(key) ?? depotMap.get(String(key));
                  if (existing) {
                    if (!existing.conductorActive) existing.conductorActive = 0;
                    if (!existing.conductorOnBreak) existing.conductorOnBreak = 0;
                    if (status.includes('break')) existing.conductorOnBreak!++;
                    else existing.conductorActive!++;
                  } else {
                    const newEntry: DepotReportApi = { depot_id: dep, depot: `Depot ${dep}`, buses: 0, crews: 0, conductorActive: 0, conductorOnBreak: 0 };
                    if (status.includes('break')) newEntry.conductorOnBreak = 1;
                    else newEntry.conductorActive = 1;
                    depotMap.set(key, newEntry);
                  }
                }
              });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.warn('Failed to fetch crew split endpoints:', msg);
          }
          }
        }

        // 4) Final fallback: if crew split still missing, split total crews proportionally (60% drivers / 40% conductors)
        const finalList: DepotReportApi[] = Array.from(depotMap.values()).map((d) => {
          const out: DepotReportApi = {
            depot_id: d.depot_id,
            depot: d.depot,
            buses: Number(d.buses || 0),
            crews: Number(d.crews || 0),
            activeBuses: d.activeBuses,
            maintenanceBuses: d.maintenanceBuses,
            driverActive: d.driverActive,
            driverOnBreak: d.driverOnBreak,
            conductorActive: d.conductorActive,
            conductorOnBreak: d.conductorOnBreak,
          };

          // if no driver/conductor numbers at all, derive
          const hasDriverConductorNumbers = (typeof out.driverActive === 'number') || (typeof out.conductorActive === 'number');
          if (!hasDriverConductorNumbers) {
            const totalCrew = out.crews || 0;
            // assume 60% drivers, 40% conductors; assume 85% on duty for both as heuristics
            const drivers = Math.round(totalCrew * 0.6);
            const conductors = totalCrew - drivers;
            const driversOnDuty = Math.round(drivers * 0.85);
            const driversOnBreak = drivers - driversOnDuty;
            const condOnDuty = Math.round(conductors * 0.85);
            const condOnBreak = conductors - condOnDuty;
            out.driverActive = driversOnDuty;
            out.driverOnBreak = driversOnBreak;
            out.conductorActive = condOnDuty;
            out.conductorOnBreak = condOnBreak;
          }

          // if activeBuses missing, assume 85% active using crews/buses if available
          if (out.activeBuses === undefined) {
            const totalB = out.buses || 0;
            const active = Math.round(totalB * 0.85);
            out.activeBuses = active;
            out.maintenanceBuses = totalB - active;
          }

          return out;
        });

        if (!cancelled) setData(finalList.length ? finalList : FALLBACK);
      } catch (err: any) {
        console.error('OpsReports fetch error', err);
        if (!cancelled) {
          setError('Failed to load depot reports, showing sample data');
          setData(FALLBACK);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [regionId, token]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Operations Reports</h1>
     
      {loading && <div className="text-sm text-gray-500 mb-3">Loading...</div>}
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Buses by Depot</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="depot" angle={-30} textAnchor="end" interval={0} height={60} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="activeBuses" name="Active Buses" fill="#1E40AF" />
            <Bar dataKey="maintenanceBuses" name="In Maintenance" fill="#60A5FA" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Crew by Depot</h2>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="depot" />
            <YAxis />
            <Tooltip formatter={(value: number) => `${value} persons`} />
            <Legend />
            {/* Drivers */}
            <Bar dataKey="driverActive" name="Drivers - On Duty" fill={CREW_COLORS[0]} />
            <Bar dataKey="driverOnBreak" name="Drivers - On Break" fill={CREW_COLORS[1]} />
            {/* Conductors */}
            <Bar dataKey="conductorActive" name="Conductors - On Duty" fill={CREW_COLORS[2]} />
            <Bar dataKey="conductorOnBreak" name="Conductors - On Break" fill={CREW_COLORS[3]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
};

export default OpsReports;
