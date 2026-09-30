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

