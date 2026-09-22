import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';

const YouTubeImportContext = createContext({ importing: false });

export function YouTubeImportProvider({ user, children }) {
  const [importing, setImporting] = useState(!!user?.youtube_import_running);

  useEffect(() => {
    setImporting(!!user?.youtube_import_running);
  }, [user?.youtube_import_running]);

  useEffect(() => {
    if (!importing) {
      return undefined;
    }

    let cancelled = false;
    const poll = async () => {
      try {
        const latest = await authAPI.getUser();
        if (cancelled) {
          return;
        }
        const stillRunning = !!latest?.youtube_import_running;
        setImporting(stillRunning);
        if (!stillRunning) {
          window.dispatchEvent(new CustomEvent('youtube-import-finished'));
        }
      } catch (error) {
        console.error('Error polling YouTube import status:', error);
      }
    };

    const intervalId = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [importing]);

  return (
    <YouTubeImportContext.Provider value={{ importing }}>
      {children}
    </YouTubeImportContext.Provider>
  );
}

export function useYouTubeImport() {
  return useContext(YouTubeImportContext);
}

export function useYouTubeImportRefresh(onFinished) {
  useEffect(() => {
    if (!onFinished) {
      return undefined;
    }
    const handler = () => onFinished();
    window.addEventListener('youtube-import-finished', handler);
    return () => window.removeEventListener('youtube-import-finished', handler);
  }, [onFinished]);
}
