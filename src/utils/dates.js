export const getTodayDate = () => new Date().toISOString().split("T")[0];
export const formatDateTitle = (date) => {
  if (!date) return "Sin fecha";
  const [year, month, day] = date.split("-");
  const fixedDate = new Date(Number(year), Number(month) - 1, Number(day));
  return fixedDate.toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" });
};
export const isExpiredTask = (task) => {
  if (!task.date) return false;
  const todayDate = getTodayDate();
  if (task.date < todayDate) return true;
  if (task.date === todayDate && task.time) return new Date(`${task.date}T${task.time}`) < new Date();
  return false;
};
