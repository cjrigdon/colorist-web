import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Color distance calculation using Euclidean distance in RGB space
const colorDistance = (color1, color2) => {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  
  return Math.sqrt(
    Math.pow(r2 - r1, 2) + 
    Math.pow(g2 - g1, 2) + 
    Math.pow(b2 - b1, 2)
  );
};

// Find closest matching color
const findClosestColor = (sourceColor, targetSet) => {
  let closest = null;
  let minDistance = Infinity;
  
  targetSet.colors.forEach((targetColor) => {
    const distance = colorDistance(sourceColor.hex, targetColor.hex);
    if (distance < minDistance) {
      minDistance = distance;
      closest = { ...targetColor, distance };
    }
  });
  
  return closest;
};

const ColorAlong = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [videoId, setVideoId] = useState('');
  const [videoSetId, setVideoSetId] = useState(null);
  const [userSetId, setUserSetId] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Get video from location state if navigating from Library
  useEffect(() => {
    if (location.state?.video) {
      setSelectedVideo(location.state.video);
      setVideoId(location.state.video.id || '');
    }
  }, [location.state]);

  const pencilSets = [
    {
      id: 1,
      name: 'Prismacolor Premier',
      brand: 'Prismacolor',
      count: 150,
      colors: [
        { id: 1, name: 'Crimson Red', hex: '#DC143C', inStock: true },
        { id: 2, name: 'True Blue', hex: '#0073CF', inStock: true },
        { id: 3, name: 'Lime Peel', hex: '#D0E429', inStock: false },
        { id: 4, name: 'Violet', hex: '#8B00FF', inStock: true },
        { id: 5, name: 'Canary Yellow', hex: '#FFEF00', inStock: true },
        { id: 6, name: 'Forest Green', hex: '#228B22', inStock: true },
        { id: 7, name: 'Orange', hex: '#FFA500', inStock: true },
      ]
    },
    {
      id: 2,
      name: 'Faber-Castell Polychromos',
      brand: 'Faber-Castell',
      count: 120,
      colors: [
        { id: 1, name: 'Scarlet Red', hex: '#FF2400', inStock: true },
        { id: 2, name: 'Cobalt Blue', hex: '#0047AB', inStock: true },
        { id: 3, name: 'Lemon Yellow', hex: '#FFF700', inStock: true },
        { id: 4, name: 'Purple Violet', hex: '#8A2BE2', inStock: false },
        { id: 5, name: 'Emerald Green', hex: '#50C878', inStock: true },
        { id: 6, name: 'Burnt Orange', hex: '#CC5500', inStock: true },
      ]
    },
    {
      id: 3,
      name: 'Derwent Coloursoft',
      brand: 'Derwent',
      count: 72,
      colors: [
        { id: 1, name: 'Rose', hex: '#FF007F', inStock: true },
        { id: 2, name: 'Sky Blue', hex: '#87CEEB', inStock: true },
        { id: 3, name: 'Forest Green', hex: '#228B22', inStock: true },
        { id: 4, name: 'Lavender', hex: '#E6E6FA', inStock: true },
        { id: 5, name: 'Sunset Yellow', hex: '#FFD700', inStock: true },
      ]
    },
    {
      id: 4,
      name: 'Caran d\'Ache Luminance',
      brand: 'Caran d\'Ache',
      count: 76,
      colors: [
        { id: 1, name: 'Scarlet', hex: '#FF1D15', inStock: true },
        { id: 2, name: 'Prussian Blue', hex: '#003153', inStock: true },
        { id: 3, name: 'Yellow', hex: '#FFFF00', inStock: true },
        { id: 4, name: 'Violet', hex: '#8F00FF', inStock: true },
        { id: 5, name: 'Green', hex: '#00FF00', inStock: true },
      ]
    },
  ];

  // Mock inspiration videos
  const inspirationVideos = [
    { id: 'dQw4w9WgXcQ', title: 'Watercolor Pencil Techniques', thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop' },
    { id: 'jNQXAC9IVRw', title: 'Blending Techniques', thumbnail: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop' },
  ];

  const videoSet = pencilSets.find(set => set.id === videoSetId);
  const userSet = pencilSets.find(set => set.id === userSetId);

  const getMatches = () => {
    if (!videoSet || !userSet) return [];

    return videoSet.colors.map(videoColor => ({
      videoColor,
      match: findClosestColor(videoColor, userSet)
    }));
  };

  const matches = getMatches();

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setVideoId(video.id);
  };

  const handleLoadVideo = () => {
    if (videoId) {
      setSelectedVideo({ id: videoId, title: 'Custom Video' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Pencil Set Selection and Video Selection Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pencil Sets and Color Matches */}
        <div className="lg:col-span-1 space-y-6">
          {/* Pencil Set Selection Section */}
          {(!videoSetId || !userSetId) && (
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 font-venti">Pencil Sets</h3>
              <div className="space-y-4">
                {/* Video Set Selection */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3 font-venti">Video Set</h4>
                  <select
                    value={videoSetId || ''}
                    onChange={(e) => setVideoSetId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#ea3663' }}
                  >
                    <option value="">Select the set used in the video...</option>
                    {pencilSets.map((set) => (
                      <option key={set.id} value={set.id}>
                        {set.name} ({set.brand}) - {set.count} colors
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Set Selection */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3 font-venti">Your Set</h4>
                  <select
                    value={userSetId || ''}
                    onChange={(e) => setUserSetId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#ea3663' }}
                  >
                    <option value="">Select your pencil set...</option>
                    {pencilSets.map((set) => (
                      <option key={set.id} value={set.id}>
                        {set.name} ({set.brand}) - {set.count} colors
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Color Matches Section */}
          {matches.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 font-venti">Color Matches</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Matches from {userSet.name}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setVideoSetId(null);
                        setUserSetId(null);
                      }}
                      className="text-xs text-slate-600 hover:text-slate-800 transition-colors underline"
                    >
                      Change pencil sets
                    </button>
                  </div>
                </div>

                <div className="p-4 max-h-[600px] overflow-y-auto">
                  <div className="space-y-3">
                    {matches.map(({ videoColor, match }) => (
                      <div
                        key={videoColor.id}
                        className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:shadow-md transition-all"
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                      >
                        <div className="flex items-center space-x-3">
                          {/* Video Color */}
                          <div className="flex-1">
                            <p className="text-xs font-medium text-slate-600 mb-1">Video</p>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-8 h-8 rounded-lg shadow-sm border border-slate-200 flex-shrink-0"
                                style={{ backgroundColor: videoColor.hex }}
                              ></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-800 truncate">{videoColor.name}</p>
                                <p className="text-xs text-slate-500 font-mono truncate">{videoColor.hex}</p>
                              </div>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="text-slate-400 flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>

                          {/* Match Color */}
                          <div className="flex-1">
                            <p className="text-xs font-medium text-slate-600 mb-1">Your Match</p>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-8 h-8 rounded-lg shadow-sm border border-slate-200 flex-shrink-0"
                                style={{ backgroundColor: match.hex }}
                              ></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-800 truncate">{match.name}</p>
                                <p className="text-xs text-slate-500 font-mono truncate">{match.hex}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-400 text-center mt-2">
                          Distance: {Math.round(match.distance)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Video Selection */}
        <div className="lg:col-span-2 bg-slate-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 font-venti">Video Selection</h3>
          
          {!selectedVideo ? (
          <div className="space-y-4">
            {/* Video ID Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Enter YouTube Video ID
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={videoId}
                  onChange={(e) => setVideoId(e.target.value)}
                  placeholder="e.g., dQw4w9WgXcQ"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ focusRingColor: '#ea3663' }}
                />
                <button
                  onClick={handleLoadVideo}
                  disabled={!videoId}
                  className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#ea3663'
                  }}
                  onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#d12a4f')}
                  onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#ea3663')}
                >
                  Load Video
                </button>
              </div>
            </div>

            {/* Inspiration Videos */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Or choose from your inspiration videos
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {inspirationVideos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => handleVideoSelect(video)}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all text-left"
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div className="relative aspect-video bg-slate-100">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <div className="w-10 h-10 rounded-full bg-white bg-opacity-90 flex items-center justify-center">
                          <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#49817b' }}>
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-slate-800 line-clamp-2">{video.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-slate-800">{selectedVideo.title}</h4>
                <p className="text-sm text-slate-600">Video ID: {selectedVideo.id}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedVideo(null);
                  setVideoId('');
                }}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Change Video
              </button>
            </div>
            <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedVideo.id}`}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Empty States */}
      {selectedVideo && !videoSetId && !userSetId && (
        <div className="bg-slate-50 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">✏️</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">Select Pencil Sets</h3>
          <p className="text-slate-600">Choose the video set and your set to see color matches</p>
        </div>
      )}

      {!selectedVideo && (
        <div className="bg-slate-50 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">Select a Video</h3>
          <p className="text-slate-600">Enter a video ID or choose from your inspiration videos to get started</p>
        </div>
      )}
    </div>
  );
};

export default ColorAlong;

