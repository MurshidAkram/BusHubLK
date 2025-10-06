import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storageAPI } from '../services/api';

interface DriverData {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  driver_id: string;
  depot_id: number;
  region_id: number;
  license_number: string | null;
  role: string;
  role_name: string;
  busId?: string;
  routeId?: string;
  assignmentId?: string;
  busRegistration?: string;
  // Additional organizational information
  depot_name?: string | null;
  depot_location?: string | null;
  region_name?: string | null;
  depot_manager_name?: string | null;
  depot_manager_phone?: string | null;
  depot_manager_email?: string | null;
}

interface DriverContextType {
  driverData: DriverData | null;
  isLoading: boolean;
  error: string | null;
  refreshDriverData: () => Promise<void>;
  setDriverData: (data: DriverData | null) => void;
}

const DriverContext = createContext<DriverContextType | undefined>(undefined);

interface DriverProviderProps {
  children: ReactNode;
}

export const DriverProvider: React.FC<DriverProviderProps> = ({ children }) => {
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDriverData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = await storageAPI.getUserData();
      
      if (userData) {
        setDriverData(userData);
      } else {
        setDriverData(null);
      }
    } catch (err) {
      console.error('Error fetching driver data:', err);
      setError('Failed to load driver data');
      setDriverData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshDriverData();
  }, []);

  const value: DriverContextType = {
    driverData,
    isLoading,
    error,
    refreshDriverData,
    setDriverData,
  };

  return (
    <DriverContext.Provider value={value}>
      {children}
    </DriverContext.Provider>
  );
};

export const useDriver = (): DriverContextType => {
  const context = useContext(DriverContext);
  if (context === undefined) {
    throw new Error('useDriver must be used within a DriverProvider');
  }
  return context;
};

export default DriverContext;