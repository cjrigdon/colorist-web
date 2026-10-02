import React, { useState } from 'react';
import TagIcon, { TAG_ICON_GROUPS } from './TagIcon';

const TagIconPicker = ({ value, onChange }) => {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();

  const groups = TAG_ICON_GROUPS
    .map(group => ({
      label: group.label,
      keys: Object.keys(group.icons).filter(key => !query || key.replace(/-/g, ' ').includes(query)),
    }))
    .filter(group => group.keys.length > 0);

  const cellClass = (selected) =>
    `flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
      selected ? 'bg-pink-50' : 'border-transparent hover:bg-slate-100'
    }`;
  const selectedStyle = { borderColor: '#ea3663' };

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault();
        }}
        placeholder="Search icons..."
        className="w-full px-3 py-2 mb-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ea3663] focus:border-transparent"
      />
      <div className="max-h-56 overflow-y-auto pr-1">
        {!query && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className={`mb-2 px-3 py-1.5 rounded-lg border text-xs font-medium text-slate-600 ${!value ? 'bg-pink-50' : 'border-slate-200 hover:bg-slate-100'}`}
            style={!value ? selectedStyle : undefined}
          >
            No icon
          </button>
        )}
        {groups.map(group => (
          <div key={group.label} className="mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{group.label}</p>
            <div className="flex flex-wrap gap-1">
              {group.keys.map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange(key)}
                  className={cellClass(value === key)}
                  style={value === key ? selectedStyle : undefined}
                  title={key.replace(/-/g, ' ')}
                  aria-label={key.replace(/-/g, ' ')}
                  aria-pressed={value === key}
                >
                  <TagIcon icon={key} size={22} />
                </button>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-500">No icons match</p>
        )}
      </div>
    </div>
  );
};

export default TagIconPicker;
