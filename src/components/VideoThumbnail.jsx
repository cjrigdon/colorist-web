import React from 'react';

/**
 * Video thumbnail component with play icon overlay
 */
const VideoThumbnail = ({ 
  thumbnail, 
  alt = 'Video thumbnail', 
  onError,
  className = '',
  playIconSize = 'w-12 h-12',
  playIconColor = '#49817b'
}) => {
  const defaultThumbnail = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop';
  
  const handleError = (e) => {
    e.target.src = defaultThumbnail;
    if (onError) onError(e);
  };

  return (
    <div className={`relative aspect-video bg-slate-100 overflow-hidden ${className}`}>
      <img
        src={thumbnail || defaultThumbnail}
        alt={alt}
        className="w-full h-full object-cover"
        onError={handleError}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
        <div className={`${playIconSize} rounded-full bg-white bg-opacity-90 flex items-center justify-center`}>
          <svg className={`${playIconSize === 'w-12 h-12' ? 'w-6 h-6' : 'w-5 h-5'} ml-1`} fill="currentColor" viewBox="0 0 24 24" style={{ color: playIconColor }}>
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default VideoThumbnail;

