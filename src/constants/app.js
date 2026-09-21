import universidad from "../assets/covers/universidad.jpg";
import universidad2 from "../assets/covers/universidad2.jpg";
import trabajo from "../assets/covers/trabajo.jpg";
import trabajo2 from "../assets/covers/trabajo2.jpg";
import tarea from "../assets/covers/tarea.jpg";
import tarea2 from "../assets/covers/tarea2.jpg";
import recordatorio from "../assets/covers/recordatorio.jpg";
import recordatorio2 from "../assets/covers/recordatorio2.jpg";
import alekeyCover from "../assets/covers/alekey.png";
import alekeyCover2 from "../assets/covers/alekey2.png";

export const DESKTOP_COVERS = {
  Universidad: universidad,
  Trabajo: trabajo,
  Tarea: tarea,
  Recordatorio: recordatorio,
  Alekey: alekeyCover,
};

export const MOBILE_COVERS = {
  Universidad: universidad2,
  Trabajo: trabajo2,
  Tarea: tarea2,
  Recordatorio: recordatorio2,
  Alekey: alekeyCover2,
};

export const UNIVERSITY_COURSES = [
  "Matemática Discreta 2",
  "Física 1",
  "Liderazgo y Trabajo Colaborativo",
];

export const DEFAULT_UNIVERSITY_COURSE = UNIVERSITY_COURSES[0];

export const ITEMS_PER_PAGE = 10;
export const NOTES_PER_PAGE = 10;
export const UNLOCK_TIME = 3 * 60 * 1000;
export const HOURLY_RATE = 1500;

export const NOTE_COLORS = [
  "note-red",
  "note-blue",
  "note-yellow",
  "note-green",
  "note-purple",
  "note-gray",
];

export const DASHBOARD_CARD_DEFINITIONS = [
  { id: "today", label: "Hoy" },
  { id: "next", label: "Próxima entrega" },
  { id: "pending", label: "Pendientes" },
];

export const DEFAULT_PREFERENCES = {
  dashboardCards: [
    { id: "today", visible: true },
    { id: "next", visible: true },
    { id: "pending", visible: true },
  ],
  progressRange: "week",
  notificationsEnabled: false,
  notifyMinutesBefore: 120,
  timezone: "America/Costa_Rica",
};

export const PROGRESS_RANGES = [
  { id: "week", label: "Esta semana" },
  { id: "month", label: "Este mes" },
  { id: "all", label: "Todo" },
];

export const BACKUP_VERSION = 2;
