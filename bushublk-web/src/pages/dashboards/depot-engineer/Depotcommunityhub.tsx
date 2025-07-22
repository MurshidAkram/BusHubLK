import { useState } from 'react';
import { Megaphone, Send, X } from 'lucide-react';

interface Message {
  id: number;
  type: 'Received' | 'Sent';
  from: string;
  to: string;
  title: string;
  message: string;
  date: string;
}

const DepotCommunityHub = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'Received',
      from: 'Regional Technical Officer',
      to: 'Depot Manager',
      title: 'Technical Inspection Scheduled',
      message: 'Please prepare all buses for the quarterly technical inspection on July 15th.',
      date: '2025-07-03',
    },
    {
      id: 23,
      type: 'Sent',
      from: 'Depot Manager',
      to: 'DGM Technical',
      title: 'Spare Parts Request',
      message: 'Requesting approval for purchase of spare parts for bus maintenance.',
      date: '2025-07-02',
    }
  ]);

  const [newMessage, setNewMessage] = useState({
    title: '',
    message: '',
    to: '',
  });

  const [showForm, setShowForm] = useState(false);

  const recipientOptions = [
    'Depot Manager',
    'Regional Technical Officer'
  ];

  const handleSend = () => {
    const newItem: Message = {
      id: Date.now(),
      type: 'Sent',
      from: 'Depot Engineer',
      to: newMessage.to,
      title: newMessage.title,
      message: newMessage.message,
      date: new Date().toISOString().slice(0, 10),
    };
    setMessages([newItem, ...messages]);
    setNewMessage({ title: '', message: '', to: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-8 h-8 text-blue-600" />
            Depot Communication Hub
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Central messaging system for depot communications
          </p>
        </div>
      </div>

      {/* Messages info + Send Message button */}
      <div className="bg-white rounded-2xl shadow-md p-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'} in total
        </div>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow flex items-center gap-2"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Message
            </>
          )}
        </button>
      </div>

      {/* Message Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-5">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Compose New Message
          </h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newMessage.to}
                onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
                required
              >
                <option value="">Select Recipient</option>
                {recipientOptions.map((recipient) => (
                  <option key={recipient} value={recipient}>
                    {recipient}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                placeholder="Message subject"
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newMessage.title}
                onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                placeholder="Write your message here..."
                rows={5}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newMessage.message}
                onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Discard
              </button>
              <button
                onClick={handleSend}
                disabled={!newMessage.title || !newMessage.message || !newMessage.to}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-blue-600" />
          Message History
        </h2>
        
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages found</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {messages.map((item) => (
              <li
                key={item.id}
                className={`border rounded-xl p-5 transition ${
                  item.type === 'Sent' 
                    ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.type === 'Sent' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      <p><span className="font-medium">To:</span> {item.to}</p>
                      <p><span className="font-medium">From:</span> {item.from}</p>
                    </div>
                    <p className="mt-2 text-gray-700">{item.message}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {item.date}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DepotCommunityHub;