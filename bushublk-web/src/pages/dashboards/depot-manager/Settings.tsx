import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';
import axios from 'axios';
import { 
  HiOfficeBuilding,
  HiLocationMarker,
  HiPhone,
  HiTruck,
  HiCog,
  HiRefresh,
  HiExclamationCircle
} from 'react-icons/hi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${API_URL}/api`;

const Settings: React.FC = () => {
  const appContext = useContext(AppContext);
  if (!appContext) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { user, token } = appContext;
  const depotId = user?.depot_id;

  const [depotName, setDepotName] = useState('');
  const [location, setLocation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [busCapacity, setBusCapacity] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!depotId || !token) return;

    const fetchDepotData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const [profileRes, busRes] = await Promise.all([
          fetch(`${API_BASE_URL}/depots/${depotId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/buses/depot/${depotId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!profileRes.ok) throw new Error('Failed to fetch depot profile');
        
        const profileData = await profileRes.json();
        setDepotName(profileData.depot?.depot_name || '');
        setLocation(profileData.depot?.address || '');
        setContactNumber(profileData.depot?.contact_phone || '');
        setBusCapacity(busRes.data.buses ? busRes.data.buses.length : 0);
        
      } catch (err) {
        setError('Could not load depot information. Please try again.');
        console.error('Error fetching depot data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepotData();
  }, [depotId, token]);

  const handleRetry = () => {
    if (depotId && token) {
      const fetchDepotData = async () => {
        setLoading(true);
        setError('');
        try {
          const [profileRes, busRes] = await Promise.all([
            fetch(`${API_BASE_URL}/depots/${depotId}`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get(`${API_BASE_URL}/buses/depot/${depotId}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);

          if (!profileRes.ok) throw new Error('Failed to fetch depot profile');
          
          const profileData = await profileRes.json();
          setDepotName(profileData.depot?.depot_name || '');
          setLocation(profileData.depot?.address || '');
          setContactNumber(profileData.depot?.contact_phone || '');
          setBusCapacity(busRes.data.buses ? busRes.data.buses.length : 0);
          
        } catch (err) {
          setError('Could not load depot information. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      fetchDepotData();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <HiCog className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Depot Settings</h1>
              <p className="text-gray-600">Loading depot information...</p>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <HiExclamationCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Unable to load depot information</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <HiRefresh className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Depot Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <HiCog className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Depot Settings</h1>
              <p className="text-gray-600">Manage and view your depot information</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Depot Information */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <HiOfficeBuilding className="w-5 h-5 text-blue-500" />
                Depot Information
              </h2>
              
              <div className="space-y-4">
                <InfoItem
                  icon={<HiOfficeBuilding className="w-5 h-5 text-blue-500" />}
                  label="Depot Name"
                  value={depotName || 'Not available'}
                />
                <InfoItem
                  icon={<HiLocationMarker className="w-5 h-5 text-green-500" />}
                  label="Location"
                  value={location || 'Not available'}
                />
                <InfoItem
                  icon={<HiPhone className="w-5 h-5 text-purple-500" />}
                  label="Contact Number"
                  value={contactNumber || 'Not available'}
                />
                <InfoItem
                  icon={<HiTruck className="w-5 h-5 text-orange-500" />}
                  label="Bus Count"
                  value={busCapacity.toString()}
                  isHighlighted={true}
                />
              </div>
            </div>

            {/* Depot Summary */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Depot Summary</h3>
              <div className="space-y-3">
                <SummaryItem 
                  label="Total Capacity" 
                  value={`${busCapacity} buses`}
                  description="Current fleet size"
                />
                <SummaryItem 
                  label="Depot Status" 
                  value="Operational"
                  description="All systems normal"
                  status="success"
                />
               
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionButton
            icon={<HiRefresh className="w-5 h-5" />}
            label="Refresh Data"
            description="Update depot information"
            onClick={handleRetry}
          />
         
        </div>
      </div>
    </div>
  );
};

// Reusable Info Item Component
const InfoItem = ({ icon, label, value, isHighlighted = false }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  isHighlighted?: boolean;
}) => (
  <div className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
    isHighlighted 
      ? 'bg-blue-50 border-blue-200' 
      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
  }`}>
    <div className="flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className={`text-lg font-semibold truncate ${
        isHighlighted ? 'text-blue-700' : 'text-gray-900'
      }`}>
        {value}
      </p>
    </div>
  </div>
);

// Reusable Summary Item Component
const SummaryItem = ({ label, value, description, status = 'normal' }: {
  label: string;
  value: string;
  description: string;
  status?: 'success' | 'warning' | 'error' | 'normal';
}) => {
  const statusColors = {
    success: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    error: 'text-red-600 bg-red-50 border-red-200',
    normal: 'text-gray-600 bg-gray-50 border-gray-200'
  };

  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[status]}`}>
        {value}
      </span>
    </div>
  );
};

// Reusable Action Button Component
const ActionButton = ({ icon, label, description, onClick }: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 p-4 text-left bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all group"
  >
    <div className="flex-shrink-0 p-2 bg-white rounded-lg border border-gray-200 group-hover:bg-blue-100 group-hover:border-blue-300 transition-colors">
      {icon}
    </div>
    <div>
      <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{label}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </button>
);

export default Settings;