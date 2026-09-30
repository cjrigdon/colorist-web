/**
 * Build the Color Along path for a video, including its saved pencil set size and book when present.
 * @param {{ embedId: string, pencilSetSizeId?: number|string|null, bookId?: number|string|null }} video
 * @returns {string}
 */
export const buildColorAlongVideoPath = ({ embedId, pencilSetSizeId, bookId }) => {
  const params = new URLSearchParams({ video: embedId });
  if (pencilSetSizeId) {
    params.set('pencilSet', String(pencilSetSizeId));
  }
  if (bookId) {
    params.set('book', String(bookId));
  }
  return `/color-along?${params.toString()}`;
};
