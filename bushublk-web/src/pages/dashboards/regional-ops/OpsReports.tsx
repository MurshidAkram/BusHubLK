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
  activeBuses?: number;
  maintenanceBuses?: number;
  driverActive?: number;
  driverOnBreak?: number;
  conductorActive?: number;
  conductorOnBreak?: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${API_URL}/api`;

const CREW_COLORS = ['#10b981', '#f59e42', '#6366f1', '#f87171'];

const SAMPLE: DepotReportApi[] = [
  { depot: 'Colombo Depot', buses: 120, crews: 250, activeBuses: 102, maintenanceBuses: 18, driverActive: 140, driverOnBreak: 30, conductorActive: 70, conductorOnBreak: 10 },
  { depot: 'Pettah', buses: 80, crews: 160, activeBuses: 58, maintenanceBuses: 22, driverActive: 85, driverOnBreak: 20, conductorActive: 50, conductorOnBreak: 5 },
  { depot: 'Nugegoda', buses: 70, crews: 150, activeBuses: 54, maintenanceBuses: 16, driverActive: 75, driverOnBreak: 18, conductorActive: 55, conductorOnBreak: 12 },
  { depot: 'Kotte', buses: 65, crews: 140, activeBuses: 51, maintenanceBuses: 14, driverActive: 68, driverOnBreak: 12, conductorActive: 45, conductorOnBreak: 15 },
  { depot: 'Dehiwala', buses: 90, crews: 180, activeBuses: 72, maintenanceBuses: 18, driverActive: 95, driverOnBreak: 20, conductorActive: 45, conductorOnBreak: 20 },
];

const OpsReports: React.FC = () => {
  const { user, token } = useContext(AppContext) || {};
  const regionId = (user as any)?.region_id || (user as any)?.regionId || Number(localStorage.getItem('region_id')) || 1;

  const [data, setData] = useState<DepotReportApi[]>(SAMPLE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchOverviewOnly = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/regional-dashboard/region/${regionId}/overview`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res?.data?.success || !res.data.data) {
          throw new Error(res?.data?.error || 'Invalid overview response');
        }

        const dp = Array.isArray(res.data.data.depotsPerformance) ? res.data.data.depotsPerformance : [];

        // Map and fill reasonable fallbacks where backend didn't provide per-depot splits
        const mapped: DepotReportApi[] = dp.map((d: any) => {
          const buses = Number(d.buses || 0);
          const crews = Number(d.crews || 0);

          // if backend didn't send active/maintenance, assume 85% active
          const activeBuses = d.activeBuses !== undefined ? Number(d.activeBuses) : Math.round(buses * 0.85);
          const maintenanceBuses = d.maintenanceBuses !== undefined ? Number(d.maintenanceBuses) : (buses - activeBuses);

          // if backend didn't send driver/conductor split, estimate: 60% drivers, 40% conductors, 85% on duty
          let driverActive = d.driverActive;
          let driverOnBreak = d.driverOnBreak;
          let conductorActive = d.conductorActive;
          let conductorOnBreak = d.conductorOnBreak;
          if (driverActive === undefined && conductorActive === undefined) {
            const drivers = Math.round(crews * 0.6);
            const conductors = crews - drivers;
            driverActive = Math.round(drivers * 0.85);
            driverOnBreak = drivers - driverActive;
            conductorActive = Math.round(conductors * 0.85);
            conductorOnBreak = conductors - conductorActive;
          }

          return {
            depot_id: d.depot_id,
            depot: d.depot,
            buses,
            crews,
            activeBuses,
            maintenanceBuses,
            driverActive: Number(driverActive || 0),
            driverOnBreak: Number(driverOnBreak || 0),
            conductorActive: Number(conductorActive || 0),
            conductorOnBreak: Number(conductorOnBreak || 0),
          } as DepotReportApi;
        });

        if (!cancelled) {
          setData(mapped.length ? mapped : SAMPLE);
        }
      } catch (err: any) {
        console.error('OpsReports fetch error', err?.response?.data || err.message || err);
        if (!cancelled) {
          // keep sample data but surface the error so user knows
          setError(err?.response?.data?.error || err?.message || 'Failed to fetch depot reports');
          setData(SAMPLE);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOverviewOnly();
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
          <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="depot" interval={0} angle={-30} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip formatter={(value: number) => `${value} persons`} />
            <Legend />
            <Bar dataKey="driverActive" name="Drivers - On Duty" fill={CREW_COLORS[0]} />
            <Bar dataKey="driverOnBreak" name="Drivers - On Break" fill={CREW_COLORS[1]} />
            <Bar dataKey="conductorActive" name="Conductors - On Duty" fill={CREW_COLORS[2]} />
            <Bar dataKey="conductorOnBreak" name="Conductors - On Break" fill={CREW_COLORS[3]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
};

export default OpsReports;
