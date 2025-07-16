import React, { useState } from 'react';

interface RouteData {
  id: number;
  routeNumber: string; // eg: "001"
  name: string;
  totalDistanceKm: number;
  averageDailyPassengers: number;
  fuelCostPerKm: number;
}

const initialRoutes: RouteData[] = [
  { id: 1, routeNumber: '001', name: 'Colombo - Galle', totalDistanceKm: 120, averageDailyPassengers: 350, fuelCostPerKm: 6 },
  { id: 2, routeNumber: '002', name: 'Colombo - Negombo', totalDistanceKm: 40, averageDailyPassengers: 220, fuelCostPerKm: 5.5 },
  { id: 3, routeNumber: '003', name: 'Colombo - Panadura', totalDistanceKm: 30, averageDailyPassengers: 300, fuelCostPerKm: 5 },
  { id: 4, routeNumber: '004', name: 'Colombo - Kottawa', totalDistanceKm: 25, averageDailyPassengers: 180, fuelCostPerKm: 4.8 },
  { id: 5, routeNumber: '005', name: 'Colombo - Maharagama', totalDistanceKm: 20, averageDailyPassengers: 160, fuelCostPerKm: 4.5 },
];

const RouteOptimization = () => {
  const [routes, setRoutes] = useState<RouteData[]>(initialRoutes);
  const [editId, setEditId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<RouteData>>({});

  const calculateEfficiencyScore = (route: RouteData) => {
    const cost = route.totalDistanceKm * route.fuelCostPerKm;
    const score = route.averageDailyPassengers / cost;
    return score.toFixed(2);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: name === 'name' ? value : Number(value),
    }));
  };

  const handleEditClick = (route: RouteData) => {
    setEditId(route.id);
    setEditFormData({ ...route });
  };

  const handleCancelClick = () => {
    setEditId(null);
    setEditFormData({});
  };

  const handleSaveClick = () => {
    if (!editId) return;
    setRoutes((prevRoutes) =>
      prevRoutes.map((route) =>
        route.id === editId ? { ...route, ...editFormData } as RouteData : route
      )
    );
    setEditId(null);
    setEditFormData({});
  };

  const handleDeleteClick = (id: number) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      setRoutes((prevRoutes) => prevRoutes.filter((route) => route.id !== id));
    }
  };

  return (
    <div className="space-y-6 ">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Route Optimization</h1>
        <p className="text-gray-600">
          Optimize bus routes for efficiency and cost-effectiveness.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Route Efficiency Overview</h2>
        <table className="w-full min-w-[900px] text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-700 uppercase">
            <tr>
              <th className="px-4 py-2">Route No.</th>
              <th className="px-4 py-2">Route</th>
              <th className="px-4 py-2">Distance (km)</th>
              <th className="px-4 py-2">Avg Daily Passengers</th>
              <th className="px-4 py-2">Fuel Cost/km (LKR)</th>
              <th className="px-4 py-2">Efficiency Score</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  No routes available.
                </td>
              </tr>
            )}
            {routes.map((route) => (
              <tr key={route.id} className="border-t">
                <td className="px-4 py-2">{route.routeNumber}</td>
                {editId === route.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        name="name"
                        value={editFormData.name || ''}
                        onChange={handleEditChange}
                        className="border px-2 py-1 rounded w-full"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        name="totalDistanceKm"
                        value={editFormData.totalDistanceKm || ''}
                        onChange={handleEditChange}
                        className="border px-2 py-1 rounded w-full"
                        min={0}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        name="averageDailyPassengers"
                        value={editFormData.averageDailyPassengers || ''}
                        onChange={handleEditChange}
                        className="border px-2 py-1 rounded w-full"
                        min={0}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        name="fuelCostPerKm"
                        value={editFormData.fuelCostPerKm || ''}
                        onChange={handleEditChange}
                        className="border px-2 py-1 rounded w-full"
                        step="0.1"
                        min={0}
                      />
                    </td>
                    <td className="px-4 py-2 font-medium text-green-600">
                      {calculateEfficiencyScore({
                        id: route.id,
                        routeNumber: route.routeNumber,
                        name: editFormData.name || '',
                        totalDistanceKm: editFormData.totalDistanceKm || 0,
                        averageDailyPassengers: editFormData.averageDailyPassengers || 0,
                        fuelCostPerKm: editFormData.fuelCostPerKm || 0,
                      })}
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={handleSaveClick}
                        className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelClick}
                        className="text-gray-700 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2">{route.name}</td>
                    <td className="px-4 py-2">{route.totalDistanceKm}</td>
                    <td className="px-4 py-2">{route.averageDailyPassengers}</td>
                    <td className="px-4 py-2">{route.fuelCostPerKm}</td>
                    <td className="px-4 py-2 font-medium text-green-600">{calculateEfficiencyScore(route)}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={() => handleEditClick(route)}
                        className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(route.id)}
                        className="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RouteOptimization;
