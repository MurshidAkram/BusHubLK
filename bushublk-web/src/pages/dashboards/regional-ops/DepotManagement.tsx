import React, { useState } from 'react';

interface DepotData {
  id: number;
  depot: string;
  fleetUsage: number;
  tripSuccessRate: number;
  passengerFeedback: number;
  breakdowns: number;
  punctuality: number;
}

const initialData: DepotData[] = [
  { id: 1, depot: 'Colombo Depot', fleetUsage: 87, tripSuccessRate: 91, passengerFeedback: 4.5, breakdowns: 2, punctuality: 96 },
  { id: 2, depot: 'Gampaha Depot', fleetUsage: 74, tripSuccessRate: 85, passengerFeedback: 4.2, breakdowns: 5, punctuality: 89 },
  { id: 3, depot: 'Kandy Depot', fleetUsage: 80, tripSuccessRate: 88, passengerFeedback: 4.3, breakdowns: 3, punctuality: 92 },
];

const depotOptions = ['Colombo Depot', 'Gampaha Depot', 'Kandy Depot'];

const getColorClass = (value: number, highGood = true) => {
  if (highGood) {
    if (value >= 80) return 'bg-green-100 text-green-700';
    if (value >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  } else {
    if (value <= 2) return 'bg-green-100 text-green-700';
    if (value <= 5) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  }
};

const DepotManagement = () => {
  const [selectedDepot, setSelectedDepot] = useState('');
  const filteredData = selectedDepot
    ? initialData.filter((item) => item.depot === selectedDepot)
    : initialData;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Depot Management</h1>
        <p className="text-gray-600">
          Visual overview of depot performance across the region.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4">
        <select
          value={selectedDepot}
          onChange={(e) => setSelectedDepot(e.target.value)}
          className="p-2 border rounded-md w-60"
        >
          <option value="">All Depots</option>
          {depotOptions.map((dep) => (
            <option key={dep} value={dep}>
              {dep}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredData.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-md p-5 space-y-3 border hover:shadow-lg transition duration-200"
            >
              <h2 className="text-xl font-semibold text-blue-800">{item.depot}</h2>

              <div className={`p-3 rounded ${getColorClass(item.fleetUsage)}`}>
                <strong>Fleet Usage:</strong> {item.fleetUsage}%
              </div>
              <div className="p-3 bg-blue-50 text-blue-800 rounded">
                <strong>Trip Success Rate:</strong> {item.tripSuccessRate}%
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-800 rounded">
                <strong>Passenger Feedback:</strong> {item.passengerFeedback.toFixed(1)} / 5
              </div>
              <div className={`p-3 rounded ${getColorClass(item.breakdowns, false)}`}>
                <strong>Breakdowns:</strong> {item.breakdowns}
              </div>
              <div className={`p-3 rounded ${getColorClass(item.punctuality)}`}>
                <strong>Punctuality:</strong> {item.punctuality}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepotManagement;
