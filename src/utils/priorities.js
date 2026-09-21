import { getTodayDate } from "./dates";
export const getAutoPriority = (date) => {
  if (!date) return "Media";
  const today = new Date(getTodayDate());
  const target = new Date(date);
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 2) return "Inminente";
  if (diffDays <= 5) return "Alta";
  if (diffDays <= 7) return "Media";
  return "Baja";
};
