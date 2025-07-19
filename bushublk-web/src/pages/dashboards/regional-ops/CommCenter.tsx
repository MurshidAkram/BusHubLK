import React, { useState } from 'react';

interface Message {
  id: number;
  to: 'Depot Manager' | 'DG (Operational)';
  from: 'Regional Operations Officer';
  title: string;
  message: string;
  date: string;
}

const CommCenter = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      to: 'Depot Manager',
      from: 'Regional Operations Officer',
      title: 'Staff Evaluation Required',
      message: 'Please submit staff performance reports by the end of the week.',
      date: '2025-07-16',
    },
    {
      id: 2,
      to: 'DG (Operational)',
      from: 'Regional Operations Officer',
      title: 'Request for Fleet Expansion',
      message: 'A request to expand the fleet in Region 3 has been submitted.',
      date: '2025-07-15',
    },
  ]);

  const [newMessage, setNewMessage] = useState({
    title: '',
    message: '',
    to: '',
  });

  const handleSend = () => {
    const newItem: Message = {
      id: Date.now(),
      to: newMessage.to as 'Depot Manager' | 'DG (Operational)',
      from: 'Regional Operations Officer',
      title: newMessage.title,
      message: newMessage.message,
      date: new Date().toISOString().slice(0, 10),
    };
    setMessages([newItem, ...messages]);
    setNewMessage({ title: '', message: '', to: '' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Communication Hub</h1>
        <p className="text-gray-600">
          Send messages to Depot Managers or report to the Deputy General Manager (Operational).
        </p>
      </div>

      {/* Send New Message */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Send New Message</h2>
        <div className="space-y-4">
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={newMessage.to}
            onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
          >
            <option value="">Select Recipient</option>
            <option value="Depot Manager">Depot Manager</option>
            <option value="DG (Operational)">DG (Operational)</option>
          </select>

          <input
            type="text"
            placeholder="Title"
            className="w-full p-2 border border-gray-300 rounded"
            value={newMessage.title}
            onChange={(e) =>
              setNewMessage({ ...newMessage, title: e.target.value })
            }
          />

          <textarea
            placeholder="Message"
            rows={4}
            className="w-full p-2 border border-gray-300 rounded"
            value={newMessage.message}
            onChange={(e) =>
              setNewMessage({ ...newMessage, message: e.target.value })
            }
          />

          <button
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            disabled={
              !newMessage.title || !newMessage.message || !newMessage.to
            }
          >
            Send Message
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Messages</h2>
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages sent.</p>
        ) : (
          <ul className="space-y-4">
            {messages.map((item) => (
              <li key={item.id} className="border border-gray-200 p-4 rounded shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                  <span className="text-sm text-gray-500">{item.date}</span>
                </div>
                <p className="text-gray-700 mb-2">{item.message}</p>
                <div className="text-sm text-gray-500">
                  From: <span className="font-medium">{item.from}</span> → To:{' '}
                  <span className="font-medium">{item.to}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CommCenter;
