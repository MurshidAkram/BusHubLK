import { useState } from 'react';
import { 
  FaHardHat, FaEye, FaComment, FaPlus, FaPaperclip, FaCalendarAlt, 
  FaClock, FaWarehouse, FaBus, FaTools, FaPhone, FaUser, FaMapPin,
  FaExclamationTriangle, FaCheckCircle, FaArrowUp, FaFilter,
  FaSearch, FaChartLine, FaCog, FaWrench, FaClipboardList, FaUsers, FaDollarSign
} from 'react-icons/fa';

// Type definition for an Issue
type Issue = {
  id: string;
  title: string;
  status: 'reported' | 'assessed' | 'parts-ordered' | 'in-repair' | 'testing' | 'resolved' | 'escalated';
  busId: string;
  route: string;
  location: string;
  reportedBy: 'driver' | 'conductor' | 'depot-engineer' | 'rto';
  driverName: string;
  driverContact: string;
  date: string; // Date reported
  lastUpdated: string; // Last time the issue was updated
  priority: 'high' | 'medium' | 'low';
  urgencyLevel: 'immediate' | 'same-day' | 'next-maintenance';
  category: string;
  description: string;
  assignedTo: string; // Who is assigned to fix it
  attachments: { url: string; alt: string }[];
  history: { action: string; date: string; details: string; user: string }[];
  chat: { sender: string; message: string; date: string }[];
  escalationLevel: 'none' | 'rto' | 'dgm-technical';
  resolution?: string; // Description of how it was resolved
  partsUsed?: string[]; // List of parts used for repair
  repairDuration?: string; // How long the repair took
  estimatedCost?: string; // Estimated cost of repair
  infoRequest?: string; // Any information requested from reporter
  mileage?: number; // Bus mileage at time of report
  lastServiceDate?: string; // Last service date of the bus
};

const DepotEngineerIssueTracker = () => {
  // State for active tab in the main navigation
  const [activeTab, setActiveTab] = useState<'queue' | 'in-progress' | 'escalated' | 'resolved'>('queue');
  // State to control visibility of the issue detail modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  // State to control visibility of the new issue creation modal
  const [showNewIssueModal, setShowNewIssueModal] = useState(false);
  // State to control visibility of a generic info modal (currently unused, but kept from original)
  const [showInfoModal, setShowInfoModal] = useState(false);
  // State to track which issue's chat is expanded
  const [expandedChat, setExpandedChat] = useState<string | null>(null);
  // State for the new message input in the chat
  const [newMessage, setNewMessage] = useState('');
  // State to hold the currently selected issue for detail view
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  // State for the search term
  const [searchTerm, setSearchTerm] = useState('');
  // States for filter dropdowns
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBusId, setFilterBusId] = useState('all');
  const [filterRoute, setFilterRoute] = useState('all');
  const [filterReporter, setFilterReporter] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Initial dummy data for issues
  const [issues, setIssues] = useState<Issue[]>([
    {
      id: 'IS-2025-001',
      title: 'Engine Overheating',
      status: 'reported',
      busId: 'NC-2847',
      route: 'Colombo-Kandy',
      location: 'Kegalle Bus Stand',
      reportedBy: 'driver',
      driverName: 'Sunil Perera',
      driverContact: '+94771234567',
      date: '2025-07-15', // Changed to YYYY-MM-DD for date filtering
      lastUpdated: '2 hours ago',
      priority: 'high',
      urgencyLevel: 'immediate',
      category: 'Engine',
      description: 'Engine temperature gauge showing critical levels. Steam coming from radiator. Passengers evacuated for safety.',
      assignedTo: 'Depot Engineer',
      attachments: [
        { url: 'https://placehold.co/150x100/ADD8E6/000000?text=Temp+Gauge', alt: 'Engine temperature gauge' },
        { url: 'https://placehold.co/150x100/ADD8E6/000000?text=Steam+from+Radiator', alt: 'Steam from radiator' }
      ],
      history: [
        { action: 'Issue Reported', date: '2025-07-15', details: 'Driver reported engine overheating', user: 'Sunil Perera' }
      ],
      chat: [
        { sender: 'Sunil Perera', message: 'Engine temperature suddenly spiked to red zone. Had to pull over immediately. Passengers are safe but bus cannot continue.', date: '2025-07-15' },
        { sender: 'Depot Engineer', message: 'Understood. Sending a recovery team and assessing the situation for immediate repair.', date: '2025-07-15' }
      ],
      escalationLevel: 'none',
      mileage: 150000,
      lastServiceDate: '2025-06-01',
      infoRequest: 'Please confirm exact location and if any fluid leaks are visible.'
    },
    {
      id: 'IS-2025-002',
      title: 'Brake Pedal Soft',
      status: 'in-repair',
      busId: 'WP-5621',
      route: 'Colombo-Negombo',
      location: 'Depot Workshop',
      reportedBy: 'driver',
      driverName: 'Kamal Silva',
      driverContact: '+94771234568',
      date: '2025-07-14',
      lastUpdated: '30 minutes ago',
      priority: 'high',
      urgencyLevel: 'same-day',
      category: 'Brakes',
      description: 'Brake pedal goes almost to floor. Reduced braking effectiveness. Safety concern.',
      assignedTo: 'Mechanic Ravi',
      attachments: [],
      history: [
        { action: 'Issue Reported', date: '2025-07-14', details: 'Driver reported brake issues', user: 'Kamal Silva' },
        { action: 'Assessed', date: '2025-07-14', details: 'Confirmed brake master cylinder failure', user: 'Depot Engineer' },
        { action: 'Parts Ordered', date: '2025-07-14', details: 'Brake master cylinder and fluid ordered', user: 'Depot Engineer' },
        { action: 'Repair Started', date: '2025-07-15', details: 'Mechanic began brake system repair', user: 'Mechanic Ravi' }
      ],
      chat: [
        { sender: 'Kamal Silva', message: 'Brake pedal feels spongy and goes to floor. Very dangerous condition.', date: '2025-07-14' },
        { sender: 'Depot Engineer', message: 'Bus removed from service immediately. Brake master cylinder needs replacement. Parts ordered.', date: '2025-07-14' },
  
      ],
      escalationLevel: 'none',
      partsUsed: ['Brake Master Cylinder', 'Brake Fluid'],
      estimatedCost: 'Rs. 15,000',
      repairDuration: '4 hours',
      mileage: 210000,
      lastServiceDate: '2025-05-10'
    },
    {
      id: 'IS-2025-003',
      title: 'Transmission Issues',
      status: 'escalated',
      busId: 'CP-3456',
      route: 'Kandy-Nuwara Eliya',
      location: 'Depot Workshop',
      reportedBy: 'driver',
      driverName: 'Nimal Fernando',
      driverContact: '+94771234569',
      date: '2025-07-12',
      lastUpdated: '1 hour ago',
      priority: 'medium',
      urgencyLevel: 'next-maintenance',
      category: 'Transmission',
      description: 'Gears slipping, difficulty shifting. Requires specialist diagnosis.',
      assignedTo: 'RTO Technical Team',
      attachments: [
        { url: 'https://placehold.co/150x100/D8BFD8/000000?text=Transmission+Fluid', alt: 'Transmission fluid check' }
      ],
      history: [
        { action: 'Issue Reported', date: '2025-07-12', details: 'Driver reported transmission problems', user: 'Nimal Fernando' },
        { action: 'Assessed', date: '2025-07-12', details: 'Initial diagnosis completed', user: 'Depot Engineer' },
        { action: 'Escalated to RTO', date: '2025-07-15', details: 'Complex transmission issue requires specialist', user: 'Depot Engineer' }
      ],
      chat: [
        { sender: 'Nimal Fernando', message: 'Gears are slipping especially on uphill climbs. Difficult to shift from 2nd to 3rd gear.', date: '2025-07-12' },
        { sender: 'Depot Engineer', message: 'Initial checks complete. This needs transmission specialist from RTO team. Escalated.', date: '2025-07-15' }
      ],
      escalationLevel: 'rto',
      mileage: 180000,
      lastServiceDate: '2025-06-20'
    },
    {
      id: 'IS-2025-004',
      title: 'Air Conditioning Failure',
      status: 'resolved',
      busId: 'SG-7890',
      route: 'Colombo-Matara',
      location: 'Depot Workshop',
      reportedBy: 'driver',
      driverName: 'Ajith Kumara',
      driverContact: '+94771234570',
      date: '2025-07-08',
      lastUpdated: '2 days ago',
      priority: 'low',
      urgencyLevel: 'next-maintenance',
      category: 'HVAC',
      description: 'Air conditioning system not cooling properly. Compressor issues suspected.',
      assignedTo: 'depot engineer',
      attachments: [],
      history: [
        { action: 'Issue Reported', date: '2025-07-08', details: 'Conductor reported AC issues', user: 'Ajith Kumara' },
        { action: 'Assessed', date: '2025-07-09', details: 'Compressor belt replacement needed', user: 'Depot Engineer' },
        { action: 'Repair Completed', date: '2025-07-13', details: 'New compressor belt installed and tested', user: 'Mechanic Prasad' }
      ],
      chat: [
        { sender: 'Ajith Kumara', message: 'AC not working properly. Passengers complaining about heat.', date: '2025-07-08' },
        { sender: 'Depot Engineer', message: 'Compressor belt is worn out. Replacement scheduled.', date: '2025-07-09' },
        { sender: 'Depot Engineer', message: 'Resolution confirmed with driver. Issue closed.', date: '2025-07-13' }
      ],
      escalationLevel: 'none',
      resolution: 'Compressor belt replaced. AC system tested and functioning normally.',
      partsUsed: ['Compressor Belt', 'AC Oil'],
      repairDuration: '2 hours',
      estimatedCost: 'Rs. 8,000',
      mileage: 120000,
      lastServiceDate: '2025-04-15'
    }
  ]);

  // Define the available categories for issues
  const categories = [
    'Engine', 'Transmission', 'Brakes', 'Electrical', 'Suspension',
    'Steering', 'Cooling System', 'Fuel System', 'Hydraulics', 'HVAC', 'Body/Interior'
  ];

  // Extract unique bus IDs and routes for filter options
  const uniqueBusIds = Array.from(new Set(issues.map(issue => issue.busId)));
  const uniqueRoutes = Array.from(new Set(issues.map(issue => issue.route)));
  const uniqueReporters = Array.from(new Set(issues.map(issue => issue.reportedBy)));
  const uniqueUrgencyLevels = Array.from(new Set(issues.map(issue => issue.urgencyLevel)));

  // Helper function to get status badge styling
  const getStatusBadge = (status: Issue['status']) => {
    const baseClasses = "text-xs font-medium me-2 px-2.5 py-0.5 rounded";
    switch(status) {
      case 'reported': return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Reported</span>;
      case 'assessed': return <span className={`${baseClasses} bg-purple-100 text-purple-800`}>Assessed</span>;
      case 'parts-ordered': return <span className={`${baseClasses} bg-orange-100 text-orange-800`}>Parts Ordered</span>;
      case 'in-repair': return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>In Repair</span>;
      case 'testing': return <span className={`${baseClasses} bg-cyan-100 text-cyan-800`}>Testing</span>;
      case 'resolved': return <span className={`${baseClasses} bg-green-100 text-green-800`}>Resolved</span>;
      case 'escalated': return <span className={`${baseClasses} bg-red-100 text-red-800`}>Escalated</span>;
      default: return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>;
    }
  };

  // Helper function to get priority badge styling
  const getPriorityBadge = (priority: Issue['priority']) => {
    const baseClasses = "text-xs font-medium me-1 px-2.5 py-0.5 rounded";
    switch(priority) {
      case 'high': return <span className={`${baseClasses} bg-red-100 text-red-800`}>High</span>;
      case 'medium': return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Medium</span>;
      case 'low': return <span className={`${baseClasses} bg-green-100 text-green-800`}>Low</span>;
      default: return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>;
    }
  };

  // Helper function to get urgency badge styling
  const getUrgencyBadge = (urgency: Issue['urgencyLevel']) => {
    const baseClasses = "text-xs font-medium me-1 px-2.5 py-0.5 rounded";
    switch(urgency) {
      case 'immediate': return <span className={`${baseClasses} bg-red-200 text-red-900`}>Immediate</span>;
      case 'same-day': return <span className={`${baseClasses} bg-orange-200 text-orange-900`}>Same Day</span>;
      case 'next-maintenance': return <span className={`${baseClasses} bg-blue-200 text-blue-900`}>Next Maintenance</span>;
      default: return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>;
    }
  };

  // Function to filter issues based on current tab and filter criteria
  const filterIssues = (issues: Issue[], tab: string) => {
    let filtered = issues;
    
    // Filter by tab
    switch(tab) {
      case 'queue':
        filtered = filtered.filter(issue => ['reported', 'assessed'].includes(issue.status));
        break;
      case 'in-progress':
        filtered = filtered.filter(issue => ['parts-ordered', 'in-repair', 'testing'].includes(issue.status));
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

    if (filterBusId !== 'all') {
      filtered = filtered.filter(issue => issue.busId === filterBusId);
    }

    if (filterRoute !== 'all') {
      filtered = filtered.filter(issue => issue.route === filterRoute);
    }

    if (filterReporter !== 'all') {
      filtered = filtered.filter(issue => issue.reportedBy === filterReporter);
    }

    if (filterUrgency !== 'all') {
      filtered = filtered.filter(issue => issue.urgencyLevel === filterUrgency);
    }

    // Apply date range filter (basic implementation)
    if (filterDateFrom) {
      filtered = filtered.filter(issue => new Date(issue.date) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      filtered = filtered.filter(issue => new Date(issue.date) <= new Date(filterDateTo));
    }
    
    return filtered;
  };

  // Function to update an issue's status
  const updateIssueStatus = (issueId: string, newStatus: Issue['status']) => {
    setIssues(issues.map(issue => {
      if (issue.id === issueId) {
        return {
          ...issue,
          status: newStatus,
          lastUpdated: 'Just now',
          history: [
            ...issue.history,
            { action: `Status changed to ${newStatus}`, date: 'Just now', details: `Status updated to ${newStatus} by depot engineer`, user: 'Depot Engineer' }
          ]
        };
      }
      return issue;
    }));
    // Close modal if status changes to resolved or escalated
    if (newStatus === 'resolved' || newStatus === 'escalated') {
      setShowIssueModal(false);
    }
  };

  // Function to view details of a specific issue
  const viewIssueDetails = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowIssueModal(true);
  };

  // Function to toggle the visibility of an issue's chat box
  const toggleChat = (issueId: string) => {
    setExpandedChat(expandedChat === issueId ? null : issueId);
  };

  // Function to send a new message in the chat
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

  // Function to escalate an issue
  const escalateIssue = (issueId: string, level: Issue['escalationLevel']) => {
    updateIssueStatus(issueId, 'escalated'); // First update status
    setIssues(issues.map(issue => {
      if (issue.id === issueId) {
        return {
          ...issue,
          escalationLevel: level,
          assignedTo: level === 'rto' ? 'RTO Technical Team' : 'DGM Technical Team',
          history: [
            ...issue.history,
            { action: `Issue escalated to ${level}`, date: 'Just now', details: `Issue escalated to ${level} by depot engineer`, user: 'Depot Engineer' }
          ]
        };
      }
      return issue;
    }));
  };

  // Function to get the count of issues for a given tab
  const getTabCount = (tab: string) => {
    return filterIssues(issues, tab).length;
  };

  // Function to add a new issue
  const addNewIssue = (newIssueData: Omit<Issue, 'id' | 'lastUpdated' | 'history' | 'chat' | 'escalationLevel' | 'attachments'>) => {
    const newIssue: Issue = {
      id: `IS-${new Date().getFullYear()}-${String(issues.length + 1).padStart(3, '0')}`,
      lastUpdated: 'Just now',
      history: [{ action: 'Issue Reported', date: 'Just now', details: 'New issue created', user: 'Depot Engineer' }],
      chat: [{ sender: newIssueData.reportedBy === 'depot-engineer' ? 'Depot Engineer' : newIssueData.driverName, message: newIssueData.description, date: 'Just now' }],
      escalationLevel: 'none',
      attachments: [], // New issues start with no attachments
      ...newIssueData,
    };
    setIssues([...issues, newIssue]);
    setShowNewIssueModal(false);
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
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center justify-center mb-4 md:mb-0 md:mr-4"
              onClick={() => setShowNewIssueModal(true)}
            >
              <FaPlus className="mr-2" />Create New Issue
            </button>
            {/* Quick Actions Panel */}
           
          </div>
          
          {/* Search and Filters */}
          <div className="bg-gray-50 p-5 rounded-lg shadow-inner mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                value={filterBusId}
                onChange={(e) => setFilterBusId(e.target.value)}
              >
                <option value="all">All Bus IDs</option>
                {uniqueBusIds.map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
              <select 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={filterRoute}
                onChange={(e) => setFilterRoute(e.target.value)}
              >
                <option value="all">All Routes</option>
                {uniqueRoutes.map(route => (
                  <option key={route} value={route}>{route}</option>
                ))}
              </select>
              
              {/* <select 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
              >
                <option value="all">All Urgency Levels</option>
                {uniqueUrgencyLevels.map(urgency => (
                  <option key={urgency} value={urgency}>{urgency.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</option>
                ))}
              </select> */}
              {/* <div className="flex items-center gap-2">
                <label htmlFor="dateFrom" className="sr-only">Date From</label>
                <input
                  type="date"
                  id="dateFrom"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
                <span className="text-gray-500">-</span>
                <label htmlFor="dateTo" className="sr-only">Date To</label>
                <input
                  type="date"
                  id="dateTo"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div> */}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
              <li className="mr-2" role="presentation">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition duration-200 ease-in-out ${activeTab === 'queue' ? 'text-blue-600 border-blue-600 active' : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'}`}
                  onClick={() => setActiveTab('queue')}
                  role="tab"
                  aria-selected={activeTab === 'queue'}
                >
                  Issue Queue ({getTabCount('queue')})
                </button>
              </li>
              <li className="mr-2" role="presentation">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition duration-200 ease-in-out ${activeTab === 'in-progress' ? 'text-blue-600 border-blue-600 active' : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'}`}
                  onClick={() => setActiveTab('in-progress')}
                  role="tab"
                  aria-selected={activeTab === 'in-progress'}
                >
                  In Progress ({getTabCount('in-progress')})
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
                    issue.urgencyLevel === 'immediate' ? 'border-l-4 border-red-500' : 
                    issue.urgencyLevel === 'same-day' ? 'border-l-4 border-orange-500' : 
                    'border-l-4 border-blue-500'
                  } hover:shadow-lg`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                    <div className="flex-1 mb-2 sm:mb-0">
                      <h5 className="font-bold text-xl text-gray-800">{issue.id} - {issue.title}</h5>
                      <div className="flex flex-wrap items-center mt-1 text-sm text-gray-600 gap-x-3 gap-y-1">
                        <span className="flex items-center"><FaBus className="mr-1 text-blue-500" />{issue.busId}</span>
                        <span className="flex items-center"><FaMapPin className="mr-1 text-purple-500" />{issue.route}</span>
                        <span className="flex items-center"><FaUser className="mr-1 text-green-500" />{issue.driverName} ({issue.reportedBy.charAt(0).toUpperCase() + issue.reportedBy.slice(1)})</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                      {/* {getUrgencyBadge(issue.urgencyLevel)} */}
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
                  
                  {issue.assignedTo && (
                    <div className="mb-4 text-sm text-gray-700">
                      <strong>Assigned to:</strong> <span className="font-medium text-blue-700">{issue.assignedTo}</span>
                    </div>
                  )}
                  
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
                      {issue.driverContact && (
                        <button 
                          className="text-purple-600 hover:text-purple-800 p-2 rounded-full hover:bg-purple-50 transition duration-200 ease-in-out flex items-center text-sm font-medium"
                          onClick={() => window.open(`tel:${issue.driverContact}`, '_self')}
                        >
                          <FaPhone className="mr-1" />Call Driver
                        </button>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {issue.status === 'reported' && (
                        <button 
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition duration-200 ease-in-out"
                          onClick={() => updateIssueStatus(issue.id, 'assessed')}
                        >
                          Assess
                        </button>
                      )}
                      {issue.status === 'assessed' && (
                        <button 
                          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition duration-200 ease-in-out"
                          onClick={() => updateIssueStatus(issue.id, 'parts-ordered')}
                        >
                          Order Parts
                        </button>
                      )}
                      {issue.status === 'parts-ordered' && (
                        <button 
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition duration-200 ease-in-out"
                          onClick={() => updateIssueStatus(issue.id, 'in-repair')}
                        >
                          Start Repair
                        </button>
                      )}
                      {issue.status === 'in-repair' && (
                        <button 
                          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition duration-200 ease-in-out"
                          onClick={() => updateIssueStatus(issue.id, 'testing')}
                        >
                          Test
                        </button>
                      )}
                      {issue.status === 'testing' && (
                        <button 
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition duration-200 ease-in-out"
                          onClick={() => updateIssueStatus(issue.id, 'resolved')}
                        >
                          Mark Resolved
                        </button>
                      )}
                      {!['escalated', 'resolved'].includes(issue.status) && (
                        <button 
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition duration-200 ease-in-out flex items-center"
                          onClick={() => escalateIssue(issue.id, 'rto')} // Default to RTO escalation
                        >
                          <FaArrowUp className="mr-1" />Escalate
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
                            className={`flex mb-3 ${msg.sender === 'Depot Engineer' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] px-4 py-2 rounded-lg shadow-sm ${msg.sender === 'Depot Engineer' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
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

      {/* New Issue Modal */}
      {showNewIssueModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all scale-100 opacity-100">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-2xl font-bold text-gray-800">Create New Issue</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition duration-200"
                  onClick={() => setShowNewIssueModal(false)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const newIssueData: Omit<Issue, 'id' | 'lastUpdated' | 'history' | 'chat' | 'escalationLevel' | 'attachments'> = {
                  title: form.issueTitle.value,
                  status: 'reported', // New issues are always reported
                  busId: form.busId.value,
                  route: form.route.value,
                  location: form.location.value,
                  reportedBy: form.reportedBy.value as Issue['reportedBy'],
                  driverName: form.driverName.value,
                  driverContact: form.driverContact.value,
                  date: new Date().toISOString().split('T')[0], // Current date
                  priority: form.priority.value as Issue['priority'],
                  urgencyLevel: form.urgencyLevel.value as Issue['urgencyLevel'],
                  category: form.category.value,
                  description: form.description.value,
                  assignedTo: 'Depot Engineer', // Default assignment
                  mileage: parseInt(form.mileage.value) || undefined,
                  lastServiceDate: form.lastServiceDate.value || undefined,
                };
                addNewIssue(newIssueData);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="issueTitle" className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
                    <input type="text" id="issueTitle" name="issueTitle" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="busId" className="block text-sm font-medium text-gray-700 mb-1">Bus ID</label>
                    <input type="text" id="busId" name="busId" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="route" className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                    <input type="text" id="route" name="route" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input type="text" id="location" name="location" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="reportedBy" className="block text-sm font-medium text-gray-700 mb-1">Reported By</label>
                    <select id="reportedBy" name="reportedBy" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                      <option value="driver">Driver</option>
                      <option value="conductor">Conductor</option>
                      <option value="depot-engineer">Depot Engineer</option>
                      <option value="rto">RTO</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="driverName" className="block text-sm font-medium text-gray-700 mb-1">Reporter Name</label>
                    <input type="text" id="driverName" name="driverName" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="driverContact" className="block text-sm font-medium text-gray-700 mb-1">Reporter Contact</label>
                    <input type="text" id="driverContact" name="driverContact" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select id="priority" name="priority" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="urgencyLevel" className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
                    <select id="urgencyLevel" name="urgencyLevel" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                      <option value="immediate">Immediate</option>
                      <option value="same-day">Same Day</option>
                      <option value="next-maintenance">Next Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select id="category" name="category" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-1">Bus Mileage (km)</label>
                    <input type="number" id="mileage" name="mileage" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="lastServiceDate" className="block text-sm font-medium text-gray-700 mb-1">Last Service Date</label>
                    <input type="date" id="lastServiceDate" name="lastServiceDate" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea id="description" name="description" rows={4} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-5 rounded-lg transition duration-200"
                    onClick={() => setShowNewIssueModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition duration-200"
                  >
                    Create Issue
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
                      <span className="font-medium">Urgency:</span>
                      <span>{getUrgencyBadge(selectedIssue.urgencyLevel)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Reported Date:</span>
                      <span>{selectedIssue.date}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Last Updated:</span>
                      <span>{selectedIssue.lastUpdated}</span>
                    </div>
                    {selectedIssue.assignedTo && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Assigned To:</span>
                        <span>{selectedIssue.assignedTo}</span>
                      </div>
                    )}
                    {selectedIssue.escalationLevel !== 'none' && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Escalation Level:</span>
                        <span className="capitalize">{selectedIssue.escalationLevel.replace('-', ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bus Information */}
                <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg shadow-inner">
                  <h4 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">Bus Information</h4>
                  <div className="space-y-2 text-gray-700 text-sm">
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
                    {selectedIssue.mileage && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Mileage:</span>
                        <span>{selectedIssue.mileage.toLocaleString()} km</span>
                      </div>
                    )}
                    {selectedIssue.lastServiceDate && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Last Service:</span>
                        <span>{selectedIssue.lastServiceDate}</span>
                      </div>
                    )}
                    <button className="mt-3 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full hover:bg-blue-200 transition duration-200">
                        Update Bus Status
                    </button>
                  </div>
                </div>

                {/* Driver Details */}
                <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg shadow-inner">
                  <h4 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">Reporter Details</h4>
                  <div className="space-y-2 text-gray-700 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Name:</span>
                      <span>{selectedIssue.driverName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Contact:</span>
                      <span>{selectedIssue.driverContact}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Reported By:</span>
                      <span className="capitalize">{selectedIssue.reportedBy}</span>
                    </div>
                    <button 
                      className="mt-3 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full hover:bg-green-200 transition duration-200"
                      onClick={() => window.open(`tel:${selectedIssue.driverContact}`, '_self')}
                    >
                      Contact Reporter
                    </button>
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

              {/* Repair Plan & Cost Tracking */}
              {['parts-ordered', 'in-repair', 'testing', 'resolved'].includes(selectedIssue.status) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                    <h4 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">Repair Plan & Details</h4>
                    <div className="space-y-2 text-gray-700 text-sm">
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
                      {selectedIssue.resolution && (
                        <div>
                          <span className="font-medium">Resolution:</span>
                          <p className="mt-1 text-gray-700">{selectedIssue.resolution}</p>
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
                      {/* Placeholder for actual cost tracking, labor hours etc. */}
                      <div className="flex justify-between items-center">
                          <span className="font-medium">Labor Hours:</span>
                          <span>{selectedIssue.repairDuration ? parseFloat(selectedIssue.repairDuration.split(' ')[0]) * (selectedIssue.repairDuration.includes('hour') ? 1 : 8) : 'N/A'}</span> {/* Simple conversion */}
                      </div>
                      <button className="mt-3 bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full hover:bg-indigo-200 transition duration-200">
                          Generate Invoice
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quality Check */}
              {selectedIssue.status === 'testing' || selectedIssue.status === 'resolved' && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
                  <h4 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">Quality Check & Testing</h4>
                  <p className="text-gray-700 text-sm">
                    Details about post-repair testing, such as road tests, diagnostic scans, and functional checks.
                    Ensure all safety protocols are met before returning to service.
                  </p>
                  <button className="mt-3 bg-teal-100 text-teal-800 text-sm px-3 py-1 rounded-full hover:bg-teal-200 transition duration-200">
                      View Test Report
                  </button>
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
                    {selectedIssue.status === 'reported' && (
                      <button 
                        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-semibold shadow-md transition duration-200"
                        onClick={() => updateIssueStatus(selectedIssue.id, 'assessed')}
                      >
                        Assess Issue
                      </button>
                    )}
                    {selectedIssue.status === 'assessed' && (
                      <button 
                        className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-lg font-semibold shadow-md transition duration-200"
                        onClick={() => updateIssueStatus(selectedIssue.id, 'parts-ordered')}
                      >
                        Order Parts
                      </button>
                    )}
                    {selectedIssue.status === 'parts-ordered' && (
                      <button 
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded-lg font-semibold shadow-md transition duration-200"
                        onClick={() => updateIssueStatus(selectedIssue.id, 'in-repair')}
                      >
                        Start Repair
                      </button>
                    )}
                    {selectedIssue.status === 'in-repair' && (
                      <button 
                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-lg font-semibold shadow-md transition duration-200"
                        onClick={() => updateIssueStatus(selectedIssue.id, 'testing')}
                      >
                        Initiate Testing
                      </button>
                    )}
                    {selectedIssue.status === 'testing' && (
                      <button 
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold shadow-md transition duration-200"
                        onClick={() => updateIssueStatus(selectedIssue.id, 'resolved')}
                      >
                        Mark Resolved
                      </button>
                    )}
                    <button 
                      className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold shadow-md transition duration-200 flex items-center"
                      onClick={() => escalateIssue(selectedIssue.id, 'rto')}
                    >
                      <FaArrowUp className="mr-2" />Escalate Issue
                    </button>
                  </>
                )}
                <button 
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-5 rounded-lg transition duration-200"
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

export default DepotEngineerIssueTracker;
