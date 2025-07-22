import React, { useState } from 'react';
import {
  Clock, AlertTriangle, CheckCircle, XCircle, MessageSquare,
  MapPin, User, Filter, Search, Bell, Car, FileText, Send, ArrowUp, CheckSquare
} from 'lucide-react';

interface EmergencyReport {
  id: string;
  type: string;
  priority: string;
  status: string;
  driver: string;
  driverPhone: string;
  vehicle: string;
  location: string;
  description: string;
  timestamp: string;
  assignedTo: string;
  estimatedResolution: string;
  updates: number;
  coordinates: { lat: number; lng: number };
  escalatedToDM: boolean;
  escalationReason?: string;
  chatHistory: { sender: string; message: string; time: string }[];
}

const IncidentTracking = () => {
  const [selectedIssue, setSelectedIssue] = useState<EmergencyReport | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');

  const [emergencyReports, setEmergencyReports] = useState<EmergencyReport[]>([
    {
      id: '31',
      type: 'Traffic Jam',
      priority: 'Medium',
      status: 'In Progress',
      driver: 'Tharindu',
      driverPhone: '+94-77-456-7890',
      vehicle: 'GA-8891',
      location: 'Colombo Fort Junction',
      description: 'Route 10 delayed by 30 mins due to heavy congestion near Colombo Fort',
      timestamp: '2025-07-22 07:45:00',
      assignedTo: 'Depot Operations manager',
      estimatedResolution: '2025-07-22 09:00:00',
      updates: 2,
      coordinates: { lat: 6.9354, lng: 79.8428 },
      escalatedToDM: false,
      chatHistory: [
        { sender: 'driver', message: 'Heavy traffic, stuck near Fort', time: '07:45' },
        { sender: 'engineer', message: 'Noted. Inform if delay exceeds 30 mins', time: '07:47' },
      ],
    },
    {
      id: '32',
      type: 'Road Closure',
      priority: 'High',
      status: 'Pending',
      driver: 'Isuru',
      driverPhone: '+94-77-567-8901',
      vehicle: 'CB-1122',
      location: 'Route 23 near Maradana',
      description: 'Detour in effect on Route 23 due to roadworks – rerouting buses',
      timestamp: '2025-07-22 08:10:00',
      assignedTo: 'Depot Operations manager',
      estimatedResolution: '2025-07-22 11:00:00',
      updates: 1,
      coordinates: { lat: 6.9278, lng: 79.8613 },
      escalatedToDM: false,
      chatHistory: [
        { sender: 'driver', message: 'Road closed at Maradana, looking for alternate route', time: '08:10' },
      ],
    },
    {
      id: '33',
      type: 'Accidents',
      priority: 'Critical',
      status: 'In Progress',
      driver: 'Nimal',
      driverPhone: '+94-77-678-9012',
      vehicle: 'XY-5566',
      location: 'Junction X, Borella',
      description: 'Minor accident at junction X – no injuries, waiting for police report',
      timestamp: '2025-07-22 08:45:00',
      assignedTo: 'Depot Operations manager',
      estimatedResolution: '2025-07-22 10:30:00',
      updates: 3,
      coordinates: { lat: 6.9123, lng: 79.8771 },
      escalatedToDM: false,
      chatHistory: [
        { sender: 'driver', message: 'Minor accident, vehicle slightly damaged', time: '08:45' },
        { sender: 'engineer', message: 'Call police and get report. Is everyone okay?', time: '08:46' },
      ],
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return 'text-red-600 bg-red-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low':
      case 'Resolved': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Pending': return 'text-gray-600 bg-gray-100';
      case 'Escalated to DM': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Fire': return <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm">🔥</div>;
      case 'Medical': return <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">⚕️</div>;
      case 'Breakdown': return <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm">⚙️</div>;
      case 'Accident': return <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm">⚠️</div>;
      case 'Passenger': return <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">👥</div>;
      case 'Other': return <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm">👥</div>;
      default: return <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm">❓</div>;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Fire': return 'text-red-600 bg-red-100';
      case 'Medical': return 'text-blue-600 bg-blue-100';
      case 'Breakdown': return 'text-orange-600 bg-orange-100';
      case 'Accident': return 'text-red-600 bg-red-100';
      case 'Passenger': return 'text-purple-600 bg-purple-100';
      case 'Other': return 'text-gray-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredReports = emergencyReports.filter((report: EmergencyReport) => {
    const matchesSearch =
      report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase());

    return filterType === 'all' ? matchesSearch : matchesSearch && report.type === filterType;
  });

  const stats = {
    total: emergencyReports.length,
    critical: emergencyReports.filter((r) => r.priority === 'Critical').length,
    inProgress: emergencyReports.filter((r) => r.status === 'In Progress').length,
    resolved: emergencyReports.filter((r) => r.status === 'Resolved').length,
    pending: emergencyReports.filter((r) => r.status === 'Pending').length,
    escalated: emergencyReports.filter((r) => r.escalatedToDM).length,
  };

  const sendMessage = () => {
    if (chatMessage.trim() && selectedIssue) {
      const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const updatedReports = emergencyReports.map((report) =>
        report.id === selectedIssue.id
          ? { ...report, chatHistory: [...report.chatHistory, { sender: 'engineer', message: chatMessage, time: currentTime }] }
          : report
      );
      setEmergencyReports(updatedReports);
      setSelectedIssue({
        ...selectedIssue,
        chatHistory: [...selectedIssue.chatHistory, { sender: 'engineer', message: chatMessage, time: currentTime }],
      });
      setChatMessage('');
    }
  };

  const escalateToDM = () => {
    if (escalationReason.trim() && selectedIssue) {
      const updatedReports = emergencyReports.map((report) =>
        report.id === selectedIssue.id
          ? {
              ...report,
              status: 'Escalated to DM',
              escalatedToDM: true,
              escalationReason,
              assignedTo: 'Depot Operations manager',
            }
          : report
      );
      setEmergencyReports(updatedReports);
      setSelectedIssue({
        ...selectedIssue,
        status: 'Escalated to DM',
        escalatedToDM: true,
        escalationReason,
        assignedTo: 'Depot Operations manager',
      });
      setShowEscalateModal(false);
      setEscalationReason('');
    }
  };

  const resolveIssue = () => {
    if (selectedIssue) {
      const updatedReports = emergencyReports.map((report) =>
        report.id === selectedIssue.id ? { ...report, status: 'Resolved' } : report
      );
      setEmergencyReports(updatedReports);
      setSelectedIssue({ ...selectedIssue, status: 'Resolved' });
      setShowPopup(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
              </div>
              <XCircle className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Escalated</p>
                <p className="text-2xl font-bold text-purple-600">{stats.escalated}</p>
              </div>
              <ArrowUp className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="Fire">Fire</option>
                <option value="Medical">Medical</option>
                <option value="Breakdown">Breakdown</option>
                <option value="Accident">Accident</option>
                <option value="Passenger">Passenger</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Showing {filteredReports.length} of {emergencyReports.length} reports</span>
            </div>
          </div>
        </div>

        {/* Reports List with Increased Width */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Emergency Reports</h2>
            </div>
            <div className="divide-y">
              {filteredReports.map((report: EmergencyReport) => (
                <div
                  key={report.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    {getTypeIcon(report.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-semibold text-gray-900">{report.type}</h3>
                          {report.escalatedToDM && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-600">
                              DM
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(report.type)}`}>
                            {report.type}
                          </span>
                          <button
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            onClick={() => {
                              setSelectedIssue(report);
                              setShowPopup(true);
                            }}
                          >
                            View
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{report.driver}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Car className="w-4 h-4" />
                          <span>{report.vehicle}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(report.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{report.location}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">{report.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Assigned to: {report.assignedTo}</span>
                        <button
                          className="text-green-600 hover:text-green-800 text-sm flex items-center space-x-1"
                          onClick={() => {
                            setSelectedIssue(report);
                            setShowChat(!showChat);
                          }}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Chat</span>
                        </button>
                      </div>
                      {showChat && selectedIssue && selectedIssue.id === report.id && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                          <div className="max-h-60 overflow-y-auto mb-2 space-y-2">
                            {report.chatHistory.map((chat: { sender: string; message: string; time: string }, index: number) => (
                              <div
                                key={index}
                                className={`p-2 rounded-lg ${chat.sender === 'engineer' ? 'bg-blue-100 text-right' : 'bg-gray-200'}`}
                              >
                                <p className="text-sm font-medium">{chat.sender === 'engineer' ? 'You' : chat.sender}</p>
                                <p className="text-sm">{chat.message}</p>
                                <p className="text-xs text-gray-500">{chat.time}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={chatMessage}
                              onChange={(e) => setChatMessage(e.target.value)}
                              placeholder="Type a message..."
                              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={sendMessage}
                              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                            >
                              <Send className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Popup for Issue Details with Scrollbar */}
        {showPopup && selectedIssue && (
<div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Issue Details - {selectedIssue.id}</h2>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPopup(false)}
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-3">
                  {getTypeIcon(selectedIssue.type)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{selectedIssue.id}</h3>
                      {selectedIssue.escalatedToDM && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-600">
                          Escalated to DM
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{selectedIssue.type} Emergency</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Priority</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedIssue.priority)}`}>
                      {selectedIssue.priority}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedIssue.status)}`}>
                      {selectedIssue.status}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-gray-700">{selectedIssue.description}</p>
                </div>

                {selectedIssue.escalatedToDM && selectedIssue.escalationReason && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-purple-600 uppercase tracking-wide mb-1">Escalation Reason</p>
                    <p className="text-sm text-purple-800">{selectedIssue.escalationReason}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Details</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Driver:</span>
                      <span className="font-medium">{selectedIssue.driver}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Vehicle:</span>
                      <span className="font-medium">{selectedIssue.vehicle}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{selectedIssue.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Reported:</span>
                      <span className="font-medium">{new Date(selectedIssue.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Assigned to:</span>
                      <span className="font-medium">{selectedIssue.assignedTo}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  {selectedIssue.status !== 'Resolved' && selectedIssue.status !== 'Escalated to DM' && (
                    <div className="flex space-x-2">
                      <button
                        className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-1"
                        onClick={resolveIssue}
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>Resolve</span>
                      </button>
                      <button
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-1"
                        onClick={() => setShowEscalateModal(true)}
                      >
                        <ArrowUp className="w-4 h-4" />
                        <span>Escalate</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Escalate Modal */}
        {showEscalateModal && selectedIssue && (
<div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Escalate to DM</h3>
              <p className="text-sm text-gray-600 mb-4">Provide a reason for escalation:</p>
              <textarea
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="e.g., Major component failure requiring specialized repair..."
                className="w-full p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={4}
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowEscalateModal(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={escalateToDM}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Confirm Escalation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default IncidentTracking;
