import React from 'react';
import { useYouTubeImport } from '../context/YouTubeImportContext';

const YouTubeImportPlaceholder = ({ count = 1 }) => {
  const { importing } = useYouTubeImport();

  if (!importing) {
    return null;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`youtube-import-placeholder-${index}`}
          className="rounded-xl border border-dashed border-slate-200 bg-slate-50 overflow-hidden"
        >
          <div className="relative aspect-video bg-slate-100 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
              <svg className="w-5 h-5 animate-spin" style={{ color: '#ea3663' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
            <p className="text-xs text-slate-500">Importing from YouTube...</p>
          </div>
        </div>
      ))}
    </>
  );
};

export default YouTubeImportPlaceholder;
