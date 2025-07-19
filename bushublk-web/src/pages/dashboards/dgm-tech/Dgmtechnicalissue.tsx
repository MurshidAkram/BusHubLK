import { useState } from 'react';
import { 
  FaUserTie, 
  FaEye, 
  FaComment, 
  FaCheck, 
  FaArrowUp, 
  FaArrowDown,
  FaCalendarAlt, 
  FaClock, 
  FaWarehouse,
  FaPaperclip,
  FaTools,
  FaBolt,
  FaCarCrash,
  FaBus,
  FaOilCan,
  FaBatteryFull
} from 'react-icons/fa';

type Issue = {
  id: string;
  title: string;
  status: 'new' | 'in-review' | 'pending-info' | 'resolved' | 'escalated';
  region: string;
  depot: string;
  date: string;
  lastUpdated: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  attachments: { url: string; alt: string }[];
  history: { action: string; date: string; details: string }[];
  chat: { sender: string; message: string; date: string }[];
  raisedBy: string;
  escalatedBy?: string;
  busesAffected?: string[];
};

const Dgmtechnicalissues = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'escalated' | 'resolved'>('pending');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [expandedChat, setExpandedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const [issues, setIssues] = useState<Issue[]>([
    {
      id: 'BUS-2023-078',
      title: 'Engine Failure in Multiple Buses',
      status: 'in-review',
      region: 'Northern Region',
      depot: 'ND-04 (Delhi)',
      date: '1 day ago',
      lastUpdated: '12 hours ago',
      priority: 'high',
      category: 'Mechanical',
      description: 'Multiple buses (DL1PB 4321, DL1PB 4325, DL1PB 4328) experiencing complete engine failure. Initial diagnosis points to contaminated fuel batch.',
      attachments: [
        { url: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Engine', alt: 'Failed engine photo' }
      ],
      history: [
        { action: 'Raised by Depot Engineer', date: '1 day ago', details: 'Three buses broke down with similar symptoms' },
        { action: 'Escalated by RTO', date: '18 hours ago', details: 'Confirmed fuel contamination affecting multiple vehicles' }
      ],
      chat: [
        { sender: 'Depot Engineer (ND-04)', message: 'Bus DL1PB 4321 engine seized during morning route. Two more buses showing same symptoms.', date: '1 day ago' },
        { sender: 'RTO (Northern)', message: 'Fuel samples sent to lab. Suspect contaminated diesel from recent supply.', date: '18 hours ago' }
      ],
      raisedBy: 'Engineer Rajesh Kumar (ND-04)',
      escalatedBy: 'RTO Northern (Vikram Singh)',
      busesAffected: ['DL1PB 4321', 'DL1PB 4325', 'DL1PB 4328']
    },
    {
      id: 'BUS-2023-079',
      title: 'Brake System Recall',
      status: 'in-review',
      region: 'Western Region',
      depot: 'WD-02 (Mumbai)',
      date: '2 days ago',
      lastUpdated: '1 day ago',
      priority: 'high',
      category: 'Safety',
      description: 'Manufacturer recall notice for brake booster assemblies in Volvo 9400 buses (Registration series MH02CN 4000-4200). 15 buses affected in our depot.',
      attachments: [
        { url: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Recall', alt: 'Recall notice' },
        { url: 'https://via.placeholder.com/150/000000/FFFFFF?text=Brake', alt: 'Brake assembly diagram' }
      ],
      history: [
        { action: 'Raised by Depot Engineer', date: '2 days ago', details: 'Received manufacturer recall notice' },
        { action: 'Escalated by RTO', date: '1 day ago', details: 'Need approval for replacement parts order' }
      ],
      chat: [
        { sender: 'Depot Engineer (WD-02)', message: 'Volvo issued recall for brake boosters in 9400 model buses. Our depot has 15 affected vehicles.', date: '2 days ago' },
        { sender: 'RTO (Western)', message: 'Need DGM approval for ₹12 lakhs parts order and workshop scheduling.', date: '1 day ago' }
      ],
      raisedBy: 'Engineer Priya Sharma (WD-02)',
      escalatedBy: 'RTO Western (Amit Patel)',
      busesAffected: ['MH02CN 4001', 'MH02CN 4005', 'MH02CN 4010', 'MH02CN 4015', 'MH02CN 4020']
    },
    {
      id: 'BUS-2023-080',
      title: 'AC System Failure Fleet-wide',
      status: 'escalated',
      region: 'Southern Region',
      depot: 'SD-03 (Chennai)',
      date: '3 days ago',
      lastUpdated: '1 day ago',
      priority: 'high',
      category: 'HVAC',
      description: 'Complete failure of AC systems in 22 Tata Starbus Ultra buses. Outside temperature reaching 42°C making buses unusable.',
      attachments: [
        { url: 'https://via.placeholder.com/150/00FF00/FFFFFF?text=AC', alt: 'AC compressor failure' }
      ],
      history: [
        { action: 'Raised by Depot Engineer', date: '3 days ago', details: 'Multiple AC failures reported' },
        { action: 'Escalated by RTO', date: '2 days ago', details: 'Tata technicians unable to identify root cause' },
        { action: 'Escalated to CEO', date: '1 day ago', details: 'Requires manufacturer intervention and possible fleet replacement' }
      ],
      chat: [
        { sender: 'Depot Engineer (SD-03)', message: 'Passengers complaining of AC failure in hot weather. Multiple buses affected.', date: '3 days ago' },
        { sender: 'RTO (Southern)', message: 'Tata service center says this is a known design flaw in this batch.', date: '2 days ago' },
        { sender: 'DGM Technical', message: 'Escalating to CEO for manufacturer negotiations. This affects our service quality.', date: '1 day ago' }
      ],
      raisedBy: 'Engineer Arun Nair (SD-03)',
      escalatedBy: 'RTO Southern (Deepak Reddy)',
      busesAffected: ['TN09AB 1234', 'TN09AB 1235', 'TN09AB 1236', 'TN09AB 1237']
    },
    {
      id: 'BUS-2023-075',
      title: 'Battery Management System Update',
      status: 'resolved',
      region: 'Eastern Region',
      depot: 'ED-01 (Kolkata)',
      date: '2 weeks ago',
      lastUpdated: '3 days ago',
      priority: 'medium',
      category: 'Electrical',
      description: 'Mandatory software update required for battery management systems in all electric buses (Model: Olectra eBuzz) to prevent overheating issues.',
      attachments: [],
      history: [
        { action: 'Raised by Depot Engineer', date: '2 weeks ago', details: 'Manufacturer advisory received' },
        { action: 'Escalated by RTO', date: '10 days ago', details: 'Approved for depot-wide update' },
        { action: 'Resolved', date: '3 days ago', details: 'All 28 buses updated successfully' }
      ],
      chat: [
        { sender: 'Depot Engineer (ED-01)', message: 'Olectra issued critical update for BMS software after overheating incidents in other cities.', date: '2 weeks ago' },
        { sender: 'RTO (Eastern)', message: 'Approved update process. Need DGM to authorize downtime schedule.', date: '10 days ago' },
        { sender: 'DGM Technical', message: 'Authorized night shifts for updates to minimize service disruption.', date: '7 days ago' },
        { sender: 'Depot Engineer (ED-01)', message: 'All electric buses updated successfully. No issues reported.', date: '3 days ago' }
      ],
      raisedBy: 'Engineer Sanjay Gupta (ED-01)',
      escalatedBy: 'RTO Eastern (Rahul Banerjee)',
      busesAffected: ['WB05EF 1001-1028']
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

  const getCategoryIcon = (category: string) => {
    switch(category.toLowerCase()) {
      case 'electrical': return <FaBolt className="inline mr-1" />;
      case 'mechanical': return <FaTools className="inline mr-1" />;
      case 'safety': return <FaCarCrash className="inline mr-1" />;
      case 'hvac': return <FaBus className="inline mr-1" />;
      case 'battery': return <FaBatteryFull className="inline mr-1" />;
      default: return <FaTools className="inline mr-1" />;
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
            { sender: 'DGM Technical', message: newMessage, date: 'Just now' }
          ],
          lastUpdated: 'Just now'
        };
      }
      return issue;
    });
    
    setIssues(updatedIssues);
    setSelectedIssue({
      ...selectedIssue,
      chat: [
        ...selectedIssue.chat,
        { sender: 'DGM Technical', message: newMessage, date: 'Just now' }
      ],
      lastUpdated: 'Just now'
    });
    setNewMessage('');
  };

  const resolveIssue = (issueId: string) => {
    setIssues(issues.map(issue => 
      issue.id === issueId ? { ...issue, status: 'resolved', lastUpdated: 'Just now' } : issue
    ));
  };

  const escalateToCEO = (issueId: string) => {
    setIssues(issues.map(issue => 
      issue.id === issueId ? { ...issue, status: 'escalated', lastUpdated: 'Just now' } : issue
    ));
  };

  const sendBackToRTO = (issueId: string) => {
    setIssues(issues.map(issue => 
      issue.id === issueId ? { ...issue, status: 'in-review', lastUpdated: 'Just now' } : issue
    ));
  };

  return (
    <div className="container-fluid mx-auto px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">DGM Technical - Bus Fleet Issues</h2>
        <p className="text-gray-600">Bus technical issues escalated from Regional Technical Officers</p>
      </div>
      
      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'pending' ? 'text-blue-600 border-blue-600' : 'hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('pending')}
            >
              Escalated to Me ({issues.filter(i => i.status === 'in-review').length})
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'escalated' ? 'text-blue-600 border-blue-600' : 'hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('escalated')}
            >
              My Escalated ({issues.filter(i => i.status === 'escalated').length})
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'resolved' ? 'text-blue-600 border-blue-600' : 'hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('resolved')}
            >
              Resolved ({issues.filter(i => i.status === 'resolved').length})
            </button>
          </li>
        </ul>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'pending' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="col-span-1 md:col-span-2">
              <input
                type="text"
                placeholder="Search bus issues..."
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="col-span-1">
              <select className="w-full p-2 border border-gray-300 rounded">
                <option>All Priority</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div className="col-span-1">
              <select className="w-full p-2 border border-gray-300 rounded">
                <option>All Regions</option>
                <option>Northern</option>
                <option>Western</option>
                <option>Southern</option>
                <option>Eastern</option>
              </select>
            </div>
          </div>
          
          {issues.filter(i => i.status === 'in-review').map(issue => (
            <div 
              key={issue.id} 
              className={`bg-white p-4 mb-4 rounded-lg shadow ${issue.priority === 'high' ? 'border-l-4 border-red-500' : issue.priority === 'medium' ? 'border-l-4 border-yellow-500' : 'border-l-4 border-green-500'}`}
            >
              <div className="flex justify-between items-start">
                <h5 className="font-bold">{issue.id} - {issue.title}</h5>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Level 2 (DGM)</span>
              </div>
              <div className="flex items-center my-2">
                {getStatusBadge(issue.status)}
                <small className="text-gray-500 mr-3 flex items-center"><FaWarehouse className="mr-1" />{issue.region} - {issue.depot}</small>
                <small className="text-gray-500 mr-3 flex items-center"><FaCalendarAlt className="mr-1" />{issue.date}</small>
                <small className="text-gray-500 flex items-center"><FaClock className="mr-1" />{issue.lastUpdated}</small>
              </div>
              <p className="mb-3">{issue.description}</p>
              {issue.busesAffected && (
                <p className="text-sm text-gray-600 mb-3">
                  Buses Affected: {issue.busesAffected.length > 3 ? 
                    `${issue.busesAffected.slice(0, 3).join(', ')} + ${issue.busesAffected.length - 3} more` : 
                    issue.busesAffected.join(', ')}
                </p>
              )}
              {issue.escalatedBy && (
                <p className="text-sm text-gray-600 mb-3">Escalated by: {issue.escalatedBy}</p>
              )}
              <div className="flex justify-between items-center">
                <div>
                  {getPriorityBadge(issue.priority)}
                  <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded">
                    {getCategoryIcon(issue.category)}{issue.category}
                  </span>
                </div>
                <div>
                  <button 
                    className="text-blue-600 hover:text-blue-800 mr-2 p-2 rounded hover:bg-blue-50"
                    onClick={() => viewIssueDetails(issue)}
                  >
                    <FaEye className="inline mr-1" />View
                  </button>
                  <button 
                    className="text-gray-600 hover:text-gray-800 mr-2 p-2 rounded hover:bg-gray-50"
                    onClick={() => toggleChat(issue.id)}
                  >
                    <FaComment className="inline mr-1" />Chat
                  </button>
                  <button 
                    className="text-green-600 hover:text-green-800 mr-2 p-2 rounded hover:bg-green-50"
                    onClick={() => resolveIssue(issue.id)}
                  >
                    <FaCheck className="inline mr-1" />Resolve
                  </button>
                  <button 
                    className="text-yellow-600 hover:text-yellow-800 mr-2 p-2 rounded hover:bg-yellow-50"
                    onClick={() => escalateToCEO(issue.id)}
                  >
                    <FaArrowUp className="inline mr-1" />Escalate
                  </button>
                  <button 
                    className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                    onClick={() => sendBackToRTO(issue.id)}
                  >
                    <FaArrowDown className="inline mr-1" />Send Back
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
                        className={`flex mb-3 ${msg.sender === 'DGM Technical' ? 'justify-end' : ''}`}
                      >
                        {msg.sender !== 'DGM Technical' && (
                          <img src="https://via.placeholder.com/40" className="w-10 h-10 rounded-full mr-2" alt="User" />
                        )}
                        <div className={`${msg.sender === 'DGM Technical' ? 'text-right' : ''}`}>
                          <div className={`p-3 rounded-lg ${msg.sender === 'DGM Technical' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                            <strong>{msg.sender}:</strong> {msg.message}
                          </div>
                          <small className="text-gray-500 text-xs">{msg.date}</small>
                        </div>
                        {msg.sender === 'DGM Technical' && (
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
      
      {activeTab === 'escalated' && (
        <div>
          {issues.filter(i => i.status === 'escalated').map(issue => (
            <div key={issue.id} className="bg-white p-4 mb-4 rounded-lg shadow border-l-4 border-red-500">
              <div className="flex justify-between items-start">
                <h5 className="font-bold">{issue.id} - {issue.title}</h5>
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Escalated to CEO</span>
              </div>
              <div className="flex items-center my-2">
                {getStatusBadge(issue.status)}
                <small className="text-gray-500 mr-3 flex items-center"><FaWarehouse className="mr-1" />{issue.region} - {issue.depot}</small>
                <small className="text-gray-500 mr-3 flex items-center"><FaCalendarAlt className="mr-1" />{issue.date}</small>
                <small className="text-gray-500 flex items-center"><FaClock className="mr-1" />{issue.lastUpdated}</small>
              </div>
              <p className="mb-3">{issue.description}</p>
              {issue.busesAffected && (
                <p className="text-sm text-gray-600 mb-3">
                  Buses Affected: {issue.busesAffected.length > 3 ? 
                    `${issue.busesAffected.slice(0, 3).join(', ')} + ${issue.busesAffected.length - 3} more` : 
                    issue.busesAffected.join(', ')}
                </p>
              )}
              {issue.escalatedBy && (
                <p className="text-sm text-gray-600 mb-3">Escalated by: {issue.escalatedBy}</p>
              )}
              <div className="flex justify-between items-center">
                <div>
                  {getPriorityBadge(issue.priority)}
                  <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded">
                    {getCategoryIcon(issue.category)}{issue.category}
                  </span>
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
            </div>
          ))}
        </div>
      )}
      
      {activeTab === 'resolved' && (
        <div>
          {issues.filter(i => i.status === 'resolved').map(issue => (
            <div key={issue.id} className="bg-white p-4 mb-4 rounded-lg shadow border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <h5 className="font-bold">{issue.id} - {issue.title}</h5>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Resolved</span>
              </div>
              <div className="flex items-center my-2">
                {getStatusBadge(issue.status)}
                <small className="text-gray-500 mr-3 flex items-center"><FaWarehouse className="mr-1" />{issue.region} - {issue.depot}</small>
                <small className="text-gray-500 mr-3 flex items-center"><FaCalendarAlt className="mr-1" />{issue.date}</small>
                <small className="text-gray-500 flex items-center"><FaClock className="mr-1" />Resolved: {issue.lastUpdated}</small>
              </div>
              <p className="mb-3">{issue.description}</p>
              {issue.busesAffected && (
                <p className="text-sm text-gray-600 mb-3">
                  Buses Affected: {issue.busesAffected.length > 3 ? 
                    `${issue.busesAffected.slice(0, 3).join(', ')} + ${issue.busesAffected.length - 3} more` : 
                    issue.busesAffected.join(', ')}
                </p>
              )}
              {issue.escalatedBy && (
                <p className="text-sm text-gray-600 mb-3">Originally escalated by: {issue.escalatedBy}</p>
              )}
              <div className="flex justify-between items-center">
                <div>
                  {getPriorityBadge(issue.priority)}
                  <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded">
                    {getCategoryIcon(issue.category)}{issue.category}
                  </span>
                </div>
                <div>
                  <button 
                    className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                    onClick={() => viewIssueDetails(issue)}
                  >
                    <FaEye className="inline mr-1" />View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Issue Detail Modal */}
      {showIssueModal && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Bus Technical Issue Details</h3>
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
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">Level 2 (DGM)</span>
                  <small className="text-gray-500 mr-3 flex items-center"><FaWarehouse className="mr-1" />{selectedIssue.region} - {selectedIssue.depot}</small>
                  <small className="text-gray-500 flex items-center"><FaCalendarAlt className="mr-1" />{selectedIssue.date}</small>
                </div>
                <div className="my-3">
                  {getPriorityBadge(selectedIssue.priority)}
                  <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded">
                    {getCategoryIcon(selectedIssue.category)}{selectedIssue.category}
                  </span>
                </div>
                <p className="mb-3">{selectedIssue.description}</p>
                
                {selectedIssue.busesAffected && (
                  <div className="mb-3">
                    <h6 className="font-semibold mb-1">Buses Affected</h6>
                    <div className="flex flex-wrap gap-2">
                      {selectedIssue.busesAffected.map((bus, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded">
                          {bus}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedIssue.escalatedBy && (
                  <p className="text-sm text-gray-600 mb-3">Escalated by: {selectedIssue.escalatedBy}</p>
                )}
                
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
                      className={`flex mb-3 ${msg.sender === 'DGM Technical' ? 'justify-end' : ''}`}
                    >
                      {msg.sender !== 'DGM Technical' && (
                        <img src="https://via.placeholder.com/40" className="w-10 h-10 rounded-full mr-2" alt="User" />
                      )}
                      <div className={`${msg.sender === 'DGM Technical' ? 'text-right' : ''}`}>
                        <div className={`p-3 rounded-lg ${msg.sender === 'DGM Technical' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                          <strong>{msg.sender}:</strong> {msg.message}
                        </div>
                        <small className="text-gray-500 text-xs">{msg.date}</small>
                      </div>
                      {msg.sender === 'DGM Technical' && (
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
                  <div className="p-3 grid gap-2">
                    <button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center justify-center"
                      onClick={() => {
                        resolveIssue(selectedIssue.id);
                        setShowIssueModal(false);
                      }}
                    >
                      <FaCheck className="mr-2" />Resolve Issue
                    </button>
                    <button 
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded flex items-center justify-center"
                      onClick={() => {
                        escalateToCEO(selectedIssue.id);
                        setShowIssueModal(false);
                      }}
                    >
                      <FaArrowUp className="mr-2" />Escalate to CEO
                    </button>
                    <button 
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center justify-center"
                      onClick={() => {
                        sendBackToRTO(selectedIssue.id);
                        setShowIssueModal(false);
                      }}
                    >
                      <FaArrowDown className="mr-2" />Send Back to RTO
                    </button>
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
                          <td className="py-2">{selectedIssue.raisedBy}</td>
                        </tr>
                        {selectedIssue.escalatedBy && (
                          <tr className="border-b">
                            <td className="py-2 font-medium">Escalated By</td>
                            <td className="py-2">{selectedIssue.escalatedBy}</td>
                          </tr>
                        )}
                        <tr className="border-b">
                          <td className="py-2 font-medium">Current Owner</td>
                          <td className="py-2">DGM Technical</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Region/Depot</td>
                          <td className="py-2">{selectedIssue.region} - {selectedIssue.depot}</td>
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
                            {selectedIssue.priority === 'high' ? 'High - Service Disruption' : 
                             selectedIssue.priority === 'medium' ? 'Medium - Limited Service Impact' : 
                             'Low - Minimal Service Impact'}
                          </td>
                        </tr>
                        {selectedIssue.busesAffected && (
                          <tr className="border-b">
                            <td className="py-2 font-medium">Buses Affected</td>
                            <td className="py-2">{selectedIssue.busesAffected.length}</td>
                          </tr>
                        )}
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
    </div>
  );
};

export default Dgmtechnicalissues;