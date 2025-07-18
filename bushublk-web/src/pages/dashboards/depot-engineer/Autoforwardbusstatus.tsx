// AutoForwardBusStatus.tsx
import { useState } from 'react';
import { FaBus, FaExclamationTriangle, FaCheckCircle, FaClock, FaChevronRight } from 'react-icons/fa';

type BusStatus = {
  id: string;
  busId: string;
  route: string;
  lastMaintenance: string;
  condition: 'critical' | 'warning' | 'normal';
  forwardedAt: string;
  forwardedBy: string;
  status: 'pending-review' | 'reviewed' | 'action-required';
  issuesDetected: string[];
  odometer: string;
  reviewNotes?: string;
};

const Autoforwardbusstatus = () => {
  const [expandedBus, setExpandedBus] = useState<string | null>(null);

  const busStatuses: BusStatus[] = [
    {
      id: 'AF-2025-001',
      busId: 'NC-2847',
      route: 'Colombo-Kandy',
      lastMaintenance: '15 days ago',
      condition: 'critical',
      forwardedAt: '2 hours ago',
      forwardedBy: 'System Auto-Check',
      status: 'pending-review',
      issuesDetected: ['Engine temperature anomalies', 'Brake wear exceeding threshold'],
      odometer: '245,782 km'
    },
    {
      id: 'AF-2025-002',
      busId: 'WP-5621',
      route: 'Colombo-Negombo',
      lastMaintenance: '8 days ago',
      condition: 'warning',
      forwardedAt: '1 day ago',
      forwardedBy: 'System Auto-Check',
      status: 'reviewed',
      issuesDetected: ['Suspension wear detected'],
      odometer: '187,543 km',
      reviewNotes: 'Scheduled for suspension check during next maintenance cycle'
    },
    {
      id: 'AF-2025-003',
      busId: 'CP-3456',
      route: 'Kandy-Nuwara Eliya',
      lastMaintenance: '3 days ago',
      condition: 'warning',
      forwardedAt: '4 hours ago',
      forwardedBy: 'Driver Report',
      status: 'action-required',
      issuesDetected: ['Transmission fluid leak', 'Unusual gear shift patterns'],
      odometer: '312,456 km'
    },
    {
      id: 'AF-2025-004',
      busId: 'SG-7890',
      route: 'Colombo-Matara',
      lastMaintenance: '20 days ago',
      condition: 'normal',
      forwardedAt: '6 hours ago',
      forwardedBy: 'Scheduled Check',
      status: 'pending-review',
      issuesDetected: ['Routine maintenance due'],
      odometer: '201,345 km'
    }
  ];

  const getConditionBadge = (condition: BusStatus['condition']) => {
    const baseClasses = "text-xs font-medium me-2 px-2.5 py-0.5 rounded";
    switch(condition) {
      case 'critical': return <span className={`${baseClasses} bg-red-100 text-red-800`}>Critical</span>;
      case 'warning': return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Warning</span>;
      case 'normal': return <span className={`${baseClasses} bg-green-100 text-green-800`}>Normal</span>;
      default: return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>;
    }
  };

  const getStatusBadge = (status: BusStatus['status']) => {
    const baseClasses = "text-xs font-medium me-2 px-2.5 py-0.5 rounded";
    switch(status) {
      case 'pending-review': return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Pending Review</span>;
      case 'reviewed': return <span className={`${baseClasses} bg-purple-100 text-purple-800`}>Reviewed</span>;
      case 'action-required': return <span className={`${baseClasses} bg-orange-100 text-orange-800`}>Action Required</span>;
      default: return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>;
    }
  };

  const toggleExpand = (busId: string) => {
    setExpandedBus(expandedBus === busId ? null : busId);
  };

  return (
    <div className="container-fluid mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <FaBus className="mr-3 text-blue-600" />
            Auto-Forwarded Bus Status
          </h2>
          <div className="text-sm text-gray-500">
            Showing {busStatuses.length} forwarded statuses
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2">
              <option value="all">All Conditions</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2">
              <option value="all">All Statuses</option>
              <option value="pending-review">Pending Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="action-required">Action Required</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2">
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Bus Status List */}
        <div className="space-y-4">
          {busStatuses.map((bus) => (
            <div 
              key={bus.id} 
              className={`border rounded-lg overflow-hidden ${
                bus.condition === 'critical' ? 'border-red-200 bg-red-50' : 
                bus.condition === 'warning' ? 'border-yellow-200 bg-yellow-50' : 
                'border-green-200 bg-green-50'
              }`}
            >
              <div 
                className="p-4 cursor-pointer flex justify-between items-center"
                onClick={() => toggleExpand(bus.id)}
              >
                <div className="flex items-center">
                  <div className="mr-4">
                    {bus.condition === 'critical' ? (
                      <FaExclamationTriangle className="text-red-500 text-xl" />
                    ) : bus.condition === 'warning' ? (
                      <FaExclamationTriangle className="text-yellow-500 text-xl" />
                    ) : (
                      <FaCheckCircle className="text-green-500 text-xl" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{bus.busId} - {bus.route}</h3>
                    <div className="flex items-center mt-1">
                      {getConditionBadge(bus.condition)}
                      {getStatusBadge(bus.status)}
                      <span className="text-sm text-gray-600 flex items-center">
                        <FaClock className="mr-1" /> Forwarded {bus.forwardedAt}
                      </span>
                    </div>
                  </div>
                </div>
                <FaChevronRight className={`transition-transform ${expandedBus === bus.id ? 'transform rotate-90' : ''}`} />
              </div>

              {/* Expanded Details */}
              {expandedBus === bus.id && (
                <div className="p-4 border-t bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold mb-2">Bus Information</h4>
                      <div className="space-y-2">
                        <div className="flex">
                          <span className="w-1/3 font-medium">Odometer:</span>
                          <span>{bus.odometer}</span>
                        </div>
                        <div className="flex">
                          <span className="w-1/3 font-medium">Last Maintenance:</span>
                          <span>{bus.lastMaintenance}</span>
                        </div>
                        <div className="flex">
                          <span className="w-1/3 font-medium">Forwarded By:</span>
                          <span>{bus.forwardedBy}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Detected Issues</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {bus.issuesDetected.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {bus.reviewNotes && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Review Notes</h4>
                      <p className="bg-gray-100 p-3 rounded">{bus.reviewNotes}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm">
                      View Full Maintenance History
                    </button>
                    {bus.status !== 'reviewed' && (
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                        {bus.status === 'action-required' ? 'Mark Action Taken' : 'Review Status'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats Footer */}
        <div className="mt-6 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-800">Pending Review</div>
            <div className="text-2xl font-bold text-blue-600">
              {busStatuses.filter(b => b.status === 'pending-review').length}
            </div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-sm text-orange-800">Action Required</div>
            <div className="text-2xl font-bold text-orange-600">
              {busStatuses.filter(b => b.status === 'action-required').length}
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-sm text-red-800">Critical Condition</div>
            <div className="text-2xl font-bold text-red-600">
              {busStatuses.filter(b => b.condition === 'critical').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Autoforwardbusstatus;