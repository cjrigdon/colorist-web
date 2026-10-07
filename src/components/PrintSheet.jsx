import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getPaletteHexes } from '../utils/colorUtils';

const ROOT_ID = 'colorist-print-root';

// Browsers drop background colors when printing unless told otherwise, which would blank every swatch.
// index.css hides everything in print by default, so the sheet has to opt back in.
const PRINT_STYLES = `
@media screen { #${ROOT_ID} { display: none; } }
@media print {
  body > *:not(#${ROOT_ID}) { display: none !important; }
  #${ROOT_ID} { display: block; }
  #${ROOT_ID}, #${ROOT_ID} * {
    visibility: visible !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { margin: 0.5in; }
}
`;

/**
 * Renders children into a print-only sheet, opens the print dialog, and calls onDone once it closes.
 */
const PrintSheet = ({ documentTitle, heading, children, onDone }) => {
  const [container] = useState(() => {
    const el = document.createElement('div');
    el.id = ROOT_ID;
    return el;
  });
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = PRINT_STYLES;
    document.head.appendChild(style);
    document.body.appendChild(container);

    // The page title becomes the default file name when saving as PDF
    const previousTitle = document.title;
    if (documentTitle) document.title = documentTitle;

    const handleAfterPrint = () => onDoneRef.current?.();
    window.addEventListener('afterprint', handleAfterPrint);
    const timer = setTimeout(() => window.print(), 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
      document.title = previousTitle;
      container.remove();
      style.remove();
    };
  }, [container, documentTitle]);

  return createPortal(
    <div className="bg-white text-slate-900 font-sans">
      <header className="flex items-end justify-between border-b-2 border-slate-800 pb-2 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Colorist</p>
          <h1 className="text-2xl font-bold">{heading}</h1>
        </div>
        <p className="text-xs text-slate-500">
          {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </header>
      <div className="space-y-6">{children}</div>
    </div>,
    container
  );
};

const Swatch = ({ hex, size = 'w-10 h-10' }) => (
  <div
    className={`${size} flex-shrink-0 rounded border border-slate-300`}
    style={{ backgroundColor: hex || '#ffffff' }}
  />
);

export const ComboPrintList = ({ combos }) => (
  <>
    {combos.map((combo) => (
      <section key={combo.id} className="border border-slate-300 rounded-lg p-4" style={{ breakInside: 'avoid' }}>
        <h2 className="text-lg font-semibold mb-3">{combo.title}</h2>
        {combo.pencils?.length > 0 ? (
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">
            {combo.pencils.map((pencil, index) => (
              <div key={index} className="flex items-center gap-2 min-w-0">
                <Swatch hex={pencil.color?.hex} />
                <div className="min-w-0 text-xs leading-snug">
                  <p className="font-semibold">
                    {pencil.color_name}{pencil.color_number ? ` (${pencil.color_number})` : ''}
                  </p>
                  <p className="text-slate-600">{[...new Set([pencil.set?.brand, pencil.set?.name].filter(Boolean))].join(' ')}</p>
                  {pencil.color?.hex && <p className="text-slate-500 font-mono uppercase">{pencil.color.hex}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No colors in this combo.</p>
        )}
        {combo.tags?.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">Tags: {combo.tags.map((tag) => tag.tag).join(', ')}</p>
        )}
      </section>
    ))}
  </>
);

export const PalettePrintList = ({ palettes }) => (
  <>
    {palettes.map((palette) => {
      const hexes = getPaletteHexes(palette);
      const colors = [
        ...(palette.colors || []).filter((color) => color.hex).map((color) => ({ key: `c-${color.id}`, hex: color.hex, name: color.name })),
        ...(palette.custom_colors || []).map((hex, index) => ({ key: `x-${index}`, hex, name: 'Custom color' }))
      ];

      return (
        <section key={palette.id} className="border border-slate-300 rounded-lg overflow-hidden" style={{ breakInside: 'avoid' }}>
          <div className="flex h-12">
            {hexes.length > 0
              ? hexes.map((hex, index) => <div key={index} className="flex-1" style={{ backgroundColor: hex }} />)
              : <div className="flex-1 bg-slate-200" />}
          </div>
          <div className="p-4">
            <h2 className="text-lg font-semibold">{palette.title}</h2>
            {palette.base_color && <p className="text-xs text-slate-500 mb-3">Based on {palette.base_color}</p>}
            {colors.length > 0 ? (
              <div className="grid grid-cols-4 gap-x-4 gap-y-3 mt-3">
                {colors.map((color) => (
                  <div key={color.key} className="flex items-center gap-2 min-w-0">
                    <Swatch hex={color.hex} size="w-8 h-8" />
                    <div className="min-w-0 text-xs leading-snug">
                      {color.name && <p className="font-semibold">{color.name}</p>}
                      <p className="text-slate-500 font-mono uppercase">{color.hex}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 mt-2">No colors in this palette.</p>
            )}
          </div>
        </section>
      );
    })}
  </>
);

export default PrintSheet;
