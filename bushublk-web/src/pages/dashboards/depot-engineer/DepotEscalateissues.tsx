import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    XCircle, MapPin, CheckCircle, ArrowUpCircle, FileText,
    MessageSquare, Send, AlertTriangle, ShieldAlert, ChevronDown, ChevronUp, Users, User
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const buildDepotEmergencyUrl = () => `${API_BASE_URL}/api/depot/emergency`;

const buildDepotEmergencyStatsUrl = () => `${API_BASE_URL}/api/depot/emergency/statistics`;

const buildDepotEmergencyStatusUrl = (reportId: number) => `${API_BASE_URL}/api/depot/emergency/${reportId}/status`;

const buildDepotEmergencyMessagesUrl = (reportId: number) => `${API_BASE_URL}/api/depot/emergency/${reportId}/messages`;

const buildDepotEmergencyManagerChatUrl = (reportId: number) => `${API_BASE_URL}/api/depot/emergency/${reportId}/manager-chat`;

// --- INTERFACES (MODIFIED) --- //
interface ChatMessage {
    id: number;
    sender_type: 'driver' | 'depot' | 'manager';
    text: string;
    created_at: string;
}

// --- FIX: Added 'Action Taken' and 'Escalated to RTO' to the status type ---
interface EmergencyReport {
    id: number;
    incident_type: string;
    status: 'New' | 'In Progress' | 'Pending' | 'Resolved' | 'Escalated to Depot Manager' | 'Action Taken' | 'Escalated to RTO';
    driver_name: string;
    driver_phone: string;
    vehicle_registration: string;
    created_at: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    messages?: ChatMessage[]; 
    managerMessages?: ChatMessage[];
}

// --- SUB-COMPONENTS --- //
interface ChatBoxProps {
    reportId: number;
    messages: ChatMessage[] | undefined;
    onMessageSent: (reportId: number, chatType: 'driver' | 'manager') => void;
    chatType: 'driver' | 'manager';
    currentUserType: 'depot';
}

const ChatBox: React.FC<ChatBoxProps> = ({ reportId, messages, onMessageSent, chatType }) => {
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const endpoint = chatType === 'driver'
            ? buildDepotEmergencyMessagesUrl(reportId)
            : buildDepotEmergencyManagerChatUrl(reportId);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newMessage, sender: 'depot' }),
            });
            if (response.ok) {
                setNewMessage('');
                onMessageSent(reportId, chatType);
            } else {
                console.error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="space-y-4 h-48 overflow-y-auto bg-gray-50 p-2 rounded-md pr-2">
                {messages && messages.length > 0 ? (messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.sender_type === 'depot' ? 'justify-end' : ''}`}>
                        <div className={`rounded-lg p-3 max-w-xs ${msg.sender_type === 'depot' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                            {msg.sender_type !== 'depot' && (<p className="text-xs font-bold capitalize text-gray-600">{msg.sender_type}</p>)}
                            <p className="text-sm">{msg.text}</p>
                            <p className="text-xs text-right mt-1 opacity-70">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))) : (<p className="text-center text-gray-400 text-sm py-8">No messages yet. Start the conversation!</p>)}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-3">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your response..." className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                <button type="submit" className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors" aria-label="Send message">
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};


// --- MAIN COMPONENT --- //
const DepotEscalateIssues: React.FC = () => {
    const [reports, setReports] = useState<EmergencyReport[]>([]);
    const [stats, setStats] = useState({ total: 0, in_progress: 0, resolved: 0, pending: 0, escalated: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All Types');

    const fetchAllData = useCallback(async () => {
        if (reports.length === 0) setIsLoading(true);
        try {
            const [reportsResponse, statsResponse] = await Promise.all([
                fetch(buildDepotEmergencyUrl()),
                fetch(buildDepotEmergencyStatsUrl())
            ]);
            const reportsResult = await reportsResponse.json();
            if (reportsResult.success) {
                const newReports = reportsResult.data || [];
                setReports(prevReports => {
                    const messageMap = new Map<number, ChatMessage[]>();
                    const managerMessageMap = new Map<number, ChatMessage[]>();
                    prevReports.forEach(report => {
                        if (report.messages) messageMap.set(report.id, report.messages);
                        if (report.managerMessages) managerMessageMap.set(report.id, report.managerMessages);
                    });
                    return newReports.map((newReport: EmergencyReport) => ({
                        ...newReport,
                        messages: messageMap.get(newReport.id),
                        managerMessages: managerMessageMap.get(newReport.id),
                    }));
                });
            }
            const statsResult = await statsResponse.json();
            if (statsResult.success) setStats(statsResult.data);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [reports.length]);

    useEffect(() => {
        fetchAllData();
        const interval = setInterval(fetchAllData, 30000);
        return () => clearInterval(interval);
    }, [fetchAllData]);

    const handleUpdateStatus = async (id: number, status: EmergencyReport['status']) => {
        try {
            const response = await fetch(buildDepotEmergencyStatusUrl(id), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (response.ok) {
                await fetchAllData();
            } else {
                throw new Error('Failed to update status on the server.');
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("There was an error updating the status. Please try again.");
        }
    };

    const fetchMessagesForReport = useCallback(async (reportId: number) => {
        try {
            const response = await fetch(buildDepotEmergencyMessagesUrl(reportId));
            const result = await response.json();
            if (result.success) {
                setReports(prevReports => prevReports.map(r =>
                    r.id === reportId ? { ...r, messages: result.data } : r
                ));
            }
        } catch (error) {
            console.error(`Failed to fetch messages for report ${reportId}:`, error);
        }
    }, []);

    const fetchManagerChatForReport = useCallback(async (reportId: number) => {
        try {
            const response = await fetch(buildDepotEmergencyManagerChatUrl(reportId));
            const result = await response.json();
            if (result.success) {
                setReports(prevReports => prevReports.map(r =>
                    r.id === reportId ? { ...r, managerMessages: result.data } : r
                ));
            }
        } catch (error) {
            console.error(`Failed to fetch manager chat for report ${reportId}:`, error);
        }
    }, []);

    const handleMessageSent = (reportId: number, chatType: 'driver' | 'manager') => {
        if (chatType === 'driver') {
            fetchMessagesForReport(reportId);
        } else {
            fetchManagerChatForReport(reportId);
        }
    };

    const handleToggleChat = (reportId: number) => {
        const report = reports.find(r => r.id === reportId);
        if (!report) return;

        if (activeChatId === reportId) {
            setActiveChatId(null);
        } else {
            setActiveChatId(reportId);
            if (report.status === 'Escalated to Depot Manager') {
                if (!report.managerMessages) {
                    fetchManagerChatForReport(reportId);
                }
            } else {
                if (!report.messages) {
                    fetchMessagesForReport(reportId);
                }
            }
        }
    };

    const getStatusPill = (status: EmergencyReport['status']) => {
        const styles = {
            'New':'bg-blue-100 text-blue-800', 'In Progress':'bg-indigo-100 text-indigo-800',
            'Pending': 'bg-yellow-100 text-yellow-800', 'Resolved':'bg-green-100 text-green-800',
            'Escalated to Depot Manager':'bg-purple-100 text-purple-800',
            'Action Taken': 'bg-orange-100 text-orange-800',
            'Escalated to RTO': 'bg-red-100 text-red-800'
        };
        return (<span className={`px-3 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100'}`}>{status}</span>);
    };

    const filteredReports = reports.filter(report => {
        const typeMatch = filterType === 'All Types' || report.incident_type === filterType;
        const searchMatch = !searchTerm || String(report.id).includes(searchTerm) ||
            report.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.vehicle_registration?.toLowerCase().includes(searchTerm.toLowerCase());
        return typeMatch && searchMatch;
    });

    const incidentTypes = ['All Types', ...new Set(reports.map(r => r.incident_type))];

    // --- FIX: A helper variable to check if the issue has been escalated ---
    const isEscalated = (status: EmergencyReport['status']) => {
        return ['Escalated to Depot Manager', 'Action Taken', 'Escalated to RTO'].includes(status);
    };

    return (
        <div className="p-6 bg-gray-50 font-sans">
            <div className="flex justify-between items-center mb-6"><div><h1 className="text-2xl font-bold text-gray-800">Issue Tracker</h1><p className="text-gray-500">Live emergency reports from drivers</p></div></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4"><FileText className="w-8 h-8 text-gray-400"/><div><p className="text-sm text-gray-500">Total Reports</p><p className="text-2xl font-bold text-gray-800">{stats.total}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4"><CheckCircle className="w-8 h-8 text-blue-500"/><div><p className="text-sm text-gray-500">In Progress</p><p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4"><XCircle className="w-8 h-8 text-green-500"/><div><p className="text-sm text-gray-500">Resolved</p><p className="text-2xl font-bold text-green-600">{stats.resolved}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4"><ArrowUpCircle className="w-8 h-8 text-yellow-500"/><div><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4"><ShieldAlert className="w-8 h-8 text-purple-500"/><div><p className="text-sm text-gray-500">Escalated</p><p className="text-2xl font-bold text-purple-600">{stats.escalated}</p></div></div>
            </div>
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
                <input type="text" placeholder="Search by driver, vehicle, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-grow border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-gray-300 rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">{incidentTypes.map(type => <option key={type} value={type}>{type}</option>)}</select>
            </div>

            <div className="space-y-4">
                {isLoading ? (<div className="text-center p-10 text-gray-500">Loading reports...</div>)
                : filteredReports.length > 0 ? (filteredReports.map((report) => (
                    <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-300 p-5">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                            <div className="md:col-span-2">
                                <div className="flex items-center gap-3">
                                    <span className="bg-red-100 text-red-700 p-2 rounded-full"><AlertTriangle className="w-5 h-5"/></span>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{report.incident_type}</h3>
                                        <p className="text-sm text-gray-500">{report.driver_name} | {report.vehicle_registration}</p>
                                        <p className="text-sm text-gray-500">📞 {report.driver_phone}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 mt-3 bg-gray-50 p-3 rounded-md">{report.description}</p>
                            </div>
                            <div className="text-sm">
                               <p className="font-semibold text-gray-500 mb-1">Status</p>
                                {getStatusPill(report.status)}
                                <p className="font-semibold text-gray-500 mt-3 mb-1">Reported At</p>
                                <p className="text-gray-700">{new Date(report.created_at).toLocaleString()}</p>
                            </div>
                            <div className="text-sm">
                                <p className="font-semibold text-gray-500 mb-1">Location</p>
                                <a href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                                    <MapPin className="w-4 h-4" />
                                    <span>View on Map</span>
                                </a>
                            </div>
                            <div className="md:col-span-1 space-y-2 flex flex-col items-stretch">
                                {/* --- FIX: Updated the disabled logic for the dropdown --- */}
                                <select 
                                    value={report.status}
                                    onChange={(e) => handleUpdateStatus(report.id, e.target.value as EmergencyReport['status'])}
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isEscalated(report.status)}
                                >
                                    <option value="In Progress">In Progress</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                                {/* --- FIX: Updated the disabled and className logic for the button --- */}
                                <button
                                    onClick={() => handleUpdateStatus(report.id, 'Escalated to Depot Manager')}
                                    className={`flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white font-semibold rounded-lg transition-colors text-sm ${!isEscalated(report.status) ? 'hover:bg-red-700' : 'opacity-50 cursor-not-allowed'}`}
                                    disabled={isEscalated(report.status)} >
                                    <ShieldAlert size={16} /> Escalate
                                </button>
                                
                                <button 
                                    onClick={() => handleToggleChat(report.id)} 
                                    className={`flex items-center justify-center gap-2 px-3 py-2 text-white font-semibold rounded-lg transition-colors text-sm bg-blue-600 hover:bg-blue-700`}
                                >
                                    <MessageSquare size={16} /> 
                                    {isEscalated(report.status) ? 'Chat with Manager' : 'Chat with Driver'}
                                    {activeChatId === report.id ? <ChevronUp size={16} /> : <ChevronDown size={16}/>}
                                </button>
                            </div>
                        </div>
                        
                        {activeChatId === report.id && (
                            <div className="mt-4 pt-4 border-t">
                                {isEscalated(report.status) ? (
                                    <>
                                        <div className="flex items-center gap-2 text-blue-700 mb-2">
                                            <Users size={18} />
                                            <h4 className="font-semibold">Internal Manager Chat</h4>
                                        </div>
                                        <ChatBox
                                            reportId={report.id}
                                            messages={report.managerMessages}
                                            onMessageSent={handleMessageSent}
                                            chatType="manager"
                                            currentUserType="depot"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 text-blue-700 mb-2">
                                            <User size={18} />
                                            <h4 className="font-semibold">Driver Chat</h4>
                                        </div>
                                        <ChatBox
                                            reportId={report.id}
                                            messages={report.messages}
                                            onMessageSent={handleMessageSent}
                                            chatType="driver"
                                            currentUserType="depot"
                                        />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ))) : (
                    <div className="text-center p-10 bg-white rounded-lg shadow-sm"><h3 className="text-lg font-semibold text-gray-700">No Reports Found</h3><p className="text-gray-500">There are no reports matching your current filters.</p></div>
                )}
            </div>
        </div>
    );
};

export default DepotEscalateIssues;