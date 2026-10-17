import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (accessToken) {
        try {
          const res = await api.get('/users/profile/');
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Failed to load user profile:', err);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [accessToken]);

  const login = async (username, password) => {
    try {
      const res = await api.post('/users/login/', { username, password });
      const { user: userData, access, refresh, message } = res.data;
      
      setUser(userData);
      setAccessToken(access);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      showToast(message || 'Welcome back!');
      return { success: true, user: userData };
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Login failed. Please check credentials.';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/users/register/', formData);
      const { user: userData, access, refresh, message } = res.data;
      
      setUser(userData);
      setAccessToken(access);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      showToast(message || 'Account created successfully!');
      return { success: true, user: userData };
    } catch (err) {
      let errMsg = 'Registration failed.';
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'string') {
          errMsg = errors;
        } else if (typeof errors === 'object' && errors !== null) {
          const keys = Object.keys(errors);
          if (keys.length > 0) {
            const val = errors[keys[0]];
            if (Array.isArray(val)) {
              const firstVal = val[0];
              errMsg = `${keys[0]}: ${typeof firstVal === 'object' ? JSON.stringify(firstVal) : firstVal}`;
            } else if (typeof val === 'object' && val !== null) {
              errMsg = `${keys[0]}: ${JSON.stringify(val)}`;
            } else {
              errMsg = `${keys[0]}: ${val}`;
            }
          }
        }
      }
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    showToast('Logged out successfully.', 'info');
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.put('/users/profile/', data, {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
      });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      showToast('Profile updated successfully!');
      return { success: true, user: res.data };
    } catch (err) {
      showToast('Failed to update profile.', 'error');
      return { success: false, error: err };
    }
  };

  const isCustomer = user?.role === 'CUSTOMER';
  const isHotelOwner = user?.role === 'HOTEL_OWNER';
  const isHotelStaff = user?.role === 'HOTEL_STAFF';
  const isAdmin = user?.role === 'ADMIN' || user?.is_superuser;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.is_superuser;
  const isSupportAgent = user?.role === 'SUPPORT_AGENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        toast,
        showToast,
        login,
        register,
        logout,
        updateProfile,
        isCustomer,
        isHotelOwner,
        isHotelStaff,
        isAdmin,
        isSuperAdmin,
        isSupportAgent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
