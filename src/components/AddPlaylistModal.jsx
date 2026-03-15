import React, { useState } from 'react';
import { playlistsAPI } from '../services/api';

const MODE_CREATE = 'create';
const MODE_IMPORT = 'import';

const AddPlaylistModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(MODE_CREATE);
  const [playlistData, setPlaylistData] = useState({
    title: '',
    playlist_url: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (mode === MODE_CREATE) {
      if (!playlistData.title?.trim()) {
        setError('Please enter a playlist name');
        return;
      }
    } else {
      if (!playlistData.playlist_url?.trim()) {
        setError('Please enter a YouTube playlist URL');
        return;
      }
    }

    try {
      setLoading(true);
      if (mode === MODE_CREATE) {
        await playlistsAPI.create({ title: playlistData.title.trim() });
      } else {
        await playlistsAPI.create({ playlist_url: playlistData.playlist_url.trim() });
      }
      onSuccess();
      onClose();
      setPlaylistData({ title: '', playlist_url: '' });
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError(err.data?.message || err.message || (mode === MODE_IMPORT
        ? 'Failed to add playlist. Please check that the playlist URL is valid and the playlist is public.'
        : 'Failed to create playlist.'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] m-0 p-0" style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}>
      <div className="bg-slate-50 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800 font-venti">Add Playlist</h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Mode toggle */}
          <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => { setMode(MODE_CREATE); setError(null); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === MODE_CREATE ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Create by name
            </button>
            <button
              type="button"
              onClick={() => { setMode(MODE_IMPORT); setError(null); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === MODE_IMPORT ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Import from YouTube
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === MODE_CREATE ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Playlist name *
                </label>
                <input
                  type="text"
                  value={playlistData.title}
                  onChange={(e) => {
                    setPlaylistData({ ...playlistData, title: e.target.value });
                    if (error) setError(null);
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="My playlist"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Create an empty playlist. You can add videos to it from your library later.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  YouTube Playlist URL *
                </label>
                <input
                  type="text"
                  value={playlistData.playlist_url}
                  onChange={(e) => {
                    setPlaylistData({ ...playlistData, playlist_url: e.target.value });
                    if (error) setError(null);
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="https://www.youtube.com/playlist?list=PLxxxxx"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Enter a YouTube playlist URL. The playlist and all videos will be automatically imported.
                  <br />
                  <strong>Note:</strong> The playlist must be public to be imported.
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#ea3663' }}
                disabled={loading}
              >
                {loading ? (mode === MODE_IMPORT ? 'Importing...' : 'Creating...') : (mode === MODE_CREATE ? 'Create Playlist' : 'Import Playlist')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPlaylistModal;

