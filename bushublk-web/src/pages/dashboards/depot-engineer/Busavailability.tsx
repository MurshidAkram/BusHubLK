import React, { useState, useEffect, useContext } from 'react';
import { HiSearch, HiX, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { AppContext } from '../../../context/AppContext';
import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const buildBusListUrl = (role?: string, depotId?: string) => {
  if (role === 'depot_engineer') {
    return `${API_BASE_URL}/api/depot-engineer/buses`;
  }

  if ((role === 'depot_manager' || role === 'depot_operations') && depotId) {
    return `${API_BASE_URL}/api/buses/depot/${depotId}`;
  }

  return `${API_BASE_URL}/api/buses`;
};

const buildUpdateBusStatusUrl = (busId: string) => `${API_BASE_URL}/api/depot-engineer/buses/${busId}/status`;

interface Bus {
  bus_id: string;
  registration_number: string;
  depot_id: string;
  class: string;
  manufacturer: string;
  model: string;
  year: number;
  mileage: string;
  status: 'Active'  | 'Maintenance' | 'Out of Service';
  depot_name?: string;
  region_name?: string;
}

interface AppContextType {
  user: { role: string; userId: string; depot_id?: string; region_id?: string; } | null;
  token: string | null;
}

interface BusResponse {
  success: boolean;
  message: string;
  buses?: Bus[];
  bus?: Bus;
}

type SeverityLevel = 'low' | 'medium' | 'high';

interface PartCondition {
  part_key: string;
  part_name: string;
  hasIssue: boolean;
  notes: string;
  severity: SeverityLevel;
}

const Busavailability = () => {
  // @ts-ignore

  const context = useContext(AppContext) as AppContextType | null;

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [editedStatus, setEditedStatus] = useState<Bus['status']>('Active');
  const PART_DEFINITIONS: PartCondition[] = [
    { part_key: 'engine', part_name: 'Engine', hasIssue: false, notes: '', severity: 'medium' },
    { part_key: 'brakes', part_name: 'Brakes', hasIssue: false, notes: '', severity: 'medium' },
    { part_key: 'tires', part_name: 'Tires', hasIssue: false, notes: '', severity: 'medium' },
    { part_key: 'windows', part_name: 'Windows', hasIssue: false, notes: '', severity: 'medium' },
    { part_key: 'doors', part_name: 'Doors', hasIssue: false, notes: '', severity: 'medium' },
    { part_key: 'headlights', part_name: 'Head Lights', hasIssue: false, notes: '', severity: 'medium' },
    { part_key: 'signallights', part_name: 'Signal Lights', hasIssue: false, notes: '', severity: 'medium' }
  ];

  const severityOptions: Array<{ value: SeverityLevel; label: string }> = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  const [partConditions, setPartConditions] = useState<PartCondition[]>(PART_DEFINITIONS);

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const userRole = context?.user?.role;
  const userDepotId = context?.user?.depot_id;
  const userRegionId = context?.user?.region_id;
  const token = context?.token;

  const fetchBuses = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setError('Authentication token is missing. Please log in.');
        setLoading(false);
        return;
      }

      if ((userRole === 'depot_manager' || userRole === 'depot_operations') && !userDepotId) {
        setError('Depot ID is required for this user role.');
        setLoading(false);
        return;
      }

      const apiUrl = buildBusListUrl(userRole, userDepotId);
      console.log('Fetching from:', apiUrl);

      const response = await axios.get<BusResponse>(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success && response.data.buses) {
        setBuses(response.data.buses);
      } else {
        setError(`Failed to fetch buses: ${response.data.message}`);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('API Error:', axiosError);
      if (axiosError.response) {
        setError(`Failed to fetch buses: ${axiosError.response.status} - ${(axiosError.response.data as any)?.message || axiosError.response.statusText}`);
      } else if (axiosError.request) {
        setError('Failed to fetch buses. The API endpoint might be down or unreachable.');
      } else {
        setError(`Error setting up request: ${axiosError.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && userRole) {
      fetchBuses();
    } else if (!token) {
      setError('Please log in to view bus availability.');
      setLoading(false);
    }
  }, [token, userRole, userDepotId, userRegionId]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredBuses = buses.filter(bus => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = term === '' ||
      bus.registration_number.toLowerCase().includes(term) ||
      bus.class.toLowerCase().includes(term) ||
      bus.status.toLowerCase().includes(term);

    const matchesStatus = statusFilter === '' || bus.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredBuses.length / itemsPerPage);
  const currentBuses = filteredBuses.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleEditClick = (bus: Bus) => {
    setSelectedBus(bus);
    setEditedStatus(bus.status);
    setPartConditions(PART_DEFINITIONS.map((part) => ({ ...part })));
    setSuccessMessage(null);
    setShowEditModal(true);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setSelectedBus(null);
    setPartConditions(PART_DEFINITIONS.map((part) => ({ ...part })));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as Bus['status'];
    setEditedStatus(newStatus);
  };

  const updatePartIssue = (partIndex: number, hasIssue: boolean) => {
    setPartConditions((prev) =>
      prev.map((part, index) =>
        index === partIndex
          ? {
              ...part,
              hasIssue,
              notes: hasIssue ? part.notes : '',
              severity: hasIssue ? part.severity : 'medium'
            }
          : part
      )
    );
  };

  const updatePartNotes = (partIndex: number, value: string) => {
    setPartConditions((prev) =>
      prev.map((part, index) =>
        index === partIndex
          ? { ...part, notes: value }
          : part
      )
    );
  };

  const updatePartSeverity = (partIndex: number, value: SeverityLevel) => {
    setPartConditions((prev) =>
      prev.map((part, index) =>
        index === partIndex
          ? { ...part, severity: value }
          : part
      )
    );
  };

  const handleSaveChanges = async () => {
    if (!selectedBus || !token) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const trimmedConditions = partConditions.map((part) => ({
        ...part,
        notes: part.notes.trim()
      }));

      const missingDescriptions = trimmedConditions.filter(
        (part) => part.hasIssue && part.notes.length === 0
      );

      if (missingDescriptions.length > 0) {
        setError(
          `Please provide a description for: ${missingDescriptions
            .map((part) => part.part_name)
            .join(', ')}`
        );
        return;
      }

      const partPayload = trimmedConditions.map((part) => ({
        key: part.part_key,
        hasIssue: part.hasIssue,
        notes: part.hasIssue ? part.notes : null,
        severity: part.hasIssue && part.severity ? part.severity.trim().toLowerCase() as SeverityLevel : null
      }));
      console.log('Submitting part payload:', partPayload);

      const response = await axios.put<BusResponse>(
        buildUpdateBusStatusUrl(selectedBus.bus_id),
        {
          status: editedStatus,
          part_checking_data: {
            statusAfterCheck: editedStatus,
            parts: partPayload
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success && response.data.bus) {
        setBuses((prevBuses) =>
          prevBuses.map((bus) =>
            bus.bus_id === selectedBus.bus_id ? { ...bus, status: editedStatus } : bus
          )
        );
        setShowEditModal(false);
        setSelectedBus(null);
        // Reset part checking data for next check
        setPartConditions(PART_DEFINITIONS.map((part) => ({ ...part })));

        const autoSchedule = (response.data as any)?.automatic_service_schedule;
        const baseMessage = response.data.message || 'Bus status updated successfully.';

        if (autoSchedule?.triggered) {
          const summary = autoSchedule.summary || {};
          const parts: string[] = [];

          if (summary.created) {
            const plural = summary.created === 1 ? 'task' : 'tasks';
            const dateText = autoSchedule.scheduled_date ? ` on ${autoSchedule.scheduled_date}` : '';
            parts.push(`${summary.created} new follow-up ${plural} scheduled${dateText}`);
          }

          if (summary.existing) {
            const plural = summary.existing === 1 ? 'task was' : 'tasks were';
            parts.push(`${summary.existing} existing follow-up ${plural} already scheduled`);
          }

          if (summary.failed) {
            const plural = summary.failed === 1 ? 'task' : 'tasks';
            parts.push(`${summary.failed} automatic follow-up ${plural} failed to schedule`);
          }

          const detail = parts.length > 0 ? ` (${parts.join(' | ')})` : '';
          setSuccessMessage(`${baseMessage}${detail}`);
        } else if (autoSchedule?.error) {
          setSuccessMessage(baseMessage);
        } else if (autoSchedule?.updated) {
          const scheduledDate = autoSchedule.scheduled_date ? ` (scheduled for ${autoSchedule.scheduled_date})` : '';
          setSuccessMessage(baseMessage || `Bus status updated and the existing follow-up service was refreshed${scheduledDate}.`);
        } else if (autoSchedule?.created) {
          const scheduledDate = autoSchedule.scheduled_date ? ` (scheduled for ${autoSchedule.scheduled_date})` : '';
          setSuccessMessage(baseMessage || `Bus status updated and follow-up service created${scheduledDate}.`);
        } else if (autoSchedule) {
          const scheduledDate = autoSchedule.scheduled_date ? ` on ${autoSchedule.scheduled_date}` : '';
          setSuccessMessage(baseMessage || `Bus status updated. Existing follow-up service detected${scheduledDate}.`);
        } else {
          setSuccessMessage(baseMessage);
        }
      } else {
        setError('Failed to update bus status: ' + (response.data.message || 'Unknown error.'));
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Error updating bus status:', axiosError);
      if (axiosError.response) {
        const errorData = axiosError.response.data as any;
        setError(`Failed to update status: ${axiosError.response.status} - ${errorData?.message || axiosError.response.statusText}`);
      } else {
        setError('Failed to update bus status. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading buses...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Bus Availability </h2>

      {successMessage && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-4 text-green-700 text-sm">
          {successMessage}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <input
            type="text"
            placeholder="Search by registration number, class, or status..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        <div className="w-full md:w-1/3 lg:w-1/4">
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            {/* <option value="In Service">In Service</option> */}
            <option value="Maintenance">Maintenance</option>
            <option value="Out of Service">Out of Service</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reg. Number
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Model
              </th>
              {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mileage
              </th> */}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentBuses.length > 0 ? (
              currentBuses.map((bus) => (
                <tr key={bus.bus_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bus.registration_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.class}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.manufacturer} {bus.model}</td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.mileage}</td> */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      bus.status === 'Active' ? 'bg-green-100 text-green-800' :
                      // bus.status === 'In Service' ? 'bg-blue-100 text-blue-800' :
                      bus.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bus.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {userRole === 'depot_engineer' && (
                      <button
                        onClick={() => handleEditClick(bus)}
                        className="text-blue-600 hover:text-blue-900 ml-4"
                      >
                        Part Check
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  No buses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <nav className="flex items-center justify-between pt-4" aria-label="Pagination">
        <div className="flex-1 flex justify-between">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiChevronLeft className="h-5 w-5" /> Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next <HiChevronRight className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {showEditModal && selectedBus && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative p-6 bg-white w-full max-w-4xl mx-auto rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Daily Part Checking & Status Update
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bus Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-3">Bus Information</h4>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Registration:</span> {selectedBus.registration_number}</p>
                  <p className="text-sm"><span className="font-medium">Model:</span> {selectedBus.manufacturer} {selectedBus.model}</p>
                  <p className="text-sm"><span className="font-medium">Year:</span> {selectedBus.year}</p>
                  <p className="text-sm"><span className="font-medium">Current Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      selectedBus.status === 'Active' ? 'bg-green-100 text-green-800' :
                      // selectedBus.status === 'In Service' ? 'bg-blue-100 text-blue-800' :
                      selectedBus.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedBus.status}
                    </span>
                  </p>
                </div>

                {/* Status Change */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                  
                  <select
                    value={editedStatus}
                    onChange={handleStatusChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active - Ready for Service</option>
                    {/* <option value="In Service">In Service - Currently Operating</option> */}
                    <option value="Maintenance">Maintenance - Requires Repair/Service</option>
                    <option value="Out of Service">Out of Service - Not Available</option>
                  </select>
                </div>
              </div>

              {/* Part Checking Checklist - Always visible for depot engineers */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-3 flex items-center">
                  🔧 Daily Part Findings 
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {partConditions.filter(part => part.hasIssue).length}/
                    {partConditions.length} Issues Logged
                  </span>
                </h4>
                
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Main Parts Checklist */}
                  <div className="bg-white p-3 rounded border">
                    <h5 className="font-medium text-blue-600 mb-3"> Main Bus Components</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {partConditions.map((part, index) => (
                        <div key={part.part_key} className="space-y-2 border rounded-md p-3 bg-gray-50">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={part.hasIssue}
                              onChange={(e) => updatePartIssue(index, e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {part.part_name}
                            </span>
                          </label>
                          {part.hasIssue && (
                            <>
                              <label className="block text-xs font-medium text-blue-700">
                                Severity
                              </label>
                              <select
                                value={part.severity}
                                onChange={(e) => updatePartSeverity(index, e.target.value as SeverityLevel)}
                                className="w-full text-sm border border-blue-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                              >
                                {severityOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <textarea
                                value={part.notes}
                                onChange={(e) => updatePartNotes(index, e.target.value)}
                                placeholder="Describe the issue found for this part"
                                className="w-full text-sm border border-blue-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                              />
                            </>
                          )}
                          {!part.hasIssue && (
                            <p className="text-xs text-gray-500">
                              No issues logged.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Busavailability;
