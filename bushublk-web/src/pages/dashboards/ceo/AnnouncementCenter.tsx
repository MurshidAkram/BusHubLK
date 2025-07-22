// src/pages/dashboards/ceo/AnnouncementCenter.tsx
import React, { useState, useMemo } from 'react';

// Mock depot list with region & district
const depotList = [
  { id: 'D101', name: 'Pettah Depot', region: 'Western Province', district: 'Colombo District' },
  { id: 'D102', name: 'Gampaha Depot', region: 'Western Province', district: 'Colombo District' },
  { id: 'D201', name: 'Kandy Depot', region: 'Central Province', district: 'Kandy District' },
  { id: 'D301', name: 'Galle Depot', region: 'Southern Province', district: 'Galle District' },
  // …add your full list here
];

interface Announcement {
  id: number;
  type: 'Received' | 'Sent';
  from: string;
  toDepotId: string;
  toDepotName: string;
  title: string;
  message: string;
  date: string;
}

const AnnouncementCenterPage: React.FC = () => {
  // announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      type: 'Received',
      from: 'Regional Office',
      toDepotId: 'D101',
      toDepotName: 'Pettah Depot',
      title: 'Urgent: Submit Weekly Report',
      message: 'Please submit the weekly operational report by 5 PM today.',
      date: '2025-07-03',
    },
    {
      id: 2,
      type: 'Sent',
      from: 'CEO Office',
      toDepotId: 'D301',
      toDepotName: 'Galle Depot',
      title: 'New Safety Protocol',
      message: 'All depots must implement the new boarding safety checks starting Monday.',
      date: '2025-07-02',
    },
  ]);

  // filters for selecting the target depot
  const regions = Array.from(new Set(depotList.map(d => d.region)));
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const districts = useMemo(
    () =>
      regionFilter === 'All'
        ? []
        : Array.from(
            new Set(
              depotList
                .filter(d => d.region === regionFilter)
                .map(d => d.district)
            )
          ),
    [regionFilter]
  );
  const [districtFilter, setDistrictFilter] = useState<string>('All');

  // final list of depots to pick from
  const filteredDepots = useMemo(() => {
    return depotList
      .filter(d => (regionFilter === 'All' || d.region === regionFilter))
      .filter(d => (districtFilter === 'All' || d.district === districtFilter));
  }, [regionFilter, districtFilter]);

  // new announcement draft
  const [newAnn, setNewAnn] = useState<{
    toDepotId: string;
    title: string;
    message: string;
  }>({ toDepotId: '', title: '', message: '' });

  const handleSend = () => {
    if (!newAnn.toDepotId || !newAnn.title || !newAnn.message) return;
    const depot = depotList.find(d => d.id === newAnn.toDepotId)!;
    const newItem: Announcement = {
      id: Date.now(),
      type: 'Sent',
      from: 'CEO Office',
      toDepotId: depot.id,
      toDepotName: depot.name,
      title: newAnn.title,
      message: newAnn.message,
      date: new Date().toISOString().slice(0, 10),
    };
    setAnnouncements([newItem, ...announcements]);
    setNewAnn({ toDepotId: '', title: '', message: '' });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Announcement Center</h1>
        <p className="text-gray-600">Send or review depot‑level announcements.</p>
      </div>

      {/* Send New Announcement */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Send New Announcement</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Region */}
          <select
            value={regionFilter}
            onChange={e => {
              setRegionFilter(e.target.value);
              setDistrictFilter('All');
              setNewAnn({ ...newAnn, toDepotId: '' });
            }}
            className="p-2 border rounded"
          >
            <option value="All">All Regions</option>
            {regions.map(r => <option key={r}>{r}</option>)}
          </select>

          {/* District */}
          <select
            value={districtFilter}
            onChange={e => {
              setDistrictFilter(e.target.value);
              setNewAnn({ ...newAnn, toDepotId: '' });
            }}
            disabled={!districts.length}
            className="p-2 border rounded disabled:bg-gray-100"
          >
            <option value="All">All Districts</option>
            {districts.map(d => <option key={d}>{d}</option>)}
          </select>

          {/* Depot */}
          <select
            value={newAnn.toDepotId}
            onChange={e => setNewAnn({ ...newAnn, toDepotId: e.target.value })}
            disabled={!filteredDepots.length}
            className="p-2 border rounded disabled:bg-gray-100"
          >
            <option value="">Select Depot</option>
            {filteredDepots.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Title"
          className="w-full p-2 border rounded"
          value={newAnn.title}
          onChange={e => setNewAnn({ ...newAnn, title: e.target.value })}
        />

        <textarea
          placeholder="Message"
          rows={4}
          className="w-full p-2 border rounded"
          value={newAnn.message}
          onChange={e => setNewAnn({ ...newAnn, message: e.target.value })}
        />

        <button
          onClick={handleSend}
          disabled={!newAnn.toDepotId || !newAnn.title || !newAnn.message}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Send Announcement
        </button>
      </div>

      {/* Recent Announcements */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Recent Announcements</h2>
        {announcements.length === 0 ? (
          <p className="text-gray-500">No announcements yet.</p>
        ) : (
          <ul className="space-y-4">
            {announcements.map(item => (
              <li
                key={item.id}
                className="border border-gray-200 p-4 rounded shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                  <span className="text-sm text-gray-500">{item.date}</span>
                </div>
                <p className="text-gray-700 mb-2">{item.message}</p>
                <div className="text-sm text-gray-500">
                  {item.type === 'Sent' ? (
                    <>
                      From: <span className="font-medium">{item.from}</span>  
                      &nbsp;→ To: <span className="font-medium">{item.toDepotName}</span>
                    </>
                  ) : (
                    <>From: <span className="font-medium">{item.from}</span></>
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

export default AnnouncementCenterPage;
