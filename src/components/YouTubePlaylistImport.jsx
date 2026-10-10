import React, { useEffect, useMemo, useState } from 'react';
import { authAPI, youtubePlaylistsAPI } from '../services/api';
import { setPostAuthRedirect } from '../utils/postAuthRedirect';
import { useYouTubeImport } from '../context/YouTubeImportContext';

export const YOUTUBE_IMPORT_PARAM = 'youtubeImport';

const SEARCH_THRESHOLD = 8;

const YouTubePlaylistImport = ({ onImported, onCancel }) => {
  const { startImport } = useYouTubeImport();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [playlists, setPlaylists] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    youtubePlaylistsAPI.list()
      .then((data) => {
        if (cancelled) return;
        setConnected(data?.connected !== false);
        setPlaylists(Array.isArray(data?.playlists) ? data.playlists : []);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.data?.reason === 'reconnect_required') {
          setConnected(false);
        } else {
          setError(err.data?.message || 'Could not load your YouTube playlists.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const visiblePlaylists = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return playlists;
    return playlists.filter((p) => p.title.toLowerCase().includes(query));
  }, [playlists, search]);

  // Playlists already in the library stay in sync on sign-in, so they aren't offered again
  const importableCount = useMemo(() => playlists.filter((p) => !p.imported_playlist_id).length, [playlists]);
  const visibleImportable = useMemo(() => visiblePlaylists.filter((p) => !p.imported_playlist_id), [visiblePlaylists]);
  const allVisibleSelected = visibleImportable.length > 0 && visibleImportable.every((p) => selected.has(p.id));

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      visibleImportable.forEach((p) => (allVisibleSelected ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      // Come back to the library with this picker open
      const params = new URLSearchParams(window.location.search);
      params.set('section', 'videos');
      params.set(YOUTUBE_IMPORT_PARAM, '1');
      setPostAuthRedirect(`${window.location.pathname}?${params}`);
      const { url } = await authAPI.getYoutubeConnect();
      window.location.href = url;
    } catch (err) {
      setConnecting(false);
      setError(err.data?.message || 'Could not start the YouTube connection. Please try again.');
    }
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await youtubePlaylistsAPI.import([...selected]);
      startImport();
      onImported?.();
    } catch (err) {
      setError(err.data?.message || 'Could not start the import. Please try again.');
      setSubmitting(false);
    }
  };

  const selectedVideoCount = playlists
    .filter((p) => selected.has(p.id))
    .reduce((sum, p) => sum + (p.video_count || 0), 0);

  let body;
  if (loading) {
    body = (
      <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-600">
        <span className="h-5 w-5 rounded-full border-2 border-slate-200 animate-spin" style={{ borderTopColor: '#ea3663' }} />
        Loading your YouTube playlists...
      </div>
    );
  } else if (!connected) {
    body = (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm font-medium text-slate-800">Connect your YouTube account</p>
        <p className="mt-1 text-xs text-slate-600">
          We&apos;ll show your playlists so you can pick which ones to bring into your library.
        </p>
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="mt-4 px-4 py-2 text-sm text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#ea3663' }}
        >
          {connecting ? 'Opening Google...' : 'Connect YouTube'}
        </button>
      </div>
    );
  } else if (playlists.length === 0) {
    body = !error && (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
        No playlists found on your YouTube channel.
      </div>
    );
  } else {
    body = (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {playlists.length > SEARCH_THRESHOLD && (
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm"
            placeholder="Search your playlists"
          />
        )}
        <div className="flex items-center justify-between text-xs text-slate-600">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAllVisible}
              disabled={visibleImportable.length === 0 || submitting}
              className="h-4 w-4 rounded border-slate-300 accent-[#ea3663]"
            />
            Select all{search.trim() ? ' shown' : ''}
          </label>
          <span>{selected.size} of {importableCount} selected</span>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {visiblePlaylists.map((playlist) => {
            const inLibrary = Boolean(playlist.imported_playlist_id);
            const Row = inLibrary ? 'div' : 'label';
            return (
              <li key={playlist.id}>
                <Row className={`flex items-center gap-3 px-3 py-2.5 ${inLibrary ? '' : 'cursor-pointer hover:bg-slate-50'}`}>
                  {inLibrary ? (
                    <span className="w-4 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <input
                      type="checkbox"
                      checked={selected.has(playlist.id)}
                      onChange={() => toggle(playlist.id)}
                      disabled={submitting}
                      className="h-4 w-4 flex-shrink-0 rounded border-slate-300 accent-[#ea3663]"
                    />
                  )}
                  {playlist.thumb ? (
                    <img src={playlist.thumb} alt="" className="w-16 h-9 flex-shrink-0 rounded object-cover bg-slate-100" />
                  ) : (
                    <div className="w-16 h-9 flex-shrink-0 rounded bg-slate-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{playlist.title}</p>
                    <p className="text-xs text-slate-500">
                      {playlist.video_count} {playlist.video_count === 1 ? 'video' : 'videos'}
                      {playlist.privacy && playlist.privacy !== 'public' && ` · ${playlist.privacy.charAt(0).toUpperCase()}${playlist.privacy.slice(1)}`}
                    </p>
                  </div>
                  {inLibrary && (
                    <span
                      className="flex-shrink-0 px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600"
                      title="Already in your library. New videos are added when you sign in with Google."
                    >
                      In library
                    </span>
                  )}
                </Row>
              </li>
            );
          })}
          {visiblePlaylists.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-slate-500">No playlists match &ldquo;{search.trim()}&rdquo;.</li>
          )}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}
      {body}
      <div className="mt-auto flex items-center justify-end gap-3 pt-2">
        {selected.size > 0 && (
          <span className="mr-auto text-xs text-slate-500">
            About {selectedVideoCount} {selectedVideoCount === 1 ? 'video' : 'videos'}
          </span>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          disabled={submitting}
        >
          Cancel
        </button>
        {connected && !loading && playlists.length > 0 && (
          <button
            type="button"
            onClick={handleImport}
            className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#ea3663' }}
            disabled={submitting || selected.size === 0}
          >
            {submitting
              ? 'Starting import...'
              : selected.size === 0
                ? 'Import playlists'
                : `Import ${selected.size} ${selected.size === 1 ? 'playlist' : 'playlists'}`}
          </button>
        )}
      </div>
    </div>
  );
};

export default YouTubePlaylistImport;
