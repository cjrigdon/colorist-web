import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { bookPagesAPI, booksAPI, colorPalettesAPI, colorCombosAPI, coloredPencilSetsAPI } from '../services/api';
import PencilSelector from '../components/PencilSelector';

// Filtered Combo Checkbox List Component
const FilteredComboCheckboxList = ({ combos, selectedCombos, onSelectionChange, pencilSetIds }) => {
  const filteredCombos = useMemo(() => {
    if (!pencilSetIds || pencilSetIds.length === 0) {
      return combos;
    }

    const selectedSetIds = pencilSetIds.map(id => parseInt(id));
    const matchingCombos = new Set();

    combos.forEach(combo => {
      if (!combo.pencils || !Array.isArray(combo.pencils)) {
        return;
      }

      const hasPencilFromSet = combo.pencils.some(pencil => {
        const pencilSetId = pencil.colored_pencil_set_id || pencil.set?.id || pencil.colored_pencil_set?.id;
        return pencilSetId && selectedSetIds.includes(pencilSetId);
      });

      if (hasPencilFromSet) {
        matchingCombos.add(combo.id);
      }
    });

    return combos.filter(combo => matchingCombos.has(combo.id));
  }, [combos, pencilSetIds]);

  const toggleCombo = (comboId) => {
    const comboIdStr = comboId.toString();
    const isSelected = selectedCombos.some(id => id.toString() === comboIdStr);
    
    if (isSelected) {
      onSelectionChange(selectedCombos.filter(id => id.toString() !== comboIdStr));
    } else {
      onSelectionChange([...selectedCombos, comboId]);
    }
  };

  if (filteredCombos.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {pencilSetIds.length > 0 
          ? 'No combos found for the selected pencil sets. Select pencil sets first or clear the filter.'
          : 'No combos available. Select pencil sets to filter combos.'}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4">
        {filteredCombos.map(combo => {
          const isSelected = selectedCombos.some(id => id.toString() === combo.id.toString());
          return (
            <label
              key={combo.id}
              className="flex items-center space-x-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCombo(combo.id)}
                className="w-4 h-4 text-slate-800 border-slate-300 rounded focus:ring-slate-500"
              />
              <span className="text-sm text-slate-700 flex-1 truncate">
                {combo.title || `Combo ${combo.id}`}
              </span>
            </label>
          );
        })}
      </div>
      {selectedCombos.length > 0 && (
        <p className="text-xs text-slate-600 mt-2">
          Selected: {selectedCombos.length} combo{selectedCombos.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

const EditBookPage = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  
  const pathname = location.pathname;
  const idFromPath = pathname.split('/edit/book-page/')[1];
  const id = params.id || idFromPath;
  const searchParams = new URLSearchParams(location.search);
  const bookIdFromQuery = searchParams.get('book_id');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    book_id: bookIdFromQuery || '',
    name: '',
    number: '',
    notes: '',
    colored_pencil_set_ids: [],
    file_ids: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showPencilSelector, setShowPencilSelector] = useState(false);
  const [showColorSelector, setShowColorSelector] = useState(false);
  const [pencilSelection, setPencilSelection] = useState({
    setIds: [],
    sizeIds: []
  });
  const [selectedPalettes, setSelectedPalettes] = useState([]);
  const [selectedCombos, setSelectedCombos] = useState([]);
  const [palettes, setPalettes] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loadingPalettes, setLoadingPalettes] = useState(false);
  const [loadingCombos, setLoadingCombos] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      // If creating a new page and book_id is provided, fetch the book details
      if (!id && bookIdFromQuery) {
        try {
          setLoadingBooks(true);
          const bookResponse = await booksAPI.getById(bookIdFromQuery);
          let bookData = bookResponse;
          if (bookResponse && typeof bookResponse === 'object' && 'data' in bookResponse && !('id' in bookResponse)) {
            bookData = bookResponse.data;
          }
          setSelectedBook(bookData);
        } catch (err) {
          console.error('Error loading book:', err);
        } finally {
          setLoadingBooks(false);
        }
      } else if (!id && !bookIdFromQuery) {
        // If creating without a book_id, fetch all books for dropdown
        try {
          setLoadingBooks(true);
          const booksResponse = await booksAPI.getAll(1, 100);
          const booksData = booksResponse.data || booksResponse;
          setBooks(Array.isArray(booksData) ? booksData : []);
        } catch (err) {
          console.error('Error loading initial data:', err);
        } finally {
          setLoadingBooks(false);
        }
      }
    };

    fetchInitialData();
  }, [id, bookIdFromQuery]);

  // Fetch palettes and combos when color selector is shown
  useEffect(() => {
    if (showColorSelector) {
      const fetchColors = async () => {
        try {
          setLoadingPalettes(true);
          setLoadingCombos(true);
          
          const palettesResponse = await colorPalettesAPI.getAll(1, 1000);
          let palettesData = [];
          if (Array.isArray(palettesResponse)) {
            palettesData = palettesResponse;
          } else if (palettesResponse.data && Array.isArray(palettesResponse.data)) {
            palettesData = palettesResponse.data;
          }
          setPalettes(palettesData);

          const combosResponse = await colorCombosAPI.getAll(1, 1000);
          let combosData = [];
          if (Array.isArray(combosResponse)) {
            combosData = combosResponse;
          } else if (combosResponse.data && Array.isArray(combosResponse.data)) {
            combosData = combosResponse.data;
          }
          setCombos(combosData);
        } catch (err) {
          console.error('Error loading colors:', err);
        } finally {
          setLoadingPalettes(false);
          setLoadingCombos(false);
        }
      };

      fetchColors();
    }
  }, [showColorSelector]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await bookPagesAPI.getById(id);
        
        let data = response;
        if (response && typeof response === 'object' && 'data' in response && !('id' in response)) {
          data = response.data;
        } else {
          data = response;
        }
        
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data received from server');
        }
        
        setFormData({
          book_id: data.book_id || '',
          name: data.name || '',
          number: data.number ? String(data.number) : '',
          notes: data.notes || '',
          file_ids: data.files?.map(f => f.id) || []
        });

        // Load selected set sizes directly from the API
        // The API returns colored_pencil_set_sizes as an array of size objects
        console.log('Book page data received:', {
          fullData: data,
          colored_pencil_set_sizes: data.colored_pencil_set_sizes,
          colored_pencil_set_sizes_type: typeof data.colored_pencil_set_sizes,
          colored_pencil_set_sizes_length: data.colored_pencil_set_sizes?.length
        });
        
        const existingSizes = data.colored_pencil_set_sizes || [];
        console.log('Existing sizes array:', existingSizes);
        
        const existingSizeIds = existingSizes.map(s => {
          const id = s?.id || s;
          console.log('Processing size:', s, 'ID:', id);
          return id;
        }).filter(Boolean);
        
        const existingSetIds = existingSizes
          .map(s => {
            // Try to get set ID from nested set object or direct property
            let setId = null;
            if (s && s.set && s.set.id) {
              setId = s.set.id;
            } else if (s && s.colored_pencil_set_id) {
              setId = s.colored_pencil_set_id;
            }
            console.log('Processing set ID from size:', s, 'Set ID:', setId);
            return setId;
          })
          .filter(Boolean);
        
        console.log('Extracted IDs:', {
          existingSizeIds,
          existingSetIds,
          sizeIdsAsStrings: existingSizeIds.map(id => String(id)),
          setIdsAsStrings: [...new Set(existingSetIds.map(id => String(id)))]
        });
        
        // Ensure all IDs are strings for consistent comparison
        const sizeIdsAsStrings = existingSizeIds.map(id => String(id));
        const setIdsAsStrings = [...new Set(existingSetIds.map(id => String(id)))];
        
        setPencilSelection({
          setIds: setIdsAsStrings,
          sizeIds: sizeIdsAsStrings
        });
        
        console.log('Final pencil selection state:', {
          setIds: setIdsAsStrings,
          sizeIds: sizeIdsAsStrings
        });
        
        // Show pencil selector if there are existing sizes, otherwise hide it
        setShowPencilSelector(existingSizeIds.length > 0);

        // Load existing palette and combos
        if (data.color_palettes && data.color_palettes.length > 0) {
          setSelectedPalettes(data.color_palettes.map(p => p.id));
          setShowColorSelector(true);
        }
        if (data.color_combos && data.color_combos.length > 0) {
          setSelectedCombos(data.color_combos.map(c => c.id));
          setShowColorSelector(true);
        }

        setExistingFiles(data.files || []);
      } catch (err) {
        setError(err.message || err.data?.message || 'Failed to load book page');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updateData = {
        name: formData.name,
        number: formData.number ? parseInt(formData.number) : null,
        notes: formData.notes || null,
        colored_pencil_set_size_ids: pencilSelection.sizeIds,
        file_ids: formData.file_ids,
        color_palette_ids: selectedPalettes.map(id => parseInt(id)),
        color_combo_ids: selectedCombos.map(id => parseInt(id))
      };

      if (selectedFiles.length > 0) {
        updateData.images = selectedFiles;
      }

      if (id) {
        await bookPagesAPI.update(id, updateData);
        // Navigate back to book edit page if book_id is available
        const savedPage = await bookPagesAPI.getById(id);
        const bookId = savedPage.book_id || formData.book_id;
        if (bookId) {
          navigate(`/edit/book/${bookId}`);
        } else {
          navigate(-1);
        }
      } else {
        updateData.book_id = parseInt(formData.book_id);
        const savedPage = await bookPagesAPI.create(updateData);
        // Navigate back to book edit page
        if (formData.book_id) {
          navigate(`/edit/book/${formData.book_id}`);
        } else {
          navigate(-1);
        }
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to save book page');
    } finally {
      setSaving(false);
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
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    
    const previews = files.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return null;
    });
    setFilePreviews(previews);
  };

  const removeExistingFile = (fileId) => {
    setFormData(prev => ({
      ...prev,
      file_ids: prev.file_ids.filter(id => id !== fileId)
    }));
    setExistingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const removeNewFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-slate-500 mb-2">Loading book page...</div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 font-venti mb-2">
            {id ? 'Edit Book Page' : 'Create Book Page'}
          </h2>
          <p className="text-sm text-slate-600">
            {id ? 'Update the details for this book page' : 'Add a new page to a coloring book'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!id && (
            <div>
              {bookIdFromQuery && selectedBook ? (
                ''
              ) : (
                <select
                  name="book_id"
                  value={formData.book_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                  required
                  disabled={loadingBooks}
                >
                  <option value="">Select a book</option>
                  {books.map(book => (
                    <option key={book.id} value={book.id}>
                      {book.title} {book.author ? `by ${book.author}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Page Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Page Number
            </label>
            <input
              type="number"
              name="number"
              value={formData.number}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
              placeholder="e.g., 1"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
              placeholder="Add any notes about this page..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Images
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
            />
            <p className="mt-2 text-xs text-slate-500">
              Supported formats: JPG, PNG, GIF. You can select multiple images.
            </p>

            {filePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {filePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {existingFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-slate-600 mb-2">Current images:</p>
                <div className="grid grid-cols-3 gap-4">
                  {existingFiles.map(file => (
                    <div key={file.id} className="relative">
                      <img
                        src={file.path?.startsWith('http') ? file.path : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${file.path}`}
                        alt={file.title || 'Image'}
                        className="w-full h-32 object-cover rounded-lg border border-slate-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingFile(file.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add Pencils Section */}
          <div>
            {!showPencilSelector ? (
              <button
                type="button"
                onClick={() => setShowPencilSelector(true)}
                className="flex items-center space-x-2 px-4 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Pencils</span>
              </button>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Pencil Sets</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPencilSelector(false);
                    }}
                    className="text-xs text-slate-600 hover:text-slate-800"
                  >
                    Hide
                  </button>
                </div>
                <PencilSelector
                  value={pencilSelection}
                  onChange={setPencilSelection}
                  label=""
                  multiple={true}
                />
              </div>
            )}
          </div>

          {/* Add Colors Section */}
          <div>
            {!showColorSelector ? (
              <button
                type="button"
                onClick={() => setShowColorSelector(true)}
                className="flex items-center space-x-2 px-4 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Colors</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Color Palette & Combos</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowColorSelector(false);
                    }}
                    className="text-xs text-slate-600 hover:text-slate-800"
                  >
                    Hide
                  </button>
                </div>

                {/* Palette Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Color Palettes
                  </label>
                  {loadingPalettes ? (
                    <p className="text-sm text-slate-500">Loading palettes...</p>
                  ) : palettes.length === 0 ? (
                    <p className="text-sm text-slate-500">No palettes available</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4">
                      {palettes.map(palette => {
                        const isSelected = selectedPalettes.includes(palette.id);
                        return (
                          <label
                            key={palette.id}
                            className="flex items-center space-x-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPalettes([...selectedPalettes, palette.id]);
                                } else {
                                  setSelectedPalettes(selectedPalettes.filter(id => id !== palette.id));
                                }
                              }}
                              className="w-4 h-4 text-slate-800 border-slate-300 rounded focus:ring-slate-500"
                            />
                            <span className="text-sm text-slate-700 flex-1 truncate">
                              {palette.title || `Palette ${palette.id}`}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {selectedPalettes.length > 0 && (
                    <p className="text-xs text-slate-600 mt-2">
                      Selected: {selectedPalettes.length} palette{selectedPalettes.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Combo Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Color Combos {pencilSelection.setIds.length > 0 && <span className="text-xs text-slate-500">(filtered by selected pencil sets)</span>}
                  </label>
                  {loadingCombos ? (
                    <p className="text-sm text-slate-500">Loading combos...</p>
                  ) : (
                    <FilteredComboCheckboxList
                      combos={combos}
                      selectedCombos={selectedCombos}
                      onSelectionChange={setSelectedCombos}
                      pencilSetIds={pencilSelection.setIds}
                    />
                  )}
                </div>
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
              disabled={saving}
              className="px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => !saving && (e.target.style.backgroundColor = '#d12a4f')}
              onMouseLeave={(e) => !saving && (e.target.style.backgroundColor = '#ea3663')}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBookPage;

