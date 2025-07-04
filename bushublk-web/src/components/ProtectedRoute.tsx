import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

interface ProtectedRouteProps {
  requiredRole?: string; // optional: only allow specific roles
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const context = useContext(AppContext);

  if (!context?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && context.user?.role.toLowerCase() !== requiredRole.toLowerCase()) {
  return <Navigate to="/" replace />;
}

  return <Outlet />;
};

export default ProtectedRoute;
