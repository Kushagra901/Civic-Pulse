import React, { useState, useEffect } from 'react';
import { tokenStore } from './api';

// Decode JWT payload helper
function getPayload(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function getUserFromToken() {
  const token = tokenStore.access;
  const payload = getPayload(token);
  if (!payload) return null;
  const name = localStorage.getItem("userName") || "";
  return { id: payload.sub, role: payload.role, name };
}

export function useAuth() {
  const [user, setUser] = useState(getUserFromToken());

  useEffect(() => {
    const handleStorage = () => {
      setUser(getUserFromToken());
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 1000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  return { user };
}
