import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../state/useAuthStore';

interface RoleGuardProps {
  allowedRoles: ('student' | 'teacher' | 'admin')[];
  children?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles }) => {
  const { activeRole } = useAuthStore();

  if (!allowedRoles.includes(activeRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleGuard;
