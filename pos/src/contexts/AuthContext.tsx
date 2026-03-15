import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, AuthContextType, LoginCredentials, AuthResponse, Application, Tenant } from '../types/auth.types';
import { authService } from '@services/auth.service';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [grantedPermissions, setGrantedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const initStartedRef = useRef(false);

  useEffect(() => {
    // Run only once (avoids double call in React 18 Strict Mode).
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    const initAuth = async () => {
      const hasToken = authService.isAuthenticated();
      if (hasToken) {
        try {
          const [sessionInfo, permissions] = await Promise.all([
            authService.getSessionInfo(),
            authService.getGrantedPermissions(),
          ]);
          if (sessionInfo.result.user) {
            setUser(sessionInfo.result.user);
            setApplication(sessionInfo.result.application);
            setTenant(sessionInfo.result.tenant);
            setGrantedPermissions(permissions);
          } else {
            authService.logout();
            setGrantedPermissions([]);
          }
        } catch (error) {
          console.error('Failed to validate session with backend:', error);
          authService.logout();
          setGrantedPermissions([]);
        }
      } else {
        try {
          const app = await authService.getApplicationInfo();
          if (app) setApplication(app);
        } catch {
          // Ignore; app/connectivity unknown when anonymous
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await authService.login(credentials);
      // After successful login, fetch the session info (user, application, tenant)
      const [sessionInfo, permissions] = await Promise.all([
        authService.getSessionInfo(),
        authService.getGrantedPermissions(),
      ]);
      setUser(sessionInfo.result.user);
      setApplication(sessionInfo.result.application);
      setTenant(sessionInfo.result.tenant);
      setGrantedPermissions(permissions);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = (): void => {
    authService.logout();
    setUser(null);
    setApplication(null);
    setTenant(null);
    setGrantedPermissions([]);
  };

  const isGranted = (permissionName: string): boolean =>
    grantedPermissions.includes(permissionName);

  const value: AuthContextType = {
    user,
    application,
    tenant,
    grantedPermissions,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    isGranted,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
