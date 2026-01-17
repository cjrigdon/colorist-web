import React, { useState } from 'react';
import { booksAPI } from '../services/api';

const AddBookModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookData, setBookData] = useState({
    title: '',
    author: '',
    image: null,
    preview: null
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBookData({
        ...bookData,
        image: file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookData.title || !bookData.author) {
      setError('Please provide a title and author');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        title: bookData.title,
        author: bookData.author
      };

      // If image is provided, convert to base64
      if (bookData.image) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result;
          payload.image = {
            name: bookData.image.name,
            data: base64Data
          };

          try {
            await booksAPI.create(payload);
            onSuccess();
            onClose();
            setBookData({ title: '', author: '', image: null, preview: null });
          } catch (err) {
            console.error('Error creating book:', err);
            setError(err.data?.message || 'Failed to create book');
            setLoading(false);
          }
        };
        reader.readAsDataURL(bookData.image);
      } else {
        // No image, just create the book
        await booksAPI.create(payload);
        onSuccess();
        onClose();
        setBookData({ title: '', author: '', image: null, preview: null });
      }
    } catch (err) {
      console.error('Error processing book:', err);
      setError('Failed to create book');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-slate-50 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800 font-venti">Add Book</h3>
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={bookData.title}
                onChange={(e) => setBookData({ ...bookData, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                placeholder="Enter book title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Author *
              </label>
              <input
                type="text"
                value={bookData.author}
                onChange={(e) => setBookData({ ...bookData, author: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                placeholder="Enter author name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cover Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
              />
              <p className="mt-2 text-xs text-slate-500">
                Supported formats: JPG, PNG, GIF
              </p>
              {bookData.preview && (
                <div className="mt-4">
                  <p className="text-sm text-slate-600 mb-2">Preview:</p>
                  <img
                    src={bookData.preview}
                    alt="Book cover preview"
                    className="max-w-full h-auto rounded-lg border border-slate-200"
                    style={{ maxHeight: '300px' }}
                  />
                </div>
              )}
            </div>

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
                {loading ? 'Adding...' : 'Add Book'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBookModal;

