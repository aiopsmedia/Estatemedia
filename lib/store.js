'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  apiGetAll, apiCreate, apiUpdate, apiDelete, apiLogin, apiSeed,
  hasPermission,
} from './data';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const collectionsCache = useRef({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await apiSeed();
      } catch {
        // Seed may fail if already initialized
      }
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('estate_currentUser') : null;
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (!parsed.role) {
            try {
              const roleData = await apiGetAll('roles');
              parsed.role = roleData.find(r => r.id === parsed.roleId || r._id === parsed.roleId) || null;
            } catch {}
          }
          setUser(parsed);
        } catch {
          localStorage.removeItem('estate_currentUser');
        }
      }
      setLoading(false);
      setInitialized(true);
    }
    init();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const u = await apiLogin(email, password);
      const fullUser = { ...u };
      setUser(fullUser);
      collectionsCache.current = {};
      if (typeof window !== 'undefined') {
        localStorage.setItem('estate_currentUser', JSON.stringify(fullUser));
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    collectionsCache.current = {};
    if (typeof window !== 'undefined') {
      localStorage.removeItem('estate_currentUser');
    }
  }, []);

  const refresh = useCallback(() => {
    collectionsCache.current = {};
    setRefreshKey(k => k + 1);
  }, []);

  const getCollection = useCallback(async (key, query = {}) => {
    const cacheKey = key + JSON.stringify(query);
    if (collectionsCache.current[cacheKey]) {
      return collectionsCache.current[cacheKey];
    }
    try {
      const data = await apiGetAll(key, query);
      collectionsCache.current[cacheKey] = data;
      return data;
    } catch {
      return [];
    }
  }, [refreshKey]);

  const addItemToCollection = useCallback(async (key, item) => {
    const newItem = { ...item };
    if (!newItem.createdAt) newItem.createdAt = new Date().toISOString();
    const result = await apiCreate(key, newItem);
    refresh();
    return result;
  }, [refresh]);

  const updateItemInCollection = useCallback(async (key, id, updates) => {
    const result = await apiUpdate(key, id, { ...updates, updatedAt: new Date().toISOString() });
    refresh();
    return result;
  }, [refresh]);

  const deleteItemFromCollection = useCallback(async (key, id) => {
    const result = await apiDelete(key, id);
    refresh();
    return result;
  }, [refresh]);

  const checkPermission = useCallback((permId) => {
    return hasPermission(user, permId);
  }, [user]);

  const value = {
    user, loading, sidebarOpen, setSidebarOpen, refreshKey, initialized,
    login, logout, refresh,
    getCollection, addItemToCollection, updateItemInCollection,
    deleteItemFromCollection, checkPermission,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
