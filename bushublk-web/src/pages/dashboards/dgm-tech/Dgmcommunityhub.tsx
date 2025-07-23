import { useState } from 'react';
import { Megaphone, Send, X, MessageSquare, ChevronDown } from 'lucide-react';

interface Message {
  id: number;
  type: 'Received' | 'Sent';
  recipient: string;
  title: string;
  message: string;
  date: string;
  chatHistory: ChatMessage[];
}

interface ChatMessage {
  sender: string;
  message: string;
  time: string;
}

const AnnouncementCenter = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'Received',
      recipient: 'DGM',
      title: 'Generator Maintenance Required',
      message: 'The depot generator requires scheduled maintenance. Please coordinate with the technical team.',
      date: '2025-07-10',
      chatHistory: [
        { sender: 'Regional Technical Officer', message: 'Maintenance scheduled for next Thursday.', time: '09:30' },
        { sender: 'DGM', message: 'Please ensure minimal disruption to operations.', time: '09:35' },
        { sender: 'Regional Technical Officer', message: 'We will work during low-activity hours.', time: '09:40' },
      ],
    },
    {
      id: 2,
      type: 'Sent',
      recipient: 'CEO',
      title: 'Depot Equipment Status Report',
      message: 'Monthly report on all depot equipment status and maintenance needs.',
      date: '2025-07-08',
      chatHistory: [
        { sender: 'CEO', message: 'Please highlight any critical issues.', time: '14:15' },
        { sender: 'DGM', message: 'Generator and HVAC systems need attention.', time: '14:20' },
        { sender: 'CEO', message: 'Approved budget for replacements.', time: '14:25' },
      ],
    },
  ]);

  const [newMessage, setNewMessage] = useState({
    recipient: '',
    title: '',
    message: '',
  });

  const [showForm, setShowForm] = useState(false);
  const [chatMessages, setChatMessages] = useState<{[key: number]: string}>({});
  const [expandedChats, setExpandedChats] = useState<number[]>([]);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  const recipients = ['Regional Technical Officer', 'CEO'];

  const handleSend = () => {
    if (!newMessage.recipient || !newMessage.title || !newMessage.message) return;

    const newItem: Message = {
      id: Date.now(),
      type: 'Sent',
      recipient: newMessage.recipient,
      title: newMessage.title,
      message: newMessage.message,
      date: new Date().toISOString().slice(0, 10),
      chatHistory: [],
    };
    setMessages([newItem, ...messages]);
    setNewMessage({ recipient: '', title: '', message: '' });
    setShowForm(false);
  };

  const handleChatSend = (messageId: number) => {
    const messageText = chatMessages[messageId];
    if (!messageText?.trim()) return;

    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const updatedMessages = messages.map((msg) =>
      msg.id === messageId
        ? {
            ...msg,
            chatHistory: [
              ...msg.chatHistory,
              { sender: 'DGM', message: messageText, time: currentTime },
            ],
          }
        : msg
    );

    setMessages(updatedMessages);
    setChatMessages({...chatMessages, [messageId]: ''});
  };

  const selectRecipient = (recipient: string) => {
    setNewMessage({ ...newMessage, recipient });
    setShowRecipientDropdown(false);
  };

  const toggleChat = (messageId: number) => {
    setExpandedChats(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleChatInputChange = (messageId: number, value: string) => {
    setChatMessages({...chatMessages, [messageId]: value});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-8 h-8" />
            Depot Technical Hub
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Communication center for technical operations
          </p>
        </div>
      </div>

      {/* Message Info + Send Button */}
      <div className="bg-white rounded-2xl shadow-md p-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {messages.length} message{messages.length !== 1 ? 's' : ''} in your hub
        </div>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow"
        >
          {showForm ? 'Hide Form' : 'New Message'}
        </button>
      </div>

      {/* Message Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-5">
          <h2 className="text-xl font-semibold text-gray-800">New Technical Communication</h2>
          <div className="grid gap-4">
            {/* Recipient Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
              <button
                type="button"
                className="w-full flex justify-between items-center p-3 border border-gray-300 rounded-lg text-left text-sm"
                onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
              >
                <span className={newMessage.recipient ? 'text-gray-900' : 'text-gray-500'}>
                  {newMessage.recipient || 'Select Recipient'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showRecipientDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-300 max-h-60 overflow-auto">
                  {recipients.map((recipient) => (
                    <div
                      key={recipient}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => selectRecipient(recipient)}
                    >
                      {recipient}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subject Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                placeholder="Technical message subject"
                className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                value={newMessage.title}
                onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
              />
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                placeholder="Write your technical communication here..."
                rows={5}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                value={newMessage.message}
                onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleSend}
                disabled={!newMessage.recipient || !newMessage.title || !newMessage.message}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium px-4 py-2 rounded-lg"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Messages */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Technical Communications</h2>
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages yet.</p>
        ) : (
          <ul className="space-y-4">
            {messages.map((item) => (
              <li
                key={item.id}
                className="border border-gray-200 rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.type === 'Sent' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {item.type === 'Sent' ? 'Sent to' : 'Received from'} {item.recipient} • {item.date}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleChat(item.id)}
                    className={`p-2 rounded-full ${
                      expandedChats.includes(item.id) 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    aria-label={expandedChats.includes(item.id) ? "Hide chat" : "Show chat"}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>

                {/* Chat Section - Collapsible */}
                {expandedChats.includes(item.id) && (
                  <div className="mt-4 bg-white border rounded-lg p-3 shadow-sm">
                    <div className="max-h-60 overflow-y-auto space-y-2 mb-2">
                      {item.chatHistory.length > 0 ? (
                        item.chatHistory.map((chat, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg text-sm ${
                              chat.sender === 'DGM'
                                ? 'bg-blue-100 text-right'
                                : 'bg-gray-100 text-left'
                            }`}
                          >
                            <p className="font-medium">
                              {chat.sender === 'DGM' ? 'You' : chat.sender}
                            </p>
                            <p>{chat.message}</p>
                            <p className="text-xs text-gray-500">{chat.time}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No responses yet.</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessages[item.id] || ''}
                        onChange={(e) => handleChatInputChange(item.id, e.target.value)}
                        placeholder="Type your response..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleChatSend(item.id)}
                      />
                      <button
                        onClick={() => handleChatSend(item.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AnnouncementCenter;