import React, { useState, useEffect } from 'react';
import { playlistsAPI } from '../services/api';

const EditPlaylistModal = ({ isOpen, onClose, onSuccess, playlist }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (playlist) setTitle(playlist.title || '');
  }, [playlist]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!playlist?.id || !title?.trim()) return;
    setError(null);
    try {
      setLoading(true);
      await playlistsAPI.update(playlist.id, { title: title.trim() });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to update playlist.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !playlist) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-slate-50 rounded-2xl shadow-xl max-w-md w-full m-4">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-800 font-venti">Edit Playlist</h3>
          <button type="button" onClick={onClose} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Playlist name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
              placeholder="Playlist name"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" disabled={loading}>Cancel</button>
            <button type="submit" className="px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50" style={{ backgroundColor: '#ea3663' }} disabled={loading || !title?.trim()}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlaylistModal;
