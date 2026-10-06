import React, { useEffect, useRef, useState } from 'react';
import { sharedColorsAPI } from '../services/api';

const LABELS = {
  combo: ['color combo', 'color combos'],
  palette: ['color palette', 'color palettes'],
};

export const buildShareUrl = (token) => `${window.location.origin}/shared/${token}`;

/**
 * Creates (or reuses) a share link for one or more of the user's combos or palettes and shows it for copying.
 * items: [{ id, title }] all of the given type.
 */
const ShareLinkModal = ({ type, items, onClose }) => {
  const [singular, plural] = LABELS[type];
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const requestedRef = useRef(false);
  const url = token ? buildShareUrl(token) : '';
  const isSingle = items.length === 1;
  const heading = isSingle ? `Share “${items[0].title}”` : `Share ${items.length} ${plural}`;
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    sharedColorsAPI.createLink(items.map((item) => ({ type, id: item.id })))
      .then((result) => setToken(result.token))
      .catch((err) => setError(err.data?.errors?.items?.[0] || err.message || 'Could not create the link'));
  }, [type, items]);

  const handleCopy = async (e) => {
    const input = e.currentTarget.parentElement.querySelector('input');
    try {
      await navigator.clipboard.writeText(url);
    } catch (_) {
      // Clipboard API can be blocked (e.g. non-HTTPS); fall back to selecting the text for a manual copy
      input?.select();
      document.execCommand?.('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    const text = isSingle
      ? `Check out my ${singular} "${items[0].title}" on Colorist`
      : `Check out these ${items.length} ${plural} on Colorist`;
    try {
      await navigator.share({ title: heading, text, url });
    } catch (_) { /* user dismissed the share sheet */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-xl font-semibold text-slate-800 font-venti">{heading}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none" aria-label="Close">
            ×
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Anyone with this link can view {isSingle ? `this ${singular}` : `these ${plural}`} and add a copy to their own studio.
          Changes you make later aren't sent to copies people have already saved.
        </p>

        {!isSingle && (
          <ul className="mb-4 max-h-32 overflow-y-auto text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 space-y-1">
            {items.map((item) => (
              <li key={item.id} className="truncate">{item.title}</li>
            ))}
          </ul>
        )}

        {error ? (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={token ? url : 'Creating link...'}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-mono"
              />
              <button
                type="button"
                onClick={handleCopy}
                disabled={!token}
                className="px-4 py-2.5 text-white rounded-xl text-sm font-medium bg-[#ea3663] hover:bg-[#d12a4f] transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
            {canNativeShare && token && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="mt-3 w-full px-4 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
              >
                Share…
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ShareLinkModal;
