import React, { useState } from 'react';
import { videosAPI, filesAPI } from '../services/api';

const AddInspirationModal = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('video'); // 'video' or 'file'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Video form data
  const [videoData, setVideoData] = useState({
    embed_id: ''
  });

  // File form data
  const [fileData, setFileData] = useState({
    title: '',
    file: null,
    preview: null
  });

  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    if (!videoData.embed_id) {
      setError('Please enter a YouTube URL or video ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await videosAPI.create({ embed_id: videoData.embed_id });
      onSuccess();
      onClose();
      setVideoData({ embed_id: '' });
    } catch (err) {
      console.error('Error creating video:', err);
      setError(err.data?.message || 'Failed to add video');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileData({
        ...fileData,
        file: file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!fileData.file || !fileData.title) {
      setError('Please provide a title and select a file');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;
        const filePayload = {
          name: fileData.file.name,
          title: fileData.title,
          data: base64Data
        };

        try {
          await filesAPI.create(filePayload);
          onSuccess();
          onClose();
          setFileData({ title: '', file: null, preview: null });
        } catch (err) {
          console.error('Error creating file:', err);
          setError(err.data?.message || 'Failed to upload file');
          setLoading(false);
        }
      };
      reader.readAsDataURL(fileData.file);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Failed to process file');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-slate-50 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800 font-venti">Add Inspiration</h3>
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

        {/* Tabs */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('video')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'video'
                  ? 'text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              style={activeTab === 'video' ? { backgroundColor: '#ea3663' } : {}}
            >
              YouTube Video
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'file'
                  ? 'text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              style={activeTab === 'file' ? { backgroundColor: '#ea3663' } : {}}
            >
              Image or PDF
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Video Tab */}
          {activeTab === 'video' && (
            <form onSubmit={handleVideoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  YouTube URL or Video ID *
                </label>
                <input
                  type="text"
                  value={videoData.embed_id}
                  onChange={(e) => setVideoData({ ...videoData, embed_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="https://www.youtube.com/watch?v=... or video ID"
                  required
                />
                <p className="mt-2 text-xs text-slate-500">
                  Enter a YouTube URL or video ID. The video title and thumbnail will be automatically fetched.
                </p>
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
                  {loading ? 'Adding...' : 'Add Video'}
                </button>
              </div>
            </form>
          )}

          {/* File Tab */}
          {activeTab === 'file' && (
            <form onSubmit={handleFileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={fileData.title}
                  onChange={(e) => setFileData({ ...fileData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="Enter a title for this file"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  File (Image or PDF) *
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                  required
                />
                <p className="mt-2 text-xs text-slate-500">
                  Supported formats: JPG, PNG, GIF, PDF
                </p>
                {fileData.preview && (
                  <div className="mt-4">
                    <p className="text-sm text-slate-600 mb-2">Preview:</p>
                    {fileData.file.type.startsWith('image/') ? (
                      <img
                        src={fileData.preview}
                        alt="Preview"
                        className="max-w-full h-auto rounded-lg border border-slate-200"
                        style={{ maxHeight: '300px' }}
                      />
                    ) : (
                      <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-600">PDF: {fileData.file.name}</p>
                      </div>
                    )}
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
                  {loading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddInspirationModal;

