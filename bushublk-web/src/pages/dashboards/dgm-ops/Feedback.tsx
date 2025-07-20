import React, { useState, useMemo } from 'react';

interface FeedbackEntry {
  id: number;
  depot: string;
  region: string;
  issue: string;
  date: string;
  resolved: boolean;
}

const initialFeedbackData: FeedbackEntry[] = [
  { id: 1, depot: 'Central Depot', region: 'Western Province', issue: 'Bus delays during peak hours', date: '2025-07-10', resolved: false },
  { id: 2, depot: 'North Depot', region: 'Northern Province', issue: 'Broken AC in several buses', date: '2025-07-08', resolved: true },
  { id: 3, depot: 'East Depot', region: 'Eastern Province', issue: 'Unclean waiting areas', date: '2025-07-12', resolved: false },
  { id: 4, depot: 'South Depot', region: 'Southern Province', issue: 'Missing bus schedules at stops', date: '2025-07-11', resolved: true },
  { id: 5, depot: 'Central Depot', region: 'Western Province', issue: 'Rude behavior by crew', date: '2025-07-09', resolved: false },
  // More mock entries
  { id: 6, depot: 'Central Depot', region: 'Western Province', issue: 'Driver arrived late', date: '2025-07-13', resolved: false },
  { id: 7, depot: 'North Depot', region: 'Northern Province', issue: 'Bus overcrowded', date: '2025-07-14', resolved: true },
  { id: 8, depot: 'East Depot', region: 'Eastern Province', issue: 'Tickets not available on bus', date: '2025-07-15', resolved: false },
  { id: 9, depot: 'South Depot', region: 'Southern Province', issue: 'Unfriendly staff at depot', date: '2025-07-16', resolved: true },
  { id: 10, depot: 'Central Depot', region: 'Western Province', issue: 'Bus was unclean', date: '2025-07-17', resolved: false },
  { id: 11, depot: 'North Depot', region: 'Northern Province', issue: 'Poor lighting at stops', date: '2025-07-18', resolved: true },
  { id: 12, depot: 'East Depot', region: 'Eastern Province', issue: 'No announcements for delays', date: '2025-07-19', resolved: false },
];

const ITEMS_PER_PAGE = 5;

const Feedback = () => {
  const [feedbackData, setFeedbackData] = useState<FeedbackEntry[]>(initialFeedbackData);
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedDepot, setSelectedDepot] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Unique regions and depots (including 'All')
  const regions = ['All', ...Array.from(new Set(initialFeedbackData.map(f => f.region)))];
  const depots = ['All', ...Array.from(new Set(initialFeedbackData.map(f => f.depot)))];

  // Filter by region, depot, and search term
  const filteredFeedback = useMemo(() => {
    return feedbackData.filter(f =>
      (selectedRegion === 'All' || f.region === selectedRegion) &&
      (selectedDepot === 'All' || f.depot === selectedDepot) &&
      f.issue.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [feedbackData, selectedRegion, selectedDepot, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredFeedback.length / ITEMS_PER_PAGE);
  const currentItems = filteredFeedback.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Toggle resolved status
  const toggleResolved = (id: number) => {
    setFeedbackData(prev =>
      prev.map(f => f.id === id ? { ...f, resolved: !f.resolved } : f)
    );
  };

  // Handle page change
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Feedback & Complaints Review</h1>
        <p className="text-gray-600">Monitor and evaluate feedback patterns from all depots to identify widespread service issues.</p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-sm p-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-gray-700 font-semibold mb-1" htmlFor="region-select">Filter by Region</label>
          <select
            id="region-select"
            value={selectedRegion}
            onChange={e => { setSelectedRegion(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded px-3 py-2"
          >
            {regions.map(region => <option key={region} value={region}>{region}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1" htmlFor="depot-select">Filter by Depot</label>
          <select
            id="depot-select"
            value={selectedDepot}
            onChange={e => { setSelectedDepot(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded px-3 py-2"
          >
            {depots.map(depot => <option key={depot} value={depot}>{depot}</option>)}
          </select>
        </div>

        <div className="flex-grow min-w-[200px]">
          <label className="block text-gray-700 font-semibold mb-1" htmlFor="search-input">Search Issues</label>
          <input
            id="search-input"
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search by issue text..."
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Feedback Entries ({filteredFeedback.length})
        </h2>

        {filteredFeedback.length === 0 ? (
          <p className="text-gray-600">No feedback found for the selected filters.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {currentItems.map(entry => (
              <li key={entry.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">{entry.issue}</p>
                  <p className="text-sm text-gray-600">
                    Depot: {entry.depot} | Region: {entry.region} | Date: {entry.date}
                  </p>
                </div>
                <button
                  onClick={() => toggleResolved(entry.id)}
                  className={`px-3 py-1 rounded text-sm font-medium
                    ${entry.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  aria-label={entry.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
                >
                  {entry.resolved ? 'Resolved' : 'Pending'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-3 mt-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`px-3 py-1 border rounded ${pageNum === currentPage ? 'bg-blue-600 text-white' : ''}`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

     
    </div>
  );
};

export default Feedback;
