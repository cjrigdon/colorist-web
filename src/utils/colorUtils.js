/**
 * Convert Delta E to percentage match
 * Delta E 0 = 100%, Delta E 1 = ~95%, Delta E 2 = ~90%, Delta E 3 = ~85%, Delta E 5 = ~75%, Delta E 10+ = ~50% or less
 * @param {number} deltaE - The Delta E value
 * @returns {number} - The percentage match (0-100)
 */
export const deltaEToPercentage = (deltaE) => {
  if (deltaE === null || deltaE === undefined || isNaN(deltaE)) {
    return 0;
  }
  // Use a formula that maps Delta E to percentage match
  // Lower Delta E = higher percentage match
  // Formula uses exponential decay for more realistic mapping
  // For deltaE <= 1: 100% - (deltaE * 5) = 100% to 95%
  // For deltaE > 1: exponential decay from 95%
  
  //let percentage;
  //if (deltaE <= 1) {
  //  percentage = 100 - (deltaE * 5);
  //} else if (deltaE <= 5) {
  //  percentage = 95 - ((deltaE - 1) * 5);
  //} else {
    //percentage = deltaE; 
  //  percentage = Math.max(0, 85 - ((deltaE - 20) * 5));
  //}
  //return Math.round(Math.max(0, Math.min(100, percentage)));
  const number = 100- deltaE;
  return number.toFixed(1);
};

/**
 * Normalize user-entered hex (with or without #, 3 or 6 digits) to uppercase #RRGGBB
 * @param {string} hex
 * @returns {string|null} - null when the value is not a valid hex color
 */
export const normalizeHex = (hex) => {
  if (!hex || typeof hex !== 'string') return null;
  let value = hex.trim().replace(/^#/, '');
  if (value.length === 3) {
    value = value.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;
  return `#${value.toUpperCase()}`;
};

/**
 * All hex codes in a color palette: system colors first, then the palette's custom colors
 * @param {object} palette
 * @returns {string[]}
 */
export const getPaletteHexes = (palette) => [
  ...(palette?.colors || []).map((color) => color.hex).filter(Boolean),
  ...(palette?.custom_colors || []),
];

/**
 * Add hex codes to a palette selection: exact system color matches are selected, anything else becomes a custom color
 * @param {string[]} hexes
 * @param {object[]} availableColors - system colors
 * @param {object[]} selectedColors - currently selected system colors
 * @param {string[]} customColors - current custom hex codes
 * @returns {{ selectedColors: object[], customColors: string[] }}
 */
export const mergeHexesIntoPalette = (hexes, availableColors, selectedColors, customColors) => {
  const systemByHex = new Map();
  availableColors.forEach((color) => {
    const hex = normalizeHex(color.hex);
    if (hex && !systemByHex.has(hex)) systemByHex.set(hex, color);
  });

  const nextSelected = [...selectedColors];
  const nextCustom = [...customColors];
  hexes.forEach((raw) => {
    const hex = normalizeHex(raw);
    if (!hex) return;
    const systemColor = systemByHex.get(hex);
    if (systemColor) {
      if (!nextSelected.some((color) => color.id === systemColor.id)) nextSelected.push(systemColor);
    } else if (!nextCustom.includes(hex)) {
      nextCustom.push(hex);
    }
  });

  return { selectedColors: nextSelected, customColors: nextCustom };
};

/**
 * Whether dark text reads better than white text on the given background (WCAG relative luminance)
 * @param {string} hex - A #rgb or #rrggbb color
 * @returns {boolean}
 */
export const prefersDarkText = (hex) => {
  if (!hex || typeof hex !== 'string') return true;
  let value = hex.trim().replace(/^#/, '');
  if (value.length === 3) {
    value = value.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9a-f]{6}$/i.test(value)) return true;

  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(value.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luminance > 0.179;
};

