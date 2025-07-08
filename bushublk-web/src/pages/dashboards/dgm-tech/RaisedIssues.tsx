import React, { useState } from 'react';
import { FaEye, FaReply, FaChevronUp, FaChevronDown, FaPaperPlane, FaArrowUp } from 'react-icons/fa';

// Define types for the issue data
type Issue = {
  id: string;
  description: string;
  busDepot: string;
  priority: string;
  status: string;
  date: string;
  priorityColor: string;
  statusColor: string;
};

// Define types for chat messages
type ChatMessage = {
  sender: string;
  message: string;
  time: string;
};

type ChatMessages = {
  [key: string]: ChatMessage[];
};

const RaisedIssues = () => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessages>({});
  const [currentMessage, setCurrentMessage] = useState<string>('');

  const issues: Issue[] = [
    {
      id: 'ESC-2023-105',
      description: 'Repeated engine failures in 5 buses',
      busDepot: 'Northern / Depot 1',
      priority: 'Critical',
      status: 'In Review',
      date: '15 Jul 2023',
      priorityColor: 'bg-red-100 text-red-800',
      statusColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: 'ESC-2023-098',
      description: 'Spare parts shortage affecting maintenance',
      busDepot: 'Eastern / Depot 3',
      priority: 'High',
      status: 'New',
      date: '12 Jul 2023',
      priorityColor: 'bg-orange-100 text-orange-800',
      statusColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'ESC-2023-087',
      description: 'Training needed for new diagnostic equipment',
      busDepot: 'Western / Depot 2',
      priority: 'Medium',
      status: 'Resolved',
      date: '05 Jul 2023',
      priorityColor: 'bg-yellow-100 text-yellow-800',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'ESC-2023-076',
      description: 'Safety concern with brake systems',
      busDepot: 'Central / Depot 1',
      priority: 'Critical',
      status: 'Escalated to CEO',
      date: '28 Jun 2023',
      priorityColor: 'bg-red-100 text-red-800',
      statusColor: 'bg-purple-100 text-purple-800'
    }
  ];

  const toggleRow = (issueId: string) => {
    setExpandedRow(expandedRow === issueId ? null : issueId);
    if (!chatMessages[issueId]) {
      setChatMessages({
        ...chatMessages,
        [issueId]: [
          { sender: 'System', message: 'Issue has been escalated. Please provide updates.', time: '10:30 AM' },
          { sender: 'Maintenance Team', message: 'Initial investigation completed. Awaiting approval for parts order.', time: '11:15 AM' }
        ]
      });
    }
  };

  const sendMessage = (issueId: string) => {
    if (currentMessage.trim()) {
      setChatMessages({
        ...chatMessages,
        [issueId]: [
          ...(chatMessages[issueId] || []),
          { 
            sender: 'You', 
            message: currentMessage, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }
        ]
      });
      setCurrentMessage('');
    }
  };

  const escalateToCEO = (issueId: string) => {
    // Handle escalation to CEO
    alert(`Issue ${issueId} has been escalated to CEO`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h1 className="text-xl font-semibold text-gray-900">Current Escalated Issues</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Filter:</span>
              <select className="border border-gray-300 rounded px-3 py-1 text-sm">
                <option>Northern Region</option>
                <option>Eastern Region</option>
                <option>Western Region</option>
                <option>Central Region</option>
                <option>All Regions</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus/Depot</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {issues.map((issue) => (
                  <React.Fragment key={issue.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {issue.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {issue.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {issue.busDepot}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${issue.priorityColor}`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${issue.statusColor}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {issue.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50">
                          <FaEye className="w-3 h-3 mr-1" />
                        
                        </button>
                        <button 
                          onClick={() => toggleRow(issue.id)}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-sm bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          <FaReply className="w-3 h-3 mr-1" />
                          
                        </button>
                        <button 
                          onClick={() => escalateToCEO(issue.id)}
                          className="inline-flex items-center px-3 py-1 border border-green-400 rounded-md text-sm bg-green-50 text-re-700 hover:bg-green-100"
                        >
                        <FaArrowUp className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expandable Chat Row */}
                    {expandedRow === issue.id && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="border rounded-lg bg-white">
                            {/* Chat Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-100">
                              <h3 className="text-sm font-medium text-gray-900">
                                Discussion Thread - {issue.id}
                              </h3>
                              <button 
                                onClick={() => toggleRow(issue.id)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <FaChevronUp className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Chat Messages */}
                            <div className="p-4 max-h-64 overflow-y-auto">
                              <div className="space-y-3">
                                {chatMessages[issue.id]?.map((msg, idx) => (
                                  <div key={idx} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs px-3 py-2 rounded-lg ${
                                      msg.sender === 'You' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 text-gray-800'
                                    }`}>
                                      <div className="text-xs font-medium mb-1">{msg.sender}</div>
                                      <div className="text-sm">{msg.message}</div>
                                      <div className="text-xs mt-1 opacity-70">{msg.time}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Message Input */}
                            <div className="px-4 py-3 border-t">
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  value={currentMessage}
                                  onChange={(e) => setCurrentMessage(e.target.value)}
                                  placeholder="Type your message..."
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(issue.id)}
                                />
                                <button
                                  onClick={() => sendMessage(issue.id)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <FaPaperPlane className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaisedIssues;