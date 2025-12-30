import React, { useState } from 'react';

const ColorCombos = () => {
  const [combos] = useState([
    {
      id: 1,
      name: 'Ocean Breeze',
      colors: [
        { name: 'Sky Blue', hex: '#87CEEB' },
        { name: 'Turquoise', hex: '#40E0D0' },
        { name: 'Navy Blue', hex: '#000080' },
      ],
      tags: ['nature', 'cool'],
    },
    {
      id: 2,
      name: 'Sunset Glow',
      colors: [
        { name: 'Coral', hex: '#FF7F50' },
        { name: 'Peach', hex: '#FFE5B4' },
        { name: 'Golden Yellow', hex: '#FFD700' },
        { name: 'Orange Red', hex: '#FF4500' },
      ],
      tags: ['warm', 'vibrant'],
    },
    {
      id: 3,
      name: 'Forest Floor',
      colors: [
        { name: 'Forest Green', hex: '#228B22' },
        { name: 'Olive', hex: '#808000' },
        { name: 'Brown', hex: '#8B4513' },
      ],
      tags: ['nature', 'earth'],
    },
    {
      id: 4,
      name: 'Lavender Dreams',
      colors: [
        { name: 'Lavender', hex: '#E6E6FA' },
        { name: 'Purple', hex: '#800080' },
        { name: 'Pink', hex: '#FFC0CB' },
      ],
      tags: ['soft', 'pastel'],
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="px-4">
        <div className="flex items-center justify-end">
          <button 
          className="px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          style={{
            backgroundColor: '#ea3663'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Combo</span>
        </button>
        </div>
      </div>

      {/* Combos Grid Section */}
      <div className="bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {combos.map((combo) => (
          <div
            key={combo.id}
            className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all"
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-800 font-venti">{combo.name}</h3>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>

            {/* Color Swatches */}
            <div className="flex flex-wrap gap-3 mb-4">
              {combo.colors.map((color, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-12 h-12 rounded-lg shadow-sm border border-slate-200"
                    style={{ backgroundColor: color.hex }}
                  ></div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{color.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{color.hex}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {combo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
        </div>

        {combos.length === 0 && (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">No Color Combos Yet</h3>
          <p className="text-slate-600 mb-4">Create your first color combination to get started</p>
          <button 
            className="px-6 py-3 text-white rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: '#ea3663'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
          >
            Create Combo
          </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorCombos;

