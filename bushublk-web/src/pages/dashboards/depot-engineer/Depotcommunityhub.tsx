import { useState } from 'react';
import { Megaphone, Send, X, MessageSquare } from 'lucide-react';

interface Message {
  id: number;
  type: 'Received' | 'Sent';
  from: string;
  to: string;
  title: string;
  message: string;
  date: string;
  chatHistory?: ChatMessage[];
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
      from: 'Regional Office',
      to: 'Depot Manager',
      title: 'Submit Weekly Report',
      message: 'Please submit the weekly operational report by 5 PM today.',
      date: '2025-07-03',
      chatHistory: [
        { sender: 'Regional Office', message: 'Can you confirm the submission?', time: '09:15' },
        { sender: 'Depot Manager', message: 'Yes, I’ll send it shortly.', time: '09:17' },
      ],
    },
    {
      id: 2,
      type: 'Sent',
      from: 'Depot Manager',
      to: 'Depot Staff',
      title: 'Depot Cleaning Drive',
      message: 'All staff are requested to participate in the depot-wide cleaning this Friday.',
      date: '2025-07-02',
      chatHistory: [
        { sender: 'Depot Staff', message: 'What time should we start?', time: '10:02' },
        { sender: 'Depot Manager', message: 'Let’s begin by 9 AM sharp.', time: '10:04' },
      ],
    },
    {
      id: 3,
      type: 'Sent',
      from: 'Depot Manager',
      to: 'DGM(op)',
      title: 'Staff Meeting',
      message: 'Reminder: Staff meeting scheduled for Monday at 9 AM.',
      date: '2025-06-30',
      chatHistory: [
        { sender: 'DGM(op)', message: 'Agenda for the meeting?', time: '08:40' },
        { sender: 'Depot Manager', message: 'Performance review and planning.', time: '08:43' },
      ],
    },
  ]);

  const [newMessage, setNewMessage] = useState({
    title: '',
    message: '',
  });

  const [showForm, setShowForm] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  const handleSend = () => {
    const newItem: Message = {
      id: Date.now(),
      type: 'Sent',
      from: 'Depot Manager',
      to: 'All Staff',
      title: newMessage.title,
      message: newMessage.message,
      date: new Date().toISOString().slice(0, 10),
      chatHistory: [],
    };
    setMessages([newItem, ...messages]);
    setNewMessage({ title: '', message: '' });
    setShowForm(false);
  };

  const handleChatSend = (messageId: number) => {
    if (!chatMessage.trim()) return;

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
              ...(msg.chatHistory || []),
              { sender: 'Depot Manager', message: chatMessage, time: currentTime },
            ],
          }
        : msg
    );

    setMessages(updatedMessages);
    setChatMessage('');
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

      {/* Message Info + Send Button */}
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
                disabled={!newMessage.title || !newMessage.message}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Send to Depot manager
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
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent messages</h2>
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
                  <span className="text-xs text-gray-500">
                    {item.date} —{' '}
                    <span className={item.type === 'Sent' ? 'text-green-600' : 'text-blue-600'}>
                      {item.type}
                    </span>
                  </span>
                </div>

                {/* Toggle Chat Button */}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => setActiveChatId(activeChatId === item.id ? null : item.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{activeChatId === item.id ? 'Hide Chat' : 'Chat'}</span>
                  </button>
                </div>

                {/* Chat UI */}
                {activeChatId === item.id && (
                  <div className="mt-4 bg-white border rounded-lg p-3 shadow-sm">
                    <div className="max-h-40 overflow-y-auto space-y-2 mb-2">
                      {item.chatHistory && item.chatHistory.length > 0 ? (
                        item.chatHistory.map((chat, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg text-sm ${
                              chat.sender === 'Depot Manager'
                                ? 'bg-blue-100 text-right'
                                : 'bg-gray-100 text-left'
                            }`}
                          >
                            <p className="font-medium">{chat.sender === 'Depot Manager' ? 'You' : chat.sender}</p>
                            <p>{chat.message}</p>
                            <p className="text-xs text-gray-500">{chat.time}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No chat history yet.</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
