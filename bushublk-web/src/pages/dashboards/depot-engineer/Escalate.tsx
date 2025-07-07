import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronDown, 
  faChevronUp, 
  faPlus, 
  faFilter, 
  faPaperclip, 
  faCheckCircle 
} from '@fortawesome/free-solid-svg-icons';

interface Escalation {
  id: string;
  title: string;
  busNumber: string;
  escalatedDate: string;
  assignedTo: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Action Required' | 'Resolved';
  messages: Message[];
}

interface Message {
  id: string;
  timestamp: string;
  sender: string;
  role: string;
  content: string;
  attachments?: string[];
}

const Escalation: React.FC = () => {
  const [expandedEscalation, setExpandedEscalation] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [showNewEscalationModal, setShowNewEscalationModal] = useState(false);
  const [newEscalation, setNewEscalation] = useState({
    relatedRepair: '',
    bus: '',
    title: '',
    description: '',
    priority: 'High',
    attachments: null as FileList | null
  });

  const escalations: Escalation[] = [
    {
      id: '1',
      title: 'Brake System Recall - Bus #07',
      busNumber: '07',
      escalatedDate: '2023-06-01',
      assignedTo: 'Sarah Johnson',
      priority: 'Critical',
      status: 'Action Required',
      messages: [
        {
          id: '1',
          timestamp: '2023-06-01 10:30 AM',
          sender: 'You',
          role: 'Depot Engineer',
          content: 'Identified cracked brake drums during routine inspection. Requesting immediate authorization for full brake system replacement.',
          attachments: ['Inspection_Report_Bus07.pdf', 'Brake_Damage_Photo1.jpg']
        },
        {
          id: '2',
          timestamp: '2023-06-02 2:15 PM',
          sender: 'Sarah Johnson',
          role: 'RTO',
          content: 'Approved full brake system replacement. Parts have been ordered from regional warehouse (ETA 2 days). Please complete repair by June 7 and upload documentation.',
          attachments: ['Approval_Notice_REF456.pdf']
        }
      ]
    },
    {
      id: '2',
      title: 'Engine Overheating - Bus #12',
      busNumber: '12',
      escalatedDate: '2023-05-28',
      assignedTo: 'Sarah Johnson',
      priority: 'High',
      status: 'Resolved',
      messages: []
    }
  ];

  const toggleEscalation = (escalationId: string) => {
    setExpandedEscalation(expandedEscalation === escalationId ? null : escalationId);
  };

  const handleSendResponse = (escalationId: string) => {
    console.log(`Sending response for escalation ${escalationId}:`, responseText);
    setResponseText('');
  };

  const handleMarkAsResolved = (escalationId: string) => {
    console.log(`Marking escalation ${escalationId} as resolved`);
  };

  const handleNewEscalation = () => {
    setShowNewEscalationModal(true);
  };

  const handleCloseModal = () => {
    setShowNewEscalationModal(false);
    setNewEscalation({
      relatedRepair: '',
      bus: '',
      title: '',
      description: '',
      priority: 'High',
      attachments: null
    });
  };

  const handleSubmitEscalation = () => {
    console.log('Submitting new escalation:', newEscalation);
    handleCloseModal();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-600';
      case 'High': return 'text-orange-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Action Required': return 'text-red-600';
      case 'Resolved': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getEscalationBorderColor = (status: string) => {
    return status === 'Action Required' ? 'border-l-red-500' : 'border-l-yellow-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">Escalated Issues</h1>
          <div className="flex gap-3">
            <button 
              onClick={handleNewEscalation}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} />
              New Escalation
            </button>
            {/* <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <FontAwesomeIcon icon={faFilter} />
              Filter
            </button> */}
          </div>
        </div>

        {/* New Escalation Modal */}
        {showNewEscalationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">New Escalation</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmitEscalation(); }}>
                <div className="space-y-4">
                  {/* Related Repair */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Related Repair (Optional)
                    </label>
                    <select
                      value={newEscalation.relatedRepair}
                      onChange={(e) => setNewEscalation({...newEscalation, relatedRepair: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">-- Select Repair --</option>
                      <option value="brake-system">Brake System Repair</option>
                      <option value="engine-overhaul">Engine Overhaul</option>
                      <option value="transmission">Transmission Service</option>
                    </select>
                  </div>

                  {/* Bus */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bus
                    </label>
                    <select
                      value={newEscalation.bus}
                      onChange={(e) => setNewEscalation({...newEscalation, bus: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">-- Select Bus --</option>
                      <option value="bus-01">Bus #01</option>
                      <option value="bus-02">Bus #02</option>
                      <option value="bus-03">Bus #03</option>
                      <option value="bus-04">Bus #04</option>
                      <option value="bus-05">Bus #05</option>
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newEscalation.title}
                      onChange={(e) => setNewEscalation({...newEscalation, title: e.target.value})}
                      placeholder="Brief title for the escalation"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newEscalation.description}
                      onChange={(e) => setNewEscalation({...newEscalation, description: e.target.value})}
                      placeholder="Describe why this issue needs escalation..."
                      rows={4}
                      className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={newEscalation.priority}
                      onChange={(e) => setNewEscalation({...newEscalation, priority: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  {/* Attachments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attachments
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setNewEscalation({...newEscalation, attachments: e.target.files})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload supporting documents, photos, or videos</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Submit Escalation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Active Escalations Section */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Active Escalations</h2>
          
          <div className="space-y-4">
            {escalations.map((escalation) => (
              <div key={escalation.id} className="bg-white rounded-lg shadow-sm border">
                {/* Escalation Header */}
                <div
                  className={`border-l-4 ${getEscalationBorderColor(escalation.status)} p-4 cursor-pointer hover:bg-gray-50 transition-colors`}
                  onClick={() => toggleEscalation(escalation.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">{escalation.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📅 Escalated: {escalation.escalatedDate}</span>
                        <span>👤 RTO: {escalation.assignedTo}</span>
                        <span className={`${getPriorityColor(escalation.priority)}`}>
                          🏷️ Priority: {escalation.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${getStatusColor(escalation.status)}`}>
                        {escalation.status}
                      </span>
                      {expandedEscalation === escalation.id ? (
                        <FontAwesomeIcon icon={faChevronUp} className="text-gray-400" />
                      ) : (
                        <FontAwesomeIcon icon={faChevronDown} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedEscalation === escalation.id && (
                  <div className="border-t">
                    {/* Message Thread */}
                    <div className="p-4 space-y-6">
                      {escalation.messages.map((message) => (
                        <div key={message.id} className="flex gap-3">
                          <div className={`w-3 h-3 rounded-full mt-1 ${message.sender === 'You' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-500 mb-1">
                              {message.timestamp}
                            </div>
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              {message.sender} ({message.role})
                            </div>
                            <div className="text-gray-800 mb-3">
                              {message.content}
                            </div>
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="space-y-2">
                                {message.attachments.map((attachment, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                                    <FontAwesomeIcon icon={faPaperclip} />
                                    {attachment}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Response Section */}
                    {escalation.status === 'Action Required' && (
                      <div className="border-t bg-gray-50 p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Add Response</h4>
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Type your response here..."
                          className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
                        />
                        
                        <div className="mt-4 flex justify-between items-center">
                          <div>
                            <label className="text-sm text-gray-600 mb-2 block">Attachments</label>
                            <input
                              type="file"
                              multiple
                              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                            />
                          </div>
                          
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleSendResponse(escalation.id)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              Send Response
                            </button>
                            <button
                              onClick={() => handleMarkAsResolved(escalation.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                              <FontAwesomeIcon icon={faCheckCircle} />
                              Mark as Resolved
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Escalation;