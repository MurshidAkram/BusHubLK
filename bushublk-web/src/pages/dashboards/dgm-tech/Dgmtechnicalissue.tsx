import React, { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle, MessageSquare, MapPin, User, Filter, Search, Bell, Car, FileText, Send, ArrowUp, CheckSquare, ChevronUp } from 'lucide-react';

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
  escalatedToDGM: boolean;
  escalatedToCEO: boolean;
  escalationReason?: string;
  ceoEscalationReason?: string;
  chatHistory: { sender: string; message: string; time: string }[];
}

const Dgmtechnicalissue = () => {
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
      id: '17',
      type: 'Fire',
      priority: 'Critical',
      status: 'Escalated to DGM',
      driver: 'Rajesh',
      driverPhone: '+94-77-123-4567',
      vehicle: 'NC-1234',
      location: 'Near Colombo Central Station',
      description: 'Small fire detected in engine compartment, passengers evacuated safely',
      timestamp: '2025-07-19 09:15:00',
      assignedTo: 'DGM Technical Division',
      estimatedResolution: '2025-07-19 12:00:00',
      updates: 3,
      coordinates: { lat: 6.9271, lng: 79.8612 },
      escalatedToDGM: true,
      escalatedToCEO: false,
      escalationReason: 'Requires specialized fire damage assessment',
      chatHistory: [
        { sender: 'driver', message: 'Engine compartment showing smoke, passengers evacuated', time: '09:15' },
        { sender: 'engineer', message: 'Fire team dispatched. Are you at safe distance?', time: '09:17' },
        { sender: 'depotmanager', message: 'Escalating to DGM for further assessment', time: '09:30' },
      ],
    },
    {
      id: '23',
      type: 'Mechanical',
      priority: 'High',
      status: 'Escalated to DGM',
      driver: 'Sankar',
      driverPhone: '+94-77-234-5678',
      vehicle: 'NY-3456',
      location: 'Galle Road Junction',
      description: 'Major engine failure, vehicle immobilized',
      timestamp: '2025-07-19 08:30:00',
      assignedTo: 'DGM Technical Division',
      estimatedResolution: '2025-07-19 14:00:00',
      updates: 5,
      coordinates: { lat: 6.8649, lng: 79.8997 },
      escalatedToDGM: true,
      escalatedToCEO: false,
      escalationReason: 'Potential engine replacement needed',
      chatHistory: [
        { sender: 'driver', message: 'Engine has stopped suddenly with loud noise', time: '08:30' },
        { sender: 'engineer', message: 'Tow truck dispatched. Please activate hazard lights', time: '08:35' },
        { sender: 'depotmanager', message: 'Escalating to DGM for engine diagnostics', time: '09:00' },
      ],
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return 'text-red-600 bg-red-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Resolved': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Pending': return 'text-gray-600 bg-gray-100';
      case 'Escalated to DGM': return 'text-indigo-600 bg-indigo-100';
      case 'Escalated to CEO': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Fire': return <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm">🔥</div>;
      case 'Medical': return <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">⚕️</div>;
      case 'Mechanical': 
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
      case 'Mechanical':
      case 'Breakdown': return 'text-orange-600 bg-orange-100';
      case 'Accident': return 'text-red-600 bg-red-100';
      case 'Passenger': return 'text-purple-600 bg-purple-100';
      case 'Other': return 'text-gray-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredReports = emergencyReports.filter((report: EmergencyReport) => {
    const matchesSearch = report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return filterType === 'all' ? matchesSearch : matchesSearch && report.type === filterType;
  });

  const stats = {
    total: emergencyReports.length,
    critical: emergencyReports.filter((r: EmergencyReport) => r.priority === 'Critical').length,
    inProgress: emergencyReports.filter((r: EmergencyReport) => r.status === 'In Progress').length,
    resolved: emergencyReports.filter((r: EmergencyReport) => r.status === 'Resolved').length,
    pending: emergencyReports.filter((r: EmergencyReport) => r.status === 'Pending').length,
    escalatedToDGM: emergencyReports.filter((r: EmergencyReport) => r.escalatedToDGM).length,
    escalatedToCEO: emergencyReports.filter((r: EmergencyReport) => r.escalatedToCEO).length,
  };

  const sendMessage = () => {
    if (chatMessage.trim() && selectedIssue) {
      const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const updatedReports = emergencyReports.map((report: EmergencyReport) =>
        report.id === selectedIssue.id
          ? { ...report, chatHistory: [...report.chatHistory, { sender: 'dgm', message: chatMessage, time: currentTime }] }
          : report
      );
      setEmergencyReports(updatedReports);
      setSelectedIssue({
        ...selectedIssue,
        chatHistory: [...selectedIssue.chatHistory, { sender: 'dgm', message: chatMessage, time: currentTime }],
      });
      setChatMessage('');
    }
  };

  const escalateToCEO = () => {
    if (escalationReason.trim() && selectedIssue) {
      const updatedReports = emergencyReports.map((report: EmergencyReport) =>
        report.id === selectedIssue.id
          ? {
              ...report,
              status: 'Escalated to CEO',
              escalatedToCEO: true,
              ceoEscalationReason: escalationReason,
              assignedTo: 'CEO Office',
            }
          : report
      );
      setEmergencyReports(updatedReports);
      setSelectedIssue({
        ...selectedIssue,
        status: 'Escalated to CEO',
        escalatedToCEO: true,
        ceoEscalationReason: escalationReason,
        assignedTo: 'CEO Office',
      });
      setShowEscalateModal(false);
      setEscalationReason('');
    }
  };

  const resolveIssue = () => {
    if (selectedIssue) {
      const updatedReports = emergencyReports.map((report: EmergencyReport) =>
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
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">DGM Technical Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
              </button>
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">DGM Technical Officer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                <p className="text-sm text-gray-600">DGM Cases</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.escalatedToDGM}</p>
              </div>
              <ChevronUp className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CEO Cases</p>
                <p className="text-2xl font-bold text-purple-600">{stats.escalatedToCEO}</p>
              </div>
              <ChevronUp className="w-8 h-8 text-purple-400" />
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
                <option value="Mechanical">Mechanical</option>
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

        {/* Reports List */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Escalated Emergency Reports</h2>
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
                          <h3 className="text-sm font-semibold text-gray-900">Driver ID: {report.id}</h3>
                          {report.escalatedToCEO ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-600">
                              Escalated to CEO
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-600">
                              Escalated to DGM
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
                            {report.chatHistory
                              .filter(chat => chat.sender === 'depotmanager' || chat.sender === 'dgm')
                              .map((chat, index) => (
                                <div
                                  key={index}
                                  className={`p-2 rounded-lg ${chat.sender === 'dgm' ? 'bg-blue-100 text-right' : 'bg-gray-200'}`}
                                >
                                  <p className="text-sm font-medium">
                                    {chat.sender === 'dgm' ? 'DGM' : 'Depot Manager'}
                                  </p>
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

        {/* Popup for Issue Details */}
        {showPopup && selectedIssue && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                      {selectedIssue.escalatedToCEO ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-600">
                          Escalated to CEO
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-600">
                          Escalated to DGM
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

                {selectedIssue.escalationReason && (
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <p className="text-xs text-indigo-600 uppercase tracking-wide mb-1">Escalation Reason (From Depot)</p>
                    <p className="text-sm text-indigo-800">{selectedIssue.escalationReason}</p>
                  </div>
                )}

                {selectedIssue.ceoEscalationReason && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-purple-600 uppercase tracking-wide mb-1">Escalation Reason (To CEO)</p>
                    <p className="text-sm text-purple-800">{selectedIssue.ceoEscalationReason}</p>
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
                  {selectedIssue.status !== 'Resolved' && !selectedIssue.escalatedToCEO && (
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
                        <ChevronUp className="w-4 h-4" />
                        <span>Escalate to CEO</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Escalate to CEO Modal */}
        {showEscalateModal && selectedIssue && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Escalate to CEO</h3>
              <p className="text-sm text-gray-600 mb-4">Provide a reason for escalation to CEO:</p>
              <textarea
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="e.g., Major financial implications requiring CEO approval..."
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
                  onClick={escalateToCEO}
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

export default Dgmtechnicalissue;