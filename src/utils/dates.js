export const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateTitle = (date) => {
  if (!date) return "Sin fecha";
  const [year, month, day] = date.split("-");
  const fixedDate = new Date(Number(year), Number(month) - 1, Number(day));
  return fixedDate.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const taskDateTime = (task) => {
  if (!task?.date) return null;
  return new Date(`${task.date}T${task.time || "23:59"}`);
};

export const isExpiredTask = (task) => {
  if (!task?.date || task.completed || task.archived) return false;
  const dateTime = taskDateTime(task);
  return dateTime ? dateTime.getTime() < Date.now() : false;
};

export const isTaskToday = (task) => task?.date === getTodayDate();

export const isDateInRange = (dateString, range) => {
  if (!dateString || range === "all") return true;

  const [year, month, day] = dateString.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const now = new Date();

  if (range === "month") {
    return (
      target.getFullYear() === now.getFullYear() &&
      target.getMonth() === now.getMonth()
    );
  }

  const start = new Date(now);
  const currentDay = start.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return target >= start && target <= end;
};

export const formatRelativeTaskDate = (task) => {
  if (!task?.date) return "Sin fecha";
  if (task.date === getTodayDate()) return task.time ? `Hoy · ${task.time}` : "Hoy";

  const date = taskDateTime(task);
  if (!date) return task.date;

  return date.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
  });
};
