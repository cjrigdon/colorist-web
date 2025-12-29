import React, { useState } from 'react';

const PencilInventory = () => {
  const [selectedSet, setSelectedSet] = useState(null);

  const pencilSets = [
    {
      id: 1,
      name: 'Prismacolor Premier',
      brand: 'Prismacolor',
      count: 150,
      colors: [
        { id: 1, name: 'Crimson Red', hex: '#DC143C', inStock: true },
        { id: 2, name: 'True Blue', hex: '#0073CF', inStock: true },
        { id: 3, name: 'Lime Peel', hex: '#D0E429', inStock: false },
        { id: 4, name: 'Violet', hex: '#8B00FF', inStock: true },
        { id: 5, name: 'Canary Yellow', hex: '#FFEF00', inStock: true },
      ]
    },
    {
      id: 2,
      name: 'Faber-Castell Polychromos',
      brand: 'Faber-Castell',
      count: 120,
      colors: [
        { id: 1, name: 'Scarlet Red', hex: '#FF2400', inStock: true },
        { id: 2, name: 'Cobalt Blue', hex: '#0047AB', inStock: true },
        { id: 3, name: 'Lemon Yellow', hex: '#FFF700', inStock: true },
        { id: 4, name: 'Purple Violet', hex: '#8A2BE2', inStock: false },
      ]
    },
    {
      id: 3,
      name: 'Derwent Coloursoft',
      brand: 'Derwent',
      count: 72,
      colors: [
        { id: 1, name: 'Rose', hex: '#FF007F', inStock: true },
        { id: 2, name: 'Sky Blue', hex: '#87CEEB', inStock: true },
        { id: 3, name: 'Forest Green', hex: '#228B22', inStock: true },
      ]
    },
  ];

  const selectedSetData = pencilSets.find(set => set.id === selectedSet);

  return (
    <div className="space-y-6">
      {/* Main Content Section */}
      <div className="bg-slate-50 rounded-2xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sets List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 font-venti">Your Sets</h3>
              <button 
                className="px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                style={{
                  backgroundColor: '#ea3663'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Set</span>
              </button>
            </div>
            <div className="space-y-2">
              {pencilSets.map((set) => (
                <button
                  key={set.id}
                  onClick={() => setSelectedSet(set.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedSet === set.id
                      ? ''
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  style={selectedSet === set.id ? {
                    borderColor: '#49817b',
                    backgroundColor: '#c1fcf6'
                  } : {}}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-slate-800">{set.name}</h4>
                    <span className="text-xs text-slate-500">{set.count}</span>
                  </div>
                  <p className="text-sm text-slate-600">{set.brand}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Colors Grid */}
        <div className="lg:col-span-2">
          {selectedSetData ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 font-venti">{selectedSetData.name}</h3>
                  <p className="text-sm text-slate-600">{selectedSetData.brand}</p>
                </div>
                <button 
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{
                    color: '#49817b'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#c1fcf6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Edit Set
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {selectedSetData.colors.map((color) => (
                  <div
                    key={color.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                      color.inStock
                        ? 'border-slate-200 bg-white'
                        : 'border-red-200 bg-red-50 opacity-60'
                    }`}
                    onMouseEnter={(e) => {
                      if (color.inStock) {
                        e.currentTarget.style.borderColor = '#ea3663';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (color.inStock) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }
                    }}
                  >
                    <div
                      className="w-full h-16 rounded-lg mb-3 shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    ></div>
                    <h4 className="font-medium text-sm text-slate-800 mb-1">{color.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-mono">{color.hex}</span>
                      {!color.inStock && (
                        <span className="text-xs text-red-600 font-medium">Out</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button 
                className="mt-6 w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 transition-colors flex items-center justify-center space-x-2"
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#49817b';
                  e.target.style.color = '#49817b';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.color = '#475569';
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Color</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="text-6xl mb-4">✏️</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">Select a Pencil Set</h3>
              <p className="text-slate-600">Choose a set from the left to view its colors</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default PencilInventory;

