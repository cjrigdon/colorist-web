import React, { useCallback, useState } from 'react';

const MODE_COPY = {
  share: { prompt: (noun) => `Select the ${noun} you want to share in one link.`, action: 'Create Share Link' },
  print: { prompt: (noun) => `Select the ${noun} you want to print.`, action: 'Print' }
};

// Tracks which cards are picked while the user builds a multi-item share link or print sheet
export const useShareSelection = () => {
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState(() => new Map());

  const start = useCallback((nextMode = 'share') => setMode(nextMode), []);

  const cancel = useCallback(() => {
    setMode(null);
    setSelected(new Map());
  }, []);

  const toggle = useCallback((item) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, { id: item.id, title: item.title });
      }
      return next;
    });
  }, []);

  const setAll = useCallback((items) => {
    setSelected(new Map(items.map((item) => [item.id, { id: item.id, title: item.title }])));
  }, []);

  const isSelected = useCallback((id) => selected.has(id), [selected]);

  return {
    selecting: mode !== null,
    mode,
    start,
    cancel,
    toggle,
    setAll,
    isSelected,
    selectedItems: Array.from(selected.values())
  };
};

const headerButtonClass = 'px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

export const SelectToShareButton = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={headerButtonClass}>
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
    <span>Share</span>
  </button>
);

export const SelectToPrintButton = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={headerButtonClass}>
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
    <span>Print</span>
  </button>
);

// Replaces the page header actions while selecting
export const ShareSelectionBar = ({ count, noun, mode = 'share', onConfirm, onCancel, onToggleAll, allSelected = false }) => {
  const copy = MODE_COPY[mode] || MODE_COPY.share;

  return (
    <div className="flex flex-wrap items-center gap-3 bg-pink-50 border border-[#ea3663]/30 rounded-xl px-4 py-3">
      <p className="text-sm text-slate-700 flex-1 min-w-[12rem]">
        {count === 0 ? copy.prompt(noun) : `${count} selected`}
      </p>
      {onToggleAll && (
        <button
          type="button"
          onClick={onToggleAll}
          className="px-3 py-2 text-sm font-medium text-[#ea3663] hover:text-[#d12a4f] transition-colors"
        >
          {allSelected ? 'Clear selection' : 'Select all'}
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={count === 0}
        className="px-4 py-2 text-white rounded-lg text-sm font-medium bg-[#ea3663] hover:bg-[#d12a4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {copy.action}
      </button>
    </div>
  );
};

export const SelectionCheck = ({ checked, className = 'top-4 left-4' }) => (
  <span
    className={`absolute ${className} z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center shadow-sm ${
      checked ? 'bg-[#ea3663] border-[#ea3663] text-white' : 'bg-white border-slate-300'
    }`}
    aria-hidden="true"
  >
    {checked && (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    )}
  </span>
);
