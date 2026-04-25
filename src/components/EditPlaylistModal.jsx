import React, { useEffect, useMemo, useState } from 'react';
import { booksAPI, playlistsAPI } from '../services/api';

const THUMBNAIL_SOURCE_UPLOAD = 'upload';
const THUMBNAIL_SOURCE_BOOK = 'book';
const THUMBNAIL_SOURCE_VIDEO = 'video';

const getBookImageUrl = (book) => {
  if (!book?.image) return null;
  if (book.image.startsWith('http://') || book.image.startsWith('https://') || book.image.startsWith('data:')) {
    return book.image;
  }
  if (book.image.startsWith('app/public/')) {
    const path = book.image.replace('app/public/', '');
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    return `${baseUrl}/storage/${path}`;
  }
  return book.image;
};

const getVideoThumbUrl = (video) => {
  if (video?.thumb) return video.thumb;
  if (video?.thumbnail) return video.thumbnail;
  if (video?.embed_id) return `https://img.youtube.com/vi/${video.embed_id}/hqdefault.jpg`;
  if (video?.embedId) return `https://img.youtube.com/vi/${video.embedId}/hqdefault.jpg`;
  if (video?.videoId) return `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
  return null;
};

const EditPlaylistModal = ({ isOpen, onClose, onSuccess, playlist }) => {
  const [loading, setLoading] = useState(false);
  const [booksLoading, setBooksLoading] = useState(false);
  const [playlistVideosLoading, setPlaylistVideosLoading] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [thumbnailSource, setThumbnailSource] = useState(THUMBNAIL_SOURCE_UPLOAD);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [bookThumbnails, setBookThumbnails] = useState([]);
  const [playlistVideoThumbnails, setPlaylistVideoThumbnails] = useState([]);
  const [selectedBookThumbnail, setSelectedBookThumbnail] = useState('');
  const [selectedVideoThumbnail, setSelectedVideoThumbnail] = useState('');

  useEffect(() => {
    if (!playlist) return;
    setTitle(playlist.title || '');
    setError(null);
    setThumbnailSource(THUMBNAIL_SOURCE_UPLOAD);
    setThumbnailFile(null);
    setThumbnailPreview('');
    setSelectedBookThumbnail('');
    setSelectedVideoThumbnail('');
  }, [playlist]);

  useEffect(() => {
    if (!isOpen || !playlist?.id) return;
    const initialVideoThumbs = [];
    const seen = new Set();
    const addVideoThumb = (video) => {
      const thumb = getVideoThumbUrl(video);
      if (!thumb || seen.has(thumb)) return;
      seen.add(thumb);
      initialVideoThumbs.push({
        id: `${video.id || video.embed_id || video.embedId || video.videoId || thumb}`,
        image: thumb,
        title: video.title || 'Playlist video',
      });
    };
    (playlist.videos || []).forEach(addVideoThumb);
    (playlist.preview_items || []).filter((item) => item.type === 'video').forEach(addVideoThumb);
    setPlaylistVideoThumbnails(initialVideoThumbs);
  }, [isOpen, playlist]);

  const loadBookThumbnails = async () => {
    if (bookThumbnails.length > 0 || booksLoading) return;
    try {
      setBooksLoading(true);
      const thumbs = [];
      const seen = new Set();
      let page = 1;
      let lastPage = 1;

      do {
        const response = await booksAPI.getAll(page, 100);
        const books = Array.isArray(response) ? response : (response?.data || []);
        books.forEach((book) => {
          if (book.archived) return;
          const imageUrl = getBookImageUrl(book);
          if (!imageUrl || seen.has(imageUrl)) return;
          seen.add(imageUrl);
          thumbs.push({
            id: `${book.id}-${imageUrl}`,
            image: imageUrl,
            title: book.title || `Book ${book.id}`,
          });
        });
        if (Array.isArray(response)) {
          lastPage = 1;
        } else {
          lastPage = Number(response?.last_page || page);
        }
        page += 1;
      } while (page <= lastPage);

      setBookThumbnails(thumbs);
    } catch (err) {
      console.error('Error loading book thumbnails:', err);
      setError('Failed to load book thumbnails.');
    } finally {
      setBooksLoading(false);
    }
  };

  const loadPlaylistVideoThumbnails = async () => {
    if (!playlist?.id || playlistVideosLoading) return;
    try {
      setPlaylistVideosLoading(true);
      const response = await playlistsAPI.getVideos(playlist.id);
      const videos = Array.isArray(response) ? response : (response?.data || []);
      const seen = new Set();
      const thumbs = [];
      videos.forEach((video) => {
        const thumb = getVideoThumbUrl(video);
        if (!thumb || seen.has(thumb)) return;
        seen.add(thumb);
        thumbs.push({
          id: `${video.id || video.embed_id || thumb}`,
          image: thumb,
          title: video.title || 'Playlist video',
        });
      });
      setPlaylistVideoThumbnails(thumbs);
    } catch (err) {
      console.error('Error loading playlist videos:', err);
      setError('Failed to load playlist videos.');
    } finally {
      setPlaylistVideosLoading(false);
    }
  };

  const selectedThumbnail = useMemo(() => {
    if (thumbnailSource === THUMBNAIL_SOURCE_UPLOAD && thumbnailPreview) return thumbnailPreview;
    if (thumbnailSource === THUMBNAIL_SOURCE_BOOK && selectedBookThumbnail) return selectedBookThumbnail;
    if (thumbnailSource === THUMBNAIL_SOURCE_VIDEO && selectedVideoThumbnail) return selectedVideoThumbnail;
    return playlist?.thumbnail || '';
  }, [thumbnailSource, thumbnailPreview, selectedBookThumbnail, selectedVideoThumbnail, playlist]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!playlist?.id || !title?.trim()) return;
    setError(null);
    try {
      setLoading(true);
      const payload = { title: title.trim() };
      if (thumbnailSource === THUMBNAIL_SOURCE_UPLOAD && thumbnailFile) {
        payload.thumbFile = thumbnailFile;
      } else if (thumbnailSource === THUMBNAIL_SOURCE_BOOK && selectedBookThumbnail) {
        payload.thumb = selectedBookThumbnail;
      } else if (thumbnailSource === THUMBNAIL_SOURCE_VIDEO && selectedVideoThumbnail) {
        payload.thumb = selectedVideoThumbnail;
      }
      await playlistsAPI.update(playlist.id, payload);
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
      <div className="bg-slate-50 rounded-2xl shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
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
          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Playlist thumbnail
            </label>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setThumbnailSource(THUMBNAIL_SOURCE_UPLOAD);
                  setError(null);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${thumbnailSource === THUMBNAIL_SOURCE_UPLOAD ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Upload image
              </button>
              <button
                type="button"
                onClick={() => {
                  setThumbnailSource(THUMBNAIL_SOURCE_BOOK);
                  setError(null);
                  loadBookThumbnails();
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${thumbnailSource === THUMBNAIL_SOURCE_BOOK ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Choose from books
              </button>
              <button
                type="button"
                onClick={() => {
                  setThumbnailSource(THUMBNAIL_SOURCE_VIDEO);
                  setError(null);
                  loadPlaylistVideoThumbnails();
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${thumbnailSource === THUMBNAIL_SOURCE_VIDEO ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Choose from playlist videos
              </button>
            </div>

            {thumbnailSource === THUMBNAIL_SOURCE_UPLOAD && (
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setThumbnailFile(file);
                    setSelectedBookThumbnail('');
                    setSelectedVideoThumbnail('');
                    if (file) setThumbnailPreview(URL.createObjectURL(file));
                    else setThumbnailPreview('');
                  }}
                  className="w-full text-sm text-slate-600"
                />
                <p className="text-xs text-slate-500">Supports JPG, PNG, WEBP, GIF (max 5MB).</p>
              </div>
            )}

            {thumbnailSource === THUMBNAIL_SOURCE_BOOK && (
              <div>
                {booksLoading ? (
                  <p className="text-sm text-slate-500">Loading book thumbnails...</p>
                ) : bookThumbnails.length === 0 ? (
                  <p className="text-sm text-slate-500">No book thumbnails found.</p>
                ) : (
                  <div className="max-h-52 overflow-y-auto grid grid-cols-4 gap-2">
                    {bookThumbnails.map((bookThumb) => (
                      <button
                        key={bookThumb.id}
                        type="button"
                        onClick={() => {
                          setSelectedBookThumbnail(bookThumb.image);
                          setSelectedVideoThumbnail('');
                          setThumbnailFile(null);
                          setThumbnailPreview('');
                        }}
                        className={`rounded-lg border-2 overflow-hidden h-16 ${selectedBookThumbnail === bookThumb.image ? 'border-pink-500' : 'border-slate-200 hover:border-slate-300'}`}
                        title={bookThumb.title}
                      >
                        <img src={bookThumb.image} alt={bookThumb.title} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {thumbnailSource === THUMBNAIL_SOURCE_VIDEO && (
              <div>
                {playlistVideosLoading ? (
                  <p className="text-sm text-slate-500">Loading playlist videos...</p>
                ) : playlistVideoThumbnails.length === 0 ? (
                  <p className="text-sm text-slate-500">No videos found in this playlist.</p>
                ) : (
                  <div className="max-h-52 overflow-y-auto grid grid-cols-4 gap-2">
                    {playlistVideoThumbnails.map((videoThumb) => (
                      <button
                        key={videoThumb.id}
                        type="button"
                        onClick={() => {
                          setSelectedVideoThumbnail(videoThumb.image);
                          setSelectedBookThumbnail('');
                          setThumbnailFile(null);
                          setThumbnailPreview('');
                        }}
                        className={`rounded-lg border-2 overflow-hidden h-16 ${selectedVideoThumbnail === videoThumb.image ? 'border-pink-500' : 'border-slate-200 hover:border-slate-300'}`}
                        title={videoThumb.title}
                      >
                        <img src={videoThumb.image} alt={videoThumb.title} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedThumbnail && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Selected thumbnail preview</p>
                <img
                  src={selectedThumbnail}
                  alt="Playlist thumbnail preview"
                  className="w-28 h-20 object-cover rounded border border-slate-200"
                />
              </div>
            )}
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
