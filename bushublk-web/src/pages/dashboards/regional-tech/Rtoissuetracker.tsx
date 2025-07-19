import { useState } from 'react';
import { 
  FaEye, FaComment, FaCheck, FaArrowUp, FaInfoCircle, FaCalendarAlt, 
  FaClock, FaWarehouse, FaSearch, FaBus, FaMapPin, FaChartLine
} from 'react-icons/fa';

// Type definition for an Issue
type Issue = {
  id: string;
  title: string;
  status: 'new' | 'in-review' | 'pending-info' | 'resolved' | 'escalated';
  depot: string;
  busId: string;
  route: string;
  location: string;
  date: string;
  lastUpdated: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  attachments: { url: string; alt: string }[];
  history: { action: string; date: string; details: string; user: string }[];
  chat: { sender: string; message: string; date: string }[];
  raisedBy: string;
  raisedByRole: 'depot-engineer' | 'rto' | 'dgm-technical';
  escalationLevel: 'none' | 'depot' | 'dgm-technical';
  resolution?: string;
  partsUsed?: string[];
  repairDuration?: string;
  estimatedCost?: string;
  infoRequest?: string;
};

const RtoIssueTracker = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'escalated' | 'resolved'>('pending');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [expandedChat, setExpandedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDepot, setFilterDepot] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [issues, setIssues] = useState<Issue[]>([
    {
      id: 'IS-2025-045',
      title: 'Engine Overheating Issue',
      status: 'pending-info',
      depot: 'Depot 5',
      busId: 'NC-2847',
      route: 'Colombo-Kandy',
      location: 'En route near Kadugannawa',
      date: '2025-07-15',
      lastUpdated: '1 hour ago',
      priority: 'high',
      category: 'Engine',
      description: 'Bus NC-2847 reported engine overheating during trip. Temperature gauge showed critical levels, and driver stopped the bus to prevent damage.',
      attachments: [
        { url: 'https://placehold.co/150x100/ADD8E6/000000?text=Engine+Gauge', alt: 'Engine temperature gauge' }
      ],
      history: [
        { action: 'Issue Reported', date: '2025-07-15', details: 'Driver reported engine overheating', user: 'Driver' },
        { action: 'Escalated to RTO', date: '2025-07-15', details: 'Requires technical assessment beyond depot capabilities', user: 'Depot Engineer' }
      ],
      chat: [
        { sender: 'Driver', message: 'Engine temp hit 110°C around 9:15 AM.', date: '2025-07-15' },
        { sender: 'RTO', message: 'Please provide coolant levels and radiator condition details.', date: '2025-07-15' }
      ],
      raisedBy: 'Sunil Perera',
      raisedByRole: 'depot-engineer',
      escalationLevel: 'depot',
      infoRequest: 'Need coolant system details and radiator inspection photos'
    },
    {
      id: 'IS-2025-047',
      title: 'Brake System Malfunction',
      status: 'in-review',
      depot: 'Depot 2',
      busId: 'WP-5621',
      route: 'Colombo-Negombo',
      location: 'Depot Workshop',
      date: '2025-07-14',
      lastUpdated: '3 hours ago',
      priority: 'medium',
      category: 'Brakes',
      description: 'Brake system on bus WP-5621 shows delayed response. Driver reported spongy brake pedal during routine checks.',
      attachments: [],
      history: [
        { action: 'Issue Reported', date: '2025-07-14', details: 'Depot engineer identified brake system issue during inspection', user: 'Depot Engineer' },
        { action: 'Escalated to RTO', date: '2025-07-14', details: 'Requires specialized brake system diagnostics', user: 'Depot Manager' }
      ],
      chat: [
        { sender: 'Depot Engineer', message: 'Brake pedal feels soft, possible air in the lines.', date: '2025-07-14' }
      ],
      raisedBy: 'Kamal Silva',
      raisedByRole: 'depot-engineer',
      escalationLevel: 'depot'
    },
    {
      id: 'IS-2025-042',
      title: 'Electrical Fault in Lighting System',
      status: 'escalated',
      depot: 'Depot 3',
      busId: 'CP-3456',
      route: 'Kandy-Nuwara Eliya',
      location: 'Depot Yard',
      date: '2025-07-12',
      lastUpdated: '1 day ago',
      priority: 'medium',
      category: 'Electrical',
      description: 'Headlights and interior lights on bus CP-3456 flicker intermittently. Issue persists after initial depot checks.',
      attachments: [],
      history: [
        { action: 'Issue Reported', date: '2025-07-12', details: 'Driver reported flickering lights', user: 'Driver' },
        { action: 'Escalated to RTO', date: '2025-07-12', details: 'Initial wiring check inconclusive', user: 'Depot Engineer' },
        { action: 'Escalated to DGM', date: '2025-07-14', details: 'Requires advanced electrical diagnostics', user: 'RTO' }
      ],
      chat: [
        { sender: 'Driver', message: 'Headlights flicker during night operation.', date: '2025-07-12' },
        { sender: 'RTO', message: 'Wiring harness checked, no faults found. Need DGM input.', date: '2025-07-14' }
      ],
      raisedBy: 'Nimal Fernando',
      raisedByRole: 'depot-engineer',
      escalationLevel: 'dgm-technical'
    },
    {
      id: 'IS-2025-038',
      title: 'Transmission Gear Slippage',
      status: 'resolved',
      depot: 'Depot 1',
      busId: 'SG-7890',
      route: 'Colombo-Matara',
      location: 'Depot Workshop',
      date: '2025-07-08',
      lastUpdated: '2 days ago',
      priority: 'low',
      category: 'Transmission',
      description: 'Bus SG-7890 experienced gear slippage during shifts. Issue resolved after replacing transmission fluid and clutch plate.',
      attachments: [],
      history: [
        { action: 'Issue Reported', date: '2025-07-08', details: 'Driver reported gear slippage', user: 'Driver' },
        { action: 'Escalated to RTO', date: '2025-07-09', details: 'Depot assessment completed', user: 'Depot Engineer' },
        { action: 'Resolved', date: '2025-07-13', details: 'Transmission fluid and clutch plate replaced', user: 'RTO' }
      ],
      chat: [
        { sender: 'Driver', message: 'Bus struggles to shift gears smoothly.', date: '2025-07-08' },
        { sender: 'RTO', message: 'Technician dispatched to inspect transmission.', date: '2025-07-09' },
        { sender: 'RTO', message: 'Issue resolved after fluid and clutch replacement.', date: '2025-07-13' }
      ],
      raisedBy: 'Ajith Kumara',
      raisedByRole: 'depot-engineer',
      escalationLevel: 'depot',
      resolution: 'Replaced transmission fluid and clutch plate. Bus tested and functioning normally.',
      partsUsed: ['Transmission Fluid', 'Clutch Plate'],
      repairDuration: '3 hours',
      estimatedCost: 'Rs. 18,500'
    }
  ]);

  const categories = [
    'Engine', 'Brakes', 'Electrical', 'Transmission', 'Suspension',
    'Cooling', 'Hydraulics', 'Tires', 'Fuel System', 'Other'
  ];

  const uniqueDepots = Array.from(new Set(issues.map(issue => issue.depot)));

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

  const filterIssues = (issues: Issue[], tab: string) => {
    let filtered = issues;
    
    // Filter by tab
    switch(tab) {
      case 'pending':
        filtered = filtered.filter(issue => ['in-review', 'pending-info'].includes(issue.status));
        break;
      case 'escalated':
        filtered = filtered.filter(issue => issue.status === 'escalated');
        break;
      case 'resolved':
        filtered = filtered.filter(issue => issue.status === 'resolved');
        break;
    }
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(issue => 
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.busId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply other dropdown filters
    if (filterStatus !== 'all') {
      filtered = filtered.filter(issue => issue.status === filterStatus);
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(issue => issue.priority === filterPriority);
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(issue => issue.category === filterCategory);
    }

    if (filterDepot !== 'all') {
      filtered = filtered.filter(issue => issue.depot === filterDepot);
    }

    // Apply date range filter
    if (filterDateFrom) {
      filtered = filtered.filter(issue => new Date(issue.date) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      filtered = filtered.filter(issue => new Date(issue.date) <= new Date(filterDateTo));
    }
    
    return filtered;
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
            { sender: 'RTO', message: newMessage, date: 'Just now' }
          ],
          lastUpdated: 'Just now',
          history: [
            ...issue.history,
            { action: 'Comment Added', date: 'Just now', details: `New message added by RTO`, user: 'RTO' }
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
        { sender: 'RTO', message: newMessage, date: 'Just now' }
      ],
      lastUpdated: 'Just now'
    });
    setNewMessage('');
  };

  const resolveIssue = (issueId: string) => {
    setIssues(issues.map(issue => {
      if (issue.id === issueId) {
        return {
          ...issue,
          status: 'resolved',
          lastUpdated: 'Just now',
          history: [
            ...issue.history,
            { action: 'Issue Resolved', date: 'Just now', details: 'Issue marked as resolved by RTO', user: 'RTO' }
          ]
        };
      }
      return issue;
    }));
    setShowIssueModal(false);
  };

  const escalateToDGM = (issueId: string) => {
    setIssues(issues.map(issue => {
      if (issue.id === issueId) {
        return {
          ...issue,
          status: 'escalated',
          escalationLevel: 'dgm-technical',
          lastUpdated: 'Just now',
          history: [
            ...issue.history,
            { action: 'Escalated to DGM', date: 'Just now', details: 'Issue escalated to DGM Technical by RTO', user: 'RTO' }
          ]
        };
      }
      return issue;
    }));
    setShowIssueModal(false);
  };

  const requestMoreInfo = (issueId: string) => {
    setIssues(issues.map(issue => {
      if (issue.id === issueId) {
        return {
          ...issue,
          status: 'pending-info',
          lastUpdated: 'Just now',
          history: [
            ...issue.history,
            { action: 'Info Requested', date: 'Just now', details: 'Additional information requested from depot', user: 'RTO' }
          ]
        };
      }
      return issue;
    }));
    setShowIssueModal(false);
  };

  const getTabCount = (tab: string) => {
    return filterIssues(issues, tab).length;
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
      <div className="container mx-auto px-4 py-8">
        {/* Main Content Area */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">RTO Issue Tracker</h2>
            {/* Quick Actions Panel */}
            <div className="flex flex-wrap gap-3">
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg flex items-center justify-center text-sm">
                <FaChartLine className="mr-2" />Generate Reports
              </button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="bg-gray-50 p-5 rounded-lg shadow-inner mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ID, Title, Bus ID, Description..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="in-review">In Review</option>
                <option value="pending-info">Pending Info</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
              <select 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={filterDepot}
                onChange={(e) => setFilterDepot(e.target.value)}
              >
                <option value="all">All Depots</option>
                {uniqueDepots.map(depot => (
                  <option key={depot} value={depot}>{depot}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  id="dateFrom"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
                <span className="text-gray-500">-</span>
                <input
                  type="date"
                  id="dateTo"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
              <li className="mr-2" role="presentation">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition duration-200 ease-in-out ${activeTab === 'pending' ? 'text-blue-600 border-blue-600 active' : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'}`}
                  onClick={() => setActiveTab('pending')}
                  role="tab"
                  aria-selected={activeTab === 'pending'}
                >
                  Pending Issues ({getTabCount('pending')})
                </button>
              </li>
              <li className="mr-2" role="presentation">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition duration-200 ease-in-out ${activeTab === 'escalated' ? 'text-blue-600 border-blue-600 active' : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'}`}
                  onClick={() => setActiveTab('escalated')}
                  role="tab"
                  aria-selected={activeTab === 'escalated'}
                >
                  Escalated Issues ({getTabCount('escalated')})
                </button>
              </li>
              <li className="mr-2" role="presentation">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition duration-200 ease-in-out ${activeTab === 'resolved' ? 'text-blue-600 border-blue-600 active' : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'}`}
                  onClick={() => setActiveTab('resolved')}
                  role="tab"
                  aria-selected={activeTab === 'resolved'}
                >
                  Resolved Issues ({getTabCount('resolved')})
                </button>
              </li>
            </ul>
          </div>
          
          {/* Issues List */}
          <div>
            {filterIssues(issues, activeTab).length === 0 ? (
              <p className="text-center text-gray-600 text-lg py-10">No issues found for this view or filters.</p>
            ) : (
              filterIssues(issues, activeTab).map(issue => (
                <div 
                  key={issue.id} 
                  className={`bg-white p-6 mb-4 rounded-xl shadow-md transition-all duration-300 ease-in-out ${
                    issue.priority === 'high' ? 'border-l-4 border-red-500' : 
                    issue.priority === 'medium' ? 'border-l-4 border-yellow-500' : 
                    'border-l-4 border-green-500'
                  } hover:shadow-lg`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                    <div className="flex-1 mb-2 sm:mb-0">
                      <h5 className="font-bold text-xl text-gray-800">{issue.id} - {issue.title}</h5>
                      <div className="flex flex-wrap items-center mt-1 text-sm text-gray-600 gap-x-3 gap-y-1">
                        <span className="flex items-center"><FaWarehouse className="mr-1 text-blue-500" />{issue.depot}</span>
                        <span className="flex items-center"><FaBus className="mr-1 text-purple-500" />{issue.busId}</span>
                        <span className="flex items-center"><FaMapPin className="mr-1 text-green-500" />{issue.route}</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                      {getPriorityBadge(issue.priority)}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center mb-3 gap-x-3 gap-y-1">
                    {getStatusBadge(issue.status)}
                    <span className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full font-medium">{issue.category}</span>
                    <small className="text-gray-500 flex items-center"><FaCalendarAlt className="mr-1" />Reported: {issue.date}</small>
                    <small className="text-gray-500 flex items-center"><FaClock className="mr-1" />Updated: {issue.lastUpdated}</small>
                  </div>
                  
                  <p className="mb-4 text-gray-700 line-clamp-2">{issue.description}</p>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                      <button 
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition duration-200 ease-in-out flex items-center text-sm font-medium"
                        onClick={() => viewIssueDetails(issue)}
                      >
                        <FaEye className="mr-1" />View Details
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50 transition duration-200 ease-in-out flex items-center text-sm font-medium"
                        onClick={() => toggleChat(issue.id)}
                      >
                        <FaComment className="mr-1" />Chat ({issue.chat.length})
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {issue.status === 'in-review' && (
                        <button 
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition duration-200 ease-in-out"
                          onClick={() => resolveIssue(issue.id)}
                        >
                          Resolve
                        </button>
                      )}
                      {issue.status === 'pending-info' && (
                        <button 
                          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition duration-200 ease-in-out"
                          onClick={() => requestMoreInfo(issue.id)}
                        >
                          Request Info
                        </button>
                      )}
                      {!['escalated', 'resolved'].includes(issue.status) && (
                        <button 
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition duration-200 ease-in-out flex items-center"
                          onClick={() => escalateToDGM(issue.id)}
                        >
                          <FaArrowUp className="mr-1" />Escalate to DGM
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Expandable Chat Box */}
                  {expandedChat === issue.id && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h6 className="font-semibold text-lg text-gray-800 mb-4">Communication Log</h6>
                      <div className="mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {issue.chat.map((msg, index) => (
                          <div 
                            key={index} 
                            className={`flex mb-3 ${msg.sender === 'RTO' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] px-4 py-2 rounded-lg shadow-sm ${msg.sender === 'RTO' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                              <div className="font-semibold text-sm mb-1">{msg.sender}</div>
                              <div className="text-sm">{msg.message}</div>
                              <div className="text-xs mt-1 opacity-80">{msg.date}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex">
                        <input
                          type="text"
                          placeholder="Type your message..."
                          className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button 
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-r-lg font-semibold transition duration-200 ease-in-out" 
                          onClick={sendMessage} 
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Issue Detail Modal */}
      {showIssueModal && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto transform transition-all scale-100 opacity-100">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  {selectedIssue.id} - {selectedIssue.title}
                  <span className="ml-4">{getStatusBadge(selectedIssue.status)}</span>
                </h3>
                <button 
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition duration-200"
                  onClick={() => setShowIssueModal(false)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Basic Information */}
                <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg shadow-inner">
                  <h4 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">Basic Information</h4>
                  <div className="space-y-2 text-gray-700 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Category:</span>
                      <span>{selectedIssue.category}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Priority:</span>
                      <span>{getPriorityBadge(selectedIssue.priority)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Reported Date:</span>
                      <span>{selectedIssue.date}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Last Updated:</span>
                      <span>{selectedIssue.lastUpdated}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Escalation Level:</span>
                      <span className="capitalize">{selectedIssue.escalationLevel.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Depot Information */}
                <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg shadow-inner">
                  <h4 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">Depot Information</h4>
                  <div className="space-y-2 text-gray-700 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Depot:</span>
                      <span>{selectedIssue.depot}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Bus ID:</span>
                      <span>{selectedIssue.busId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Route:</span>
                      <span>{selectedIssue.route}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Location:</span>
                      <span>{selectedIssue.location}</span>
                    </div>
                  </div>
                </div>

                {/* Reporter Details */}
                <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg shadow-inner">
                  <h4 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">Reporter Details</h4>
                  <div className="space-y-2 text-gray-700 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Name:</span>
                      <span>{selectedIssue.raisedBy}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Role:</span>
                      <span className="capitalize">{selectedIssue.raisedByRole.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
                <h4 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">Description</h4>
                <p className="text-gray-700 text-base">{selectedIssue.description}</p>
              </div>

              {/* Attachments */}
              {selectedIssue.attachments.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
                  <h4 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">Attachments</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedIssue.attachments.map((attach, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <img 
                          src={attach.url} 
                          alt={attach.alt} 
                          className="w-full h-32 object-cover"
                          onError={(e) => { e.currentTarget.src = `https://placehold.co/150x100/CCCCCC/333333?text=Image+Error`; e.currentTarget.alt = "Image failed to load"; }}
                        />
                        <p className="text-xs text-gray-600 p-2 truncate">{attach.alt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution & Cost Tracking */}
              {selectedIssue.status === 'resolved' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                    <h4 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">Resolution Details</h4>
                    <div className="space-y-2 text-gray-700 text-sm">
                      {selectedIssue.resolution && (
                        <div>
                          <span className="font-medium">Resolution:</span>
                          <p className="mt-1 text-gray-700">{selectedIssue.resolution}</p>
                        </div>
                      )}
                      {selectedIssue.partsUsed && selectedIssue.partsUsed.length > 0 && (
                        <div>
                          <span className="font-medium">Parts Used:</span>
                          <ul className="list-disc list-inside ml-2">
                            {selectedIssue.partsUsed.map((part, index) => (
                              <li key={index}>{part}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedIssue.repairDuration && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Repair Duration:</span>
                          <span>{selectedIssue.repairDuration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                    <h4 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">Cost Tracking</h4>
                    <div className="space-y-2 text-gray-700 text-sm">
                      {selectedIssue.estimatedCost && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Estimated Cost:</span>
                          <span>{selectedIssue.estimatedCost}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* History Log */}
              <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
                <h4 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">History Log</h4>
                <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {selectedIssue.history.map((entry, index) => (
                    <div key={index} className="mb-2 text-sm text-gray-700">
                      <span className="font-medium">{entry.date}:</span> {entry.action} by {entry.user} - <span className="text-gray-600">{entry.details}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                {!['escalated', 'resolved'].includes(selectedIssue.status) && (
                  <>           
                  {selectedIssue.status === 'in-review' && (
                    <button 
                      className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition duration-200 ease-in-out"
                      onClick={() => {
                        resolveIssue(selectedIssue.id);
                        setShowIssueModal(false);
                      }}
                    >
                      <FaCheck className="inline mr-1" /> Mark as Resolved
                    </button>
                  )}
                  {selectedIssue.status === 'pending-info' && (
                    <button 
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition duration-200 ease-in-out"
                      onClick={() => {
                        requestMoreInfo(selectedIssue.id);
                        setShowIssueModal(false);
                      }}
                    >
                      <FaInfoCircle className="inline mr-1" /> Request More Info
                    </button>
                  )}
                  <button 
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition duration-200 ease-in-out flex items-center"
                    onClick={() => {
                      escalateToDGM(selectedIssue.id);
                      setShowIssueModal(false);
                    }}
                  >
                    <FaArrowUp className="mr-1" /> Escalate to DGM
                  </button>
                </>
              )}
              <button 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition duration-200 ease-in-out"
                onClick={() => setShowIssueModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default RtoIssueTracker;