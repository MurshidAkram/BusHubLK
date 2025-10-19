import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { AppContext } from '../../../context/AppContext';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const buildDepotEngineerBusesUrl = () => `${API_BASE_URL}/api/depot-engineer/buses`;

const buildDepotBusesUrl = (depotId: string) => `${API_BASE_URL}/api/buses/depot/${depotId}`;

const buildDepotEngineerSchedulesUrl = () => `${API_BASE_URL}/api/depot-engineer/service-schedules`;

const buildLegacyServiceSchedulesUrl = () => `${API_BASE_URL}/api/service-schedules`;

const buildDepotEmergencyUrl = () => `${API_BASE_URL}/api/depot/emergency`;

const buildDepotEngineerSparePartsUrl = () => `${API_BASE_URL}/api/depot-engineer/spare-parts`;

const buildDepotEngineerSparePartsUsageUrl = () => `${API_BASE_URL}/api/depot-engineer/spare-parts/usage-history`;

type Bus = {
  bus_id: string;
  registration_number: string;
  model: string;
  year: number;
  status: string;
  depot_name: string;
  class: string;
  manufacturer: string;
  purchase_date: string;
};

type ServiceSchedule = {
  id: number;
  service_type: string;
  bus_id: string;
  scheduled_date: string | null;
  completed_date: string | null;
  status: string;
  calculated_status?: string;
  registration_number?: string;
};

type EmergencyReport = {
  id: number;
  incident_type: string | null;
  description: string | null;
  status: string | null;
  created_at: string | null;
  vehicle_registration: string | null;
  depot_name?: string | null;
};

interface BusResponse {
  message?: string;
  buses?: Bus[];
}

interface ServiceScheduleResponse {
  schedules?: ServiceSchedule[];
}

interface EmergencyResponse {
  data?: EmergencyReport[];
}

type SparePart = {
  id: string;
  part_id: string;
  part_name: string;
  current_stock: number;
  last_restocked: string;
  unit: string;
  created_at: string;
};

type SparePartUsage = {
  usage_id: number;
  part_id: string;
  part_name: string;
  bus_id: number | null;
  quantity_used: number;
  unit: string;
  usage_date: string;
  registration_number?: string;
  first_name?: string;
  last_name?: string;
};

interface AppContextType {
  user: { role: string; userId: string; depot_id?: string; region_id?: string } | undefined;
  token: string | null;
}

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB');
};

const getStatusLabel = (status?: string | null) => (status && status.trim().length > 0 ? status : 'Unknown');

const chartColors = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#22d3ee'];

const timeframeOptions = [
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
  { label: 'Last 180 days', value: 180 },
];

const copyPageStyles = () =>
  Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map((node) => node.outerHTML)
    .join('');

const GenerateReports: React.FC = () => {
  // @ts-ignore
  const context = useContext(AppContext) as AppContextType | undefined;
  const token = context?.token;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [serviceSchedules, setServiceSchedules] = useState<ServiceSchedule[]>([]);
  const [issues, setIssues] = useState<EmergencyReport[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeframe, setTimeframe] = useState<number>(30);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [sparePartUsage, setSparePartUsage] = useState<SparePartUsage[]>([]);
  const [sparePartsLoading, setSparePartsLoading] = useState<boolean>(false);
  const [sparePartsError, setSparePartsError] = useState<string | null>(null);

  const cutoffDate = useMemo(() => {
    const option = timeframeOptions.find((item) => item.value === timeframe);
    if (!option) {
      return null;
    }
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - option.value + 1);
    return date;
  }, [timeframe]);

  const timeframeLabel = useMemo(() => {
    const option = timeframeOptions.find((item) => item.value === timeframe);
    return option ? option.label : 'Last 30 days';
  }, [timeframe]);

  const fetchData = async () => {
    if (!token) {
      setError('Please log in to view depot reports.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = { Authorization: `Bearer ${token}` };

      let busEndpoint = buildDepotEngineerBusesUrl();
      if (context?.user?.role === 'depot_manager' || context?.user?.role === 'depot_operations') {
        if (context?.user?.depot_id) {
          busEndpoint = buildDepotBusesUrl(context.user.depot_id);
        }
      }

      const scheduleEndpoint = buildDepotEngineerSchedulesUrl();
      const scheduleParams = {
        include_cancelled: true,
        ...(context?.user?.role && context.user.role !== 'depot_engineer' && context.user.depot_id
          ? { depot_id: context.user.depot_id }
          : {}),
      };

      const [busResponse, scheduleResponse, emergencyResponse] = await Promise.all([
        axios.get<BusResponse>(busEndpoint, { headers }),
        axios
          .get<ServiceScheduleResponse>(scheduleEndpoint, {
            headers,
            params: scheduleParams,
          })
          .catch((scheduleError: AxiosError) => {
            if (scheduleError.response?.status === 404) {
              console.warn('Service schedule endpoint returned 404, falling back to legacy route.');
              return axios.get<ServiceScheduleResponse>(buildLegacyServiceSchedulesUrl(), {
                headers,
                params: scheduleParams,
              });
            }
            throw scheduleError;
          }),
        axios
          .get<EmergencyResponse>(buildDepotEmergencyUrl(), {
            headers,
            params: context?.user?.depot_id ? { depotId: context.user.depot_id } : undefined,
          })
          .catch(() => ({ data: { data: [] } } as { data: EmergencyResponse })),
      ]);

      setBuses(busResponse.data?.buses ?? []);
      setServiceSchedules(scheduleResponse.data?.schedules ?? []);
      setIssues(emergencyResponse.data?.data ?? []);
      setLastUpdated(new Date());
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response) {
        setError(
          `Failed to load depot data: ${axiosError.response.status} - ${
            (axiosError.response.data as { message?: string })?.message || axiosError.response.statusText
          }`
        );
      } else if (axiosError.request) {
        setError('Unable to reach the depot services API. Please check your network connection.');
      } else {
        setError(`Unexpected error: ${axiosError.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSparePartsData = useCallback(async () => {
    if (!token) {
      setSpareParts([]);
      setSparePartUsage([]);
      return;
    }

    try {
      setSparePartsLoading(true);
      setSparePartsError(null);

      const headers = { Authorization: `Bearer ${token}` };
      const now = new Date();
      const toDate = new Date(now);
      toDate.setHours(23, 59, 59, 999);
      const fromDate = new Date(now);
      fromDate.setHours(0, 0, 0, 0);
      fromDate.setDate(fromDate.getDate() - timeframe + 1);

      const [partsResponse, usageResponse] = await Promise.all([
        axios.get<{ success: boolean; parts: SparePart[]; message?: string }>(
          buildDepotEngineerSparePartsUrl(),
          { headers }
        ),
        axios.get<{ success: boolean; usageHistory: SparePartUsage[]; message?: string }>(
          buildDepotEngineerSparePartsUsageUrl(),
          {
            headers,
            params: {
              limit: 500,
              date_from: fromDate.toISOString(),
              date_to: toDate.toISOString(),
            },
          }
        ),
      ]);

      if (partsResponse.data?.success) {
        setSpareParts(partsResponse.data.parts ?? []);
      } else {
        setSpareParts([]);
        setSparePartsError(partsResponse.data?.message || 'Unable to load spare parts inventory.');
      }

      if (usageResponse.data?.success) {
        setSparePartUsage(usageResponse.data.usageHistory ?? []);
      } else {
        setSparePartUsage([]);
        setSparePartsError((prev) => prev ?? (usageResponse.data?.message || 'Unable to load spare parts usage.'));
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('💥 Spare parts report fetch error:', axiosError);
      setSpareParts([]);
      setSparePartUsage([]);
      if (axiosError.response) {
        setSparePartsError(
          `Failed to load spare parts data: ${axiosError.response.status} - ${
            (axiosError.response.data as { message?: string })?.message || axiosError.response.statusText
          }`
        );
      } else if (axiosError.request) {
        setSparePartsError('Unable to reach the spare parts service. Please check your network connection.');
      } else {
        setSparePartsError(`Unexpected spare parts error: ${axiosError.message}`);
      }
    } finally {
      setSparePartsLoading(false);
    }
  }, [token, timeframe]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    fetchSparePartsData();
  }, [fetchSparePartsData]);

  const filteredServiceSchedules = useMemo(() => {
    if (!cutoffDate) {
      return serviceSchedules;
    }

    return serviceSchedules.filter((schedule) => {
      const referenceDate = schedule.completed_date || schedule.scheduled_date;
      if (!referenceDate) {
        return false;
      }
      const scheduleDate = new Date(referenceDate);
      if (Number.isNaN(scheduleDate.getTime())) {
        return false;
      }
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate >= cutoffDate;
    });
  }, [serviceSchedules, cutoffDate]);

  const filteredIssues = useMemo(() => {
    if (!cutoffDate) {
      return issues;
    }

    return issues.filter((report) => {
      if (!report.created_at) {
        return false;
      }
      const created = new Date(report.created_at);
      if (Number.isNaN(created.getTime())) {
        return false;
      }
      created.setHours(0, 0, 0, 0);
      return created >= cutoffDate;
    });
  }, [issues, cutoffDate]);

  const depotName = useMemo(() => {
    if (buses.length > 0 && buses[0].depot_name) {
      return buses[0].depot_name;
    }
    if (issues.length > 0 && issues[0].depot_name) {
      return issues[0].depot_name ?? 'Depot';
    }
    return 'Depot';
  }, [buses, issues]);

  const busStats = useMemo(() => {
    const statusCounts = buses.reduce<Record<string, number>>((acc, bus) => {
      const status = getStatusLabel(bus.status);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      total: buses.length,
      statusCounts,
      active: statusCounts['Active'] ?? 0,
      inService: statusCounts['In Service'] ?? 0,
      maintenance: statusCounts['Maintenance'] ?? 0,
      outOfService: statusCounts['Out of Service'] ?? 0,
    };
  }, [buses]);

  const serviceStats = useMemo(() => {
    const statusCounts = filteredServiceSchedules.reduce<Record<string, number>>((acc, schedule) => {
      const status = getStatusLabel(schedule.calculated_status || schedule.status);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const upcomingStatuses = ['Pending', 'Due Today'];
    const overdueStatuses = ['Overdue', 'Critical Overdue'];

    const upcoming = upcomingStatuses.reduce((total, status) => total + (statusCounts[status] ?? 0), 0);
    const overdue = overdueStatuses.reduce((total, status) => total + (statusCounts[status] ?? 0), 0);

    const inProgress = statusCounts['In Progress'] ?? 0;
    const completed = statusCounts['Completed'] ?? 0;

    const upcomingList = filteredServiceSchedules
      .filter((schedule) => upcomingStatuses.includes(getStatusLabel(schedule.calculated_status || schedule.status)))
      .sort((a, b) => {
        const aDate = new Date(a.scheduled_date || 0).getTime();
        const bDate = new Date(b.scheduled_date || 0).getTime();
        return aDate - bDate;
      })
      .slice(0, 8);

    const overdueList = filteredServiceSchedules
      .filter((schedule) => overdueStatuses.includes(getStatusLabel(schedule.calculated_status || schedule.status)))
      .sort((a, b) => {
        const aDate = new Date(a.scheduled_date || 0).getTime();
        const bDate = new Date(b.scheduled_date || 0).getTime();
        return aDate - bDate;
      })
      .slice(0, 8);

    return {
      statusCounts,
      upcoming,
      overdue,
      inProgress,
      completed,
      upcomingList,
      overdueList,
    };
  }, [filteredServiceSchedules]);

  const issueStats = useMemo(() => {
    const statusCounts = filteredIssues.reduce<Record<string, number>>((acc, report) => {
      const status = getStatusLabel(report.status);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const openStatuses = ['New', 'Pending', 'In Progress', 'Escalated to Depot Manager', 'Escalated to RTO'];
    const openReports = filteredIssues.filter((report) => openStatuses.includes(getStatusLabel(report.status))).length;

    const now = new Date();
    const newToday = filteredIssues.filter((report) => {
      if (!report.created_at) return false;
      const created = new Date(report.created_at);
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth() &&
        created.getDate() === now.getDate()
      );
    }).length;

    const criticalQueue = filteredIssues
      .filter((report) => openStatuses.includes(getStatusLabel(report.status)))
      .slice(0, 8);

    const incidentCounts = filteredIssues.reduce<Record<string, number>>((acc, report) => {
      const label = report.incident_type?.trim() || report.description?.trim() || 'Unspecified';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const topIncidentTypes = Object.entries(incidentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }));

    return {
      statusCounts,
      openReports,
      newToday,
      criticalQueue,
      topIncidentTypes,
    };
  }, [filteredIssues]);

  const totalServices = filteredServiceSchedules.length;
  const fleetAvailability = busStats.total ? (busStats.active / busStats.total) * 100 : 0;
  const maintenanceBurden = busStats.total ? (busStats.maintenance / busStats.total) * 100 : 0;
  const serviceCompletionRate = totalServices ? (serviceStats.completed / totalServices) * 100 : 0;
  const overdueRate = totalServices ? (serviceStats.overdue / totalServices) * 100 : 0;
  const totalIncidents = filteredIssues.length;
  const resolvedIncidents = issueStats.statusCounts['Resolved'] ?? 0;
  const incidentResolutionRate = totalIncidents ? (resolvedIncidents / totalIncidents) * 100 : 0;
  const escalatedIncidents =
    (issueStats.statusCounts['Escalated to Depot Manager'] ?? 0) +
    (issueStats.statusCounts['Escalated to RTO'] ?? 0);
  const pendingIncidents = issueStats.statusCounts['Pending'] ?? 0;
  const inProgressIncidents = issueStats.statusCounts['In Progress'] ?? 0;

  const totalPartTypes = spareParts.length;
  const totalUnitsInStock = useMemo(
    () => spareParts.reduce((sum, part) => sum + (Number(part.current_stock) || 0), 0),
    [spareParts]
  );
  const totalUnitsUsed = useMemo(
    () => sparePartUsage.reduce((sum, item) => sum + (Number(item.quantity_used) || 0), 0),
    [sparePartUsage]
  );
  const distinctPartsUsed = useMemo(
    () => new Set(sparePartUsage.map((item) => item.part_id)).size,
    [sparePartUsage]
  );
  const inStockParts = useMemo(
    () => spareParts.filter((part) => part.current_stock > 0).length,
    [spareParts]
  );
  const lowStockParts = useMemo(
    () => spareParts.filter((part) => part.current_stock > 0 && part.current_stock < 10).length,
    [spareParts]
  );
  const outOfStockParts = useMemo(
    () => spareParts.filter((part) => part.current_stock === 0).length,
    [spareParts]
  );
  const topConsumedParts = useMemo(() => {
    const usageMap = new Map<string, { name: string; quantity: number; unit: string }>();

    sparePartUsage.forEach((usage) => {
      const key = usage.part_id || usage.part_name;
      if (!key) {
        return;
      }

      const existing = usageMap.get(key) || {
        name: usage.part_name || usage.part_id || 'Unknown',
        quantity: 0,
        unit: usage.unit || '',
      };

      existing.quantity += Number(usage.quantity_used) || 0;
      existing.unit = usage.unit || existing.unit;
      usageMap.set(key, existing);
    });

    return Array.from(usageMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [sparePartUsage]);

  const recentPartUsage = useMemo(() => {
    return [...sparePartUsage]
      .sort((a, b) => new Date(b.usage_date).getTime() - new Date(a.usage_date).getTime())
      .slice(0, 6);
  }, [sparePartUsage]);

  const formatPercent = (value: number) => `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;

  const fleetStatusChartData = useMemo(
    () =>
      Object.entries(busStats.statusCounts)
        .filter(([, value]) => value > 0)
        .map(([name, value]) => ({ name, value })),
    [busStats]
  );

  const serviceStatusChartData = useMemo(
    () =>
      Object.entries(serviceStats.statusCounts)
        .filter(([, value]) => value > 0)
        .map(([name, value]) => ({ name, value })),
    [serviceStats]
  );

  const incidentTypeChartData = useMemo(
    () => issueStats.topIncidentTypes.map((item) => ({ name: item.label, value: item.count })),
    [issueStats.topIncidentTypes]
  );

  const reportRef = useRef<HTMLDivElement>(null);

  const downloadDepotReport = () => {
    if (!reportRef.current) {
      alert('Generate the report before attempting to download.');
      return;
    }

    const reportHtml = reportRef.current.outerHTML;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const iframeWindow = iframe.contentWindow;
    if (!iframeWindow) {
      document.body.removeChild(iframe);
      alert('Unable to prepare the download. Please try again.');
      return;
    }

    const doc = iframeWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
      <html>
        <head>
          <title>Depot Performance Report</title>
          ${copyPageStyles()}
          <style>
            @page {
              margin: 1cm;
              size: A4;
            }

            body {
              font-family: 'Inter', sans-serif;
              background: #ffffff;
              padding: 16px;
              width: 100%;
              color: #0f172a;
            }

            .report-container {
              max-width: 960px;
              margin: 0 auto;
            }

            .print-hidden {
              display: none !important;
            }

            .grid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            section,
            .rounded-lg,
            table {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th, td {
              border: 1px solid #e2e8f0;
              padding: 8px;
              font-size: 12px;
              text-align: left;
            }

            .space-y-8 > * + * {
              margin-top: 1.5rem;
            }

            @media print {
              body {
                font-size: 12px;
                line-height: 1.4;
              }

              .report-container {
                padding: 0;
              }

              .print\:hidden {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">${reportHtml}</div>
        </body>
      </html>`);
    doc.close();

    const triggerPrint = () => {
      iframeWindow.focus();
      iframeWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    };

    if (doc.readyState === 'complete') {
      setTimeout(triggerPrint, 300);
    } else {
      doc.addEventListener('readystatechange', () => {
        if (doc.readyState === 'complete') {
          setTimeout(triggerPrint, 300);
        }
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Compiling depot report...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div ref={reportRef} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Depot Performance Report</h1>
          <p className="text-gray-600">Consolidated insight across fleet health, service schedules, and emergency responses.</p>
          <p className="text-sm text-gray-500 mt-2">
            Depot: <span className="font-medium text-gray-700">{depotName}</span> · Last refreshed:{' '}
            {lastUpdated ? lastUpdated.toLocaleString() : 'N/A'} · Reporting window:{' '}
            <span className="font-medium text-gray-700">{timeframeLabel}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 print:hidden">
          <div className="flex flex-col">
            <label htmlFor="timeframe" className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Time window
            </label>
            <select
              id="timeframe"
              value={timeframe}
              onChange={(event) => setTimeframe(Number(event.target.value))}
              className="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {timeframeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={downloadDepotReport}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors"
          >
            Download PDF Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard title="Fleet Size" value={busStats.total} description={`${busStats.active} active`} tone="blue" />
        <SummaryCard
          title="Fleet Availability"
          value={formatPercent(fleetAvailability)}
          description={`${busStats.active} buses operational`}
          tone="green"
        />
        <SummaryCard
          title="Maintenance Load"
          value={busStats.maintenance}
          description={`${formatPercent(maintenanceBurden)} of fleet`}
          tone="yellow"
        />
        <SummaryCard
          title="Service Completion"
          value={formatPercent(serviceCompletionRate)}
          description={`${serviceStats.completed} completed`}
          tone="indigo"
        />
        <SummaryCard
          title="Overdue Services"
          value={serviceStats.overdue}
          description={`${formatPercent(overdueRate)} backlog`}
          tone="orange"
        />
        <SummaryCard
          title="Open Emergencies"
          value={issueStats.openReports}
          description={`${issueStats.newToday} reported today`}
          tone="red"
        />
      </div>

      <section className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <header className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900">Fleet Health Overview</h2>
          <p className="text-sm text-gray-600">Live fleet posture as reported by the Bus Management workspace.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Active Fleet"
            value={busStats.active.toLocaleString()}
            helper={formatPercent(fleetAvailability)}
            tone="green"
          />
          <MetricCard
            label="In Maintenance"
            value={busStats.maintenance.toLocaleString()}
            helper={`${formatPercent(maintenanceBurden)} of total`}
            tone="yellow"
          />
          <MetricCard
            label="Out of Service"
            value={busStats.outOfService.toLocaleString()}
            helper={`${busStats.statusCounts['Out of Service'] ?? 0} flagged`}
            tone="orange"
          />
          <MetricCard
            label="Depot Coverage"
            value={depotName}
            helper={
              buses.length
                ? `Primary: ${buses[0].manufacturer ? buses[0].manufacturer : 'Mixed fleet'}`
                : 'No fleet data'
            }
            tone="blue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-lg border border-gray-200 p-5">
            <StatusList title="Status mix" data={busStats.statusCounts} />
          </div>
          <ChartCard title="Fleet status distribution" subtitle="Share of buses by current state">
            {fleetStatusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={fleetStatusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {fleetStatusChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No fleet status data available." />
            )}
          </ChartCard>
          <div className="rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Top fleet snapshot</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-2">Registration</th>
                    <th className="px-4 py-2">Model</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.length === 0 && (
                    <tr>
                      <td className="px-4 py-3" colSpan={3}>
                        No buses found for this depot.
                      </td>
                    </tr>
                  )}
                  {buses.slice(0, 12).map((bus) => (
                    <tr key={bus.bus_id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-medium text-gray-900">{bus.registration_number}</td>
                      <td className="px-4 py-3 text-gray-700">{bus.model}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {getStatusLabel(bus.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <header className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900">Service Operations</h2>
          <p className="text-sm text-gray-600">Pipeline view from the Service Scheduling workspace.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            label="Total Scheduled"
            value={totalServices.toLocaleString()}
            helper={`${serviceStats.inProgress} in progress`}
            tone="blue"
          />
          <MetricCard
            label="Completed"
            value={serviceStats.completed.toLocaleString()}
            helper={formatPercent(serviceCompletionRate)}
            tone="green"
          />
          <MetricCard
            label="Upcoming"
            value={serviceStats.upcoming.toLocaleString()}
            helper={`${serviceStats.upcomingList.length} highlighted`}
            tone="indigo"
          />
          <MetricCard
            label="Overdue"
            value={serviceStats.overdue.toLocaleString()}
            helper={`${formatPercent(overdueRate)} backlog`}
            tone="orange"
          />
          <MetricCard
            label="Critical"
            value={(serviceStats.statusCounts['Critical Overdue'] ?? 0).toLocaleString()}
            helper={`${serviceStats.statusCounts['Critical Overdue'] ?? 0} urgent`}
            tone="red"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Service status mix" subtitle="Volume of work by current phase">
            {serviceStatusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={serviceStatusChartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip formatter={(value: number) => value.toLocaleString()} cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {serviceStatusChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No service status data available." />
            )}
          </ChartCard>
          <div className="rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Upcoming priorities</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {serviceStats.upcomingList.length === 0 && <li>No upcoming services scheduled.</li>}
              {serviceStats.upcomingList.map((item) => (
                <li key={item.id} className="flex justify-between items-center border border-gray-100 rounded-md px-3 py-2">
                  <span className="font-medium text-gray-900">{item.service_type}</span>
                  <span className="text-gray-600">{formatDate(item.scheduled_date)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Overdue & critical backlog</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {serviceStats.overdueList.length === 0 && <li>Great news—no overdue services.</li>}
              {serviceStats.overdueList.map((item) => (
                <li key={item.id} className="flex justify-between items-center border border-red-100 bg-red-50 px-3 py-2 rounded-md">
                  <span className="font-medium text-red-700">{item.service_type}</span>
                  <span className="text-red-600">{formatDate(item.scheduled_date)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <header className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900">Emergency Response</h2>
          <p className="text-sm text-gray-600">Real-time issue flow from the Emergency dashboard.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <MetricCard
            label="Total Incidents"
            value={totalIncidents.toLocaleString()}
            helper={`${issueStats.newToday} today`}
            tone="red"
          />
          <MetricCard
            label="Open"
            value={issueStats.openReports.toLocaleString()}
            helper={`${pendingIncidents} pending`}
            tone="orange"
          />
          <MetricCard
            label="In Progress"
            value={inProgressIncidents.toLocaleString()}
            helper={`${escalatedIncidents} escalated`}
            tone="yellow"
          />
          <MetricCard
            label="Resolved"
            value={resolvedIncidents.toLocaleString()}
            helper={totalIncidents ? `${formatPercent(incidentResolutionRate)}` : 'N/A'}
            tone="green"
          />
          <MetricCard
            label="Escalations"
            value={escalatedIncidents.toLocaleString()}
            helper={`${issueStats.statusCounts['Escalated to Depot Manager'] ?? 0} depot · ${
              issueStats.statusCounts['Escalated to RTO'] ?? 0
            } RTO`}
            tone="indigo"
          />
          <MetricCard
            label="New Today"
            value={issueStats.newToday.toLocaleString()}
            helper="Fresh within 24h"
            tone="blue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-lg border border-gray-200 p-5">
            <StatusList title="Status distribution" data={issueStats.statusCounts} />
          </div>
          <div className="rounded-lg border border-gray-200 p-5">
            <MetricList
              title="Top incident types"
              items={issueStats.topIncidentTypes}
              emptyMessage="No incident trends available."
            />
          </div>
          <ChartCard title="Incident type breakdown" subtitle="Top categories impacting the depot">
            {incidentTypeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={incidentTypeChartData}
                  layout="vertical"
                  margin={{ top: 16, right: 24, left: 0, bottom: 8 }}
                >
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip formatter={(value: number) => value.toLocaleString()} cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {incidentTypeChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No incident analytics available." />
            )}
          </ChartCard>
        </div>
        <div className="rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Priority queue</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2">Incident</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Reported</th>
                </tr>
              </thead>
              <tbody>
                {issueStats.criticalQueue.length === 0 && (
                  <tr>
                    <td className="px-4 py-3" colSpan={3}>
                      No active emergency reports at the moment.
                    </td>
                  </tr>
                )}
                {issueStats.criticalQueue.map((report) => (
                  <tr key={report.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-gray-700">{report.incident_type || report.description || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                        {getStatusLabel(report.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(report.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <header className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900">Spare Parts Inventory</h2>
          <p className="text-sm text-gray-600">
            Consumption and stock readiness for maintenance teams · Reporting window: {timeframeLabel}
          </p>
        </header>

        {sparePartsError && (
          <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {sparePartsError}
          </div>
        )}

        {sparePartsLoading ? (
          <div className="text-sm text-gray-500">Loading spare parts analytics...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <MetricCard
                label="Part Types"
                value={totalPartTypes}
                helper={`${inStockParts.toLocaleString()} available`}
                tone="blue"
              />
              <MetricCard
                label="Units In Stock"
                value={totalUnitsInStock}
                helper="Across all spare parts"
                tone="green"
              />
              <MetricCard
                label="Units Used"
                value={totalUnitsUsed}
                helper={`Issued ${timeframeLabel.toLowerCase()}`}
                tone="indigo"
              />
              <MetricCard
                label="Distinct Parts Used"
                value={distinctPartsUsed}
                helper="Unique SKUs deployed"
                tone="blue"
              />
              <MetricCard
                label="Low Stock"
                value={lowStockParts}
                helper="Below 10 units"
                tone="orange"
              />
              <MetricCard
                label="Out of Stock"
                value={outOfStockParts}
                helper="Requires immediate restock"
                tone="red"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ChartCard title="Top consumed parts" subtitle={`Quantity used ${timeframeLabel.toLowerCase()}`}>
                {topConsumedParts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topConsumedParts} margin={{ top: 16, right: 24, left: 0, bottom: 32 }}>
                      <XAxis
                        dataKey="name"
                        interval={0}
                        tick={{ fontSize: 12 }}
                        angle={-10}
                        height={50}
                        stroke="#94a3b8"
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <Tooltip
                        formatter={(value: number | string, _name, entry) => {
                          const numericValue = typeof value === 'number' ? value : Number(value);
                          const displayValue = Number.isFinite(numericValue) ? numericValue.toLocaleString() : '0';
                          const unitLabel = entry?.payload?.unit ? ` ${entry.payload.unit}` : '';
                          return [`${displayValue}${unitLabel}`, 'Quantity'];
                        }}
                        cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }}
                      />
                      <Bar dataKey="quantity" radius={[6, 6, 0, 0]}>
                        {topConsumedParts.map((entry, index) => (
                          <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No usage recorded for the selected window." />
                )}
              </ChartCard>

              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <MetricList
                  title="Inventory status"
                  items={[
                    { label: 'In stock', count: inStockParts },
                    { label: 'Low stock', count: lowStockParts },
                    { label: 'Out of stock', count: outOfStockParts },
                  ]}
                  emptyMessage="No inventory data available."
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Recent usage</h3>
                {recentPartUsage.length === 0 ? (
                  <p className="text-sm text-gray-500">No spare part usage recorded for this timeframe.</p>
                ) : (
                  <ul className="space-y-3 text-sm text-gray-700">
                    {recentPartUsage.map((usage) => (
                      <li key={usage.usage_id} className="border border-gray-100 rounded-md px-3 py-2">
                        <div className="flex items-center justify-between font-medium text-gray-900">
                          <span>{usage.part_name || usage.part_id}</span>
                          <span>
                            {Number(usage.quantity_used || 0).toLocaleString()} {usage.unit}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {(usage.registration_number ? `Bus ${usage.registration_number}` : 'General issue')} ·{' '}
                          {formatDate(usage.usage_date)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: number | string;
  description?: string;
  tone: 'blue' | 'yellow' | 'indigo' | 'red' | 'green' | 'orange';
}) => {
  const toneMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-700',
    orange: 'bg-orange-50 text-orange-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-600',
  };

  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${toneMap[tone]}`}>
        {title}
      </div>
      <p className="mt-3 text-2xl font-semibold text-gray-900">{displayValue}</p>
      {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
    </div>
  );
};

const StatusList = ({ title, data }: { title: string; data: Record<string, number> }) => (
  <div>
    <h3 className="text-sm font-semibold text-gray-800 mb-2">{title}</h3>
    <ul className="space-y-2 text-sm text-gray-700">
      {Object.keys(data).length === 0 && <li>No data available.</li>}
      {Object.entries(data).map(([label, count]) => (
        <li key={label} className="flex justify-between rounded-md border px-3 py-2">
          <span>{label}</span>
          <span className="font-medium text-gray-900">{count}</span>
        </li>
      ))}
    </ul>
  </div>
);

const MetricCard = ({
  label,
  value,
  helper,
  tone = 'blue',
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: 'blue' | 'green' | 'yellow' | 'orange' | 'indigo' | 'red';
}) => {
  const toneMap: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    orange: 'text-orange-600',
    indigo: 'text-indigo-600',
    red: 'text-red-600',
  };

  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${toneMap[tone]}`}>{displayValue}</p>
      {helper && <p className="text-sm text-gray-600 mt-1">{helper}</p>}
    </div>
  );
};

const ChartCard = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    <div className="mt-4 h-56">
      {children}
    </div>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex h-full items-center justify-center rounded-md bg-slate-50 text-sm text-slate-500">
    {message}
  </div>
);

const MetricList = ({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: { label: string; count: number }[];
  emptyMessage: string;
}) => (
  <div>
    <h3 className="text-sm font-semibold text-gray-800 mb-2">{title}</h3>
    <ul className="space-y-2 text-sm text-gray-700">
      {items.length === 0 && <li>{emptyMessage}</li>}
      {items.map((item) => (
        <li key={item.label} className="flex justify-between rounded-md border px-3 py-2">
          <span>{item.label}</span>
          <span className="font-medium text-gray-900">{item.count}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default GenerateReports;