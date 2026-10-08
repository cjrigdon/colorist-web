import React, { useEffect, useRef, useState } from 'react';
import { playlistsAPI } from '../services/api';

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop';

const playlistThumbnail = (playlist) => playlist?.thumb || FALLBACK_THUMB;

const normalizeTitle = (title) => (title || '').trim().toLowerCase();

export const findPlaylistByTitle = (playlists, title) => {
  const target = normalizeTitle(title);
  return target ? playlists.find((playlist) => normalizeTitle(playlist.title) === target) : undefined;
};

export const createPlaylistNamed = async (title) => {
  const response = await playlistsAPI.create({ title: title.trim() });
  return response?.data?.id != null ? response.data : response;
};

const PlaylistThumb = ({ playlist }) => (
  <img
    src={playlistThumbnail(playlist)}
    alt={playlist?.title || 'Playlist thumbnail'}
    className="w-8 h-6 rounded object-cover flex-shrink-0"
    onError={(e) => {
      e.target.src = FALLBACK_THUMB;
    }}
  />
);

const PlaylistSelect = ({ playlists, onPlaylistCreated, value, onChange, disabled = false, label = 'Add to playlist (optional)' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const menuRef = useRef(null);

  const selectedPlaylist = playlists.find((playlist) => String(playlist.id) === String(value));
  const trimmedQuery = query.trim();
  const filtered = trimmedQuery
    ? playlists.filter((playlist) => normalizeTitle(playlist.title).includes(normalizeTitle(trimmedQuery)))
    : playlists;
  const exactMatch = findPlaylistByTitle(playlists, trimmedQuery);
  const canCreate = Boolean(trimmedQuery) && !exactMatch;

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    searchRef.current?.focus({ preventScroll: true });
    menuRef.current?.scrollIntoView({ block: 'nearest' });
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setError(null);
    }
  }, [open]);

  const choose = (playlistId) => {
    onChange(playlistId ? String(playlistId) : '');
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!canCreate || creating) return;
    try {
      setCreating(true);
      setError(null);
      const playlist = await createPlaylistNamed(trimmedQuery);
      onPlaylistCreated(playlist);
      choose(playlist.id);
    } catch (err) {
      setError(err?.data?.message || 'Could not create the playlist.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white flex items-center justify-between"
        disabled={disabled}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selectedPlaylist ? (
            <>
              <PlaylistThumb playlist={selectedPlaylist} />
              <span className="truncate">{selectedPlaylist.title || 'Untitled Playlist'}</span>
            </>
          ) : (
            <span className="text-slate-500">No playlist</span>
          )}
        </span>
        <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div ref={menuRef} className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="p-2 border-b border-slate-100">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (exactMatch) choose(exactMatch.id);
                  else handleCreate();
                } else if (e.key === 'Escape') {
                  setOpen(false);
                }
              }}
              placeholder="Search or name a new playlist..."
              maxLength={255}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300"
              aria-label="Search playlists"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {!trimmedQuery && (
              <button
                type="button"
                onClick={() => choose('')}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${!value ? 'bg-slate-50 text-slate-800 font-medium' : 'text-slate-700'}`}
              >
                No playlist
              </button>
            )}
            {filtered.map((playlist) => (
              <button
                key={playlist.id}
                type="button"
                onClick={() => choose(playlist.id)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${String(value) === String(playlist.id) ? 'bg-slate-50 text-slate-800 font-medium' : 'text-slate-700'}`}
              >
                <PlaylistThumb playlist={playlist} />
                <span className="truncate">{playlist.title || 'Untitled Playlist'}</span>
              </button>
            ))}
            {trimmedQuery && filtered.length === 0 && !canCreate && (
              <p className="px-3 py-2 text-sm text-slate-500">No matching playlists</p>
            )}
            {canCreate && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full px-3 py-2 text-left text-sm font-medium text-[#ea3663] hover:bg-pink-50 flex items-center gap-2 border-t border-slate-100 disabled:opacity-60"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="truncate">{creating ? 'Creating...' : `Create playlist "${trimmedQuery}"`}</span>
              </button>
            )}
            {error && <p className="px-3 py-2 text-xs text-red-600">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistSelect;
