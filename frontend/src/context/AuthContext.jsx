import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('qnu_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('qnu_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Hết phiên');
          return res.json();
        })
        .then(userData => {
          setUser(userData);
          localStorage.setItem('qnu_user', JSON.stringify(userData));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Đăng nhập không thành công');
    }
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('qnu_token', data.token);
    localStorage.setItem('qnu_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('qnu_token');
    localStorage.removeItem('qnu_user');
  };

  const changePassword = async (current_password, new_password, confirm_password) => {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ current_password, new_password, confirm_password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Đổi mật khẩu thất bại');
    }
    // Update is_first_login
    if (user) {
      const updatedUser = { ...user, is_first_login: false };
      setUser(updatedUser);
      localStorage.setItem('qnu_user', JSON.stringify(updatedUser));
    }
    return data;
  };

  const apiFetch = async (url, options = {}) => {
    const headers = {
      ...(options.headers || {})
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      logout();
      throw new Error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, changePassword, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
