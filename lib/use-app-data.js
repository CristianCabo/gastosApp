'use client';

import { useState, useEffect, useCallback } from 'react';

export function useAppData() {
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const reloadCategories = useCallback(async () => {
    const res = await fetch('/api/categories');
    const json = await res.json();
    setCategories(json.data || []);
  }, []);

  const reloadProfile = useCallback(async () => {
    const res = await fetch('/api/profile');
    const json = await res.json();
    setProfile(json.data || null);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([reloadCategories(), reloadProfile()]);
      setLoading(false);
    })();
  }, [reloadCategories, reloadProfile]);

  return { profile, categories, loading, reloadCategories, reloadProfile, setProfile };
}
