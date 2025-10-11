import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storageAPI, driverAPI } from '../services/api';

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
  // Today's assignment data
  todayAssignment?: {
    assignment_id: number;
    bus_registration: string;
    bus_id: number;
    route_id: number;
    route_number?: string;
    route_name?: string;
    assignment_date: string;
  } | null;
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
        // Fetch today's assignment for this driver
        try {
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          const upcomingAssignments = await driverAPI.getUpcomingAssignments(userData.driver_id.toString(), 1);
          
          let todayAssignment = null;
          
          if (Array.isArray(upcomingAssignments) && upcomingAssignments.length > 0) {
            // Find today's assignment
            todayAssignment = upcomingAssignments.find(assignment => 
              assignment.assignment_date === today
            );
          } else if (upcomingAssignments && !Array.isArray(upcomingAssignments)) {
            // Single assignment returned, check if it's for today
            if (upcomingAssignments.assignment_date === today) {
              todayAssignment = upcomingAssignments;
            }
          }
          
          // If no assignment found from upcoming, try the daily assignment endpoint
          if (!todayAssignment) {
            try {
              const dailyAssignment = await driverAPI.getDailyAssignment(userData.driver_id.toString());
              if (dailyAssignment && dailyAssignment.assignment_date === today) {
                todayAssignment = dailyAssignment;
              }
            } catch (dailyError) {
              console.log('No daily assignment found or endpoint failed:', dailyError);
            }
          }
          
          // Format the today assignment data
          if (todayAssignment) {
            const formattedTodayAssignment = {
              assignment_id: todayAssignment.assignment_id,
              bus_registration: todayAssignment.bus_registration || `Bus ${todayAssignment.bus_id}`,
              bus_id: todayAssignment.bus_id,
              route_id: todayAssignment.route_id,
              route_number: todayAssignment.route_number,
              route_name: todayAssignment.route_name,
              assignment_date: todayAssignment.assignment_date,
            };
            
            setDriverData({
              ...userData,
              todayAssignment: formattedTodayAssignment,
              busRegistration: formattedTodayAssignment.bus_registration, // Keep for backward compatibility
            });
          } else {
            setDriverData({
              ...userData,
              todayAssignment: null,
              busRegistration: undefined,
            });
          }
          
        } catch (assignmentError) {
          console.error('Error fetching today assignment:', assignmentError);
          // Still set the basic user data even if assignment fetch fails
          setDriverData({
            ...userData,
            todayAssignment: null,
          });
        }
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