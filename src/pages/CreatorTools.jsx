import React, { useState, useEffect } from 'react';
import { inspirationAPI, coloredPencilSetsAPI } from '../services/api';

const CreatorTools = () => {
  const [selectedInspiration, setSelectedInspiration] = useState(null);
  const [selectedPencilSet, setSelectedPencilSet] = useState(null);
  const [inspirations, setInspirations] = useState([]);
  const [pencilSets, setPencilSets] = useState([]);
  const [loadingInspirations, setLoadingInspirations] = useState(false);
  const [loadingPencilSets, setLoadingPencilSets] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [inspirationSearch, setInspirationSearch] = useState('');
  const [pencilSetSearch, setPencilSetSearch] = useState('');
  const [showInspirationDropdown, setShowInspirationDropdown] = useState(false);
  const [showPencilSetDropdown, setShowPencilSetDropdown] = useState(false);

  useEffect(() => {
    fetchInspirations();
    fetchPencilSets();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowInspirationDropdown(false);
        setShowPencilSetDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchInspirations = async () => {
    try {
      setLoadingInspirations(true);
      const response = await inspirationAPI.getAll(1, 100, { archived: false, type: 'video' });
      const items = response.data || response;
      // Filter to only show videos
      const videos = Array.isArray(items) 
        ? items.filter(item => (item.item_type === 'video' || item.type === 'video'))
        : [];
      setInspirations(videos);
    } catch (err) {
      console.error('Error fetching inspirations:', err);
      setError('Failed to load videos');
    } finally {
      setLoadingInspirations(false);
    }
  };

  const fetchPencilSets = async () => {
    try {
      setLoadingPencilSets(true);
      const response = await coloredPencilSetsAPI.getAll(1, 100, true, { archived: false });
      const items = response.data || response;
      setPencilSets(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Error fetching pencil sets:', err);
      setError('Failed to load pencil sets');
    } finally {
      setLoadingPencilSets(false);
    }
  };

  const filteredInspirations = inspirations.filter(item => {
    if (!inspirationSearch) return true;
    const title = item.title || '';
    return title.toLowerCase().includes(inspirationSearch.toLowerCase());
  });

  const filteredPencilSets = pencilSets.filter(set => {
    if (!pencilSetSearch) return true;
    const setName = set.set?.name || set.name || '';
    const brandName = set.set?.brand?.name || set.brand || '';
    return setName.toLowerCase().includes(pencilSetSearch.toLowerCase()) ||
           brandName.toLowerCase().includes(pencilSetSearch.toLowerCase());
  });

  const handleGenerateLink = () => {
    if (!selectedInspiration || !selectedPencilSet) {
      setError('Please select both a video and a pencil set');
      return;
    }

    // Verify it's a video
    const inspirationType = selectedInspiration.item_type || selectedInspiration.type;
    if (inspirationType !== 'video') {
      setError('Please select a video (not an image or file)');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      
      // Get video embed_id (YouTube video ID)
      const videoEmbedId = selectedInspiration.embed_id || selectedInspiration.videoId;
      if (!videoEmbedId) {
        setError('Selected video does not have a valid embed ID');
        setGenerating(false);
        return;
      }
      
      // Get pencil set size ID
      const pencilSetId = selectedPencilSet.id;
      
      // Generate Color Along URL with query parameters
      const shareableUrl = `${window.location.origin}/color-along?video=${encodeURIComponent(videoEmbedId)}&pencilSet=${encodeURIComponent(pencilSetId)}`;
      setGeneratedLink(shareableUrl);
    } catch (err) {
      console.error('Error generating link:', err);
      setError(err.message || 'Failed to generate shareable link');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      // Show a brief success message
      const button = document.getElementById('copy-button');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('bg-green-500');
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('bg-green-500');
        }, 2000);
      }
    }
  };

  const getInspirationThumbnail = (item) => {
    if (item.thumb) return item.thumb;
    if (item.thumbnail_path) return item.thumbnail_path;
    if (item.thumbnail) return item.thumbnail;
    return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop';
  };

  const getPencilSetThumbnail = (set) => {
    if (set.thumb) return set.thumb;
    if (set.set?.thumb) return set.set.thumb;
    return null;
  };

  const handleGetExtensionFiles = () => {
    // Show detailed instructions
    const instructions = `To install the Colorist Chrome Extension:

1. The extension files are located in the chrome-extension folder of the repository
2. Download or clone the repository to access the extension files
3. Follow the installation steps shown above

Alternatively, you can:
- Contact support for a packaged version
- Check the repository's releases page for a downloadable .zip file

For detailed documentation, see the README.md file in the chrome-extension folder.`;

    alert(instructions);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Chrome Extension Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎨</span>
            <h1 className="text-3xl font-bold text-slate-800">Chrome Extension</h1>
          </div>
          <p className="text-slate-600">
            Install our Chrome extension to quickly generate ColorAlong links directly from YouTube videos.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Features</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Automatically detect YouTube video ID</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Select from your pencil sets</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Generate ColorAlong links with one click</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Copy links to clipboard automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Add links to video descriptions (when editing)</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Installation Instructions</h3>
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                <div>
                  <p className="font-medium">Download the Extension</p>
                  <p className="text-slate-600 mt-1">Download the extension files from the repository or contact support for access.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                <div>
                  <p className="font-medium">Open Chrome Extensions</p>
                  <p className="text-slate-600 mt-1">Navigate to <code className="bg-white px-1.5 py-0.5 rounded text-xs">chrome://extensions/</code> in your browser.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                <div>
                  <p className="font-medium">Enable Developer Mode</p>
                  <p className="text-slate-600 mt-1">Toggle "Developer mode" in the top right corner of the extensions page.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">4</span>
                <div>
                  <p className="font-medium">Load the Extension</p>
                  <p className="text-slate-600 mt-1">Click "Load unpacked" and select the extension folder.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">5</span>
                <div>
                  <p className="font-medium">Login to Colorist</p>
                  <p className="text-slate-600 mt-1">Click the extension icon, enter your email and password, then click Login. URLs are auto-detected automatically.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
            <button
              onClick={handleGetExtensionFiles}
              className="px-6 py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Get Installation Files
            </button>
            <button
              onClick={() => {
                const instructions = `To open Chrome Extensions page:

1. Copy this URL: chrome://extensions/
2. Paste it into your Chrome address bar
3. Press Enter

Or:
- Click the three dots menu (⋮) in Chrome
- Go to More tools → Extensions`;
                alert(instructions);
              }}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to Open Extensions
            </button>
          </div>
        </div>
      </div>

      {/* Link Generator Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Color Along Link Generator</h1>
          <p className="text-slate-600">
            Create a shareable link to the Color Along page that pre-populates a video and pencil set for your audience.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Inspiration Selection */}
          <div className="dropdown-container">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Video
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for a video..."
                value={inspirationSearch}
                onChange={(e) => {
                  setInspirationSearch(e.target.value);
                  setShowInspirationDropdown(true);
                }}
                onFocus={() => setShowInspirationDropdown(true)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              {showInspirationDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {loadingInspirations ? (
                    <div className="p-4 text-center text-slate-500">Loading...</div>
                  ) : filteredInspirations.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">No videos found</div>
                  ) : (
                    filteredInspirations.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedInspiration(item);
                          setInspirationSearch(item.title || 'Untitled');
                          setShowInspirationDropdown(false);
                        }}
                        className="w-full text-left p-3 hover:bg-slate-50 flex items-center space-x-3 border-b border-slate-100 last:border-b-0"
                      >
                        <img
                          src={getInspirationThumbnail(item)}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {item.title || 'Untitled'}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">
                            {item.item_type || item.type || 'unknown'}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedInspiration && (
              <div className="mt-2 p-3 bg-slate-50 rounded-lg flex items-center space-x-3">
                <img
                  src={getInspirationThumbnail(selectedInspiration)}
                  alt={selectedInspiration.title}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{selectedInspiration.title || 'Untitled'}</p>
                  <p className="text-xs text-slate-500 capitalize">
                    {selectedInspiration.item_type || selectedInspiration.type || 'unknown'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedInspiration(null);
                    setInspirationSearch('');
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Pencil Set Selection */}
          <div className="dropdown-container">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Pencil Set
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for a pencil set..."
                value={pencilSetSearch}
                onChange={(e) => {
                  setPencilSetSearch(e.target.value);
                  setShowPencilSetDropdown(true);
                }}
                onFocus={() => setShowPencilSetDropdown(true)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              {showPencilSetDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {loadingPencilSets ? (
                    <div className="p-4 text-center text-slate-500">Loading...</div>
                  ) : filteredPencilSets.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">No pencil sets found</div>
                  ) : (
                    filteredPencilSets.map((set) => {
                      const setName = set.set?.name || set.name || 'Unknown';
                      const brandName = set.set?.brand?.name || set.brand || 'Unknown';
                      const thumbnail = getPencilSetThumbnail(set);
                      return (
                        <button
                          key={set.id}
                          onClick={() => {
                            setSelectedPencilSet(set);
                            setPencilSetSearch(`${brandName} - ${setName}`);
                            setShowPencilSetDropdown(false);
                          }}
                          className="w-full text-left p-3 hover:bg-slate-50 flex items-center space-x-3 border-b border-slate-100 last:border-b-0"
                        >
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={setName}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-slate-200 rounded flex items-center justify-center">
                              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{setName}</p>
                            <p className="text-xs text-slate-500 truncate">{brandName}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            {selectedPencilSet && (
              <div className="mt-2 p-3 bg-slate-50 rounded-lg flex items-center space-x-3">
                {getPencilSetThumbnail(selectedPencilSet) ? (
                  <img
                    src={getPencilSetThumbnail(selectedPencilSet)}
                    alt={selectedPencilSet.set?.name || selectedPencilSet.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-slate-200 rounded flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    {selectedPencilSet.set?.name || selectedPencilSet.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedPencilSet.set?.brand?.name || selectedPencilSet.brand || 'Unknown'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPencilSet(null);
                    setPencilSetSearch('');
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateLink}
            disabled={!selectedInspiration || !selectedPencilSet || generating}
            className="w-full px-6 py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? 'Generating...' : 'Generate Color Along Link'}
          </button>

          {/* Generated Link */}
          {generatedLink && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-2">Color Along Link Generated!</p>
              <p className="text-xs text-green-700 mb-3">Share this link to let others color along with your selected video and pencil set.</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm text-slate-800"
                />
                <button
                  id="copy-button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Copy Link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorTools;

