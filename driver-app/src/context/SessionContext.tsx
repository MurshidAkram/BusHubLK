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
    // Check if error is related to token expiration (401 or 403)
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return true;
    }
    
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorDataMessage = error?.response?.data?.error?.toLowerCase() || '';
    
    // Check for JWT-related errors
    if (errorMessage.includes('jwt') || errorDataMessage.includes('jwt')) {
      return true;
    }
    
    // Check for token errors
    if ((errorMessage.includes('token') || errorDataMessage.includes('token')) && 
        (errorMessage.includes('expired') || errorMessage.includes('invalid') ||
         errorDataMessage.includes('expired') || errorDataMessage.includes('invalid'))) {
      return true;
    }
    
    // Check for authentication errors
    if (errorMessage.includes('authentication') || 
        errorMessage.includes('unauthenticated') ||
        errorDataMessage.includes('authentication') ||
        errorDataMessage.includes('unauthenticated')) {
      return true;
    }
    
    // Check for connection timeout that might be JWT-related
    if (errorMessage.includes('connection terminated') && 
        errorMessage.includes('connection timeout')) {
      return true;
    }
    
    // Check response data for session/auth errors
    if (errorDataMessage.includes('session') && 
        (errorDataMessage.includes('expired') || errorDataMessage.includes('invalid'))) {
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
