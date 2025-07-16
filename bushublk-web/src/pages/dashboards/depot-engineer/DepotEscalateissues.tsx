import { useState } from 'react';
import { FaHardHat, FaEye, FaComment, FaPlus, FaPaperclip, FaCalendarAlt, FaClock, FaWarehouse } from 'react-icons/fa';

type Issue = {
  id: string;
  title: string;
  status: 'new' | 'in-review' | 'pending-info' | 'resolved' | 'escalated';
  depot: string;
  date: string;
  lastUpdated: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  attachments: { url: string; alt: string }[];
  history: { action: string; date: string; details: string }[];
  chat: { sender: string; message: string; date: string }[];
  infoRequest?: string;
};

const DepotEscalateissues = () => {
  const [activeTab, setActiveTab] = useState<'my-issues' | 'pending-info'>('my-issues');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showNewIssueModal, setShowNewIssueModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [expandedChat, setExpandedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const [issues, setIssues] = useState<Issue[]>([
    {
      id: 'IS-2023-045',
      title: 'Power Supply Failure',
      status: 'pending-info',
      depot: 'Depot 5',
      date: '2 days ago',
      lastUpdated: '3 hours ago',
      priority: 'high',
      category: 'Electrical',
      description: 'The main power supply unit in Depot 5 has failed, causing complete shutdown of operations. This is affecting all systems in the depot.',
      attachments: [
        { url: 'https://via.placeholder.com/150', alt: 'Power supply error' },
        { url: 'https://via.placeholder.com/150', alt: 'Depot location' }
      ],
      history: [
        { action: 'Raised by Depot Engineer', date: '2 days ago', details: 'Issue initially reported' },
        { action: 'Assigned to RTO', date: '1 day ago', details: 'RTO began investigation' },
        { action: 'Info Requested', date: '3 hours ago', details: 'RTO requested model number and photos' }
      ],
      chat: [
        { sender: 'Depot Engineer', message: 'The main power supply failed this morning around 9:15 AM. We\'ve switched to backup but it won\'t last more than 4 hours.', date: '2 days ago' },
        { sender: 'RTO', message: 'Please provide the exact model number of the power supply unit and photos of the error indicators if available.', date: '3 hours ago' }
      ],
      infoRequest: 'Please provide the exact model number of the power supply unit and photos of the error indicators if available.'
    },
    {
      id: 'IS-2023-042',
      title: 'Network Connectivity Issues',
      status: 'escalated',
      depot: 'Depot 3',
      date: '5 days ago',
      lastUpdated: '1 day ago',
      priority: 'medium',
      category: 'Network',
      description: 'Intermittent network connectivity issues in the eastern wing of Depot 3. RTO couldn\'t resolve as it appears to be a larger infrastructure problem.',
      attachments: [],
      history: [
        { action: 'Raised by Depot Engineer', date: '5 days ago', details: 'Issue initially reported' },
        { action: 'Assigned to RTO', date: '4 days ago', details: 'RTO began investigation' },
        { action: 'Escalated to DGM', date: '1 day ago', details: 'RTO escalated due to infrastructure scope' }
      ],
      chat: [
        { sender: 'Depot Engineer', message: 'We\'re experiencing intermittent network drops in the eastern wing. Happens 3-4 times per hour.', date: '5 days ago' },
        { sender: 'RTO', message: 'We\'ve checked the local switches and found no issues. This may require network infrastructure upgrades.', date: '1 day ago' }
      ]
    },
    {
      id: 'IS-2023-038',
      title: 'Faulty HVAC Unit',
      status: 'resolved',
      depot: 'Depot 1',
      date: '1 week ago',
      lastUpdated: '2 days ago',
      priority: 'low',
      category: 'HVAC',
      description: 'HVAC unit in control room not maintaining temperature. RTO technician replaced the thermostat and recalibrated the system.',
      attachments: [],
      history: [
        { action: 'Raised by Depot Engineer', date: '1 week ago', details: 'Issue initially reported' },
        { action: 'Assigned to RTO', date: '6 days ago', details: 'RTO began investigation' },
        { action: 'Resolved', date: '2 days ago', details: 'Thermostat replaced and system recalibrated' }
      ],
      chat: [
        { sender: 'Depot Engineer', message: 'Control room temperature fluctuates between 60°F and 80°F. Thermostat seems unresponsive.', date: '1 week ago' },
        { sender: 'RTO', message: 'We\'ll dispatch a technician to inspect the HVAC system.', date: '6 days ago' },
        { sender: 'RTO', message: 'Issue resolved. Faulty thermostat replaced.', date: '2 days ago' }
      ]
    }
  ]);

  const getStatusBadge = (status: Issue['status']) => {
    const baseClasses = "text-xs font-medium me-2 px-2.5 py-0.5 rounded";
    switch(status) {
      case 'new': return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>New</span>;
      case 'in-review': return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>In Review</span>;
      case 'pending-info': return <span className={`${baseClasses} bg-cyan-100 text-cyan-800`}>Pending Info</span>;
      case 'resolved': return <span className={`${baseClasses} bg-green-100 text-green-800`}>Resolved</span>;
      case 'escalated': return <span className={`${baseClasses} bg-red-100 text-red-800`}>Escalated</span>;
      default: return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>;
    }
  };

  const getPriorityBadge = (priority: Issue['priority']) => {
    const baseClasses = "text-xs font-medium me-1 px-2.5 py-0.5 rounded";
    switch(priority) {
      case 'high': return <span className={`${baseClasses} bg-red-100 text-red-800`}>High</span>;
      case 'medium': return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Medium</span>;
      case 'low': return <span className={`${baseClasses} bg-green-100 text-green-800`}>Low</span>;
      default: return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>;
    }
  };

  const viewIssueDetails = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowIssueModal(true);
  };

  const toggleChat = (issueId: string) => {
    setExpandedChat(expandedChat === issueId ? null : issueId);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedIssue) return;
    
    const updatedIssues = issues.map(issue => {
      if (issue.id === selectedIssue.id) {
        return {
          ...issue,
          chat: [
            ...issue.chat,
            { sender: 'Depot Engineer', message: newMessage, date: 'Just now' }
          ]
        };
      }
      return issue;
    });
    
    setIssues(updatedIssues);
    setSelectedIssue({
      ...selectedIssue,
      chat: [
        ...selectedIssue.chat,
        { sender: 'Depot Engineer', message: newMessage, date: 'Just now' }
      ]
    });
    setNewMessage('');
  };

  const provideAdditionalInfo = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowInfoModal(true);
  };

  return (
    <div className="container-fluid mx-auto px-4">
      <div className="flex flex-col md:flex-row mt-4 gap-4">
        {/* Sidebar */}
       
        
        {/* Main Content */}
        <div className="w-full md:w-3/4">
          
          
          <button 
            className="w-2xl mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center justify-center"
            onClick={() => setShowNewIssueModal(true)}
          >
            <FaPlus className="mr-2" />Raise New Issue
          </button>
          
          {/* Tabs */}
          <div className="mb-4 border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px">
              <li className="mr-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'my-issues' ? 'text-blue-600 border-blue-600' : 'hover:text-gray-600 hover:border-gray-300'}`}
                  onClick={() => setActiveTab('my-issues')}
                >
                  My Raised Issues ({issues.length})
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'pending-info' ? 'text-blue-600 border-blue-600' : 'hover:text-gray-600 hover:border-gray-300'}`}
                  onClick={() => setActiveTab('pending-info')}
                >
                  Pending My Info ({issues.filter(i => i.status === 'pending-info').length})
                </button>
              </li>
            </ul>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'my-issues' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="col-span-1 md:col-span-2">
                  <input
                    type="text"
                    placeholder="Search issues..."
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="col-span-1">
                  <select className="w-full p-2 border border-gray-300 rounded">
                    <option>All Status</option>
                    <option>New</option>
                    <option>In Review</option>
                    <option>Resolved</option>
                    <option>Escalated</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <select className="w-full p-2 border border-gray-300 rounded">
                    <option>All Priority</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              
              {issues.map(issue => (
                <div 
                  key={issue.id} 
                  className={`bg-white p-4 mb-4 rounded-lg shadow ${issue.priority === 'high' ? 'border-l-4 border-red-500' : issue.priority === 'medium' ? 'border-l-4 border-yellow-500' : 'border-l-4 border-green-500'}`}
                >
                  <div className="flex justify-between items-start">
                    <h5 className="font-bold">{issue.id} - {issue.title}</h5>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Level 1 (RTO)</span>
                  </div>
                  <div className="flex items-center my-2">
                    {getStatusBadge(issue.status)}
                    <small className="text-gray-500 mr-3 flex items-center"><FaCalendarAlt className="mr-1" />{issue.date}</small>
                    <small className="text-gray-500 flex items-center"><FaClock className="mr-1" />{issue.lastUpdated}</small>
                  </div>
                  <p className="mb-3">{issue.description}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      {getPriorityBadge(issue.priority)}
                      <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded">{issue.category}</span>
                    </div>
                    <div>
                      <button 
                        className="text-blue-600 hover:text-blue-800 mr-2 p-2 rounded hover:bg-blue-50"
                        onClick={() => viewIssueDetails(issue)}
                      >
                        <FaEye className="inline mr-1" />View
                      </button>
                      <button 
                        className="text-gray-600 hover:text-gray-800 p-2 rounded hover:bg-gray-50"
                        onClick={() => toggleChat(issue.id)}
                      >
                        <FaComment className="inline mr-1" />Chat
                      </button>
                    </div>
                  </div>
                  
                  {/* Expandable Chat Box */}
                  {expandedChat === issue.id && (
                    <div className="mt-4 pt-4 border-t">
                      <h6 className="font-semibold mb-3">Conversation</h6>
                      <div className="mb-3 max-h-48 overflow-y-auto">
                        {issue.chat.map((msg, index) => (
                          <div 
                            key={index} 
                            className={`flex mb-3 ${msg.sender === 'Depot Engineer' ? '' : 'justify-end'}`}
                          >
                            {msg.sender === 'Depot Engineer' && (
                              <img src="https://via.placeholder.com/40" className="w-10 h-10 rounded-full mr-2" alt="User" />
                            )}
                            <div className={`${msg.sender === 'Depot Engineer' ? '' : 'text-right'}`}>
                              <div className={`p-3 rounded-lg ${msg.sender === 'Depot Engineer' ? 'bg-gray-100' : 'bg-blue-100 text-blue-800'}`}>
                                <strong>{msg.sender}:</strong> {msg.message}
                              </div>
                              <small className="text-gray-500 text-xs">{msg.date}</small>
                            </div>
                            {msg.sender !== 'Depot Engineer' && (
                              <img src="https://via.placeholder.com/40" className="w-10 h-10 rounded-full ml-2" alt="User" />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex">
                        <input
                          type="text"
                          placeholder="Type your message..."
                          className="flex-grow p-2 border border-gray-300 rounded-l"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button 
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-r"
                          onClick={sendMessage}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'pending-info' && (
            <div>
              {issues.filter(i => i.status === 'pending-info').map(issue => (
                <div key={issue.id} className="bg-white p-4 mb-4 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <h5 className="font-bold">{issue.id} - {issue.title}</h5>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Level 1 (RTO)</span>
                  </div>
                  <div className="flex items-center my-2">
                    {getStatusBadge(issue.status)}
                    <small className="text-gray-500 mr-3 flex items-center"><FaCalendarAlt className="mr-1" />{issue.date}</small>
                    <small className="text-gray-500 flex items-center"><FaClock className="mr-1" />{issue.lastUpdated}</small>
                  </div>
                  <p className="mb-3">RTO has requested additional information about this issue:</p>
                  <div className="bg-gray-50 p-3 mb-3 rounded">
                    <p><strong>RTO Request:</strong> {issue.infoRequest}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      {getPriorityBadge(issue.priority)}
                      <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded">{issue.category}</span>
                    </div>
                    <div>
                      <button 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                        onClick={() => provideAdditionalInfo(issue)}
                      >
                        <FaComment className="inline mr-1" />Respond
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Issue Detail Modal */}
      {showIssueModal && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Issue Details</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowIssueModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2">
                <h4 className="text-lg font-bold">#{selectedIssue.id} - {selectedIssue.title}</h4>
                <div className="flex items-center my-2">
                  {getStatusBadge(selectedIssue.status)}
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">Level 1 (RTO)</span>
                  <small className="text-gray-500 mr-3 flex items-center"><FaWarehouse className="mr-1" />{selectedIssue.depot}</small>
                  <small className="text-gray-500 flex items-center"><FaCalendarAlt className="mr-1" />{selectedIssue.date}</small>
                </div>
                <div className="my-3">
                  {getPriorityBadge(selectedIssue.priority)}
                  <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded">{selectedIssue.category}</span>
                </div>
                <p className="mb-3">{selectedIssue.description}</p>
                
                <h6 className="font-semibold mb-2">Attachments</h6>
                <div className="flex flex-wrap mb-4">
                  {selectedIssue.attachments.map((att, index) => (
                    <img key={index} src={att.url} className="w-24 h-24 object-cover rounded mr-2 mb-2 border" alt={att.alt} />
                  ))}
                </div>
                
                <h6 className="font-semibold mb-2">Escalation History</h6>
                <div className="mb-4">
                  {selectedIssue.history.map((item, index) => (
                    <div key={index} className="flex mb-3">
                      <div className="flex flex-col items-center mr-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        {index < selectedIssue.history.length - 1 && (
                          <div className="w-px h-8 bg-gray-300"></div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <strong>{item.action}</strong>
                          <small className="text-gray-500">{item.date}</small>
                        </div>
                        <p className="text-sm">{item.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <h6 className="font-semibold mb-2">Conversation</h6>
                <div className="mb-3 max-h-64 overflow-y-auto">
                  {selectedIssue.chat.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex mb-3 ${msg.sender === 'Depot Engineer' ? '' : 'justify-end'}`}
                    >
                      {msg.sender === 'Depot Engineer' && (
                        <img src="https://via.placeholder.com/40" className="w-10 h-10 rounded-full mr-2" alt="User" />
                      )}
                      <div className={`${msg.sender === 'Depot Engineer' ? '' : 'text-right'}`}>
                        <div className={`p-3 rounded-lg ${msg.sender === 'Depot Engineer' ? 'bg-gray-100' : 'bg-blue-100 text-blue-800'}`}>
                          <strong>{msg.sender}:</strong> {msg.message}
                        </div>
                        <small className="text-gray-500 text-xs">{msg.date}</small>
                      </div>
                      {msg.sender !== 'Depot Engineer' && (
                        <img src="https://via.placeholder.com/40" className="w-10 h-10 rounded-full ml-2" alt="User" />
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mb-3">
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded"
                    rows={3}
                    placeholder="Add your comment..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <div className="flex justify-between mt-2">
                    <button className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100">
                      <FaPaperclip />
                    </button>
                    <button 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                      onClick={sendMessage}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="col-span-1">
                <div className="bg-white rounded-lg shadow mb-4">
                  <div className="p-3 border-b">
                    <h6 className="font-semibold">Issue Actions</h6>
                  </div>
                  <div className="p-3">
                    {selectedIssue.status === 'pending-info' ? (
                      <button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-2"
                        onClick={() => provideAdditionalInfo(selectedIssue)}
                      >
                        <FaComment className="inline mr-1" />Respond to Info Request
                      </button>
                    ) : (
                      <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50">
                        <FaComment className="inline mr-1" />Add Comment
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow">
                  <div className="p-3 border-b">
                    <h6 className="font-semibold">Issue Details</h6>
                  </div>
                  <div className="p-3">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Raised By</td>
                          <td className="py-2">Depot Engineer</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Current Owner</td>
                          <td className="py-2">RTO (John Smith)</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Created</td>
                          <td className="py-2">{selectedIssue.date}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Last Updated</td>
                          <td className="py-2">{selectedIssue.lastUpdated}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Estimated Impact</td>
                          <td className="py-2">
                            {selectedIssue.priority === 'high' ? 'High - Full Depot Operations' : 
                             selectedIssue.priority === 'medium' ? 'Medium - Partial Operations Impact' : 
                             'Low - Minimal Impact'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
                onClick={() => setShowIssueModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* New Issue Modal */}
      {showNewIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Raise New Issue</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowNewIssueModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Brief description of the issue"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded"
                  rows={5}
                  placeholder="Detailed description of the issue"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select className="w-full p-2 border border-gray-300 rounded">
                    <option value="high">High (Critical Impact)</option>
                    <option value="medium" selected>Medium (Significant Impact)</option>
                    <option value="low">Low (Minor Impact)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select className="w-full p-2 border border-gray-300 rounded">
                    <option>Electrical</option>
                    <option>Mechanical</option>
                    <option>Network</option>
                    <option>Software</option>
                    <option>HVAC</option>
                    <option>Structural</option>
                    <option>Security</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Depot/Location</label>
                <select className="w-full p-2 border border-gray-300 rounded">
                  <option>Depot 1</option>
                  <option>Depot 2</option>
                  <option>Depot 3</option>
                  <option>Depot 4</option>
                  <option>Depot 5</option>
                  <option>Headquarters</option>
                  <option>Other Location</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Attachments</label>
                <input
                  type="file"
                  className="w-full p-2 border border-gray-300 rounded"
                  multiple
                />
                <p className="text-xs text-gray-500 mt-1">Upload photos, documents, or other files that might help resolve the issue</p>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded mr-2"
                onClick={() => setShowNewIssueModal(false)}
              >
                Cancel
              </button>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                onClick={() => setShowNewIssueModal(false)}
              >
                Submit Issue
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Additional Info Modal */}
      {showInfoModal && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Provide Additional Information</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowInfoModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Information Requested</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                  rows={3}
                  readOnly
                  value={selectedIssue.infoRequest || ''}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Your Response</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded"
                  rows={5}
                  placeholder="Provide the requested information here"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Additional Attachments</label>
                <input
                  type="file"
                  className="w-full p-2 border border-gray-300 rounded"
                  multiple
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded mr-2"
                onClick={() => setShowInfoModal(false)}
              >
                Cancel
              </button>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                onClick={() => setShowInfoModal(false)}
              >
                Submit Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepotEscalateissues;