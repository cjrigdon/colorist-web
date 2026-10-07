import React, { useEffect, useState } from 'react';
import DropdownMenu from './DropdownMenu';
import { bookPagesAPI } from '../services/api';

const NEW_PAGE = 'new';

export const EMPTY_BOOK_PAGE = { pageId: '', name: '', number: '' };

export const bookPageFromEntry = (entry) => ({
  ...EMPTY_BOOK_PAGE,
  pageId: entry?.book_page_id ? String(entry.book_page_id) : '',
});

// An empty selection is sent as book_page_id: null so editing an entry can clear its page
export const bookPagePayload = (value) => {
  const page = value || EMPTY_BOOK_PAGE;
  if (page.pageId === NEW_PAGE) {
    const name = (page.name || '').trim();
    const number = parseInt(page.number, 10);
    const payload = {};
    if (name) payload.book_page_name = name;
    if (Number.isInteger(number) && number > 0) payload.book_page_number = number;
    return Object.keys(payload).length > 0 ? payload : { book_page_id: null };
  }
  return { book_page_id: page.pageId ? parseInt(page.pageId, 10) : null };
};

export const describeSavedBookPage = (bookPage) => {
  if (!bookPage?.created) return '';
  const label = bookPage.number ? `Page ${bookPage.number}` : `"${bookPage.name}"`;
  return `${label} was added to the book.`;
};

export const formatBookPage = (page) => {
  if (!page) return '';
  if (!page.number) return page.name;
  return page.name && page.name !== `Page ${page.number}` ? `Page ${page.number} · ${page.name}` : `Page ${page.number}`;
};

const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300';

const BookPageFields = ({ bookId, value, onChange, disabled = false }) => {
  const [pages, setPages] = useState([]);
  const [loadedBookId, setLoadedBookId] = useState(null);
  const loading = Boolean(bookId) && loadedBookId !== bookId;
  const page = value || EMPTY_BOOK_PAGE;

  useEffect(() => {
    if (!bookId) {
      setPages([]);
      return undefined;
    }
    let cancelled = false;
    bookPagesAPI.getAll(1, 100, { book_id: bookId })
      .then((response) => {
        if (!cancelled) setPages(Array.isArray(response) ? response : (response?.data || []));
      })
      .catch(() => {
        if (!cancelled) setPages([]);
      })
      .finally(() => {
        if (!cancelled) setLoadedBookId(bookId);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  if (!bookId) return null;

  const bookPages = loading ? [] : pages;
  const options = [
    ...bookPages.map((p) => ({ value: String(p.id), label: formatBookPage(p) })),
    { value: NEW_PAGE, label: '+ New page' },
  ];

  const number = parseInt(page.number, 10);
  const name = (page.name || '').trim().toLowerCase();
  const match = page.pageId === NEW_PAGE
    ? (Number.isInteger(number)
        ? bookPages.find((p) => p.number === number)
        : name && bookPages.find((p) => (p.name || '').trim().toLowerCase() === name))
    : null;

  return (
    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
      <p className="text-xs font-medium text-slate-600">Page (optional)</p>
      <DropdownMenu
        options={options}
        value={page.pageId}
        onChange={(pageId) => onChange({ ...EMPTY_BOOK_PAGE, pageId: pageId || '' })}
        placeholder={loading ? 'Loading pages...' : bookPages.length > 0 ? 'Select a page...' : 'No pages yet — add one'}
        searchable={bookPages.length > 8}
        searchPlaceholder="Search pages..."
        clearable={Boolean(page.pageId)}
        clearLabel="No page"
      />
      {page.pageId === NEW_PAGE && (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={page.name}
              onChange={(e) => onChange({ ...page, name: e.target.value })}
              placeholder="Page name"
              maxLength={255}
              disabled={disabled}
              className={`${inputClass} flex-1 min-w-0`}
              aria-label="Page name"
            />
            <input
              type="number"
              value={page.number}
              onChange={(e) => onChange({ ...page, number: e.target.value })}
              placeholder="Page #"
              min="1"
              disabled={disabled}
              className={`${inputClass} w-24`}
              aria-label="Page number"
            />
          </div>
          {match ? (
            <p className="text-xs text-amber-700">
              {formatBookPage(match)} is already in this book.{' '}
              <button
                type="button"
                onClick={() => onChange({ ...EMPTY_BOOK_PAGE, pageId: String(match.id) })}
                className="font-medium underline"
              >
                Use that page
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-500">This page will be added to the book when you save.</p>
          )}
        </>
      )}
    </div>
  );
};

export default BookPageFields;
