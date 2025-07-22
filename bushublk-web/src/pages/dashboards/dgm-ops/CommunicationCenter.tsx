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

const CommunicationCenter = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'Received',
      from: 'Regional operations Officer',
      to: 'Depot Manager',
      title: 'Submit Weekly Report',
      message: 'Please submit the weekly operational report by 5 PM today.',
      date: '2025-07-03',
    },
    {
      id: 2,
      type: 'Sent',
      from: 'Depot Manager',
      to: 'Depot Staff',
      title: 'Depot Cleaning Drive',
      message: 'All staff are requested to participate in the depot-wide cleaning this Friday.',
      date: '2025-07-02',
    },
    {
      id: 3,
      type: 'Sent',
      from: 'Depot Manager',
      to: 'DGM(op)',
      title: 'Staff Meeting',
      message: 'Reminder: Staff meeting scheduled for Monday at 9 AM.',
      date: '2025-06-30',
    },
  ]);

  const [newMessage, setNewMessage] = useState({
    title: '',
    message: '',
    to: '',
  });

  const [showForm, setShowForm] = useState(false);

  const handleSend = () => {
    const newItem: Message = {
      id: Date.now(),
      type: 'Sent',
      from: 'Depot Manager',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            Communication hub
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated with the latest messages
          </p>
        </div>
      </div>

      {/* Below header: Messages info + Send Message button */}
      <div className="bg-white rounded-2xl shadow-md p-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {messages.length} of {messages.length} messages
        </div>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow"
        >
          {showForm ? 'Hide Form' : 'Send message'}
        </button>
      </div>

      {/* Message Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-5">
          <h2 className="text-xl font-semibold text-gray-800">Send New Message</h2>
          <div className="grid gap-4">
            <select
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
              value={newMessage.to}
              onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
            >
              <option value="">Select Recipient</option>
              <option value="Regional Operations Officer">ROO(Regional Operations Officer)</option>
              <option value="Chief Executive Officer">CEO</option>
            </select>

            <input
              type="text"
              placeholder="Message Title"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
              value={newMessage.title}
              onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
            />

            <textarea
              placeholder="Write your message..."
              rows={5}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
              value={newMessage.message}
              onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleSend}
                disabled={!newMessage.title || !newMessage.message || !newMessage.to}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Send
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
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Announcements</h2>
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages available.</p>
        ) : (
          <ul className="space-y-4">
            {messages.map((item) => (
              <li
                key={item.id}
                className="border border-gray-200 rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                  </div>
                  <span className="text-xs text-gray-500 block text-right mt-1">
                    {item.date} —{' '}
                    <span className={item.type === 'Sent' ? 'text-green-600' : 'text-blue-600'}>
                      {item.type}
                    </span>
                    <br />
                    <span className="text-gray-700 font-semibold">From: </span>{item.from}
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

export default CommunicationCenter;
