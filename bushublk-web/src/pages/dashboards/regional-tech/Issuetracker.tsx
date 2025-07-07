import React, { useState } from 'react';
import { 
  FaReply, 
  FaArrowUp, 
  FaCheck, 
  FaEye, 
  FaPaperclip, 
  FaFilePdf, 
  FaImage,
  FaSearch,
  FaChevronDown
} from 'react-icons/fa';

const Issuetracker = () => {
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [depotFilter, setDepotFilter] = useState('All Depots');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');

  const issues = [
    {
      id: 'ESC-001',
      depot: 'Colombo',
      busNo: '57',
      date: '2025-07-03',
      description: 'Brake system failure',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-800',
      attachments: '2 files',
      hasAttachments: true,
      communications: [
        {
          sender: 'Depot Engineer (Colombo)',
          message: 'Bus #57 reported brake system failure during morning inspection. Pedal goes to floor with little resistance. Suspect master cylinder failure.',
          timestamp: '2025-07-03 09:15',
          attachments: [
            { name: 'brake_inspection.pdf', type: 'pdf' },
            { name: 'photo_1.jpg', type: 'image' }
          ]
        },
        {
          sender: 'RTO (You)',
          message: 'Please check brake fluid level and inspect for leaks at all four wheels. Also verify booster operation.',
          timestamp: '2025-07-03 10:30'
        }
      ]
    },
    {
      id: 'ESC-002',
      depot: 'Galle',
      busNo: '64',
      date: '2025-07-01',
      description: 'Radiator leak',
      status: 'Investigating',
      statusColor: 'bg-blue-100 text-blue-800',
      attachments: '1 image',
      hasAttachments: true,
      communications: []
    },
    {
      id: 'ESC-003',
      depot: 'Matara',
      busNo: '22',
      date: '2025-06-29',
      description: 'Gearbox noise after service',
      status: 'Resolved',
      statusColor: 'bg-green-100 text-green-800',
      attachments: '—',
      hasAttachments: false,
      communications: []
    }
  ];

  const filteredIssues = issues.filter(issue => {
    const matchesDepot = depotFilter === 'All Depots' || issue.depot === depotFilter;
    const matchesStatus = statusFilter === 'All Statuses' || issue.status === statusFilter;
    const matchesSearch = issue.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.busNo.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesDepot && matchesStatus && matchesSearch;
  });

  const handleReplyClick = (issueId) => {
    setExpandedIssue(expandedIssue === issueId ? null : issueId);
    setReplyText('');
  };

  const handleSendReply = (issueId) => {
    if (replyText.trim()) {
      console.log(`Sending reply for ${issueId}:`, replyText);
      setReplyText('');
      setExpandedIssue(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved':
        return <FaCheck className="w-4 h-4 text-green-600" />;
      case 'Escalated':
        return <FaArrowUp className="w-4 h-4 text-red-600" />;
      case 'Investigating':
        return <FaEye className="w-4 h-4 text-blue-600" />;
      case 'Pending':
        return <div className="w-4 h-4 bg-yellow-500 rounded-full" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Depot Issue Tracker</h1>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1">
                <select 
                  value={depotFilter}
                  onChange={(e) => setDepotFilter(e.target.value)}
                  className="appearance-none w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All Depots">All Depots</option>
                  {[...new Set(issues.map(issue => issue.depot))].map(depot => (
                    <option key={depot} value={depot}>{depot}</option>
                  ))}
                </select>
                <FaChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative flex-1">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All Statuses">All Statuses</option>
                  {[...new Set(issues.map(issue => issue.status))].map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <FaChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative flex-1">
                <FaSearch className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Issues Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depot</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attachments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIssues.map((issue) => (
                  <React.Fragment key={issue.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {issue.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issue.depot}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issue.busNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issue.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {issue.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${issue.statusColor}`}>
                          {getStatusIcon(issue.status)}
                          <span className="ml-1">{issue.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issue.hasAttachments ? (
                          <div className="flex items-center text-blue-600">
                            <FaPaperclip className="w-4 h-4 mr-1" />
                            {issue.attachments}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleReplyClick(issue.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaReply className="w-4 h-4" />
                          </button>
                          {issue.status !== 'Resolved' && issue.status !== 'Escalated' && (
                            <button 
                              onClick={() => console.log(`Escalating issue ${issue.id}`)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <FaArrowUp className="w-4 h-4" />
                            </button>
                          )}
                          {issue.status !== 'Resolved' && issue.status !== 'Escalated' ? (
                            <button 
                              onClick={() => console.log(`Resolving issue ${issue.id}`)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <FaCheck className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => console.log(`Viewing issue ${issue.id}`)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Communication History */}
                    {expandedIssue === issue.id && (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            {/* Communication History */}
                            {issue.communications.length > 0 && (
                              <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Communication History</h4>
                                {issue.communications.map((comm, index) => (
                                  <div key={index} className="bg-white p-4 rounded-lg border">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                                      <span className="font-medium text-gray-900">{comm.sender}</span>
                                      <span className="text-sm text-gray-500">{comm.timestamp}</span>
                                    </div>
                                    <p className="text-gray-700 mb-2">{comm.message}</p>
                                    {comm.attachments && (
                                      <div className="flex flex-wrap gap-4">
                                        {comm.attachments.map((attachment, attIndex) => (
                                          <div key={attIndex} className="flex items-center text-blue-600 text-sm">
                                            {attachment.type === 'pdf' ? (
                                              <FaFilePdf className="w-4 h-4 mr-1" />
                                            ) : (
                                              <FaImage className="w-4 h-4 mr-1" />
                                            )}
                                            {attachment.name}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Send Reply */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-3">Send Reply</h4>
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type your message here..."
                                className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={() => handleSendReply(issue.id)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  Send Reply
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

export default Issuetracker;