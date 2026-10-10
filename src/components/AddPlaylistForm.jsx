import React, { useMemo, useState } from 'react';
import { booksAPI, playlistsAPI } from '../services/api';

const MODE_CREATE = 'create';
const MODE_IMPORT = 'import';
const THUMBNAIL_SOURCE_UPLOAD = 'upload';
const THUMBNAIL_SOURCE_BOOK = 'book';

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

const AddPlaylistForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [booksLoading, setBooksLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(MODE_CREATE);
  const [thumbnailSource, setThumbnailSource] = useState(THUMBNAIL_SOURCE_UPLOAD);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [bookThumbnails, setBookThumbnails] = useState([]);
  const [selectedBookThumbnail, setSelectedBookThumbnail] = useState('');
  const [playlistData, setPlaylistData] = useState({
    title: '',
    playlist_url: ''
  });

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

  const selectedThumbnail = useMemo(() => {
    if (thumbnailSource === THUMBNAIL_SOURCE_UPLOAD && thumbnailPreview) {
      return thumbnailPreview;
    }
    if (thumbnailSource === THUMBNAIL_SOURCE_BOOK && selectedBookThumbnail) {
      return selectedBookThumbnail;
    }
    return '';
  }, [thumbnailSource, thumbnailPreview, selectedBookThumbnail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (mode === MODE_CREATE) {
      if (!playlistData.title?.trim()) {
        setError('Please enter a playlist name');
        return;
      }
    } else if (!playlistData.playlist_url?.trim()) {
      setError('Please enter a YouTube playlist URL');
      return;
    }

    try {
      setLoading(true);
      const payload = mode === MODE_CREATE
        ? { title: playlistData.title.trim() }
        : { playlist_url: playlistData.playlist_url.trim() };

      if (thumbnailSource === THUMBNAIL_SOURCE_UPLOAD && thumbnailFile) {
        payload.thumbFile = thumbnailFile;
      } else if (thumbnailSource === THUMBNAIL_SOURCE_BOOK && selectedBookThumbnail) {
        payload.thumb = selectedBookThumbnail;
      }

      const response = await playlistsAPI.create(payload);
      onSuccess?.(response?.data ?? response);
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError(err.data?.message || err.message || (mode === MODE_IMPORT
        ? 'Failed to add playlist. Please check that the playlist URL is valid and the playlist is public.'
        : 'Failed to create playlist.'));
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-shrink-0 space-x-2 mb-4">
        {[
          { id: MODE_CREATE, label: 'Create by name' },
          { id: MODE_IMPORT, label: 'Import from YouTube link' },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => { setMode(option.id); setError(null); }}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === option.id ? 'text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            style={mode === option.id ? { backgroundColor: '#ea3663' } : {}}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col space-y-4">
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

        <div className="border border-slate-200 rounded-lg p-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Playlist thumbnail (optional)
          </label>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
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
          </div>

          {thumbnailSource === THUMBNAIL_SOURCE_UPLOAD ? (
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setThumbnailFile(file);
                  setSelectedBookThumbnail('');
                  if (file) {
                    setThumbnailPreview(URL.createObjectURL(file));
                  } else {
                    setThumbnailPreview('');
                  }
                  if (error) setError(null);
                }}
                className="w-full text-sm text-slate-600"
              />
              <p className="text-xs text-slate-500">Supports JPG, PNG, WEBP, GIF (max 5MB).</p>
            </div>
          ) : (
            <div className="space-y-2">
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
                        setThumbnailFile(null);
                        setThumbnailPreview('');
                        if (error) setError(null);
                      }}
                      className={`rounded-lg border-2 overflow-hidden aspect-video bg-slate-100 ${selectedBookThumbnail === bookThumb.image ? 'border-pink-500' : 'border-slate-200 hover:border-slate-300'}`}
                      title={bookThumb.title}
                    >
                      <img
                        src={bookThumb.image}
                        alt={bookThumb.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
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
                className="w-48 aspect-video object-cover rounded-lg border border-slate-200 bg-slate-100"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-3 pt-4 !mt-auto">
          <button
            type="button"
            onClick={onCancel}
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
  );
};

export default AddPlaylistForm;
