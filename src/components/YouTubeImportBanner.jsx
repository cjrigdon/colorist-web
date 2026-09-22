import React from 'react';
import { useYouTubeImport } from '../context/YouTubeImportContext';

const YouTubeImportBanner = ({ compact = false, className = '' }) => {
  const { importing } = useYouTubeImport();

  if (!importing) {
    return null;
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 ${className}`}>
        <span className="h-2 w-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: '#ea3663' }} />
        Importing YouTube videos...
      </div>
    );
  }

  return (
    <div className={`bg-pink-50 border border-pink-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 animate-spin" style={{ color: '#ea3663' }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Importing your YouTube videos</h4>
          <p className="text-xs text-slate-600 mt-0.5">
            We&apos;re bringing in your playlists and videos. This can take a minute.
          </p>
        </div>
      </div>
    </div>
  );
};

export default YouTubeImportBanner;
