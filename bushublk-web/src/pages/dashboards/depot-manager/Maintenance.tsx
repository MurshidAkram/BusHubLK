import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    MapPin, Clock, CheckCircle, FileText,
    MessageSquare, Send, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Activity
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api/depot-manager';

// --- INTERFACES --- //
interface ChatMessage {
    id: number;
    sender_type: 'driver' | 'depot' | 'depot_manager';
    text: string;
    created_at: string;
}

interface ManagerReport {
    id: number;
    incident_type: string;
    status: 'Escalated to Depot Manager' | 'Action Taken' | 'Resolved';
    driver_name: string;
    vehicle_registration: string;
    created_at: string;
    description?: string;
    location?: string;
    messages?: ChatMessage[];
}

// --- REUSABLE CHATBOX SUB-COMPONENT --- //
const ChatBox: React.FC<{
    reportId: number;
    messages: ChatMessage[];
    currentUser: 'depot' | 'depot_manager';
    onMessageSent: (reportId: number) => void;
}> = ({ reportId, messages, currentUser, onMessageSent }) => {
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        const postUrl = `${API_BASE_URL}/emergency/${reportId}/reply`;
        try {
            const response = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newMessage }),
            });
            if (response.ok) {
                setNewMessage('');
                onMessageSent(reportId);
            } else {
                console.error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const userBubbleClass = 'bg-green-100 text-green-900';
    const otherBubbleClass = 'bg-gray-100 text-gray-800';

    return (
        <div className="mt-4 flex flex-col h-80 bg-gray-50 rounded-lg p-3">
            <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                {messages && messages.length > 0 ? (messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-2.5 ${msg.sender_type === currentUser ? 'justify-end' : ''}`}>
                        <div className={`rounded-xl p-3 w-fit max-w-xl ${msg.sender_type === currentUser ? userBubbleClass : otherBubbleClass}`}>
                            {msg.sender_type !== currentUser && (
                                <p className="text-xs font-bold capitalize text-gray-500">
                                    {msg.sender_type === 'depot' ? 'Engineer' : msg.sender_type.replace('_', ' ')}
                                </p>
                            )}
                            <p className="text-sm break-words">{msg.text}</p>
                            <p className="text-xs text-right mt-1 opacity-60">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))) : (
                    <div className="flex-grow flex items-center justify-center">
                        <p className="text-center text-gray-400 text-sm">No messages yet.</p>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-3 flex-shrink-0">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your response..."
                    className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button type="submit" className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex-shrink-0">
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};


// --- MAIN MANAGER COMPONENT --- //
const DepotManagerIssues: React.FC = () => {
    const [reports, setReports] = useState<ManagerReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [stats, setStats] = useState({ reviewing: 0, actionTaken: 0, resolved: 0, total: 0 });

    const fetchAllManagerData = useCallback(async () => {
        try {
            const [reportsResponse, statsResponse] = await Promise.all([
                fetch(API_BASE_URL),
                fetch(`${API_BASE_URL}/statistics`)
            ]);
            const reportsResult = await reportsResponse.json();
            const statsResult = await statsResponse.json();
            if (reportsResult.success) {
                setReports(prevReports => {
                    const messageMap = new Map<number, ChatMessage[]>();
                    prevReports.forEach(r => r.messages && messageMap.set(r.id, r.messages));
                    return (reportsResult.data || []).map((newReport: ManagerReport) => ({
                        ...newReport,
                        messages: messageMap.get(newReport.id),
                    }));
                });
            }
            if (statsResult.success) {
                setStats(statsResult.data);
            }
        } catch (error) {
            console.error("Failed to fetch escalated reports:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllManagerData();
        const interval = setInterval(fetchAllManagerData, 30000);
        return () => clearInterval(interval);
    }, [fetchAllManagerData]);

    const handleUpdateStatus = async (id: number, status: ManagerReport['status']) => {
        try {
            await fetch(`${API_BASE_URL}/emergency/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            await fetchAllManagerData();
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };
    
    const fetchMessagesForReport = useCallback(async (reportId: number) => {
        try {
            const response = await fetch(`http://localhost:5000/api/depot/emergency/${reportId}/manager-chat`);
            const result = await response.json();
            if (result.success) {
                setReports(prev => prev.map(r => 
                    r.id === reportId ? { ...r, messages: result.data } : r
                ));
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        }
    }, []);

    const handleToggleChat = (reportId: number) => {
        const report = reports.find(r => r.id === reportId);
        if (activeChatId === reportId) {
            setActiveChatId(null);
        } else {
            setActiveChatId(reportId);
            if (report && !report.messages) {
                fetchMessagesForReport(reportId);
            }
        }
    };
    
    return (
        <div className="p-6 bg-gray-50 font-sans">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manager Dashboard</h1>
                <p className="text-gray-500">Review and action escalated issues.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4"><FileText className="w-8 h-8 text-gray-400"/><div><p className="text-sm text-gray-500">Total Issues</p><p className="text-2xl font-bold text-gray-800">{stats.total}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4"><ShieldCheck className="w-8 h-8 text-purple-500"/><div><p className="text-sm text-gray-500">Reviewing</p><p className="text-2xl font-bold text-purple-600">{stats.reviewing}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4"><Activity className="w-8 h-8 text-yellow-500"/><div><p className="text-sm text-gray-500">Action Taken</p><p className="text-2xl font-bold text-yellow-600">{stats.actionTaken}</p></div></div>
                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4"><CheckCircle className="w-8 h-8 text-green-500"/><div><p className="text-sm text-gray-500">Resolved</p><p className="text-2xl font-bold text-green-600">{stats.resolved}</p></div></div>
            </div>

            <div className="space-y-4">
                {isLoading && reports.length === 0 ? (<p className="text-center p-10">Loading escalated reports...</p>)
                : reports.length > 0 ? (reports.map((report) => (
                    // --- THIS IS THE FIX: Changed the border color ---
                    <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-300 p-5">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                            <div className="md:col-span-2">
                                <div className="flex items-center gap-3">
                                    <span className="bg-purple-100 text-purple-700 p-2 rounded-full"><ShieldCheck className="w-5 h-5"/></span>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{report.incident_type} </h3>
                                        <p className="text-sm text-gray-500">{report.driver_name} | {report.vehicle_registration}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 mt-3 bg-gray-50 p-3 rounded-md">{report.description}</p>
                            </div>
                            
                            <div className="text-sm space-y-2">
                                <div>
                                    <p className="font-semibold text-gray-500">Status</p>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                        report.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                        report.status === 'Action Taken' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'
                                    }`}>{report.status}</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-500">Reported At</p>
                                    <p className="text-gray-700">{new Date(report.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-2 flex flex-col items-stretch">
                                <select 
                                    value={report.status}
                                    onChange={(e) => handleUpdateStatus(report.id, e.target.value as ManagerReport['status'])}
                                    className="w-full border rounded-md p-2 text-sm focus:ring-blue-700"
                                    disabled={report.status === 'Resolved'}
                                >
                                    <option value="Escalated to Depot Manager">Reviewing</option>
                                    <option value="Action Taken">Action Taken</option>
                                    <option value="Resolved">Mark as Resolved</option>
                                </select>
                                <button onClick={() => handleToggleChat(report.id)} className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                                    <MessageSquare size={16} /> Chat with Depot {activeChatId === report.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                </button>
                            </div>
                        </div>

                        {activeChatId === report.id && (
                            !report.messages ? <p className="text-center text-gray-500 mt-4">Loading chat...</p> : (
                                <ChatBox
                                    reportId={report.id}
                                    messages={report.messages}
                                    currentUser="depot_manager"
                                    onMessageSent={fetchMessagesForReport}
                                />
                            )
                        )}
                    </div>
                ))) : (
                    <div className="text-center p-10 bg-white rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-700">No Escalated Reports</h3>
                        <p className="text-gray-500">There are currently no issues that require your attention.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DepotManagerIssues;