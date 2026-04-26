import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { playlistsAPI } from '../services/api';
import VideoThumbnail from '../components/VideoThumbnail';
import HoverableCard from '../components/HoverableCard';
import PrimaryButton from '../components/PrimaryButton';
import ErrorState from '../components/ErrorState';

const PlaylistVideos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { playlistId } = useParams();
  const resolvedPlaylistId = useMemo(() => {
    if (playlistId) return playlistId;
    const match = location.pathname.match(/\/studio\/inspiration\/playlists\/([^/]+)/);
    return match?.[1] || null;
  }, [playlistId, location.pathname]);
  const [playlistTitle, setPlaylistTitle] = useState('Playlist');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlaylistVideos = useCallback(async () => {
    if (!resolvedPlaylistId) {
      setLoading(false);
      setError('Invalid playlist URL.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [playlistResponse, videosResponse] = await Promise.all([
        playlistsAPI.getById(resolvedPlaylistId),
        playlistsAPI.getVideos(resolvedPlaylistId),
      ]);

      const playlistData = playlistResponse?.data ?? playlistResponse ?? {};
      setPlaylistTitle(playlistData.title || 'Untitled Playlist');

      const videosData = Array.isArray(videosResponse) ? videosResponse : (videosResponse?.data ?? []);
      const transformedVideos = (videosData || []).map((video) => ({
        id: Number(video.id) || video.id,
        title: video.title || 'Untitled Video',
        thumbnail: video.thumb || `https://img.youtube.com/vi/${video.embed_id}/hqdefault.jpg`,
        videoId: video.embed_id,
      }));
      setVideos(transformedVideos);
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to load playlist videos.');
    } finally {
      setLoading(false);
    }
  }, [resolvedPlaylistId]);

  useEffect(() => {
    fetchPlaylistVideos();
  }, [fetchPlaylistVideos]);

  if (loading) {
    return (
      <div className="bg-white p-12 text-center">
        <div className="modern-loader mb-4">
          <div className="loader-ring">
            <div className="loader-ring-segment"></div>
            <div className="loader-ring-segment"></div>
            <div className="loader-ring-segment"></div>
            <div className="loader-ring-segment"></div>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">Loading Playlist Videos...</h3>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate('/studio/inspiration?section=playlists')}
            className="text-sm text-slate-500 hover:text-slate-700 mb-2"
          >
            ← Back to Playlists
          </button>
          <h2 className="text-2xl font-semibold text-slate-800">{playlistTitle}</h2>
          <p className="text-sm text-slate-500">{videos.length} {videos.length === 1 ? 'video' : 'videos'}</p>
        </div>
      </div>

      {error && <ErrorState error={error} />}

      {!error && videos.length === 0 && (
        <div className="text-center py-10">
          <p className="text-slate-500">No videos in this playlist yet.</p>
        </div>
      )}

      {!error && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {videos.map((video) => (
            <HoverableCard key={video.id} className="group relative">
              <div className="w-full">
                <VideoThumbnail
                  thumbnail={video.thumbnail}
                  alt={video.title}
                  className="group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-4">
                  <h3 className="font-medium text-slate-800 line-clamp-2">{video.title}</h3>
                </div>
              </div>
              <div className="absolute inset-0 z-10 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 rounded-xl">
                <button
                  onClick={() => navigate(`/edit/inspiration/video/${video.id}`)}
                  className="w-40 min-h-10 text-xs px-3 py-2 bg-white text-slate-800 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                  title="Edit"
                >
                  Edit
                </button>
                <PrimaryButton
                  onClick={() => {
                    if (video.videoId) navigate(`/color-along?video=${video.videoId}`);
                  }}
                  className="w-40 min-h-10 justify-center"
                  icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
                >
                  Color Along
                </PrimaryButton>
              </div>
            </HoverableCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaylistVideos;
