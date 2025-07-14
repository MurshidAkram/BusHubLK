import { useState } from 'react';

interface Announcement {
  id: number;
  type: 'Received' | 'Sent';
  from: string;
  to: string;
  title: string;
  message: string;
  date: string;
}

const AnnouncementCenter = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      type: 'Received',
      from: 'Regional Office',
      to: 'Depot Manager',
      title: 'Urgent: Submit Weekly Report',
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
  ]);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    to: '',
  });

  const handleSend = () => {
    const newItem: Announcement = {
      id: Date.now(),
      type: 'Sent',
      from: 'Depot Manager',
      to: newAnnouncement.to,
      title: newAnnouncement.title,
      message: newAnnouncement.message,
      date: new Date().toISOString().slice(0, 10),
    };
    setAnnouncements([newItem, ...announcements]);
    setNewAnnouncement({ title: '', message: '', to: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Announcement Center</h1>
        <p className="text-gray-600">Stay updated with the latest announcements and notifications.</p>
      </div>

      {/* Send Announcement */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Send New Announcement</h2>
        <div className="space-y-4">
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={newAnnouncement.to}
            onChange={(e) =>
              setNewAnnouncement({ ...newAnnouncement, to: e.target.value })
            }
          >
            <option value="">Select Recipient</option>
            <option value="Depot Staff">Depot Staff</option>
            <option value="Depot Manager">Depot Manager</option>
            <option value="Regional Office">Regional Office</option>
          </select>

          <input
            type="text"
            placeholder="Title"
            className="w-full p-2 border border-gray-300 rounded"
            value={newAnnouncement.title}
            onChange={(e) =>
              setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
            }
          />

          <textarea
            placeholder="Message"
            rows={4}
            className="w-full p-2 border border-gray-300 rounded"
            value={newAnnouncement.message}
            onChange={(e) =>
              setNewAnnouncement({ ...newAnnouncement, message: e.target.value })
            }
          />

          <button
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            disabled={
              !newAnnouncement.title || !newAnnouncement.message || !newAnnouncement.to
            }
          >
            Send Announcement
          </button>
        </div>
      </div>

      {/* Recent Announcements */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Announcements</h2>
        {announcements.length === 0 ? (
          <p className="text-gray-500">No announcements available.</p>
        ) : (
          <ul className="space-y-4">
            {announcements.map((item) => (
              <li key={item.id} className="border border-gray-200 p-4 rounded shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                  <span className="text-sm text-gray-500">{item.date}</span>
                </div>
                <p className="text-gray-700 mb-2">{item.message}</p>
                <div className="text-sm text-gray-500">
                  {item.type === 'Sent' ? (
                    <>
                      From: <span className="font-medium">{item.from}</span> → To:{' '}
                      <span className="font-medium">{item.to}</span>
                    </>
                  ) : (
                    <>
                      From: <span className="font-medium">{item.from}</span>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AnnouncementCenter;
