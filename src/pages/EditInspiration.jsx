import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { videosAPI, filesAPI } from '../services/api';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const EditInspiration = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  
  // Extract ID and type from pathname since route uses pathname matching
  // Path format: /edit/inspiration/{type}/{id}
  const pathname = location.pathname;
  const pathParts = pathname.split('/edit/inspiration/')[1]?.split('/') || [];
  const typeFromPath = pathParts[0];
  const idFromPath = pathParts[1];
  const id = params.id || idFromPath;
  const type = params.type || typeFromPath;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    embed_id: '',
    embed_type: '',
    path: '',
    mime_type: '',
    thumbnail_path: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Early return if no ID or type
    if (!id || !type) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        let data;
        
        if (type === 'video') {
          const response = await videosAPI.getById(id);
          // API returns the JSON object directly from handleResponse
          // But check if it's wrapped in a data property
          if (response && typeof response === 'object' && 'data' in response && !('id' in response)) {
            data = response.data;
          } else {
            data = response;
          }
          
          // Handle null/undefined values properly
          setFormData(prev => ({
            title: (data.title !== null && data.title !== undefined) ? String(data.title) : '',
            description: (data.description !== null && data.description !== undefined) ? String(data.description) : '',
            embed_id: (data.embed_id !== null && data.embed_id !== undefined) ? String(data.embed_id) : '',
            embed_type: (data.embed_type !== null && data.embed_type !== undefined) ? String(data.embed_type) : '',
            path: '',
            mime_type: ''
          }));
        } else if (type === 'file') {
          const response = await filesAPI.getById(id);
          // API returns the JSON object directly from handleResponse
          // But check if it's wrapped in a data property
          if (response && typeof response === 'object' && 'data' in response && !('id' in response)) {
            data = response.data;
          } else {
            data = response;
          }
          
          // Handle null/undefined values properly
          setFormData(prev => ({
            title: (data.title !== null && data.title !== undefined) ? String(data.title) : '',
            description: '',
            embed_id: '',
            embed_type: '',
            path: (data.path !== null && data.path !== undefined) ? String(data.path) : '',
            mime_type: (data.mime_type !== null && data.mime_type !== undefined) ? String(data.mime_type) : '',
            thumbnail_path: (data.thumbnail_path !== null && data.thumbnail_path !== undefined) ? String(data.thumbnail_path) : ''
          }));
        }
      } catch (err) {
        setError(err.message || err.data?.message || 'Failed to load inspiration item');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, type]);

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
      // Update mime_type in formData to show the new file's type
      setFormData(prev => ({
        ...prev,
        mime_type: file.type || ''
      }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (type === 'video') {
        await videosAPI.update(id, formData);
      } else if (type === 'file') {
        // If a new file was selected, upload it first
        if (selectedFile) {
          setUploadingFile(true);
          try {
            // Convert file to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
              try {
                const base64Data = reader.result;
                const filePayload = {
                  name: selectedFile.name,
                  title: formData.title,
                  data: base64Data
                };

                // Upload new file
                const newFile = await filesAPI.create(filePayload);
                
                // Update the existing file record with new path and mime_type
                await filesAPI.update(id, {
                  title: formData.title,
                  path: newFile.path,
                  mime_type: newFile.mime_type
                });
                
                navigate(-1);
              } catch (err) {
                setError(err.data?.message || err.message || 'Failed to upload file');
                setSaving(false);
                setUploadingFile(false);
              }
            };
            reader.readAsDataURL(selectedFile);
            return; // Exit early, navigate will happen in reader.onloadend
          } catch (err) {
            setError(err.data?.message || err.message || 'Failed to process file');
            setSaving(false);
            setUploadingFile(false);
            return;
          }
        } else {
          // No new file selected, just update title
          await filesAPI.update(id, {
            title: formData.title
          });
        }
        navigate(-1);
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to update inspiration item');
    } finally {
      setSaving(false);
      setUploadingFile(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !type) return;
    
    setDeleting(true);
    setError(null);
    
    try {
      if (type === 'video') {
        await videosAPI.delete(id);
      } else if (type === 'file') {
        await filesAPI.delete(id);
      }
      navigate(-1);
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to delete item');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="modern-loader mb-4">
          <div className="loader-ring">
            <div className="loader-ring-segment"></div>
            <div className="loader-ring-segment"></div>
            <div className="loader-ring-segment"></div>
            <div className="loader-ring-segment"></div>
          </div>
        </div>
        <div className="text-slate-500 mb-2">Loading inspiration item...</div>
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
      {/* Header Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 font-venti mb-2">
            Edit {type === 'video' ? 'Video' : 'File'}
          </h2>
          <p className="text-sm text-slate-600">
            Update the details for this inspiration item
          </p>
        </div>
        {/* Action Buttons Group */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting}
            className="px-6 py-2.5 text-red-700 bg-red-50 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              const form = document.getElementById('edit-inspiration-form');
              if (form) {
                form.requestSubmit();
              }
            }}
            disabled={saving || uploadingFile}
            className="px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#ea3663' }}
            onMouseEnter={(e) => !saving && !uploadingFile && (e.target.style.backgroundColor = '#d12a4f')}
            onMouseLeave={(e) => !saving && !uploadingFile && (e.target.style.backgroundColor = '#ea3663')}
          >
            {uploadingFile ? 'Uploading...' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* White Container */}
      <div className="bg-white shadow-sm p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form id="edit-inspiration-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Preview Section */}
          {type === 'video' && formData.embed_id && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Video Preview
              </label>
              <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                <iframe
                  src={`https://www.youtube.com/embed/${formData.embed_id}`}
                  title={formData.title || 'Video'}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {type === 'file' && formData.path && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {formData.mime_type?.startsWith('image/') ? 'Image Preview' : 
                 formData.mime_type?.includes('pdf') ? 'PDF Preview' : 
                 'File Preview'}
              </label>
              {formData.mime_type?.startsWith('image/') ? (
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={formData.thumbnail_path || formData.path}
                    alt={formData.title || 'Image'}
                    className="max-w-full h-auto"
                    style={{ maxHeight: '500px' }}
                    onError={(e) => {
                      // Fallback to path if thumbnail fails
                      if (e.target.src !== formData.path) {
                        e.target.src = formData.path;
                      } else {
                        e.target.style.display = 'none';
                      }
                    }}
                  />
                </div>
              ) : formData.mime_type?.includes('pdf') ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                      <div>
                        <p className="font-medium text-slate-800">{formData.title || 'PDF Document'}</p>
                        <p className="text-sm text-slate-500">PDF File</p>
                      </div>
                    </div>
                    <a
                      href={formData.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                      style={{ backgroundColor: '#ea3663' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>Open PDF</span>
                    </a>
                  </div>
                  <div className="bg-white rounded border border-slate-200" style={{ height: '500px' }}>
                    <iframe
                      src={formData.path}
                      title={formData.title || 'PDF'}
                      className="w-full h-full rounded"
                      style={{ border: 'none' }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )}

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

          {type === 'video' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200 resize-none"
                  style={{ focusRingColor: '#ea3663' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  YouTube ID
                </label>
                <input
                  type="text"
                  name="embed_id"
                  value={formData.embed_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                  style={{ focusRingColor: '#ea3663' }}
                />
              </div>
            </>
          )}

          {type === 'file' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select New File (optional)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                  style={{ focusRingColor: '#ea3663' }}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Supported formats: JPG, PNG, GIF, PDF. Leave empty to keep current file.
                </p>
                {filePreview && (
                  <div className="mt-4">
                    <p className="text-sm text-slate-600 mb-2">New file preview:</p>
                    {selectedFile?.type.startsWith('image/') ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="max-w-full h-auto rounded-lg border border-slate-200"
                        style={{ maxHeight: '300px' }}
                      />
                    ) : (
                      <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-600">PDF: {selectedFile?.name}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  MIME Type
                </label>
                <input
                  type="text"
                  name="mime_type"
                  value={formData.mime_type}
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-slate-500">
                  MIME type is automatically determined from the file
                </p>
              </div>
            </>
          )}
        </form>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={formData.title || (type === 'video' ? 'Video' : 'File')}
        itemType={type === 'video' ? 'video' : 'file'}
      />
    </div>
  );
};

export default EditInspiration;

