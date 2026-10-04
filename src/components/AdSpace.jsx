import React, { useEffect, useRef } from 'react';

const AD_CLIENT = 'ca-pub-4114815321990959';
const AD_SLOT = '5825940616';

const AdSpace = ({ width, height, className = '' }) => {
  const adRef = useRef(null);

  useEffect(() => {
    const ad = adRef.current;
    // AdSense throws if push() runs twice for the same <ins> (e.g. React StrictMode re-running effects)
    if (!ad || ad.getAttribute('data-adsbygoogle-status')) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.warn('AdSense failed to load an ad:', error);
    }
  }, []);

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 border border-slate-200 rounded-lg ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-400 text-xs pointer-events-none">
        <svg className="w-8 h-8 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
        <div className="font-medium">Advertisement</div>
      </div>
      <ins
        ref={adRef}
        className="adsbygoogle relative"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSpace;
