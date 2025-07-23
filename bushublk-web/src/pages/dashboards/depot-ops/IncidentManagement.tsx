import { useState } from 'react';
import { CheckCircle, AlertTriangle, Search, X } from 'lucide-react';

interface LostFoundReport {
  id: number;
  incident_date: string;
  incident_time: string;
  passenger_name: string;
  report_type: 'Lost' | 'Found';
  item_category: string;
  item_description: string;
  item_photo: string;
  route_number: string;
  contact_email: string;
  contact_phone: string;
  status: 'Pending' | 'Resolved';
}

const ImageWithFallback = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc('/default-item.png')}
    />
  );
};

const IncidentManagement = () => {
  const [reports, setReports] = useState<LostFoundReport[]>([
    {
      id: 1,
      incident_date: '2025-07-21',
      incident_time: '08:30',
      passenger_name: 'Fatima N.',
      report_type: 'Lost',
      item_category: 'Mobile',
      item_description: 'Black Samsung Galaxy A52 with cracked screen',
      item_photo: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGhvbmV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=100&q=60',
      route_number: '138 - Colombo to Maharagama',
      contact_email: 'fatima@gmail.com',
      contact_phone: '+94771234567',
      status: 'Pending',
    },
    {
      id: 2,
      incident_date: '2025-07-20',
      incident_time: '16:45',
      passenger_name: 'Nuwan P.',
      report_type: 'Found',
      item_category: 'Jewellery',
      item_description: 'Gold chain with heart pendant',
      item_photo: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8amV3ZWxyeXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=100&q=60',
      route_number: '138 - Colombo to Maharagama',
      contact_email: 'nuwan@gmail.com',
      contact_phone: '+94778999999',
      status: 'Pending',
    },
    {
      id: 3,
      incident_date: '2025-07-19',
      incident_time: '12:15',
      passenger_name: 'Rajesh K.',
      report_type: 'Lost',
      item_category: 'Wallet',
      item_description: 'Brown leather wallet with credit cards',
      item_photo: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8d2FsbGV0fGVufDB8fDB8fHww&auto=format&fit=crop&w=100&q=60',
      route_number: '100 - Colombo to Negombo',
      contact_email: 'rajesh@gmail.com',
      contact_phone: '+94771234568',
      status: 'Resolved',
    },
    {
  id: 4,
  incident_date: '2025-07-18',
  incident_time: '18:20',
  passenger_name: 'Yasmin L.',
  report_type: 'Found',
  item_category: 'Bag',
  item_description: 'Blue backpack with books and a water bottle',
    item_photo: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGhvbmV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=100&q=60',
  route_number: '99 - Colombo to Matara',
  contact_email: 'yasmin@example.com',
  contact_phone: '+94770000001',
  status: 'Pending',
},
{
  id: 5,
  incident_date: '2025-07-17',
  incident_time: '10:05',
  passenger_name: 'Ahmed R.',
  report_type: 'Lost',
  item_category: 'Book',
  item_description: 'Story in a black leather cover',
  item_photo: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8d2FsbGV0fGVufDB8fDB8fHww&auto=format&fit=crop&w=100&q=60',
  route_number: '45 -  Colombo to Horana',
  contact_email: 'ahmedr@gmail.com',
  contact_phone: '+94775554433',
  status: 'Pending',
}

  ]);

  const [filter, setFilter] = useState<'All' | 'Lost' | 'Found'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<LostFoundReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const resolveReport = (id: number) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === id ? { ...report, status: 'Resolved' } : report
      )
    );
  };

  const openReportDetails = (report: LostFoundReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  const filteredReports = reports.filter((report) => {
    const matchesFilter = filter === 'All' || report.report_type === filter;
    const matchesSearch = 
      report.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.item_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.route_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Modal for viewing report details */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedReport.report_type} Item Details
              </h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Passenger Information</h3>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedReport.passenger_name}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Incident Date & Time</h3>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedReport.incident_date} at {selectedReport.incident_time}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Route Number</h3>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedReport.route_number}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Item Category</h3>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedReport.item_category}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <div className={`mt-1 inline-flex items-center ${
                      selectedReport.status === 'Resolved' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {selectedReport.status === 'Resolved' ? (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-sm">{selectedReport.status}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Report Type</h3>
                    <div className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedReport.report_type === 'Lost' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedReport.report_type}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Item Description</h3>
                <div className="mt-1 text-sm text-gray-900">
                  {selectedReport.item_description}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Item Photo</h3>
                <ImageWithFallback
                  src={selectedReport.item_photo}
                  alt={selectedReport.item_description}
                  className="w-48 h-48 rounded-lg object-cover border border-gray-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contact Email</h3>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedReport.contact_email}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contact Phone</h3>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedReport.contact_phone}
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selectedReport.status !== 'Resolved' && (
                <button
                  onClick={() => {
                    resolveReport(selectedReport.id);
                    closeModal();
                  }}
                  className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700"
                >
                  Mark as Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lost and Found Items</h1>
            <p className="text-sm text-gray-500">Manage items reported by passengers</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow max-w-md">
             
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilter('All')}
                className={`px-3 py-1 text-sm rounded-md ${filter === 'All' ? 'bg-white shadow-sm font-medium' : 'text-gray-600'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('Lost')}
                className={`px-3 py-1 text-sm rounded-md ${filter === 'Lost' ? 'bg-white shadow-sm text-red-500 font-medium' : 'text-gray-600'}`}
              >
                Lost
              </button>
              <button
                onClick={() => setFilter('Found')}
                className={`px-3 py-1 text-sm rounded-md ${filter === 'Found' ? 'bg-white shadow-sm text-green-500 font-medium' : 'text-gray-600'}`}
              >
                Found
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Passenger & Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No reports found
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.report_type === 'Lost' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {report.report_type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{report.passenger_name}</div>
                      <div className="text-sm text-gray-500">{report.route_number}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {report.incident_date} at {report.incident_time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <ImageWithFallback
                          src={report.item_photo}
                          alt={report.item_description}
                          className="w-12 h-12 rounded-md object-cover mr-3 border border-gray-200 bg-gray-100"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{report.item_category}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{report.item_description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{report.contact_email}</div>
                      <div className="text-sm text-gray-500">{report.contact_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center ${
                        report.status === 'Resolved' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {report.status === 'Resolved' ? (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 mr-1" />
                        )}
                        <span className="text-sm">{report.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {report.status !== 'Resolved' && (
                        <button
                          onClick={() => resolveReport(report.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Resolve
                        </button>
                      )}
                      <button 
                        onClick={() => openReportDetails(report)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredReports.length > 0 && (
        <div className="text-sm text-gray-500 px-4">
          Showing {filteredReports.length} of {reports.length} reports
        </div>
      )}
    </div>
  );
};

export default IncidentManagement;