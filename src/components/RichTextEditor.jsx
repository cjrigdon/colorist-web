import React, { useEffect, useMemo, useRef } from 'react';

const TOOLBAR_ACTIONS = [
  { label: 'B', command: 'bold', title: 'Bold' },
  { label: 'I', command: 'italic', title: 'Italic' },
  { label: 'U', command: 'underline', title: 'Underline' },
  { label: '• List', command: 'insertUnorderedList', title: 'Bulleted List' },
  { label: '1. List', command: 'insertOrderedList', title: 'Numbered List' }
];

const normalizeHtml = (html = '') => html.replace(/&nbsp;/g, ' ').trim();
const ALLOWED_TAGS = new Set(['P', 'BR', 'STRONG', 'EM', 'U', 'UL', 'OL', 'LI', 'A', 'B', 'I']);
const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

export const isRichTextEmpty = (html = '') => {
  if (!html) return true;
  const withoutTags = html
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<\/?(p|div|span|strong|em|u|ul|ol|li|b|i)\b[^>]*>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();

  return withoutTags.length === 0;
};

export const sanitizeRichTextHtml = (html = '') => {
  if (!html || typeof window === 'undefined') return '';

  const template = window.document.createElement('template');
  template.innerHTML = html;

  const sanitizeNode = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === window.Node.ELEMENT_NODE) {
        const tag = child.tagName.toUpperCase();

        if (!ALLOWED_TAGS.has(tag)) {
          const fragment = window.document.createDocumentFragment();
          while (child.firstChild) {
            fragment.appendChild(child.firstChild);
          }
          child.replaceWith(fragment);
          sanitizeNode(node);
          return;
        }

        Array.from(child.attributes).forEach((attr) => {
          const attrName = attr.name.toLowerCase();
          if (tag === 'A' && attrName === 'href') {
            try {
              const parsedUrl = new URL(attr.value, window.location.origin);
              if (!SAFE_URL_PROTOCOLS.has(parsedUrl.protocol)) {
                child.removeAttribute(attr.name);
              }
            } catch {
              child.removeAttribute(attr.name);
            }
            return;
          }

          child.removeAttribute(attr.name);
        });

        if (tag === 'A') {
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noopener noreferrer');
        }
      }

      if (child.nodeType !== window.Node.TEXT_NODE) {
        sanitizeNode(child);
      }
    });
  };

  sanitizeNode(template.content);
  return normalizeHtml(template.innerHTML);
};

const RichTextEditor = ({ value, onChange, placeholder = '', minHeight = '8rem' }) => {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  const normalizedValue = useMemo(() => (value && value.trim().length > 0 ? value : ''), [value]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== normalizedValue) {
      editorRef.current.innerHTML = normalizedValue;
    }
  }, [normalizedValue]);

  const handleInput = () => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }
    onChange(normalizeHtml(editorRef.current.innerHTML));
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selectionRef.current || !editorRef.current) return;
    if (!editorRef.current.contains(selectionRef.current.commonAncestorContainer)) return;
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  };

  const handleAction = (command) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand(command, false, null);
    handleInput();
  };

  const handleAddLink = () => {
    if (!editorRef.current) return;
    const url = window.prompt('Enter URL');
    if (!url) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand('createLink', false, url);
    handleInput();
  };

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.command}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleAction(action.command)}
            className="px-2 py-1 text-xs text-slate-700 hover:bg-slate-200 rounded transition-colors"
            title={action.title}
          >
            {action.label}
          </button>
        ))}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAddLink}
          className="px-2 py-1 text-xs text-slate-700 hover:bg-slate-200 rounded transition-colors"
          title="Insert Link"
        >
          Link
        </button>
      </div>
      <div className="relative">
        {isRichTextEmpty(value) && (
          <span className="pointer-events-none absolute left-3 top-2 text-sm text-slate-400">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyUp={handleInput}
          onMouseUp={handleInput}
          className="w-full px-3 py-2 text-slate-800 focus:outline-none relative [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2 [&_li]:my-1"
          style={{ minHeight }}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
