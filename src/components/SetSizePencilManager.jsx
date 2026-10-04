import React, { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../services/api';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'in', label: 'In this size' },
  { value: 'out', label: 'Not in this size' },
];

const SetSizePencilManager = ({ setId, sizeId, sizeLabel, onClose, onSaved }) => {
  const [pencils, setPencils] = useState([]);
  const [initialIds, setInitialIds] = useState(() => new Set());
  const [checkedIds, setCheckedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminAPI.pencilSets.getPencils(setId, 1, 'all', 'color_number', 'asc');
        if (cancelled) return;
        const list = Array.isArray(response) ? response : (response?.data || []);
        const inSize = new Set(list.filter((p) => (p.sizes || []).includes(sizeId)).map((p) => p.id));
        setPencils(list);
        setInitialIds(inSize);
        setCheckedIds(new Set(inSize));
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load pencils for this set');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [setId, sizeId]);

  const addedCount = [...checkedIds].filter((id) => !initialIds.has(id)).length;
  const removedCount = [...initialIds].filter((id) => !checkedIds.has(id)).length;
  const hasChanges = addedCount > 0 || removedCount > 0;

  const visiblePencils = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return pencils.filter((pencil) => {
      // Filter on the saved state so rows don't vanish as they're toggled
      if (filter === 'in' && !initialIds.has(pencil.id)) return false;
      if (filter === 'out' && initialIds.has(pencil.id)) return false;
      if (!searchLower) return true;
      return (
        (pencil.color_name || '').toLowerCase().includes(searchLower) ||
        (pencil.color_number || '').toLowerCase().includes(searchLower) ||
        (pencil.color?.hex || '').toLowerCase().includes(searchLower)
      );
    });
  }, [pencils, filter, search, initialIds]);

  const togglePencil = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setVisibleChecked = (checked) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      visiblePencils.forEach((p) => (checked ? next.add(p.id) : next.delete(p.id)));
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const result = await adminAPI.pencilSets.syncSetSizePencils(sizeId, [...checkedIds]);
      onSaved?.(result);
    } catch (err) {
      const fieldErrors = err.data?.errors ? Object.values(err.data.errors).flat().join(' ') : null;
      setError(fieldErrors || err.data?.message || err.message || 'Failed to save pencils');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-800 font-venti">Add or Remove Pencils</h3>
          <p className="mt-1 text-sm text-slate-600">
            Check the pencils from this set that belong in <span className="font-medium">{sizeLabel}</span>.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, number, or hex"
              className="flex-1 min-w-[200px] px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#ea3663] focus:border-transparent"
            />
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    filter === f.value ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {!loading && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-slate-600">
                <span className="font-semibold text-slate-800">{checkedIds.size}</span> of {pencils.length} set pencils in this size
                {addedCount > 0 && <span className="ml-2 text-green-700">+{addedCount} to add</span>}
                {removedCount > 0 && <span className="ml-2 text-red-600">−{removedCount} to remove</span>}
              </span>
              <span className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setVisibleChecked(true)}
                  disabled={visiblePencils.length === 0}
                  className="text-slate-700 hover:text-slate-900 underline disabled:opacity-50"
                >
                  Check all
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleChecked(false)}
                  disabled={visiblePencils.length === 0}
                  className="text-slate-700 hover:text-slate-900 underline disabled:opacity-50"
                >
                  Uncheck all
                </button>
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-8 text-sm text-slate-500">Loading pencils...</div>
          ) : visiblePencils.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              {pencils.length === 0 ? 'This set has no pencils yet.' : 'No pencils match.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {visiblePencils.map((pencil) => {
                const checked = checkedIds.has(pencil.id);
                const wasInSize = initialIds.has(pencil.id);
                const status = checked && !wasInSize ? 'add' : !checked && wasInSize ? 'remove' : null;
                return (
                  <label
                    key={pencil.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 ${
                      status === 'add' ? 'bg-green-50' : status === 'remove' ? 'bg-red-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePencil(pencil.id)}
                      className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500"
                    />
                    <span
                      className="w-6 h-6 rounded border border-slate-300 flex-shrink-0"
                      style={{ backgroundColor: pencil.color?.hex || '#ccc' }}
                    />
                    <span className="flex-1 text-sm text-slate-700 truncate">
                      {pencil.color_number ? `${pencil.color_number} · ` : ''}{pencil.color_name}
                    </span>
                    {status === 'add' && <span className="text-xs font-medium text-green-700">Adding</span>}
                    {status === 'remove' && <span className="text-xs font-medium text-red-600">Removing</span>}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 pt-4 border-t border-slate-200">
          {error && <div className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || !hasChanges}
              className="px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ea3663' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetSizePencilManager;
