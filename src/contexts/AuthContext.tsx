'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  authChecked: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const authCheckCount = useRef(0);
  const router = useRouter();

  // Check if user is authenticated on initial load
  useEffect(() => {
    const initialCheck = async () => {
      await checkAuth();
    };
    initialCheck();
  }, []);
  
  const checkAuth = async (): Promise<boolean> => {
    if (authCheckCount.current > 5) {
      console.log('Too many auth checks, stopping to prevent infinite loop');
      setLoading(false);
      setAuthChecked(true);
      return false;
    }

    authCheckCount.current++;

    try {
      setLoading(true);
      console.log('Checking authentication status...');

      // Debug the cookie directly in the browser
      console.log('Current cookies:', document.cookie);

      // Use fetch with no-cache headers
      const res = await fetch(`/api/auth/me?t=${Date.now()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      // Log the response status
      console.log('Auth check response status:', res.status);
      console.log('Auth check response headers:', Object.fromEntries(res.headers.entries()));

      // Try to clone and log the raw response
      try {
        const resClone = res.clone();
        const rawText = await resClone.text();
        console.log('Raw response:', rawText);
      } catch (e) {
        console.error('Could not log raw response:', e);
      }

      // Don't await the json parsing if status isn't ok
      if (!res.ok) {
        console.log('Auth check failed, status:', res.status);
        setUser(null);
        setAuthChecked(true);
        setLoading(false);
        return false;
      }

      // Parse the response body
      try {
        const data = await res.json();
        console.log('Auth check successful, user data:', data);

        if (data.user) {
          // Make sure we properly extract the user object as expected by the dashboard
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role
          });
          setAuthChecked(true);
          setLoading(false);
          return true;
        } else {
          console.error('Auth response missing user data');
          setUser(null);
          setAuthChecked(true);
          setLoading(false);
          return false;
        }
      } catch (parseError) {
        console.error('Error parsing auth response:', parseError);
        setUser(null);
        setAuthChecked(true);
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Auth check network error:', err);
      setUser(null);
      setAuthChecked(true);
      setLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await res.json();
      setUser(data.user);

      // Force a checkAuth to ensure everything is synchronized
      await checkAuth();

      return data;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      setUser(null);
      router.push('/login');
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || 'Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setUser(data.user);

      // Force a checkAuth to ensure everything is synchronized
      await checkAuth();

      return data;
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        checkAuth,
        authChecked
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
