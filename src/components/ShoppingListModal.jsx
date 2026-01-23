import React from 'react';

const ShoppingListModal = ({ isOpen, onClose, pencils, setData, pencilSets }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    // Prepare pencil data with colors extracted and set information
    const pencilsWithColors = pencils.map(pencil => {
      // Extract hex color - handle both nested color object and direct hex
      let hexColor = '#ffffff';
      
      // Try multiple ways to access the color
      if (pencil.color) {
        if (typeof pencil.color === 'string') {
          hexColor = pencil.color.startsWith('#') ? pencil.color : `#${pencil.color}`;
        } else if (pencil.color.hex) {
          hexColor = pencil.color.hex;
        } else if (typeof pencil.color === 'object') {
          // Try to access hex from nested object
          hexColor = pencil.color.hex || '#ffffff';
        }
      }
      
      // Ensure hex color has # prefix and is valid
      if (hexColor && typeof hexColor === 'string') {
        if (!hexColor.startsWith('#')) {
          hexColor = `#${hexColor}`;
        }
      } else {
        hexColor = '#ffffff';
      }
      
      // Find the set this pencil belongs to
      let brand = 'Unknown';
      let setName = 'Unknown';
      if (pencilSets) {
        const pencilSet = pencilSets.find(set => {
          if (set.id === pencil.colored_pencil_set_id) return true;
          if (set.set?.id === pencil.colored_pencil_set_id) return true;
          return false;
        });
        if (pencilSet) {
          brand = pencilSet.set?.brand || pencilSet.brand || 'Unknown';
          setName = pencilSet.set?.name || pencilSet.name || 'Unknown';
        }
      }
      
      return {
        color_name: pencil.color_name || 'N/A',
        color_number: pencil.color_number || 'N/A',
        hex: hexColor,
        brand: brand,
        set_name: setName
      };
    });

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shopping List</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              margin: 0;
            }
            h1 {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .set-info {
              font-size: 16px;
              color: #475569;
              margin-bottom: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            thead tr {
              border-bottom: 2px solid #1e293b;
            }
            th {
              text-align: left;
              padding: 12px;
              font-weight: bold;
            }
            tbody tr {
              border-bottom: 1px solid #e2e8f0;
            }
            td {
              padding: 12px;
            }
            .color-swatch {
              width: 32px;
              height: 32px;
              border-radius: 4px;
              border: 1px solid #cbd5e1;
              display: inline-block;
              vertical-align: middle;
              margin-right: 12px;
            }
            .color-name {
              font-weight: 500;
            }
            .hex-code {
              font-family: monospace;
              font-size: 14px;
            }
            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <h1>Shopping List</h1>
          <p class="set-info">${pencils.length} pencil${pencils.length !== 1 ? 's' : ''} selected</p>
          <table>
            <thead>
              <tr>
                <th>Brand</th>
                <th>Set</th>
                <th>Color</th>
                <th>Number</th>
                <th>Hex</th>
              </tr>
            </thead>
            <tbody>
              ${pencilsWithColors.map((pencil) => {
                // Ensure hex is valid - must be a string starting with # and at least 4 chars (#fff minimum)
                const validHex = (pencil.hex && typeof pencil.hex === 'string' && pencil.hex.startsWith('#') && pencil.hex.length >= 4)
                  ? pencil.hex 
                  : '#ffffff';
                
                return `
                <tr>
                  <td>${pencil.brand}</td>
                  <td>${pencil.set_name}</td>
                  <td>
                    <div class="color-swatch" style="background-color: ${validHex};"></div>
                    <span class="color-name">${pencil.color_name}</span>
                  </td>
                  <td>${pencil.color_number}</td>
                  <td class="hex-code">${validHex}</td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      // Optionally close the window after printing
      // printWindow.close();
    }, 250);
  };

  return (
    <>
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800 font-venti">
                Shopping List
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {pencils.length} pencil{pencils.length !== 1 ? 's' : ''} selected
                {(() => {
                  // Count unique sets
                  const setIds = new Set();
                  pencils.forEach(pencil => {
                    if (pencil.colored_pencil_set_id) {
                      setIds.add(pencil.colored_pencil_set_id);
                    }
                  });
                  const uniqueSetCount = setIds.size;
                  if (uniqueSetCount > 1) {
                    return ` from ${uniqueSetCount} sets`;
                  } else if (uniqueSetCount === 1 && pencilSets) {
                    // Show set name if only one set
                    const setId = Array.from(setIds)[0];
                    const pencilSet = pencilSets.find(set => {
                      if (set.id === setId) return true;
                      if (set.set?.id === setId) return true;
                      return false;
                    });
                    if (pencilSet) {
                      const brand = pencilSet.set?.brand || pencilSet.brand || '';
                      const name = pencilSet.set?.name || pencilSet.name || '';
                      return brand && name ? ` - ${brand} ${name}` : '';
                    }
                  }
                  return '';
                })()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium transition-colors hover:bg-teal-700 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="px-6 py-4 overflow-y-auto flex-1">
            {pencils.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No pencils selected for shopping list
              </div>
            ) : (
              <div className="space-y-3">
                {pencils.map((pencil) => (
                  <div
                    key={pencil.id}
                    className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {/* Color Swatch */}
                    {(() => {
                      // Get hex color - ColorResource already includes # prefix
                      const hexColor = pencil.color?.hex || '#ffffff';
                      return (
                        <div
                          className="w-16 h-16 rounded-lg shadow-sm flex-shrink-0 border border-slate-200"
                          style={{ backgroundColor: hexColor }}
                        ></div>
                      );
                    })()}
                    
                    {/* Pencil Info */}
                    <div className="flex-1 min-w-0">
                      {pencilSets && (() => {
                        // Find the set this pencil belongs to
                        const pencilSet = pencilSets.find(set => {
                          if (set.id === pencil.colored_pencil_set_id) return true;
                          if (set.set?.id === pencil.colored_pencil_set_id) return true;
                          return false;
                        });
                        if (pencilSet) {
                          const brand = pencilSet.set?.brand || pencilSet.brand || 'Unknown';
                          const setName = pencilSet.set?.name || pencilSet.name || 'Unknown';
                          return (
                            <>
                              <p className="text-xs text-slate-500 mb-1">
                                {brand} - {setName}
                              </p>
                              <h3 className="font-semibold text-slate-800">
                                {pencil.color_name || 'N/A'} ({pencil.color_number || 'N/A'})
                              </h3>
                              <p className="text-sm text-slate-600 font-mono">
                                {pencil.color?.hex || 'N/A'}
                              </p>
                            </>
                          );
                        }
                        return (
                          <>
                            <h3 className="font-semibold text-slate-800">
                              {pencil.color_name || 'N/A'} ({pencil.color_number || 'N/A'})
                            </h3>
                            <p className="text-sm text-slate-600 font-mono">
                              {pencil.color?.hex || 'N/A'}
                            </p>
                          </>
                        );
                      })()}
                    </div>

                    {/* Shopping Link */}
                    {pencil.shopping_link && (
                      <div className="flex-shrink-0">
                        <a
                          href={pencil.shopping_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium transition-colors hover:bg-teal-700 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span>Shop</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ShoppingListModal;

