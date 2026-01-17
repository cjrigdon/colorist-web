import React, { useState } from 'react';
import { coloredPencilsAPI } from '../services/api';

const AdminPencilImport = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
        setError('Please select a CSV file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setMessage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a CSV file to upload');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await coloredPencilsAPI.importCsv(file);
      setMessage(response.message || 'CSV import has been queued successfully. The import will be processed in the background.');
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('csv-file');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to upload CSV file. Please try again.');
      console.error('CSV upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Import Colored Pencils from CSV</h1>
          <p className="text-slate-600">
            Upload a CSV file to import colored pencils, pencil sets, and set sizes into the system.
          </p>
        </div>

        {/* CSV Format Instructions */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">CSV Format Requirements</h2>
          <div className="space-y-2 text-sm text-slate-700">
            <p><strong>Required columns:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Set fields:</strong> brand, set_name, origin_country, type, set_shopping_link, water_soluable, open_stock, thumb</li>
              <li><strong>Pencil fields:</strong> color_number, color_name, hex, lightfast_rating, shopping_link, inventory</li>
              <li><strong>Set size field:</strong> set_sizes (comma-separated, format: "count:name" or just "name" or just "count")</li>
            </ul>
            <p className="mt-3"><strong>Example:</strong></p>
            <pre className="bg-white p-3 rounded border border-slate-200 text-xs overflow-x-auto">
{`brand,set_name,origin_country,type,set_shopping_link,water_soluable,open_stock,thumb,color_number,color_name,hex,lightfast_rating,shopping_link,inventory,set_sizes
Prismacolor,Premier,USA,Professional,https://...,0,1,thumb.jpg,101,Crimson Red,#DC143C,Excellent,https://...,0,12:12-count,24:24-count,36:36-count`}
            </pre>
          </div>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="csv-file" className="block text-sm font-medium text-slate-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              id="csv-file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-pink-50 file:text-pink-700
                hover:file:bg-pink-100
                file:cursor-pointer
                border border-slate-300 rounded-lg
                focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              disabled={loading}
            />
            {file && (
              <p className="mt-2 text-sm text-slate-600">
                Selected: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {message && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-800">{message}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setError(null);
                setMessage(null);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
              disabled={loading}
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="px-6 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{
                backgroundColor: loading || !file ? '#cbd5e1' : '#ea3663'
              }}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                'Upload CSV'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPencilImport;

