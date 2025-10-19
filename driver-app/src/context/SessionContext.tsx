import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { storageAPI } from '../services/api';

interface SessionContextType {
  handleSessionExpired: () => void;
  checkSessionExpired: (error: any) => boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
  onSessionExpired: () => void; // Callback to navigate to login
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children, onSessionExpired }) => {
  const [hasShownAlert, setHasShownAlert] = useState(false);

  const handleSessionExpired = () => {
    // Prevent showing multiple alerts
    if (hasShownAlert) return;
    
    setHasShownAlert(true);
    
    Alert.alert(
      '🔒 Session Expired',
      'Your session has expired. Please log in again to continue.',
      [
        {
          text: 'Log In',
          onPress: async () => {
            // Clear storage and navigate to login
            await storageAPI.clearStorage();
            setHasShownAlert(false);
            onSessionExpired();
          },
        },
      ],
      { 
        cancelable: false // User must acknowledge
      }
    );
  };

  const checkSessionExpired = (error: any): boolean => {
    // Check if error is related to token expiration
    if (error?.response?.status === 403) {
      return true;
    }
    
    // Check for token expired message in error
    if (error?.message?.toLowerCase().includes('token') && 
        (error?.message?.toLowerCase().includes('expired') || 
         error?.message?.toLowerCase().includes('invalid'))) {
      return true;
    }
    
    // Check response data for token errors
    if (error?.response?.data?.error?.toLowerCase().includes('token')) {
      return true;
    }
    
    return false;
  };

  const value: SessionContextType = {
    handleSessionExpired,
    checkSessionExpired,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export default SessionContext;
