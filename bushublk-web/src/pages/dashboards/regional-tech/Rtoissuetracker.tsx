import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Filter, Search, FileText, Send, ChevronUp, ChevronDown, ShieldCheck, Activity, CheckCircle } from 'lucide-react';

interface ChatMessage {
  sender_type: string;
  text: string;
  created_at: string;
}

interface EmergencyReport {
  id: number;
  incident_type: string;
  status: string;
  driver_name: string;
  driver_phone?: string;
  vehicle_registration: string;
  description: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
  chatHistory?: ChatMessage[];
}

const API_BASE_URL = 'http://localhost:5000/api/rto';

const Rtoissuetracker = () => {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [emergencyReports, setEmergencyReports] = useState<EmergencyReport[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeChatId) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [emergencyReports, activeChatId]);

  const fetchRTOReports = useCallback(async () => {
    try {
      const response = await fetch(API_BASE_URL);
      const result = await response.json();
      if (result.success) {
        setEmergencyReports(prevReports => {
          const chatHistoryMap = new Map<number, ChatMessage[]>();
          prevReports.forEach(report => {
            if (report.chatHistory) {
              chatHistoryMap.set(report.id, report.chatHistory);
            }
          });
          const newReports: EmergencyReport[] = result.data || [];
          return newReports.map(newReport => ({
            ...newReport,
            chatHistory: chatHistoryMap.get(newReport.id) || newReport.chatHistory,
          }));
        });
      }
    } catch (error) {
      console.error('Failed to fetch RTO reports:', error);
    }
  }, []);

  useEffect(() => {
    fetchRTOReports();
    const interval = setInterval(fetchRTOReports, 30000);
    return () => clearInterval(interval);
  }, [fetchRTOReports]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Escalated to RTO': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredReports = emergencyReports.filter((report: EmergencyReport) => {
    const matchesSearch = report.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.vehicle_registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return filterType === 'all' ? matchesSearch : matchesSearch && report.incident_type === filterType;
  });

  const stats = {
    total: emergencyReports.length,
    inProgress: emergencyReports.filter((r: EmergencyReport) => r.status === 'In Progress').length,
    resolved: emergencyReports.filter((r: EmergencyReport) => r.status === 'Resolved').length,
    escalatedToRTO: emergencyReports.filter((r: EmergencyReport) => r.status === 'Escalated to RTO').length,
  };

  const sendMessage = async () => {
    if (chatMessage.trim() && activeChatId) {
      try {
        const response = await fetch(`${API_BASE_URL}/emergency/${activeChatId}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: chatMessage }),
        });
        if (response.ok) {
          setChatMessage('');
          await fetchChatMessages(activeChatId);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const fetchChatMessages = useCallback(async (reportId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/emergency/${reportId}/chat`);
      const result = await response.json();
      if (result.success) {
        setEmergencyReports(prev => prev.map(r => 
          r.id === reportId ? { ...r, chatHistory: result.data } : r
        ));
      }
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
    }
  }, []);

  const handleToggleChat = (reportId: number) => {
    const report = emergencyReports.find(r => r.id === reportId);
    if (activeChatId === reportId) {
      setActiveChatId(null);
    } else {
      setActiveChatId(reportId);
      if (report && !report.chatHistory) {
        fetchChatMessages(reportId);
      }
    }
  };

  const updateReportStatus = async (reportId: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/emergency/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        await fetchRTOReports();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-50 font-sans">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">RTO Technical Dashboard</h1>
        <p className="text-gray-500">Review and action escalated emergency reports.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
          <FileText className="w-8 h-8 text-gray-400"/>
          <div>
            <p className="text-sm text-gray-500">Total Reports</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
          <ShieldCheck className="w-8 h-8 text-purple-500"/>
          <div>
            <p className="text-sm text-gray-500">Under Review</p>
            <p className="text-2xl font-bold text-purple-600">{stats.escalatedToRTO}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
          <Activity className="w-8 h-8 text-yellow-500"/>
          <div>
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-500"/>
          <div>
            <p className="text-sm text-gray-500">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          </div>
        </div>
      </div>

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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <div className="space-y-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report: EmergencyReport) => (
            <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-300 p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-purple-100 text-purple-700 p-2 rounded-full">
                      <ShieldCheck className="w-5 h-5"/>
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{report.incident_type}</h3>
                      <p className="text-sm text-gray-500">{report.driver_name} | {report.vehicle_registration}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-3 bg-gray-50 p-3 rounded-md">{report.description}</p>
                </div>
                
                <div className="text-sm space-y-2">
                  <div>
                    <p className="font-semibold text-gray-500">Status</p>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-500">Reported At</p>
                    <p className="text-gray-700">{new Date(report.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2 flex flex-col items-stretch">
                  <select 
                    value={report.status}
                    onChange={(e) => updateReportStatus(report.id, e.target.value)}
                    className="w-full border rounded-md p-2 text-sm focus:ring-blue-700"
                    disabled={report.status === 'Resolved'}
                  >
                    <option value="Escalated to RTO">Under Review</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Mark as Resolved</option>
                  </select>
                  <button 
                    onClick={() => handleToggleChat(report.id)} 
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <MessageSquare size={16} /> Chat with Manager {activeChatId === report.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  </button>
                </div>
              </div>
              
              {/* ======================= SIMPLE CHAT STYLE START ======================= */}
              {activeChatId === report.id && (
                !report.chatHistory ? (
                  <div className="text-center text-gray-500 mt-4 p-4">Loading chat history...</div>
                ) : (
                  <div className="mt-4 flex flex-col h-96 bg-gray-50 rounded-lg p-2">
                    {/* Messages Area */}
                    <div className="flex-grow space-y-3 overflow-y-auto p-2">
                      {report.chatHistory.length > 0 ? (
                        report.chatHistory.map((chat, index: number) => {
                          const isRTO = chat.sender_type === 'rto';
                          return (
                            <div key={index} className={`flex items-end gap-2 ${isRTO ? 'justify-end' : ''}`}>
                              {/* Avatar (non-RTO) */}
                              {!isRTO && (
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                                  <ShieldCheck className="w-4 h-4 text-gray-600" />
                                </div>
                              )}
                              
                              {/* Message Bubble */}
                              <div className={`w-fit max-w-xs leading-1.5 p-3 rounded-xl ${isRTO ? 'bg-blue-500 text-white' : 'bg-white shadow-sm'}`}>
                                <p className="text-sm font-normal break-words">{chat.text}</p>
                                <p className={`text-xs text-right mt-1.5 ${isRTO ? 'text-blue-100' : 'text-gray-400'}`}>
                                  {new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex-grow flex items-center justify-center text-center text-gray-400">
                          <div>
                            <MessageSquare className="mx-auto h-8 w-8"/>
                            <p className="mt-1 text-sm">No messages yet.</p>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-2 border-t flex items-center gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                      />
                      <button
                        onClick={sendMessage}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        disabled={!chatMessage.trim()}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )
              )}
              {/* ======================== SIMPLE CHAT STYLE END ======================== */}
            </div>
          ))
        ) : (
          <div className="text-center p-10 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700">No Reports Found</h3>
            <p className="text-gray-500">There are currently no reports matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rtoissuetracker;