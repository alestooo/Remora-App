export const calculateHours = (segments = []) => {
  let total = 0;
  segments.forEach((segment) => {
    if (!segment.start || !segment.end) return;
    const [sh, sm] = segment.start.split(":").map(Number);
    const [eh, em] = segment.end.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (end > start) total += (end - start) / 60;
  });
  return Number(total.toFixed(2));
};
export const createNoteId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
