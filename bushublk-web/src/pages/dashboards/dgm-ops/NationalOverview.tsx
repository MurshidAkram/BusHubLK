import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import axios from 'axios';
import { AppContext } from '../../../context/AppContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${API_URL}/api`;
const DGM_API_BASE = `${API_BASE_URL}/dgm-operations-dashboard`;
const ASSIGNMENTS_API_BASE = `${API_BASE_URL}/assignments`;

const getTodayDateString = () => {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localTime.toISOString().slice(0, 10);
};

const NationalOverview: React.FC = () => {
  const appContext = useContext(AppContext);
  const token = appContext?.token ?? localStorage.getItem('bushublk_token') ?? '';

  const todayDate = useMemo(() => getTodayDateString(), []);

  const [regions, setRegions] = useState<Region[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [regionsError, setRegionsError] = useState<string | null>(null);

  const [depots, setDepots] = useState<Depot[]>([]);
  const [depotsLoading, setDepotsLoading] = useState(false);
  const [depotsError, setDepotsError] = useState<string | null>(null);

  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedDepot, setSelectedDepot] = useState<Depot | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [view, setView] = useState<'regions' | 'depots' | 'routes'>('regions');

  const authHeaders = useMemo(() => (
    token ? { Authorization: `Bearer ${token}` } : undefined
  ), [token]);

  const fetchRegions = useCallback(async () => {
    if (!token) {
      setRegionsError('Authentication required to load regions.');
      setRegions([]);
      return;
    }

    setRegionsLoading(true);
    setRegionsError(null);
    try {
      const response = await axios.get(`${DGM_API_BASE}/regions`, {
        headers: authHeaders
      });
      const regionsData: Region[] = response.data?.regions ?? [];
      setRegions(regionsData);
    } catch (error: any) {
      setRegionsError(
        error?.response?.data?.error || 'Unable to load regions overview.'
      );
      setRegions([]);
    } finally {
      setRegionsLoading(false);
    }
  }, [authHeaders, token]);

  const fetchDepotsForRegion = useCallback(async (regionId: number) => {
    if (!token) {
      setDepotsError('Authentication required to load depots.');
      setDepots([]);
      return;
    }

    setDepotsLoading(true);
    setDepotsError(null);
    try {
      const response = await axios.get(`${DGM_API_BASE}/regions/${regionId}/depots`, {
        headers: authHeaders
      });
      const depotsData: Depot[] = response.data?.depots ?? [];
      setDepots(depotsData);
    } catch (error: any) {
      setDepotsError(
        error?.response?.data?.error || 'Unable to load depots for this region.'
      );
      setDepots([]);
    } finally {
      setDepotsLoading(false);
    }
  }, [authHeaders, token]);

  const fetchRoutesForDepot = useCallback(async (depotId: number) => {
    if (!token) {
      setRoutesError('Authentication required to load routes.');
      setRoutes([]);
      return;
    }

    setRoutesLoading(true);
    setRoutesError(null);
    try {
      const response = await axios.get(`${DGM_API_BASE}/depots/${depotId}/routes`, {
        headers: authHeaders
      });
      const data: RouteItem[] = response.data?.routes ?? [];
      setRoutes(data);
    } catch (error: any) {
      setRoutesError(
        error?.response?.data?.error || 'Unable to load routes for this depot.'
      );
      setRoutes([]);
    } finally {
      setRoutesLoading(false);
    }
  }, [authHeaders, token]);

  const fetchSchedule = useCallback(async (routeId: number, date: string) => {
    setScheduleLoading(true);
    setScheduleError(null);
    try {
      const response = await axios.get(
        `${ASSIGNMENTS_API_BASE}/route/${routeId}/daily-schedule`,
        {
          params: { date },
          headers: authHeaders
        }
      );
      const data: ScheduleSlot[] = response.data?.schedule ?? [];
      setSchedule(data);
    } catch (error: any) {
      console.error('Failed to fetch schedule', error);
      setScheduleError(
        error?.response?.data?.error || 'Unable to load schedule for this route.'
      );
      setSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  useEffect(() => {
    if (!selectedRouteId) {
      setSchedule([]);
      setScheduleError(null);
      return;
    }
    fetchSchedule(selectedRouteId, selectedDate);
  }, [selectedRouteId, selectedDate, fetchSchedule]);

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    setView('depots');
    setSelectedDepot(null);
    setSelectedRouteId(null);
    setRoutes([]);
    setSchedule([]);
    setDepotsError(null);
    setRoutesError(null);
    setScheduleError(null);
    fetchDepotsForRegion(region.region_id);
  };

  const handleDepotSelect = (depot: Depot) => {
    setSelectedDepot(depot);
    setView('routes');
    setSelectedRouteId(null);
    setRoutes([]);
    setSchedule([]);
    setRoutesError(null);
    setScheduleError(null);
    fetchRoutesForDepot(depot.depot_id);
  };

  const handleRouteSelect = (routeId: number) => {
    setSelectedRouteId(routeId);
  };

  const handleBackToRegions = () => {
    setView('regions');
    setSelectedRegion(null);
    setSelectedDepot(null);
    setSelectedRouteId(null);
    setDepots([]);
    setRoutes([]);
    setSchedule([]);
    setDepotsError(null);
    setRoutesError(null);
    setScheduleError(null);
  };

  const handleBackToDepots = () => {
    if (!selectedRegion) {
      handleBackToRegions();
      return;
    }
    setView('depots');
    setSelectedDepot(null);
    setSelectedRouteId(null);
    setRoutes([]);
    setSchedule([]);
    setRoutesError(null);
    setScheduleError(null);
  };

  const handleDateChange = useCallback((value: string) => {
    if (!value) {
      setSelectedDate(todayDate);
      return;
    }
    if (value > todayDate) {
      setSelectedDate(todayDate);
      return;
    }
    setSelectedDate(value);
  }, [todayDate]);

  const selectedRoute = useMemo(() => {
    if (!selectedRouteId) {
      return null;
    }
    return routes.find(route => route.route_id === selectedRouteId) ?? null;
  }, [routes, selectedRouteId]);

  const assignedSlots = useMemo(
    () => schedule.filter(slot => !!slot.assignment),
    [schedule]
  );

  const unassignedCount = Math.max(schedule.length - assignedSlots.length, 0);

  const uniqueBuses = useMemo(() => {
    const ids = new Set<number>();
    schedule.forEach(slot => {
      if (slot.assignment?.bus_id) {
        ids.add(slot.assignment.bus_id);
      }
    });
    return ids.size;
  }, [schedule]);

  const uniqueCrew = useMemo(() => {
    const ids = new Set<string>();
    schedule.forEach(slot => {
      const assignment = slot.assignment;
      if (assignment?.driver_id) {
        ids.add(`driver-${assignment.driver_id}`);
      }
      if (assignment?.conductor_id) {
        ids.add(`conductor-${assignment.conductor_id}`);
      }
    });
    return ids.size;
  }, [schedule]);

  const totalDepotsAcrossRegions = useMemo(() => (
    regions.reduce((sum, region) => sum + (region.depot_count ?? 0), 0)
  ), [regions]);

  const totalRoutesAcrossRegions = useMemo(() => (
    regions.reduce((sum, region) => sum + (region.route_count ?? 0), 0)
  ), [regions]);

  const formatTime12h = (time: string) => {
    if (!time) return '--';
    const [hourStr, minuteStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr ?? '0', 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const sanitizeTime = (time: string) => {
    if (!time) return '';
    const [hourStr, minuteStr] = time.split(':');
    return `${hourStr}:${(minuteStr ?? '0').padStart(2, '0')}`;
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const regionSummary = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <div className="text-sm text-gray-500">Regions</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">{regions.length}</div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <div className="text-sm text-gray-500">Total Depots</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">{totalDepotsAcrossRegions}</div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <div className="text-sm text-gray-500">Total Routes</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">{totalRoutesAcrossRegions}</div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <div className="text-sm text-gray-500">Selected Date</div>
        <div className="text-lg font-semibold text-gray-900 mt-2">
          {formatDisplayDate(selectedDate)}
        </div>
      </div>
    </div>
  );

  const depotSummary = selectedRegion ? (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <div className="text-sm text-gray-500">Region</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">{selectedRegion.region_name}</div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <div className="text-sm text-gray-500">Depots</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">{depots.length}</div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <div className="text-sm text-gray-500">Routes</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">{selectedDepot ? routes.length : selectedRegion.route_count ?? 0}</div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <div className="text-sm text-gray-500">Selected Date</div>
        <div className="text-lg font-semibold text-gray-900 mt-2">
          {formatDisplayDate(selectedDate)}
        </div>
      </div>
    </div>
  ) : null;

  const routeSummary = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <div className="text-sm text-gray-500">Total Slots</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">{schedule.length}</div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <div className="text-sm text-gray-500">Assigned Slots</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">{assignedSlots.length}</div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <div className="text-sm text-gray-500">Unassigned Slots</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">{unassignedCount}</div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <div className="text-sm text-gray-500">Unique Crew</div>
        <div className="text-lg font-semibold text-gray-900 mt-2">
          {uniqueBuses} buses • {uniqueCrew} crew
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-6">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">National Schedule Oversight</h1>
              <p className="text-gray-600 mt-2">
                Review regions, drill into depots, and inspect route assignments across the network.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="text-lg font-semibold text-gray-900 text-center">
                {formatDisplayDate(selectedDate)}
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                max={todayDate}
                className="mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <button
                  onClick={handleBackToRegions}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                  disabled={view === 'regions'}
                >
                  <svg className="flex-shrink-0 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </button>
              </li>
              {view !== 'regions' && selectedRegion && (
                <li>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                    </svg>
                    <button
                      onClick={handleBackToRegions}
                      className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      {selectedRegion.region_name}
                    </button>
                  </div>
                </li>
              )}
              {view === 'routes' && selectedDepot && (
                <li>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                    </svg>
                    <button
                      onClick={handleBackToDepots}
                      className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      {selectedDepot.depot_name}
                    </button>
                  </div>
                </li>
              )}
            </ol>
          </nav>
        </div>

        {view === 'regions' && (
          <div>
            {regionSummary}
            {regionsLoading && (
              <div className="text-gray-500">Loading regions…</div>
            )}
            {regionsError && (
              <div className="text-red-600">{regionsError}</div>
            )}
            {!regionsLoading && !regionsError && !regions.length && (
              <div className="text-gray-500">No regions available.</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {regions.map((region) => (
                <button
                  key={region.region_id}
                  onClick={() => handleRegionSelect(region)}
                  className="text-left bg-white rounded-2xl shadow border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{region.region_name}</h3>
                    <span className="px-3 py-1 rounded-full text-sm border bg-blue-50 text-blue-700 border-blue-200">
                      {region.depot_count ?? 0} depots
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {region.route_count ?? 0} active routes
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'depots' && selectedRegion && (
          <div>
            {depotSummary}
            {depotsLoading && (
              <div className="text-gray-500">Loading depots…</div>
            )}
            {depotsError && (
              <div className="text-red-600">{depotsError}</div>
            )}
            {!depotsLoading && !depotsError && !depots.length && (
              <div className="text-gray-500">No depots available for this region.</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {depots.map((depot) => {
                const isActiveDepot = selectedDepot && selectedDepot.depot_id === depot.depot_id;
                const routeBadge = isActiveDepot ? `${routes.length} routes` : `${depot.route_count ?? 0} routes`;
                return (
                  <button
                    key={depot.depot_id}
                    onClick={() => handleDepotSelect(depot)}
                    className="text-left bg-white rounded-2xl shadow border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">{depot.depot_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm border ${isActiveDepot ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {routeBadge}
                      </span>
                    </div>
                    </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'routes' && selectedRegion && selectedDepot && (
          <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
            <div className="flex flex-col lg:flex-row min-h-[560px]">
              <div className="lg:w-1/4 border-r border-gray-200 bg-gray-50">
                <div className="p-6 bg-white border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedDepot.depot_name}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {routes.length} route{routes.length === 1 ? '' : 's'} | {selectedRegion.region_name}
                      </p>
                    </div>
                    <button
                      onClick={handleBackToDepots}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Back
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-260px)]">
                  {routesLoading && <div className="text-gray-500">Loading routes…</div>}
                  {routesError && <div className="text-red-600">{routesError}</div>}
                  {!routesLoading && !routesError && !routes.length && (
                    <div className="text-gray-500 text-sm">No routes available for this depot.</div>
                  )}
                  {routes.map(route => (
                    <button
                      key={route.route_id}
                      onClick={() => handleRouteSelect(route.route_id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all
                        ${selectedRouteId === route.route_id ? 'border-blue-500 bg-white shadow' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                          {route.route_number}
                        </span>
                        {selectedRouteId === route.route_id && (
                          <span className="text-xs text-green-600 font-medium">Active</span>
                        )}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-gray-900">
                        {route.route_name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:w-3/4 bg-white">
                {selectedRoute ? (
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Route {selectedRoute.route_number}: {selectedRoute.route_name}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Depot {selectedDepot.depot_name} • {selectedRegion.region_name}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        Viewing assignments for {formatDisplayDate(selectedDate)}
                      </div>
                    </div>

                    {routeSummary}

                    {scheduleLoading && (
                      <div className="text-gray-500">Loading schedule…</div>
                    )}
                    {scheduleError && (
                      <div className="text-red-600 mb-4">{scheduleError}</div>
                    )}

                    {!scheduleLoading && !scheduleError && (
                      <div className="border border-gray-200 rounded-2xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">Daily Schedule</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Time Slot
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Bus Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Crew Assignment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {schedule.length ? (
                                schedule
                                  .slice()
                                  .sort((a, b) => sanitizeTime(a.shift_start_time).localeCompare(sanitizeTime(b.shift_start_time)))
                                  .map(slot => (
                                    <tr key={slot.assignment_id} className="hover:bg-blue-50 transition-colors">
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-semibold text-gray-900">
                                          {formatTime12h(sanitizeTime(slot.shift_start_time))} – {formatTime12h(sanitizeTime(slot.shift_end_time))}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        {slot.assignment ? (
                                          <div>
                                            <div className="font-semibold text-gray-900">
                                              {slot.assignment.bus_registration ?? 'Bus not set'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                              {slot.assignment.bus_type ?? 'Type not available'}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-sm text-red-600 font-medium">Not assigned</span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4">
                                        {slot.assignment ? (
                                          <div className="space-y-2">
                                            <div>
                                              <div className="text-sm font-semibold text-gray-900">
                                                {slot.assignment.driver_name ?? 'Driver not assigned'}
                                              </div>
                                              <div className="text-xs text-gray-500">Driver</div>
                                            </div>
                                            <div>
                                              <div className="text-sm font-semibold text-gray-900">
                                                {slot.assignment.conductor_name ?? 'Conductor not assigned'}
                                              </div>
                                              <div className="text-xs text-gray-500">Conductor</div>
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-sm text-red-600 font-medium">Not assigned</span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        {slot.assignment ? (
                                          <span className="px-4 py-2 rounded-full text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50">
                                            {slot.assignment.status ?? 'Scheduled'}
                                          </span>
                                        ) : (
                                          <span className="px-4 py-2 rounded-full text-xs font-semibold border border-gray-200 text-gray-600 bg-gray-50">
                                            Not scheduled
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    No slots configured for this route.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-24 px-4 text-center text-gray-600">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Select a route</h3>
                    <p className="max-w-md">
                      Choose a route from the list to view scheduled assignments for the selected date.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface Region {
  region_id: number;
  region_name: string;
  depot_count?: number;
  route_count?: number;
}

interface Depot {
  depot_id: number;
  depot_name: string;
  region_id: number;
  route_count?: number;
}

interface Assignment {
  assignment_id: number;
  bus_id: number | null;
  bus_registration: string | null;
  bus_type: string | null;
  driver_id: number | null;
  driver_name: string | null;
  conductor_id: number | null;
  conductor_name: string | null;
  status: string | null;
  shift_start_time: string;
  shift_end_time: string;
  assignment_date: string;
}

interface ScheduleSlot {
  assignment_id: number;
  shift_start_time: string;
  shift_end_time: string;
  assignment: Assignment | null;
}

interface RouteItem {
  route_id: number;
  route_number: string;
  route_name: string;
  depot_id: number;
}

export default NationalOverview;
