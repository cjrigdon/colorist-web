const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    img.src = url;
  });

/**
 * Downscale a photo before upload so large phone pictures stay under the server's upload limit.
 * Small images and GIFs (which would lose their animation) are returned unchanged.
 * @param {File} file
 * @param {{ maxDimension?: number, maxBytes?: number, quality?: number }} options
 * @returns {Promise<File>}
 */
export const shrinkImageForUpload = async (file, { maxDimension = 2000, maxBytes = 1.5 * 1024 * 1024, quality = 0.85 } = {}) => {
  if (!file || file.type === 'image/gif') return file;

  let img;
  try {
    img = await loadImage(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale === 1 && file.size <= maxBytes) return file;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) return file;

  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
};
