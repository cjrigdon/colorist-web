import React, { useCallback, useEffect, useState } from 'react';
import { adminAPI } from '../services/api';

const SetSizePencilAdder = ({ setId, sizeId, onPencilsAdded }) => {
  const [pencils, setPencils] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchPencils = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.pencilSets.getPencils(setId, 1, 'all');
      setPencils(Array.isArray(response) ? response : (response?.data || []));
    } catch (err) {
      console.error('Error loading set pencils:', err);
      setError(err.message || 'Failed to load pencils for this set');
    } finally {
      setLoading(false);
    }
  }, [setId]);

  useEffect(() => {
    fetchPencils();
  }, [fetchPencils]);

  const isInSize = (pencil) => (pencil.sizes || []).includes(sizeId);
  const pencilsInSize = pencils.filter(isInSize).length;
  const searchLower = search.trim().toLowerCase();
  const availablePencils = pencils
    .filter((pencil) => !isInSize(pencil))
    .filter((pencil) => {
      if (!searchLower) return true;
      return (
        (pencil.color_name || '').toLowerCase().includes(searchLower) ||
        (pencil.color_number || '').toLowerCase().includes(searchLower) ||
        (pencil.color?.hex || '').toLowerCase().includes(searchLower)
      );
    });

  const togglePencil = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    try {
      setAdding(true);
      setError(null);
      const result = await adminAPI.pencilSets.addPencilsToSetSize(sizeId, [...selectedIds]);
      setSelectedIds(new Set());
      setMessage(`Added ${result.added} ${result.added === 1 ? 'pencil' : 'pencils'}. This size now has ${result.pencil_count}.`);
      await fetchPencils();
      onPencilsAdded?.(result);
    } catch (err) {
      console.error('Error adding pencils to set size:', err);
      setError(err.data?.message || err.message || 'Failed to add pencils');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-slate-700">Add pencils from this set</label>
        {!loading && (
          <span className="text-xs text-slate-500">
            {pencilsInSize} of {pencils.length} set pencils in this size
          </span>
        )}
      </div>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      {message && <p className="mb-2 text-sm text-green-700">{message}</p>}

      {loading ? (
        <div className="text-center py-4 text-sm text-slate-500">Loading pencils...</div>
      ) : pencils.length > 0 && pencilsInSize === pencils.length ? (
        <div className="text-center py-4 text-sm text-slate-500 border border-slate-200 rounded-lg">
          Every pencil in this set is already in this size.
        </div>
      ) : (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
            placeholder="Search by name, number, or hex"
            className="w-full mb-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#ea3663] focus:border-transparent"
          />
          <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
            {availablePencils.length === 0 ? (
              <div className="text-center py-4 text-sm text-slate-500">No pencils match "{search}"</div>
            ) : (
              availablePencils.map((pencil) => (
                <label key={pencil.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(pencil.id)}
                    onChange={() => togglePencil(pencil.id)}
                    className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500"
                  />
                  <span
                    className="w-6 h-6 rounded border border-slate-300 flex-shrink-0"
                    style={{ backgroundColor: pencil.color?.hex || '#ccc' }}
                  />
                  <span className="text-sm text-slate-700 truncate">
                    {pencil.color_number ? `${pencil.color_number} · ` : ''}{pencil.color_name}
                  </span>
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding || selectedIds.size === 0}
              className="px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ea3663' }}
            >
              {adding
                ? 'Adding...'
                : selectedIds.size > 0
                  ? `Add ${selectedIds.size} ${selectedIds.size === 1 ? 'pencil' : 'pencils'}`
                  : 'Add pencils'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SetSizePencilAdder;
