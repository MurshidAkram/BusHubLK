import React, { useState, useEffect } from 'react';

interface Incident {
  id: number;
  type: string;
  depot: string;
  timeAgo: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Active' | 'Resolved';
  details?: string;
  timestamp: number;
}

const severityColors = {
  Low: 'text-green-800 bg-green-200',
  Medium: 'text-yellow-800 bg-yellow-200',
  High: 'text-red-800 bg-red-200',
};

// Added more depots here:
const depots = ['All Depots', 'Colombo', 'Maharagama', 'Pettah', 'Nugegoda', 'Moratuwa', 'Kandy'];

const mockIncidents: Incident[] = [
  {
    id: 1,
    type: 'Schedule Delay',
    depot: 'Nugegoda',
    timeAgo: '',
    severity: 'Medium',
    status: 'Active',
    details: 'Delay due to heavy traffic on main road',
    timestamp: Date.now() - 12 * 60 * 1000, // 12 min ago
  },
  {
    id: 2,
    type: 'Staff Shortage',
    depot: 'Moratuwa',
    timeAgo: '',
    severity: 'High',
    status: 'Active',
    details: 'Shortage of drivers impacting route frequency',
    timestamp: Date.now() - 28 * 60 * 1000, // 28 min ago
  },
  {
    id: 3,
    type: 'Route Deviation',
    depot: 'Maharagama',
    timeAgo: '',
    severity: 'Low',
    status: 'Active',
    details: 'Bus deviated from scheduled path near junction',
    timestamp: Date.now() - 45 * 60 * 1000, // 45 min ago
  },
  {
    id: 4,
    type: 'Mechanical Failure',
    depot: 'Colombo',
    timeAgo: '',
    severity: 'High',
    status: 'Active',
    details: 'Bus engine failure, assistance dispatched',
    timestamp: Date.now() - 7 * 60 * 1000, // 7 min ago
  },
  {
    id: 5,
    type: 'Accident Reported',
    depot: 'Pettah',
    timeAgo: '',
    severity: 'High',
    status: 'Resolved',
    details: 'Minor collision, no injuries reported',
    timestamp: Date.now() - 90 * 60 * 1000, // 1.5 hours ago
  },
  {
    id: 6,
    type: 'Signal Failure',
    depot: 'Colombo',
    timeAgo: '',
    severity: 'Medium',
    status: 'Active',
    details: 'Traffic light malfunction causing delays',
    timestamp: Date.now() - 22 * 60 * 1000, // 22 min ago
  },
  {
    id: 7,
    type: 'Delay Due to Road Works',
    depot: 'Maharagama',
    timeAgo: '',
    severity: 'Low',
    status: 'Active',
    details: 'Construction work causing slow traffic',
    timestamp: Date.now() - 35 * 60 * 1000, // 35 min ago
  },
  {
    id: 8,
    type: 'Overcrowding',
    depot: 'Kandy',
    timeAgo: '',
    severity: 'Medium',
    status: 'Active',
    details: 'Bus overcrowded causing delay',
    timestamp: Date.now() - 10 * 60 * 1000,
  },
  {
    id: 9,
    type: 'Driver Late',
    depot: 'Nugegoda',
    timeAgo: '',
    severity: 'Low',
    status: 'Active',
    details: 'Driver arrived late for shift',
    timestamp: Date.now() - 55 * 60 * 1000,
  },
];

// Function to compute "time ago"
function getTimeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
}

const IncidentTracking = () => {
  const [selectedDepot, setSelectedDepot] = useState('All Depots');
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    // Update timeAgo initially and every minute
    const updateTimeAgo = () => {
      setIncidents(
        mockIncidents
          .map((inc) => ({ ...inc, timeAgo: getTimeAgo(inc.timestamp) }))
          .sort((a, b) => b.timestamp - a.timestamp)
      );
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter incidents by depot if depot selected is not "All Depots"
  const filteredIncidents =
    selectedDepot === 'All Depots'
      ? incidents
      : incidents.filter((inc) => inc.depot === selectedDepot);

  return (
    <div className="space-y-6 ">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Incident Tracking</h1>
        <p className="text-gray-600">
          Monitor bus incidents by depot for timely management.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <label
          className="block font-medium text-gray-700 mb-2"
          htmlFor="depot-select"
        >
          Select Depot:
        </label>
        <select
          id="depot-select"
          value={selectedDepot}
          onChange={(e) => setSelectedDepot(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-6"
        >
          {depots.map((depot) => (
            <option key={depot} value={depot}>
              {depot}
            </option>
          ))}
        </select>

        <h2 className="text-xl font-semibold mb-4">
          {selectedDepot === 'All Depots'
            ? 'All Incidents'
            : `${selectedDepot} Incidents`}
        </h2>

        {filteredIncidents.length === 0 ? (
          <p className="text-gray-500">No incidents reported for this depot.</p>
        ) : (
          <ul className="space-y-4">
            {filteredIncidents.map(
              ({ id, type, depot, timeAgo, severity, status, details }) => (
                <li
                  key={id}
                  className="border rounded p-4 flex justify-between items-start bg-white"
                >
                  <div>
                    <p className="font-semibold text-lg">{type}</p>
                    <p className="text-sm text-gray-600 font-medium">{depot}</p>
                    <p className="text-xs text-gray-500">{timeAgo}</p>
                    {details && (
                      <p className="mt-2 text-gray-700 italic">{details}</p>
                    )}
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {status}
                    </p>
                  </div>
                  <div
                    className={`px-4 py-1 rounded-full text-sm font-semibold ${severityColors[severity]}`}
                  >
                    {severity}
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default IncidentTracking;
