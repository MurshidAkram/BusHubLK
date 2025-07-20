import React, { createContext, useState, useEffect } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  avatar?: string;
  depot_id?: number;  // Add depot_id
  region_id?: number; // Add region_id
}

interface AppContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load authentication state from localStorage on app start
  useEffect(() => {
    const savedToken = localStorage.getItem('bushublk_token');
    const savedUser = localStorage.getItem('bushublk_user');
    
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        // Clear corrupted data
        localStorage.removeItem('bushublk_token');
        localStorage.removeItem('bushublk_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('bushublk_token', authToken);
    localStorage.setItem('bushublk_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bushublk_token');
    localStorage.removeItem('bushublk_user');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('bushublk_user', JSON.stringify(updatedUser));
    }
  };

  const value: AppContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider