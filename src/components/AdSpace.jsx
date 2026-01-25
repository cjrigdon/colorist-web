import React from 'react';

const AdSpace = ({ width, height, className = '' }) => {
  // Determine the ad unit ID based on dimensions
  const getAdUnitId = () => {
    if (width === 728 && height === 90) {
      return '728x90'; // Leaderboard
    } else if (width === 160 && height === 600) {
      return '160x600'; // Wide Skyscraper
    }
    return 'default';
  };

  const adUnitId = getAdUnitId();

  return (
    <div 
      className={`bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center ${className}`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`
      }}
    >
      {/* Placeholder for ad - Replace with actual ad code */}
      <div className="text-center text-slate-400 text-xs">
        <div className="mb-2">
          <svg className="w-8 h-8 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        </div>
        <div className="font-medium">Advertisement</div>
        <div className="text-xs mt-1">{width} × {height}</div>
        {/* TODO: Replace with actual ad network code (e.g., Google AdSense) */}
        {/* Example:
        <ins className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-XXXXXXXXXX"
          data-ad-slot="XXXXXXXXXX"
          data-ad-format="auto"
          data-full-width-responsive="true"></ins>
        <script>
          (adsbygoogle = window.adsbygoogle || []).push({});
        </script>
        */}
      </div>
    </div>
  );
};

export default AdSpace;

