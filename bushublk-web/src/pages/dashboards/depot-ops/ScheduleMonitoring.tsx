import React, { useState } from 'react';

interface Bus {
  id: string;
  bus: string;
  route: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  actual: string;
  distance: string;
  status: string;
}

const BusScheduleTable = () => {
  const [busData, setBusData] = useState<Bus[]>([
    {
      id: '1',
      bus: 'NP4567',
      route: '101',
      scheduledDeparture: '09:00',
      scheduledArrival: '11:30',
      actual: '',
      distance: '',
      status: 'Not Logged'
    },
    {
      id: '2',
      bus: 'NP8910',
      route: '102',
      scheduledDeparture: '07:45',
      scheduledArrival: '09:15',
      actual: '07:40 - 09:00',
      distance: '49 km',
      status: 'Early'
    },
    {
      id: '3',
      bus: 'SP1234',
      route: '103',
      scheduledDeparture: '08:30',
      scheduledArrival: '10:00',
      actual: '08:35 - 10:10',
      distance: '58 km',
      status: 'Delayed'
    },
    {
      id: '4',
      bus: 'CP9876',
      route: '104',
      scheduledDeparture: '10:00',
      scheduledArrival: '12:30',
      actual: '10:00 - 12:30',
      distance: '65 km',
      status: 'On Time'
    },
    {
      id: '5',
      bus: 'NP1122',
      route: '105',
      scheduledDeparture: '06:00',
      scheduledArrival: '08:00',
      actual: '',
      distance: '',
      status: 'Not Logged'
    },
    {
      id: '6',
      bus: 'NP8910',
      route: '122',
      scheduledDeparture: '17:45',
      scheduledArrival: '19:15',
      actual: '17:40 - 19:00',
      distance: '49 km',
      status: 'Early'
    },
    {
      id: '7',
      bus: 'SP5234',
      route: '108',
      scheduledDeparture: '08:30',
      scheduledArrival: '10:00',
      actual: '08:35 - 10:10',
      distance: '58 km',
      status: 'Delayed'
    },
    {
      id: '8',
      bus: 'CN9876',
      route: '144',
      scheduledDeparture: '10:00',
      scheduledArrival: '12:30',
      actual: '14:00 - 15:30',
      distance: '65 km',
      status: 'On Time'
    },
    {
      id: '9',
      bus: 'NP0122',
      route: '145',
      scheduledDeparture: '16:00',
      scheduledArrival: '18:00',
      actual: '',
      distance: '',
      status: 'Not Logged'
    }
  ]);

  const [selectedRow, setSelectedRow] = useState<Bus | null>(null);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'log' | null>(null);
  const [formData, setFormData] = useState({
    actualDeparture: '',
    actualArrival: '',
    distance: ''
  });
  const [errors, setErrors] = useState({
    actualDeparture: '',
    actualArrival: '',
    distance: ''
  });

  // Get unique routes from busData
  const routes = Array.from(new Set(busData.map(bus => bus.route))).map(route => ({
    route_id: route,
    route_number: route,
    route_name: `Route ${route}`
  }));

  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  
  // Filter buses by selected route
  const filteredBuses = selectedRoute 
    ? busData.filter(bus => bus.route === selectedRoute)
    : busData;

  const handleModalOpen = (type: 'view' | 'edit' | 'log', row: Bus) => {
    setModalType(type);
    setSelectedRow(row);
    setErrors({ actualDeparture: '', actualArrival: '', distance: '' });

    if (type === 'view') return;

    setFormData({
      actualDeparture: row.actual?.split(' - ')[0] || '',
      actualArrival: row.actual?.split(' - ')[1] || '',
      distance: row.distance.replace(' km', '')
    });
  };

  const handleModalClose = () => {
    setModalType(null);
    setSelectedRow(null);
    setFormData({ actualDeparture: '', actualArrival: '', distance: '' });
    setErrors({ actualDeparture: '', actualArrival: '', distance: '' });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSave = () => {
    const newErrors = {
      actualDeparture: formData.actualDeparture ? '' : 'Actual departure is required',
      actualArrival: formData.actualArrival ? '' : 'Actual arrival is required',
      distance: formData.distance ? '' : 'Distance is required'
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error !== '')) return;
    if (!selectedRow) return;

    const actual = `${formData.actualDeparture} - ${formData.actualArrival}`;
    const distance = `${formData.distance} km`;
    const scheduledArrival = selectedRow.scheduledArrival;
    let status = 'On Time';

    if (formData.actualArrival < scheduledArrival) status = 'Early';
    else if (formData.actualArrival > scheduledArrival) status = 'Delayed';

    setBusData(prev =>
      prev.map(bus =>
        bus.id === selectedRow.id
          ? { ...bus, actual, distance, status }
          : bus
      )
    );

    handleModalClose();
  };

  return (
    <div>
     

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-col md:flex-row gap-0">
          {/* Routes List - Left Panel */}
          <div className="md:w-1/4 bg-gradient-to-b from-blue-25 to-indigo-25 border-r border-gray-200">
            <div className="p-5 sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <h2 className="text-xl font-bold">Available Routes</h2>
              <p className="text-blue-100 text-sm mt-1">Select route to view schedule</p>
            </div>
            <ul className="p-3 max-h-[calc(100vh-150px)] overflow-y-auto">
              {routes.map(route => (
                <li
                  key={route.route_id}
                  className={`p-3 mb-2 rounded-lg transition-all duration-200 cursor-pointer flex items-start
                    ${selectedRoute === route.route_id
                      ? 'bg-white shadow-md border-l-4 border-blue-500'
                      : 'hover:bg-blue-100'}`}
                  onClick={() => setSelectedRoute(route.route_id)}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">Route {route.route_number}</div>
                    <div className="text-sm text-gray-600 mt-1">{route.route_name}</div>
                  </div>
                  {selectedRoute === route.route_id && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Main Content Area - Right Panel */}
          <div className="md:w-3/4">
            {selectedRoute ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Schedule for Route {selectedRoute}
                    </h2>
                    <p className="text-gray-600">Bus schedules and performance tracking</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-lg px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Bus Schedule Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Bus</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Scheduled Departure</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Scheduled Arrival</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actual Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Distance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBuses.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{row.bus}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">{row.scheduledDeparture}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">{row.scheduledArrival}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {row.actual ? (
                              <div className="text-gray-900">{row.actual}</div>
                            ) : (
                              <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Not recorded</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {row.distance ? (
                              <div className="text-gray-900">{row.distance}</div>
                            ) : (
                              <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Not recorded</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                              ${row.status === 'Early' ? 'bg-green-100 text-green-800' :
                                row.status === 'Delayed' ? 'bg-red-100 text-red-800' :
                                  row.status === 'On Time' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleModalOpen('log', row)}
                                disabled={row.status !== 'Not Logged'}
                                className={`text-sm px-3 py-1 rounded ${
                                  row.status !== 'Not Logged' 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                Log
                              </button>
                              <button
                                onClick={() => handleModalOpen('view', row)}
                                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleModalOpen('edit', row)}
                                disabled={row.status === 'Not Logged'}
                                className={`text-sm px-3 py-1 rounded ${
                                  row.status === 'Not Logged' 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                }`}
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-24 px-4 text-center">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full p-6 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Route</h3>
                <p className="text-gray-600 max-w-md">
                  Choose a route from the left panel to view and manage its daily schedule
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalType && selectedRow && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold capitalize">{modalType} Entry</h2>
              <button 
                onClick={handleModalClose} 
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalType === 'view' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bus</label>
                    <div className="text-gray-900">{selectedRow.bus}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                    <div className="text-gray-900">{selectedRow.route}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Departure</label>
                    <div className="text-gray-900">{selectedRow.scheduledDeparture}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Arrival</label>
                    <div className="text-gray-900">{selectedRow.scheduledArrival}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Time</label>
                    <div className="text-gray-900">{selectedRow.actual || 'Not recorded'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distance</label>
                    <div className="text-gray-900">{selectedRow.distance || 'Not recorded'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${selectedRow.status === 'Early' ? 'bg-green-100 text-green-800' :
                        selectedRow.status === 'Delayed' ? 'bg-red-100 text-red-800' :
                          selectedRow.status === 'On Time' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'}`}>
                      {selectedRow.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {(modalType === 'edit' || modalType === 'log') && (
              <>
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Bus:</span> {selectedRow.bus}
                    </div>
                    <div>
                      <span className="font-medium">Route:</span> {selectedRow.route}
                    </div>
                    <div>
                      <span className="font-medium">Scheduled:</span> {selectedRow.scheduledDeparture} - {selectedRow.scheduledArrival}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Departure</label>
                    <input
                      type="time"
                      name="actualDeparture"
                      value={formData.actualDeparture}
                      onChange={handleFormChange}
                      className={`w-full border rounded px-3 py-2 text-sm ${errors.actualDeparture ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.actualDeparture && <p className="text-red-500 text-xs mt-1">{errors.actualDeparture}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Arrival</label>
                    <input
                      type="time"
                      name="actualArrival"
                      value={formData.actualArrival}
                      onChange={handleFormChange}
                      className={`w-full border rounded px-3 py-2 text-sm ${errors.actualArrival ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.actualArrival && <p className="text-red-500 text-xs mt-1">{errors.actualArrival}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                    <input
                      type="number"
                      name="distance"
                      value={formData.distance}
                      onChange={handleFormChange}
                      className={`w-full border rounded px-3 py-2 text-sm ${errors.distance ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.distance && <p className="text-red-500 text-xs mt-1">{errors.distance}</p>}
                  </div>
                </div>
              </>
            )}

            {(modalType === 'edit' || modalType === 'log') && (
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={handleModalClose}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusScheduleTable;