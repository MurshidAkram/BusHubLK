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
    <div className="container mx-auto p-4">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Daily schedules</h1>
        <p className="text-gray-600">Create and manage bus time schedules and timetables.</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled Departure</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled Arrival</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {busData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{row.bus}</td>
                <td className="px-6 py-4 whitespace-nowrap">{row.route}</td>
                <td className="px-6 py-4 whitespace-nowrap">{row.scheduledDeparture}</td>
                <td className="px-6 py-4 whitespace-nowrap">{row.scheduledArrival}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-sm rounded 
                    ${row.status === 'Early' ? 'bg-green-100 text-green-700' :
                      row.status === 'Delayed' ? 'bg-red-100 text-red-700' :
                        row.status === 'On Time' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'}`}>
                    {row.status || 'Not Logged'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                  <button
                    onClick={() => handleModalOpen('log', row)}
                    disabled={row.status !== 'Not Logged'}
                    className={`text-sm ${row.status !== 'Not Logged' ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:underline'}`}
                  >
                    Log
                  </button>
                  <button
                    onClick={() => handleModalOpen('view', row)}
                    className="text-sm text-gray-700 hover:underline"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleModalOpen('edit', row)}
                    disabled={row.status === 'Not Logged'}
                    className={`text-sm ${row.status === 'Not Logged' ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:underline'}`}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalType && selectedRow && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-xl shadow-lg">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-bold capitalize">{modalType} Entry</h2>
              <button onClick={handleModalClose} className="text-red-600 font-bold">X</button>
            </div>

            {modalType === 'view' && (
              <div className="space-y-2">
                <p><strong>Bus:</strong> {selectedRow.bus}</p>
                <p><strong>Route:</strong> {selectedRow.route}</p>
                <p><strong>Scheduled Departure:</strong> {selectedRow.scheduledDeparture}</p>
                <p><strong>Scheduled Arrival:</strong> {selectedRow.scheduledArrival}</p>
                <p><strong>Actual:</strong> {selectedRow.actual || 'Not recorded'}</p>
                <p><strong>Distance:</strong> {selectedRow.distance || 'Not recorded'}</p>
                <p><strong>Status:</strong> {selectedRow.status || 'Not Logged'}</p>
              </div>
            )}

            {(modalType === 'edit' || modalType === 'log') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actual Departure</label>
                  <input
                    type="time"
                    name="actualDeparture"
                    value={formData.actualDeparture}
                    onChange={handleFormChange}
                    className={`mt-1 block w-full border rounded-md py-2 px-3 text-sm ${errors.actualDeparture ? 'border-red-500' : ''}`}
                  />
                  {errors.actualDeparture && <p className="text-red-500 text-xs mt-1">{errors.actualDeparture}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actual Arrival</label>
                  <input
                    type="time"
                    name="actualArrival"
                    value={formData.actualArrival}
                    onChange={handleFormChange}
                    className={`mt-1 block w-full border rounded-md py-2 px-3 text-sm ${errors.actualArrival ? 'border-red-500' : ''}`}
                  />
                  {errors.actualArrival && <p className="text-red-500 text-xs mt-1">{errors.actualArrival}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Distance (km)</label>
                  <input
                    type="number"
                    name="distance"
                    value={formData.distance}
                    onChange={handleFormChange}
                    className={`mt-1 block w-full border rounded-md py-2 px-3 text-sm ${errors.distance ? 'border-red-500' : ''}`}
                  />
                  {errors.distance && <p className="text-red-500 text-xs mt-1">{errors.distance}</p>}
                </div>
              </div>
            )}

            {(modalType === 'edit' || modalType === 'log') && (
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={handleModalClose}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
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
