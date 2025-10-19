import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { FaCalendarAlt, FaDownload, FaSync } from 'react-icons/fa'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AppContext } from '../../../context/AppContext'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')
const buildApiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

type DepotSnapshot = {
  depot_id: number
  depot: string
  region_name: string
  active: number

  out_of_service: number
  under_maintenance: number
  lastInspection: string
}

type InspectionRecord = {
  id: number
  inspection_type: string
  date: string
  time: string
  status: string
  depot_id: number
  depot_name: string
  region_name: string
}

type EmergencyReport = {
  id: number
  incident_type: string
  status: string
  driver_name: string
  driver_phone?: string | null
  vehicle_registration: string
  description: string
  created_at: string
  depot_id?: number
  depot_name?: string
  region_name?: string
}

type CommunicationParticipant = {
  user_id: number
  first_name: string
  last_name: string
  role: string
  depot_name?: string
  depot_id?: number
}

type CommunicationChannel = {
  channel_id: number
  channel_type: string
  channel_name?: string | null
  participants?: CommunicationParticipant[]
  unread_count: number
  last_message?: {
    message_text: string
    sender_name: string
    created_at: string
  } | null
}

type DatePreset = 'last_7_days' | 'last_30_days' | 'last_60_days' | 'last_90_days' | 'custom'

const presetLabels: Record<DatePreset, string> = {
  last_7_days: 'Last 7 days',
  last_30_days: 'Last 30 days',
  last_60_days: 'Last 60 days',
  last_90_days: 'Last 90 days',
  custom: 'Custom range',
}

const presetWindows: Record<Exclude<DatePreset, 'custom'>, { past: number; future: number }> = {
  last_7_days: { past: 7, future: 7 },
  last_30_days: { past: 30, future: 30 },
  last_60_days: { past: 60, future: 60 },
  last_90_days: { past: 90, future: 90 },
}

const parseISODate = (value: string): Date | null => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatDate = (date: Date): string => date.toISOString().split('T')[0]

const formatDateTime = (value: string): string => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '—'
  }
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const normalizeText = (value?: string | null): string => (value ? value.trim().toLowerCase() : '')

type InspectionStatusCategory = 'completed' | 'pending' | 'in_progress' | 'cancelled' | 'other'

const normalizeInspectionStatus = (value?: string | null): InspectionStatusCategory => {
  const key = normalizeText(value)

  if (['completed', 'complete', 'done', 'closed'].includes(key)) {
    return 'completed'
  }

  if (['pending', 'scheduled', 'awaiting', 'assigned', 'planned'].includes(key)) {
    return 'pending'
  }

  if (['in progress', 'in-progress', 'ongoing', 'underway'].includes(key)) {
    return 'in_progress'
  }

  if (['cancelled', 'canceled', 'cancelled by rto', 'cancelled by depot', 'cancelled - rto'].includes(key)) {
    return 'cancelled'
  }

  return 'other'
}

type EnrichedInspectionRecord = InspectionRecord & {
  inspectionDate: Date
  normalizedStatus: InspectionStatusCategory
}

const GenerateReports = () => {
  const context = useContext(AppContext)
  const token = context?.token

  const [datePreset, setDatePreset] = useState<DatePreset>('last_30_days')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [depots, setDepots] = useState<DepotSnapshot[]>([])
  const [inspections, setInspections] = useState<InspectionRecord[]>([])
  const [availableDepots, setAvailableDepots] = useState<{ depot_id: number; depot_name: string }[]>([])
  const [emergencyReports, setEmergencyReports] = useState<EmergencyReport[]>([])
  const [communicationChannels, setCommunicationChannels] = useState<CommunicationChannel[]>([])
  const [selectedDepot, setSelectedDepot] = useState<'all' | number>('all')
  const reportRef = useRef<HTMLDivElement>(null)

  const headers = useMemo(() => {
    if (!token) {
      return null
    }
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }, [token])

  const fetchReportSources = async () => {
    if (!headers) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [serviceResult, inspectionResult, emergencyResult, channelsResult] = await Promise.allSettled([
        axios.get(buildApiUrl('/api/depots/service-monitor'), { headers }),
        axios.get(buildApiUrl('/api/inspections'), { headers }),
        axios.get(buildApiUrl('/api/rto'), { headers }),
        axios.get(buildApiUrl('/api/communication/channels'), { headers }),
      ])

      if (serviceResult.status !== 'fulfilled') {
        throw serviceResult.reason
      }
      if (inspectionResult.status !== 'fulfilled') {
        throw inspectionResult.reason
      }

      const depotItems: DepotSnapshot[] = (serviceResult.value.data.depots || []).map((entry: any) => ({
        depot: entry.depot,
        depot_id: Number(entry.depot_id),
        region_name: entry.region_name,
        active: Number(entry.active) || 0,

        out_of_service: Number(entry.out_of_service) || 0,
        under_maintenance: Number(entry.under_maintenance) || 0,
        lastInspection: entry.lastInspection || 'Never',
      }))

      const inspectionItems: InspectionRecord[] = (inspectionResult.value.data.inspections || []).map((item: any) => ({
        id: Number(item.id),
        inspection_type: item.inspection_type,
        date: item.date,
        time: item.time,
        status: item.status,
        depot_id: Number(item.depot_id),
        depot_name: item.depot_name,
        region_name: item.region_name,
      }))

      setDepots(depotItems)
      setInspections(inspectionItems)

      if (emergencyResult.status === 'fulfilled' && emergencyResult.value.data?.data) {
        const emergencyItems: EmergencyReport[] = (emergencyResult.value.data.data || []).map((item: any) => ({
          id: Number(item.id),
          incident_type: item.incident_type,
          status: item.status,
          driver_name: item.driver_name,
          driver_phone: item.driver_phone,
          vehicle_registration: item.vehicle_registration,
          description: item.description,
          created_at: item.created_at,
          depot_name: item.depot_name,
          region_name: item.region_name,
        }))
        setEmergencyReports(emergencyItems)
      } else if (emergencyResult.status === 'rejected') {
        console.warn('Failed to load emergency reports for regional summary:', emergencyResult.reason)
        setEmergencyReports([])
      }

      if (channelsResult.status === 'fulfilled' && channelsResult.value.data?.channels) {
        const channels: CommunicationChannel[] = (channelsResult.value.data.channels || []).map((channel: any) => ({
          channel_id: Number(channel.channel_id),
          channel_type: channel.channel_type,
          channel_name: channel.channel_name,
          participants: channel.participants,
          unread_count: Number(channel.unread_count) || 0,
          last_message: channel.last_message || null,
        }))
        setCommunicationChannels(channels)
      } else if (channelsResult.status === 'rejected') {
        console.warn('Failed to load communication hub channels:', channelsResult.reason)
        setCommunicationChannels([])
      }
    } catch (err) {
      console.error('Regional report fetch error:', err)
      setError('Failed to load report data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (headers) {
      fetchReportSources()
    }
  }, [headers])

  useEffect(() => {
    if (!headers) {
      return
    }

    const loadDepots = async () => {
      try {
  const response = await axios.get(buildApiUrl('/api/inspections/depots'), {
          headers,
        })

        const depotsForRegion = (response.data.depots || []).map((item: any) => ({
          depot_id: Number(item.depot_id),
          depot_name: item.depot_name,
        }))

        setAvailableDepots(depotsForRegion)
      } catch (err) {
        console.error('Failed to load depots for region:', err)
        setAvailableDepots([])
      }
    }

    loadDepots()
  }, [headers])

  useEffect(() => {
    if (selectedDepot === 'all') {
      return
    }

    const stillAvailable = availableDepots.some((entry) => entry.depot_id === selectedDepot)
    if (!stillAvailable) {
      setSelectedDepot('all')
    }
  }, [availableDepots, selectedDepot])

  const activeDateRange = useMemo(() => {
    if (datePreset !== 'custom') {
      const window = presetWindows[datePreset]
      const start = new Date()
      start.setDate(start.getDate() - window.past + 1)
      start.setHours(0, 0, 0, 0)

      const end = new Date()
      end.setDate(end.getDate() + window.future)
      end.setHours(23, 59, 59, 999)

      return { start, end }
    }

    const startDate = customStart ? parseISODate(customStart) : null
    const endDate = customEnd ? parseISODate(customEnd) : null

    if (!startDate || !endDate) {
      const fallbackStart = new Date()
      fallbackStart.setDate(fallbackStart.getDate() - 29)
      fallbackStart.setHours(0, 0, 0, 0)

      const fallbackEnd = new Date()
      fallbackEnd.setDate(fallbackEnd.getDate() + 30)
      fallbackEnd.setHours(23, 59, 59, 999)

      return { start: fallbackStart, end: fallbackEnd }
    }

    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)
    return { start: startDate, end: endDate }
  }, [datePreset, customStart, customEnd])

  const filteredDepots = useMemo(() => {
    if (selectedDepot === 'all') {
      return depots
    }
    return depots.filter((item) => item.depot_id === selectedDepot)
  }, [depots, selectedDepot])

  const filteredInspections = useMemo<EnrichedInspectionRecord[]>(() => {
    const { start, end } = activeDateRange
    const scoped: EnrichedInspectionRecord[] = []

    inspections.forEach((inspection) => {
      if (selectedDepot !== 'all' && inspection.depot_id !== selectedDepot) {
        return
      }

      const inspectionDate = parseISODate(inspection.date)
      if (!inspectionDate) {
        return
      }

      if (inspectionDate < start || inspectionDate > end) {
        return
      }

      scoped.push({
        ...inspection,
        inspectionDate,
        normalizedStatus: normalizeInspectionStatus(inspection.status),
      })
    })

    return scoped
  }, [inspections, activeDateRange, selectedDepot])

  const selectedDepotName = useMemo(() => {
    if (selectedDepot === 'all') {
      return null
    }

    const fromAvailable = availableDepots.find((entry) => entry.depot_id === selectedDepot)
    if (fromAvailable) {
      return fromAvailable.depot_name
    }

    const fromSnapshot = depots.find((entry) => entry.depot_id === selectedDepot)
    return fromSnapshot?.depot ?? null
  }, [selectedDepot, availableDepots, depots])

  const filteredEmergencyReports = useMemo(() => {
    if (selectedDepot === 'all') {
      return emergencyReports
    }

    const normalizedName = normalizeText(selectedDepotName)

    return emergencyReports.filter((report) => {
      if (typeof selectedDepot === 'number' && typeof report.depot_id === 'number') {
        return report.depot_id === selectedDepot
      }

      const reportName = normalizeText(report.depot_name)
      return reportName.includes(normalizedName) || normalizedName.includes(reportName)
    })
  }, [emergencyReports, selectedDepot, selectedDepotName])

  const filteredCommunicationChannels = useMemo(() => {
    if (selectedDepot === 'all') {
      return communicationChannels
    }

    const normalizedName = normalizeText(selectedDepotName)
    if (!normalizedName) {
      return communicationChannels
    }

    return communicationChannels.filter((channel) => {
      if (normalizeText(channel.channel_type) === 'announcement') {
        return true
      }

      const nameMatches = normalizeText(channel.channel_name).includes(normalizedName)
      const participantMatches = channel.participants?.some((participant) => {
        if (typeof selectedDepot === 'number' && typeof participant.depot_id === 'number') {
          return participant.depot_id === selectedDepot
        }
        return normalizeText(participant.depot_name).includes(normalizedName)
      })

      return nameMatches || Boolean(participantMatches)
    })
  }, [communicationChannels, selectedDepot, selectedDepotName])

  const inspectionSummary = useMemo(() => {
    return filteredInspections.reduce(
      (acc, inspection) => {
        acc.total += 1

        switch (inspection.normalizedStatus) {
          case 'completed':
            acc.completed += 1
            break
          case 'pending':
            acc.pending += 1
            break
          case 'in_progress':
            acc.inProgress += 1
            break
          case 'cancelled':
            acc.cancelled += 1
            break
          default:
            acc.other += 1
        }

        return acc
      },
      { total: 0, completed: 0, pending: 0, inProgress: 0, cancelled: 0, other: 0 }
    )
  }, [filteredInspections])

  const depotInspectionSummary = useMemo(() => {
    const summary = new Map<
      number,
      {
        depot: string
        region: string
        pending: number
        completed: number
        inProgress: number
        cancelled: number
        other: number
        total: number
      }
    >()

    filteredInspections.forEach((inspection) => {
      const existing = summary.get(inspection.depot_id) || {
        depot: inspection.depot_name,
        region: inspection.region_name,
        pending: 0,
        completed: 0,
        inProgress: 0,
        cancelled: 0,
        other: 0,
        total: 0,
      }

      switch (inspection.normalizedStatus) {
        case 'completed':
          existing.completed += 1
          break
        case 'pending':
          existing.pending += 1
          break
        case 'in_progress':
          existing.inProgress += 1
          break
        case 'cancelled':
          existing.cancelled += 1
          break
        default:
          existing.other += 1
      }

      existing.total += 1
      summary.set(inspection.depot_id, existing)
    })

    return summary
  }, [filteredInspections])

  const fleetTotals = useMemo(() => {
    return filteredDepots.reduce(
      (acc, depot) => {
        acc.totalDepots += 1
        acc.active += depot.active
        acc.outOfService += depot.out_of_service
        acc.underMaintenance += depot.under_maintenance
        return acc
      },
      { totalDepots: 0, active: 0,outOfService: 0, underMaintenance: 0 }
    )
  }, [filteredDepots])

  const emergencySummary = useMemo(() => {
    return filteredEmergencyReports.reduce(
      (acc, report) => {
        const statusKey = report.status?.toLowerCase() || 'unknown'
        acc.total += 1
        if (statusKey === 'resolved') {
          acc.resolved += 1
        } else if (statusKey === 'in progress') {
          acc.inProgress += 1
        } else if (statusKey === 'escalated to rto' || statusKey === 'under review') {
          acc.underReview += 1
        } else {
          acc.other += 1
        }
        return acc
      },
      { total: 0, resolved: 0, inProgress: 0, underReview: 0, other: 0 }
    )
  }, [filteredEmergencyReports])

  const emergencyByIncident = useMemo(() => {
    const map = new Map<string, { type: string; total: number; open: number }>()
    filteredEmergencyReports.forEach((report) => {
      const key = report.incident_type || 'Unspecified'
      const existing = map.get(key) || { type: key, total: 0, open: 0 }
      existing.total += 1
      if (report.status?.toLowerCase() !== 'resolved') {
        existing.open += 1
      }
      map.set(key, existing)
    })
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [filteredEmergencyReports])

  const activeEmergencyReports = useMemo(() => {
    return filteredEmergencyReports
      .filter((report) => report.status?.toLowerCase() !== 'resolved')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [filteredEmergencyReports])

  const communicationSummary = useMemo(() => {
    const total = filteredCommunicationChannels.length
    const direct = filteredCommunicationChannels.filter((channel) => channel.channel_type === 'direct').length
    const announcements = filteredCommunicationChannels.filter((channel) => channel.channel_type === 'announcement').length
    const unread = filteredCommunicationChannels.reduce((acc, channel) => acc + (channel.unread_count || 0), 0)
    return { total, direct, announcements, unread }
  }, [filteredCommunicationChannels])

  const recentCommunicationActivity = useMemo(() => {
    return filteredCommunicationChannels
      .filter((channel) => channel.last_message)
      .sort((a, b) => {
        const aTime = a.last_message ? new Date(a.last_message.created_at).getTime() : 0
        const bTime = b.last_message ? new Date(b.last_message.created_at).getTime() : 0
        return bTime - aTime
      })
      .slice(0, 5)
  }, [filteredCommunicationChannels])

  const depotServiceChartData = useMemo(() => {
    const orderedDepots = [...filteredDepots].sort((a, b) => a.depot.localeCompare(b.depot))
    return orderedDepots.map((depot) => ({
      name: depot.depot,
      Active: depot.active,
      'Maintenance': depot.under_maintenance,
      'Out of Service': depot.out_of_service,
    }))
  }, [filteredDepots])

  const inspectionTrendData = useMemo(() => {
    const buckets = new Map<
      string,
      {
        date: string
        Completed: number
        Pending: number
        'In Progress': number
        Cancelled: number
      }
    >()

    filteredInspections.forEach((inspection) => {
      const key = formatDate(inspection.inspectionDate)
      const existing =
        buckets.get(key) || {
          date: key,
          Completed: 0,
          Pending: 0,
          'In Progress': 0,
          Cancelled: 0,
        }

      switch (inspection.normalizedStatus) {
        case 'completed':
          existing.Completed += 1
          break
        case 'pending':
          existing.Pending += 1
          break
        case 'in_progress':
          existing['In Progress'] += 1
          break
        case 'cancelled':
          existing.Cancelled += 1
          break
        default:
          break
      }

      buckets.set(key, existing)
    })

    return Array.from(buckets.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [filteredInspections])

  const inspectionDetailRows = useMemo(() => {
    const rows = [...filteredInspections]
    rows.sort((a, b) => {
      const aDate = formatDate(a.inspectionDate)
      const bDate = formatDate(b.inspectionDate)
      const aTimestamp = new Date(`${aDate}T${a.time || '00:00'}`).getTime()
      const bTimestamp = new Date(`${bDate}T${b.time || '00:00'}`).getTime()
      return bTimestamp - aTimestamp
    })
    return rows.slice(0, 50)
  }, [filteredInspections])

  const emergencyStatusChartData = useMemo(() => {
    const entries = [
      { name: 'Under review', value: emergencySummary.underReview },
      { name: 'In progress', value: emergencySummary.inProgress },
      { name: 'Resolved', value: emergencySummary.resolved },
      { name: 'Other', value: emergencySummary.other },
    ]
    return entries.filter((entry) => entry.value > 0)
  }, [emergencySummary])

  const emergencyStatusColors = ['#7c3aed', '#2563eb', '#059669', '#f97316', '#dc2626']

  const handleDownloadPdf = () => {
    if (!reportRef.current) {
      return
    }

    const reportContent = reportRef.current.innerHTML
    const printFrame = document.createElement('iframe')
    printFrame.style.position = 'fixed'
    printFrame.style.right = '0'
    printFrame.style.bottom = '0'
    printFrame.style.width = '0'
    printFrame.style.height = '0'
    printFrame.style.border = '0'
    document.body.appendChild(printFrame)

    const printDocument = printFrame.contentWindow?.document
    if (!printDocument) {
      document.body.removeChild(printFrame)
      return
    }

    printDocument.open()
    printDocument.write(`<!DOCTYPE html>
      <html>
        <head>
          <title>Regional Technical Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            h1, h2, h3 { color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #cbd5f5; padding: 8px; font-size: 13px; }
            th { background: #e0e7ff; text-align: left; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap: 16px; }
            .summary-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #f8fafc; }
          </style>
        </head>
        <body>
          ${reportContent}
        </body>
      </html>`)
    printDocument.close()

    const printWindow = printFrame.contentWindow
    if (!printWindow) {
      document.body.removeChild(printFrame)
      return
    }

    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      document.body.removeChild(printFrame)
    }, 200)
  }

  const rangeLabel = `${formatDate(activeDateRange.start)} to ${formatDate(activeDateRange.end)}`

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="rounded-lg border border-red-200 bg-white p-6 text-center text-red-600 shadow-sm">
          Unable to authenticate regional report request. Please sign in again.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Regional Technical Reports</h1>
            <p className="text-sm text-slate-500">Region-wide fleet health, service readiness, and inspection activity.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* <button
              onClick={fetchReportSources}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
              disabled={loading}
            >
              <FaSync className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh data
            </button> */}
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <FaDownload className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <FaCalendarAlt className="h-5 w-5 text-blue-600" />
                Reporting window
              </h2>
              <p className="text-xs text-slate-500">Current window: {rangeLabel}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={datePreset}
                onChange={(event) => setDatePreset(event.target.value as DatePreset)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                {Object.entries(presetLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {datePreset === 'custom' && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    From
                    <input
                      type="date"
                      value={customStart}
                      onChange={(event) => setCustomStart(event.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    To
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(event) => setCustomEnd(event.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Depot filter</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={selectedDepot === 'all' ? 'all' : String(selectedDepot)}
              onChange={(event) => {
                const value = event.target.value
                setSelectedDepot(value === 'all' ? 'all' : Number(value))
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All depots</option>
              {availableDepots.map((depot) => (
                <option key={depot.depot_id} value={depot.depot_id}>
                  {depot.depot_name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <div ref={reportRef} className="flex flex-col gap-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">Fleet readiness overview</h2>
            <p className="mt-1 text-xs text-slate-500">
              {selectedDepot === 'all'
                ? 'Aggregated across all depots in the region.'
                : `Focused on ${selectedDepotName ?? 'selected depot'} metrics.`}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Monitored depots</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{fleetTotals.totalDepots}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Active buses</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-600">{fleetTotals.active}</p>
              </div>
              {/* <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">In service</p>
                <p className="mt-2 text-2xl font-semibold text-blue-600">{fleetTotals.inService}</p>
              </div> */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Maintenance / Out</p>
                <p className="mt-2 text-2xl font-semibold text-amber-600">{fleetTotals.underMaintenance + fleetTotals.outOfService}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">Inspection status</h2>
            <p className="mt-1 text-xs text-slate-500">
              {selectedDepot === 'all'
                ? 'Status counts across every depot in scope.'
                : `Status counts for ${selectedDepotName ?? 'selected depot'}.`}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total inspections</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{inspectionSummary.total}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Completed</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-600">{inspectionSummary.completed}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
                <p className="mt-2 text-2xl font-semibold text-amber-600">{inspectionSummary.pending}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">In progress</p>
                <p className="mt-2 text-2xl font-semibold text-blue-600">{inspectionSummary.inProgress}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">Depot service monitor</h2>
            <p className="mt-1 text-xs text-slate-500">
              {selectedDepot === 'all'
                ? 'Service posture by depot across the region.'
                : `Detailed service metrics for ${selectedDepotName ?? 'selected depot'}.`}
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Depot</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Region</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Active</th>
                    {/* <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">In service</th> */}
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Under maintenance</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Out of service</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Last inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredDepots.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                        No depot data available for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDepots.map((depot) => (
                      <tr key={depot.depot_id}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{depot.depot}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{depot.region_name}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{depot.active}</td>
                        {/* <td className="px-4 py-3 text-sm font-semibold text-blue-600">{depot.in_service}</td> */}
                        <td className="px-4 py-3 text-sm font-semibold text-amber-600">{depot.under_maintenance}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-rose-600">{depot.out_of_service}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{depot.lastInspection}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">Inspection breakdown</h2>
            <p className="mt-1 text-xs text-slate-500">
              {selectedDepot === 'all'
                ? 'Comparison of inspection counts by depot.'
                : `Inspection distribution for ${selectedDepotName ?? 'selected depot'}.`}
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Depot</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Region</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Completed</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {depotInspectionSummary.size === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                        No inspection records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    Array.from(depotInspectionSummary.entries()).map(([depotId, summary]) => (
                      <tr key={depotId}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{summary.depot}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{summary.region}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{summary.total}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{summary.completed}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-amber-600">{summary.pending}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Inspection activity detail</h2>
              <p className="text-xs text-slate-500">
                Showing inspections {selectedDepot === 'all' ? 'across all depots' : `for ${selectedDepotName ?? 'selected depot'}`}
              </p>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Depot</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Region</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {inspectionDetailRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                        No individual inspection events within this window.
                      </td>
                    </tr>
                  ) : (
                    inspectionDetailRows.map((inspection) => {
                      const statusClass =
                        inspection.normalizedStatus === 'completed'
                          ? 'text-emerald-600'
                          : inspection.normalizedStatus === 'pending'
                            ? 'text-amber-600'
                            : inspection.normalizedStatus === 'in_progress'
                              ? 'text-blue-600'
                              : inspection.normalizedStatus === 'cancelled'
                                ? 'text-rose-600'
                                : 'text-slate-600'

                      const dateLabel = inspection.inspectionDate.toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })

                      const fallbackStatus = inspection.normalizedStatus
                        .split('_')
                        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
                        .join(' ')

                      const displayStatus = inspection.status && inspection.status.trim().length > 0 ? inspection.status : fallbackStatus

                      return (
                        <tr key={inspection.id}>
                          <td className="px-4 py-3 text-sm text-slate-700">{dateLabel}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{inspection.time || '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{inspection.depot_name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{inspection.region_name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{inspection.inspection_type}</td>
                          <td className={`px-4 py-3 text-sm font-semibold ${statusClass}`}>{displayStatus}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">Visual insights</h2>
            <p className="mt-1 text-xs text-slate-500">
              {selectedDepot === 'all'
                ? 'Charts summarising region-wide trends.'
                : `Charts focused on ${selectedDepotName ?? 'selected depot'} activity.`}
            </p>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="flex flex-col">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Depot service distribution</h3>
                <div className="mt-3 h-72 w-full">
                  {depotServiceChartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      No depot metrics available to chart.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={depotServiceChartData}
                        layout="vertical"
                        margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" stroke="#475569" tick={{ fontSize: 12 }} allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={160}
                          tick={{ fontSize: 12, fill: '#1e293b' }}
                          tickLine={false}
                        />
                        <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Active" stackId="service" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={18} />
                        <Bar dataKey="Maintenance" stackId="service" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={18} />
                        <Bar dataKey="Out of Service" stackId="service" fill="#dc2626" radius={[0, 4, 4, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Inspection workload trend</h3>
                <div className="mt-3 h-72 w-full">
                  {inspectionTrendData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      No inspection activity in the selected range.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={inspectionTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#475569" tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip cursor={{ stroke: '#94a3b8', strokeWidth: 1 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="Completed" stroke="#059669" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Pending" stroke="#f97316" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="In Progress" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Cancelled" stroke="#9ca3af" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Emergency status mix</h3>
                <div className="mt-3 h-72 w-full">
                  {emergencyStatusChartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Emergency escalations are not yet chartable.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Pie data={emergencyStatusChartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3} label>
                          {emergencyStatusChartData.map((entry, index) => (
                            <Cell key={entry.name} fill={emergencyStatusColors[index % emergencyStatusColors.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">Emergency escalation overview</h2>
            <p className="mt-1 text-xs text-slate-500">
              {selectedDepot === 'all'
                ? 'Emergency escalations across the region.'
                : `Emergency escalations raised by ${selectedDepotName ?? 'selected depot'}.`}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total reports</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{emergencySummary.total}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Under review</p>
                <p className="mt-2 text-2xl font-semibold text-purple-600">{emergencySummary.underReview}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">In progress</p>
                <p className="mt-2 text-2xl font-semibold text-blue-600">{emergencySummary.inProgress}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Resolved</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-600">{emergencySummary.resolved}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Incident type mix</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Incident</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Open</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {emergencyByIncident.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">
                            No emergency escalations recorded for this region.
                          </td>
                        </tr>
                      ) : (
                        emergencyByIncident.map((row) => (
                          <tr key={row.type}>
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{row.type}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{row.total}</td>
                            <td className="px-4 py-3 text-sm text-amber-600">{row.open}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Most recent open reports</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Incident</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Driver / Vehicle</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Reported</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {activeEmergencyReports.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                            No active escalations pending action.
                          </td>
                        </tr>
                      ) : (
                        activeEmergencyReports.map((report) => (
                          <tr key={report.id}>
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">
                              <div>{report.incident_type}</div>
                              {report.region_name && (
                                <div className="text-xs text-slate-500">{report.region_name}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              <div>{report.driver_name}</div>
                              <div className="text-xs text-slate-500">{report.vehicle_registration}</div>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-blue-600">{report.status}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{formatDateTime(report.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">Communication hub activity</h2>
            <p className="mt-1 text-xs text-slate-500">
              {selectedDepot === 'all'
                ? 'Region-wide messages and collaboration channels.'
                : `Channels tied to ${selectedDepotName ?? 'selected depot'}.`}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total channels</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{communicationSummary.total}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Direct conversations</p>
                <p className="mt-2 text-2xl font-semibold text-blue-600">{communicationSummary.direct}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Announcement channels</p>
                <p className="mt-2 text-2xl font-semibold text-amber-600">{communicationSummary.announcements}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Unread messages</p>
                <p className="mt-2 text-2xl font-semibold text-rose-600">{communicationSummary.unread}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Recent conversation activity</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Channel</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Unread</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Last activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {recentCommunicationActivity.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                          No recent messages recorded for this reporting window.
                        </td>
                      </tr>
                    ) : (
                      recentCommunicationActivity.map((channel) => (
                        <tr key={channel.channel_id}>
                          <td className="px-4 py-3 text-sm font-medium text-slate-800">
                            {channel.channel_name || channel.participants?.[0]?.first_name || 'Direct channel'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {channel.channel_type === 'announcement' ? 'Announcement' : 'Direct'}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-rose-600">{channel.unread_count}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {channel.last_message ? formatDateTime(channel.last_message.created_at) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default GenerateReports