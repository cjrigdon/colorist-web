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

export const formatVideoTimestamp = (seconds) => {
  if (seconds === null || seconds === undefined || seconds === '') {
    return null;
  }
  const total = Math.floor(Number(seconds));
  if (!Number.isFinite(total) || total < 0) {
    return null;
  }
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  }
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
};

export const formatVideoTimeRange = (startSeconds, endSeconds) => {
  const start = formatVideoTimestamp(startSeconds);
  const end = formatVideoTimestamp(endSeconds);
  if (start && end && start !== end) {
    return `${start}–${end}`;
  }
  return start || end || null;
};
