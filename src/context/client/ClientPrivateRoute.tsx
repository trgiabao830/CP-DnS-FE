import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useClientAuth } from './ClientAuthContext';

const ClientPrivateRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useClientAuth();
  const location = useLocation();

  if (isLoading) {
    return null; 
  }

  if (!isAuthenticated) {
    return <Navigate to="/?login=true" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ClientPrivateRoute;