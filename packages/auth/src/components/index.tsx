import React from 'react';
import { useAuth } from '../context/AuthContext';
import { formatUserRole } from '../utils';

interface UserProfileProps {
  className?: string;
  showRole?: boolean;
  showEmail?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  className = '',
  showRole = true,
  showEmail = false,
}) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className={`user-profile ${className}`}>
      {user.photoURL && (
        <img 
          src={user.photoURL} 
          alt={`Avatar de ${user.displayName || user.email}`}
          className="user-avatar"
        />
      )}
      <div className="user-info">
        <h3 className="user-name">{user.displayName || user.email}</h3>
        {showEmail && <p className="user-email">{user.email}</p>}
        {showRole && <span className="user-role">{formatUserRole(user.role)}</span>}
      </div>
    </div>
  );
};

interface LoginButtonProps {
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const LoginButton: React.FC<LoginButtonProps> = ({
  onClick,
  children = 'Iniciar Sesión',
  className = '',
  disabled = false,
}) => {
  const { isLoading } = useAuth();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`login-button ${className}`}
      disabled={disabled || isLoading}
    >
      {isLoading ? 'Iniciando...' : children}
    </button>
  );
};

interface LogoutButtonProps {
  onLogout?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  onLogout,
  children = 'Cerrar Sesión',
  className = '',
}) => {
  const { logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`logout-button ${className}`}
      disabled={isLoading}
    >
      {isLoading ? 'Cerrando...' : children}
    </button>
  );
};

interface ProtectedComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRoles?: string[];
}

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  fallback = <div>No tienes permisos para ver este contenido</div>,
  requiredRoles,
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user.role)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};
