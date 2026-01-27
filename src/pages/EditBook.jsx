import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { booksAPI, bookPagesAPI } from '../services/api';

const EditBook = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  
  // Extract ID from pathname since route uses pathname matching
  const pathname = location.pathname;
  const idFromPath = pathname.split('/edit/book/')[1];
  const id = params.id || idFromPath;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publisher: '',
    year_published: '',
    number_of_pages: '',
    isbn: '',
    image: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [bookPages, setBookPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);

  useEffect(() => {
    // Early return if no ID
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await booksAPI.getById(id);
        
        // API returns the JSON object directly from handleResponse
        // But check if it's wrapped in a data property
        let data = response;
        if (response && typeof response === 'object' && 'data' in response && !('id' in response)) {
          data = response.data;
        } else {
          data = response;
        }
        
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data received from server');
        }
        
        // Handle null/undefined values properly
        setFormData(prev => ({
          title: (data.title !== null && data.title !== undefined) ? String(data.title) : '',
          author: (data.author !== null && data.author !== undefined) ? String(data.author) : '',
          publisher: (data.publisher !== null && data.publisher !== undefined) ? String(data.publisher) : '',
          year_published: (data.year_published !== null && data.year_published !== undefined) ? String(data.year_published) : '',
          number_of_pages: (data.number_of_pages !== null && data.number_of_pages !== undefined) ? String(data.number_of_pages) : '',
          isbn: (data.isbn !== null && data.isbn !== undefined) ? String(data.isbn) : '',
          image: (data.image !== null && data.image !== undefined) ? String(data.image) : ''
        }));
      } catch (err) {
        setError(err.message || err.data?.message || 'Failed to load book');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Fetch book pages when book ID is available
  useEffect(() => {
    if (!id) {
      return;
    }

    const fetchPages = async () => {
      try {
        setLoadingPages(true);
        const response = await bookPagesAPI.getAll(1, 100, { book_id: id });
        const pagesData = response.data || response;
        setBookPages(Array.isArray(pagesData) ? pagesData : []);
      } catch (err) {
        console.error('Error loading book pages:', err);
      } finally {
        setLoadingPages(false);
      }
    };

    fetchPages();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updateData = {
        title: formData.title,
        author: formData.author,
        publisher: formData.publisher || null,
        year_published: formData.year_published ? parseInt(formData.year_published) : null,
        number_of_pages: formData.number_of_pages ? parseInt(formData.number_of_pages) : null,
        isbn: formData.isbn || null
      };

      // If a new file was selected, convert it to base64 and include in update
      if (selectedFile) {
        setUploadingFile(true);
        try {
          // Convert file to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64Data = reader.result;
              updateData.image = {
                name: selectedFile.name,
                data: base64Data
              };

              await booksAPI.update(id, updateData);
              navigate(-1);
            } catch (err) {
              setError(err.data?.message || err.message || 'Failed to update book');
              setSaving(false);
              setUploadingFile(false);
            }
          };
          reader.readAsDataURL(selectedFile);
          return; // Exit early, navigate will happen in reader.onloadend
        } catch (err) {
          setError(err.data?.message || err.message || 'Failed to process image');
          setSaving(false);
          setUploadingFile(false);
          return;
        }
      } else {
        // No new file selected, just update title and author
        await booksAPI.update(id, updateData);
        navigate(-1);
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to update book');
    } finally {
      setSaving(false);
      setUploadingFile(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    } else {
      // Reset if file input is cleared
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!window.confirm('Are you sure you want to delete this page?')) {
      return;
    }

    try {
      await bookPagesAPI.delete(pageId);
      // Refresh pages list
      const response = await bookPagesAPI.getAll(1, 100, { book_id: id });
      const pagesData = response.data || response;
      setBookPages(Array.isArray(pagesData) ? pagesData : []);
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to delete page');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-slate-500 mb-2">Loading book...</div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 font-venti mb-2">
            Edit Coloring Book
          </h2>
          <p className="text-sm text-slate-600">
            Update the details for this coloring book
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
              style={{ focusRingColor: '#ea3663' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Author
            </label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
              style={{ focusRingColor: '#ea3663' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Publisher
            </label>
            <input
              type="text"
              name="publisher"
              value={formData.publisher}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
              style={{ focusRingColor: '#ea3663' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Year Published
              </label>
              <input
                type="number"
                name="year_published"
                value={formData.year_published}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                style={{ focusRingColor: '#ea3663' }}
                placeholder="e.g., 2024"
                min="1000"
                max="9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Number of Pages
              </label>
              <input
                type="number"
                name="number_of_pages"
                value={formData.number_of_pages}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                style={{ focusRingColor: '#ea3663' }}
                placeholder="e.g., 96"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ISBN
            </label>
            <input
              type="text"
              name="isbn"
              value={formData.isbn}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
              style={{ focusRingColor: '#ea3663' }}
              placeholder="Enter ISBN (10 or 13 digits)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cover Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
              style={{ focusRingColor: '#ea3663' }}
            />
            <p className="mt-2 text-xs text-slate-500">
              Supported formats: JPG, PNG, GIF. Leave empty to keep current image.
            </p>
            {filePreview && (
              <div className="mt-4">
                <p className="text-sm text-slate-600 mb-2">New image preview:</p>
                <img
                  src={filePreview}
                  alt="Preview"
                  className="max-w-xs h-64 object-cover rounded-lg border border-slate-200"
                />
              </div>
            )}
            {formData.image && !selectedFile && (
              <div className="mt-4">
                <p className="text-sm text-slate-600 mb-2">Current image:</p>
                <img
                  src={formData.image}
                  alt="Current cover"
                  className="max-w-xs h-64 object-cover rounded-lg border border-slate-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingFile}
              className="px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => !saving && !uploadingFile && (e.target.style.backgroundColor = '#d12a4f')}
              onMouseLeave={(e) => !saving && !uploadingFile && (e.target.style.backgroundColor = '#ea3663')}
            >
              {uploadingFile ? 'Uploading...' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Book Pages Section */}
      {id && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-800 font-venti mb-1">
                Book Pages
              </h3>
              <p className="text-sm text-slate-600">
                Manage pages for this coloring book
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/edit/book-page?book_id=${id}`)}
              className="px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#d12a4f')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#ea3663')}
            >
              + Add Page
            </button>
          </div>

          {loadingPages ? (
            <div className="text-center py-8 text-slate-500">Loading pages...</div>
          ) : bookPages.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="mb-4">No pages yet. Create your first page!</p>
              <button
                type="button"
                onClick={() => navigate(`/edit/book-page?book_id=${id}`)}
                className="px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors"
                style={{ backgroundColor: '#ea3663' }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#d12a4f')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#ea3663')}
              >
                + Add First Page
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookPages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-slate-800">
                        {page.name}
                      </h4>
                      {page.number && (
                        <span className="text-sm text-slate-500">
                          (Page {page.number})
                        </span>
                      )}
                    </div>
                    {page.notes && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {page.notes}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                      {page.colored_pencil_sets?.length > 0 && (
                        <span>
                          {page.colored_pencil_sets.length} set{page.colored_pencil_sets.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {page.colored_pencils?.length > 0 && (
                        <span>
                          {page.colored_pencils.length} pencil{page.colored_pencils.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {page.files?.length > 0 && (
                        <span>
                          {page.files.length} image{page.files.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/edit/book-page/${page.id}`)}
                      className="px-3 py-1.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePage(page.id)}
                      className="px-3 py-1.5 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EditBook;

