import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, provider, db } from "./firebase";
import { requestNotificationPermission } from "./notifications";
import { registerPasskey, unlockWithPasskey } from "./passkey";

import {
  Plus,
  ListTodo,
  BarChart3,
  Trash2,
  X,
  FileText,
  Pencil,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  NotebookText,
  Lock,
  Eye,
  EyeOff,
  Calculator,
  BookOpen,
  StickyNote,
  UserPlus,
  Users,
  CircleDollarSign,
  BadgeCheck,
  BadgeX,
  GripVertical,
  FilePlus2,
  Pin,
  PinOff,
  MoreHorizontal,
  CheckSquare,
  Type,
  UserRound,
  Search,
  PlusCircle,
} from "lucide-react";

import icono from "./assets/icono.png";

import universidad from "./assets/covers/universidad.jpg";
import universidad2 from "./assets/covers/universidad2.jpg";

import trabajo from "./assets/covers/trabajo.jpg";
import trabajo2 from "./assets/covers/trabajo2.jpg";

import tarea from "./assets/covers/tarea.jpg";
import tarea2 from "./assets/covers/tarea2.jpg";

import recordatorio from "./assets/covers/recordatorio.jpg";
import recordatorio2 from "./assets/covers/recordatorio2.jpg";

import alekeyCover from "./assets/covers/alekey.png";
import alekeyCover2 from "./assets/covers/alekey2.png";

const DESKTOP_COVERS = {
  Universidad: universidad,
  Trabajo: trabajo,
  Tarea: tarea,
  Recordatorio: recordatorio,
  Alekey: alekeyCover,
};

const MOBILE_COVERS = {
  Universidad: universidad2,
  Trabajo: trabajo2,
  Tarea: tarea2,
  Recordatorio: recordatorio2,
  Alekey: alekeyCover2,
};

const UNIVERSITY_COURSES = [
  "Pensamiento Crítico",
  "Probabilidad y Estadística 2",
  "Calidad, Verificación y Validación del Software",
  "Arquitectura de Software 1",
  "Cálculo Diferencial e Integral",
];

const ITEMS_PER_PAGE = 10;
const NOTES_PER_PAGE = 10;

const NOTE_COLORS = [
  "note-red",
  "note-blue",
  "note-yellow",
  "note-green",
  "note-purple",
  "note-gray",
];

const createNoteId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const MASTER_PASSWORD = "Alekey149";
const UNLOCK_TIME = 5 * 60 * 1000;
const HOURLY_RATE = 1500;

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const getTodayDate = () => new Date().toISOString().split("T")[0];

const formatDateTitle = (date) => {
  if (!date) return "Sin fecha";

  const [year, month, day] = date.split("-");
  const fixedDate = new Date(Number(year), Number(month) - 1, Number(day));

  return fixedDate.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getAutoPriority = (date) => {
  if (!date) return "Media";

  const today = new Date(getTodayDate());
  const target = new Date(date);
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays <= 2) return "Inminente";
  if (diffDays <= 5) return "Alta";
  if (diffDays <= 7) return "Media";
  return "Baja";
};

const calculateHours = (segments) => {
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

const calculateClientTotal = (products = []) => {
  return products.reduce((sum, product) => {
    const price = Number(product.price || 0);
    return sum + price;
  }, 0);
};

function SortableNoteCard({
  note,
  onOpen,
  notesReorderMode,
  noteMenuId,
  setNoteMenuId,
  toggleNotePinned,
  deleteNote,
  openEditNote,
  toggleChecklistItemInNote,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : "auto",
  };

  const noteDate = note?.createdAt?.toDate
    ? note.createdAt.toDate().toLocaleDateString("es-CR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Hoy";

  const checklistBlocks = (note.blocks || []).filter(
    (block) => block.type === "checklist"
  );

  const pendingBlocks = (note.blocks || []).filter(
    (block) => block.type === "pending" && (block.person || block.amount)
  );

  const textBlocks = (note.blocks || []).filter(
    (block) => block.type === "text" && block.text
  );

  const totalChecklistItems = checklistBlocks.reduce(
    (sum, block) => sum + (block.items || []).length,
    0
  );

  const completedChecklistItems = checklistBlocks.reduce(
    (sum, block) =>
      sum + (block.items || []).filter((item) => item.done).length,
    0
  );

  return (
    <motion.article
      ref={setNodeRef}
      style={style}
      layout
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className={`note-card ${note.color || "note-red"} ${
        isDragging ? "dragging" : ""
      } ${notesReorderMode ? "reorder-active" : ""}`}
      onClick={() => {
        if (notesReorderMode) return;
        onOpen(note);
      }}
    >
      {notesReorderMode && (
        <button
          className="note-drag-handle"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          aria-label="Mover nota"
          type="button"
        >
          <GripVertical size={18} />
        </button>
      )}

      <div className="note-card-header">
        <span className="note-emoji">📝</span>

        <div className="note-card-right">
          <small>{noteDate}</small>

          {note.pinned && (
            <span className="note-pin-indicator">
              <Pin size={15} />
            </span>
          )}

          <button
            className="note-menu-btn"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setNoteMenuId(noteMenuId === note.id ? null : note.id);
            }}
          >
            <MoreHorizontal size={18} />
          </button>

          {noteMenuId === note.id && (
            <div className="note-card-menu" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setNoteMenuId(null);
              openEditNote(note);
            }}
          >
            <Pencil size={15} />
            Editar nota
          </button>

            <button
              onClick={() => {
                setNoteMenuId(null);
                toggleNotePinned(note);
              }}
            >
              {note.pinned ? <PinOff size={15} /> : <Pin size={15} />}
              {note.pinned ? "Desfijar" : "Fijar"}
            </button>

            <button
              className="danger"
              onClick={() => {
                setNoteMenuId(null);
                deleteNote(note.id);
              }}
            >
              <Trash2 size={15} />
              Eliminar
            </button>
            </div>
          )}
        </div>
      </div>

      <h3>{note.title}</h3>

      {note.content && <p>{note.content}</p>}

      {textBlocks.slice(0, 1).map((block) => (
        <p key={block.id}>{block.text}</p>
      ))}

      {checklistBlocks.slice(0, 1).map((block) => (
        <div className="note-preview-checklist" key={block.id}>
          <strong>{block.title || "Checklist"}</strong>

          {(block.items || []).slice(0, 3).map((item) => (

          <div
            className={`note-preview-check ${item.done ? "completed" : ""}`}
            key={item.id}
          >
            <span className={`fake-check ${item.done ? "done" : ""}`}>
              {item.done ? "✓" : ""}
            </span>
            <span>{item.text || "Elemento sin nombre"}</span>
          </div>

          ))}
        </div>
      ))}

          {pendingBlocks.slice(0, 1).map((block) => (
            <div
              className={`note-preview-pending ${
                Number(block.amount || 0) > 0 ? "pending-red" : "pending-green"
              }`}
              key={block.id}
            >
          <div>
            <UserRound size={17} />
            <span>{block.person || "Pendiente"}</span>
          </div>

          <strong>
            ₡{Number(block.amount || 0).toLocaleString("es-CR")}
          </strong>
        </div>
      ))}

      <div className="note-card-footer">
        {totalChecklistItems > 0 && (
          <span>
            {completedChecklistItems}/{totalChecklistItems} tareas
          </span>
        )}

        {pendingBlocks.length > 0 && (
          <span>
            {pendingBlocks.length} pendiente
            {pendingBlocks.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </motion.article>
  );
}

function App() {
  const emptyForm = {
    title: "",
    type: "Universidad",
    course: "Pensamiento Crítico",
    alekeyRole: "Encargado",
    description: "",
    date: "",
    time: "",
    priority: "Media",
    progressActive: true,
    hoursActive: true,
    checklist: "",
    resources: [{ name: "", url: "", type: "PDF" }],
    driveFolderUrl: "",
    workSegments: [{ start: "", end: "" }],
    totalHours: "",
    hourlyRate: "1500",
  };

  const emptyAccountForm = {
    title: "",
    username: "",
    cedula: "",
    email: "",
    user: "",
    password: "",
    pin: "",
  };

  const emptyClientForm = {
    name: "",
    products: [{ name: "", price: "" }],
    paid: false,
  };

  const emptyNoteForm = {
    title: "",
    content: "",
    color: "note-red",
    pinned: false,
    blocks: [],
  };

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [view, setView] = useState("Inicio");
  const [tasks, setTasks] = useState([]);
  const [toolsData, setToolsData] = useState({ quickNote: "" });
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [securityData, setSecurityData] = useState({});

  const [filter, setFilter] = useState("Todas");
  const [page, setPage] = useState(1);
  const [showExpired, setShowExpired] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [originalForm, setOriginalForm] = useState(null);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [visibleAccountId, setVisibleAccountId] = useState(null);
  const [accountsUnlocked, setAccountsUnlocked] = useState(false);
  const [accountsUnlockEnd, setAccountsUnlockEnd] = useState(null);
  const [unlockSecondsLeft, setUnlockSecondsLeft] = useState(0);
  const [mobilePasskeyAvailable, setMobilePasskeyAvailable] = useState(false);
  const [masterInput, setMasterInput] = useState("");
  const [accountErrors, setAccountErrors] = useState({});

  const [selectedTool, setSelectedTool] = useState(null);

  const [gradeScore, setGradeScore] = useState("");
  const [gradeTotal, setGradeTotal] = useState("");

  const [calcA, setCalcA] = useState("");
  const [calcB, setCalcB] = useState("");
  const [calcOperation, setCalcOperation] = useState("+");

  const [showClientModal, setShowClientModal] = useState(false);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [clientErrors, setClientErrors] = useState({});

  const [notes, setNotes] = useState([]);
  const [noteForm, setNoteForm] = useState(emptyNoteForm);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteMode, setNoteMode] = useState("create");
  const [noteErrors, setNoteErrors] = useState({});
  const [notePage, setNotePage] = useState(1);
  const [notesReorderMode, setNotesReorderMode] = useState(false);
  const [noteSearch, setNoteSearch] = useState("");
  const [noteMenuId, setNoteMenuId] = useState(null);

  const [errors, setErrors] = useState({});
  const [alertData, setAlertData] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 650,
        tolerance: 8,
      },
    })
  );

  const [isMobileCover, setIsMobileCover] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileCover(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const DEFAULT_COVERS = isMobileCover ? MOBILE_COVERS : DESKTOP_COVERS;

  const showAlert = (data) => setAlertData(data);
  const closeAlert = () => setAlertData(null);

  const goToView = (nextView) => {
    setView(nextView);
    setSelectedTool(null);

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    setMobilePasskeyAvailable(isMobileDevice());
  }, []);

  useEffect(() => {
    let mounted = true;

    const fallback = setTimeout(() => {
      if (mounted) setAuthLoading(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        clearTimeout(fallback);
        if (!mounted) return;

        setUser(currentUser);
        setAuthLoading(false);
      },
      (error) => {
        clearTimeout(fallback);
        console.error("Auth error:", error);
        if (!mounted) return;

        setAuthLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(fallback);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const savedEnd = localStorage.getItem(`remora_accounts_unlock_${user.uid}`);

    if (savedEnd && Number(savedEnd) > Date.now()) {
      setAccountsUnlocked(true);
      setAccountsUnlockEnd(Number(savedEnd));
    }
  }, [user]);

  useEffect(() => {
    if (!accountsUnlocked || !accountsUnlockEnd) return;

    const interval = setInterval(() => {
      const left = Math.max(
        0,
        Math.ceil((accountsUnlockEnd - Date.now()) / 1000)
      );

      setUnlockSecondsLeft(left);

      if (left <= 0) {
        setAccountsUnlocked(false);
        setVisibleAccountId(null);
        setAccountsUnlockEnd(null);

        if (user) {
          localStorage.removeItem(`remora_accounts_unlock_${user.uid}`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [accountsUnlocked, accountsUnlockEnd, user]);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setSelectedTask(null);
      return;
    }

    setTasksLoading(true);

    const tasksRef = collection(db, "users", user.uid, "tasks");
    const q = query(tasksRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userTasks = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setTasks(userTasks);
        setTasksLoading(false);
      },
      () => {
        setTasksLoading(false);
        showAlert({
          type: "warning",
          title: "Error al cargar tareas",
          message: "No se pudieron cargar tus tareas desde la base de datos.",
          confirmText: "Entendido",
          onlyConfirm: true,
          onConfirm: closeAlert,
        });
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const toolsRef = doc(db, "users", user.uid, "meta", "tools");

    const unsubscribe = onSnapshot(toolsRef, (snapshot) => {
      if (snapshot.exists()) {
        setToolsData(snapshot.data());
      } else {
        setToolsData({ quickNote: "" });
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const securityRef = doc(db, "users", user.uid, "meta", "security");

    const unsubscribe = onSnapshot(securityRef, (snapshot) => {
      if (snapshot.exists()) {
        setSecurityData(snapshot.data());
      } else {
        setSecurityData({});
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const accountsRef = collection(db, "users", user.uid, "accounts");
    const q = query(accountsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userAccounts = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setAccounts(userAccounts);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const clientsRef = collection(db, "users", user.uid, "clients");
    const q = query(clientsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userClients = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setClients(userClients);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const notesRef = collection(db, "users", user.uid, "notes");
    const q = query(notesRef, orderBy("position", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userNotes = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setNotes(userNotes);
    });

    return () => unsubscribe();
  }, [user]);

    const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      showAlert({
        type: "warning",
        title: "No se pudo iniciar sesión",
        message: error.message,
        confirmText: "Entendido",
        onlyConfirm: true,
        onConfirm: closeAlert,
      });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setTasks([]);
    setSelectedTask(null);
    setAccountsUnlocked(false);
    setVisibleAccountId(null);
  };

  const enableNotifications = async () => {
    try {
      await requestNotificationPermission(user);

      showAlert({
        type: "success",
        title: "Notificaciones activadas",
        message: "Remora ya puede enviarte recordatorios en este dispositivo.",
        confirmText: "Listo",
        onlyConfirm: true,
        onConfirm: closeAlert,
      });
    } catch (error) {
      showAlert({
        type: "warning",
        title: "No se pudieron activar",
        message: error.message,
        confirmText: "Entendido",
        onlyConfirm: true,
        onConfirm: closeAlert,
      });
    }
  };

  const getCover = (task) => DEFAULT_COVERS[task.type];

  const isExpired = (task) => {
    if (!task.date) return false;

    const todayDate = getTodayDate();

    if (task.date < todayDate) return true;

    if (task.date === todayDate && task.time) {
      return new Date(`${task.date}T${task.time}`) < new Date();
    }

    return false;
  };

  const filteredTasks = useMemo(() => {
    const base =
      filter === "Todas"
        ? tasks
        : tasks.filter((task) => task.type === filter);

    return [...base].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
  }, [tasks, filter]);

  const activeTasks = filteredTasks.filter((task) => !isExpired(task));
  const expiredTasks = filteredTasks.filter((task) => isExpired(task));

  const totalPages = Math.max(
    1,
    Math.ceil(activeTasks.length / ITEMS_PER_PAGE)
  );

  const visibleTasks = activeTasks.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const groupedVisibleTasks = useMemo(() => {
    const groups = {};

    visibleTasks.forEach((task) => {
      const key = task.date || "Sin fecha";
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    return groups;
  }, [visibleTasks]);

  const groupedExpiredTasks = useMemo(() => {
    const groups = {};

    expiredTasks.forEach((task) => {
      const key = task.date || "Sin fecha";
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    return groups;
  }, [expiredTasks]);

const filteredNotes = useMemo(() => {
  const search = noteSearch.trim().toLowerCase();

  const base = [...notes].sort((a, b) => {
    if ((a.pinned ?? false) !== (b.pinned ?? false)) {
      return a.pinned ? -1 : 1;
    }

    return Number(a.position || 0) - Number(b.position || 0);
  });

  if (!search) return base;

  return base.filter((note) => {
    const blocksText = (note.blocks || [])
      .map((block) => {
        if (block.type === "text") return block.text || "";
        if (block.type === "checklist") {
          return (block.items || []).map((item) => item.text).join(" ");
        }
        if (block.type === "pending") {
          return `${block.person || ""} ${block.amount || ""}`;
        }
        return "";
      })
      .join(" ");

    return `${note.title || ""} ${note.content || ""} ${blocksText}`
      .toLowerCase()
      .includes(search);
  });
}, [notes, noteSearch]);

const visibleNotes = useMemo(() => {
  return filteredNotes.slice(
    (notePage - 1) * NOTES_PER_PAGE,
    notePage * NOTES_PER_PAGE
  );
}, [filteredNotes, notePage]);

const totalNotePages = Math.max(
  1,
  Math.ceil(filteredNotes.length / NOTES_PER_PAGE)
);

const openCreateNote = () => {
  setNoteMode("create");
  setNoteForm(emptyNoteForm);
  setSelectedNote(null);
  setNoteErrors({});
  setShowNoteModal(true);
};

const openViewNote = (note) => {
  setNoteMode("view");
  setSelectedNote(note);
  setNoteForm({
    title: note.title || "",
    content: note.content || "",
    color: note.color || "note-red",
    pinned: note.pinned || false,
    blocks: note.blocks || [],
  });
  setNoteErrors({});
  setShowNoteModal(true);
};

const openEditNote = (note) => {
  setNoteMenuId(null);
  setNoteMode("edit");
  setSelectedNote(note);
  setNoteForm({
    title: note.title || "",
    content: note.content || "",
    color: note.color || "note-red",
    pinned: note.pinned || false,
    blocks: note.blocks || [],
  });
  setNoteErrors({});
  setShowNoteModal(true);
};

  const closeNoteModal = () => {
    setShowNoteModal(false);
    setSelectedNote(null);
    setNoteForm(emptyNoteForm);
    setNoteErrors({});
    setNoteMode("create");
  };

const saveNote = async () => {
  const newErrors = {};

  if (!noteForm.title.trim()) {
    newErrors.title = "Agrega un título.";
  }

  setNoteErrors(newErrors);
  if (Object.keys(newErrors).length > 0) return;

  const cleanedBlocks = (noteForm.blocks || []).map((block) => {
    if (block.type === "checklist") {
      return {
        ...block,
        items: (block.items || []).filter((item) => item.text.trim()),
      };
    }

    if (block.type === "pending") {
      return {
        ...block,
        person: block.person || "",
        amount: block.amount || "",
      };
    }

    return block;
  });

  if (noteMode === "edit" && selectedNote) {
    await updateDoc(doc(db, "users", user.uid, "notes", selectedNote.id), {
      title: noteForm.title,
      content: noteForm.content,
      color: noteForm.color,
      pinned: noteForm.pinned || false,
      blocks: cleanedBlocks,
      updatedAt: serverTimestamp(),
    });
  } else {
    const noteRef = doc(collection(db, "users", user.uid, "notes"));

    await setDoc(noteRef, {
      id: noteRef.id,
      title: noteForm.title,
      content: noteForm.content,
      color: noteForm.color,
      pinned: noteForm.pinned || false,
      blocks: cleanedBlocks,
      position: notes.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  closeNoteModal();
};

  const deleteNote = (noteId) => {
    showAlert({
      type: "danger",
      title: "Eliminar nota",
      message: "¿Seguro que quieres eliminar esta nota?",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        await deleteDoc(doc(db, "users", user.uid, "notes", noteId));
        closeAlert();
        closeNoteModal();
      },
    });
  };

const toggleNotePinned = async (note) => {
  const newPinnedValue = !(note.pinned || false);

  const updatedNote = {
    ...note,
    pinned: newPinnedValue,
  };

  setSelectedNote((prev) =>
    prev && prev.id === note.id ? updatedNote : prev
  );

  setNotes((prev) =>
    prev.map((item) => (item.id === note.id ? updatedNote : item))
  );

  await updateDoc(doc(db, "users", user.uid, "notes", note.id), {
    pinned: newPinnedValue,
    updatedAt: serverTimestamp(),
  });

  setNoteMenuId(null);
};

const addNoteTextBlock = () => {
  setNoteForm({
    ...noteForm,
    blocks: [
      ...noteForm.blocks,
      {
        id: createNoteId(),
        type: "text",
        text: "",
      },
    ],
  });
};

const addNoteChecklistBlock = () => {
  setNoteForm({
    ...noteForm,
    blocks: [
      ...noteForm.blocks,
      {
        id: createNoteId(),
        type: "checklist",
        title: `Checklist ${noteForm.blocks.filter((b) => b.type === "checklist").length + 1}`,
        items: [
          {
            id: createNoteId(),
            text: "",
            done: false,
          },
        ],
      },
    ],
  });
};

const addNotePendingBlock = () => {
  setNoteForm({
    ...noteForm,
    blocks: [
      ...noteForm.blocks,
      {
        id: createNoteId(),
        type: "pending",
        person: "",
        amount: "",
      },
    ],
  });
};

const updateNoteBlock = (blockId, field, value) => {
  setNoteForm({
    ...noteForm,
    blocks: noteForm.blocks.map((block) =>
      block.id === blockId ? { ...block, [field]: value } : block
    ),
  });
};

const removeNoteBlock = (blockId) => {
  setNoteForm({
    ...noteForm,
    blocks: noteForm.blocks.filter((block) => block.id !== blockId),
  });
};

const addChecklistItem = (blockId) => {
  setNoteForm({
    ...noteForm,
    blocks: noteForm.blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            items: [
              ...(block.items || []),
              {
                id: createNoteId(),
                text: "",
                done: false,
              },
            ],
          }
        : block
    ),
  });
};

const updateChecklistItem = (blockId, itemId, field, value) => {
  setNoteForm({
    ...noteForm,
    blocks: noteForm.blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            items: block.items.map((item) =>
              item.id === itemId ? { ...item, [field]: value } : item
            ),
          }
        : block
    ),
  });
};

const toggleChecklistItemInNote = async (note, blockId, itemId) => {
  const updatedBlocks = (note.blocks || []).map((block) =>
    block.id === blockId
      ? {
          ...block,
          items: (block.items || []).map((item) =>
            item.id === itemId ? { ...item, done: !item.done } : item
          ),
        }
      : block
  );

  const updatedNote = {
    ...note,
    blocks: updatedBlocks,
  };

  setSelectedNote((prev) =>
    prev && prev.id === note.id ? updatedNote : prev
  );

  setNotes((prev) =>
    prev.map((item) => (item.id === note.id ? updatedNote : item))
  );

  await updateDoc(doc(db, "users", user.uid, "notes", note.id), {
    blocks: updatedBlocks,
    updatedAt: serverTimestamp(),
  });
};

  const handleNoteDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = notes.findIndex((note) => note.id === active.id);
    const newIndex = notes.findIndex((note) => note.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedNotes = arrayMove(notes, oldIndex, newIndex);

    setNotes(reorderedNotes);

    const batch = writeBatch(db);

    reorderedNotes.forEach((note, index) => {
      const noteRef = doc(db, "users", user.uid, "notes", note.id);

      batch.update(noteRef, {
        position: index,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  };

  const formatNoteDate = (note) => {
    if (!note?.createdAt?.toDate) return "Hoy";

    return note.createdAt.toDate().toLocaleDateString("es-CR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formChanged = () => {
    if (!originalForm) return false;
    return JSON.stringify(form) !== JSON.stringify(originalForm);
  };

  const closeForm = () => {
    if (editing && formChanged()) {
      showAlert({
        type: "warning",
        title: "Cambios sin guardar",
        message: "¿Quieres salir sin guardar los cambios?",
        confirmText: "Sí, salir",
        cancelText: "No, volver",
        onConfirm: () => {
          setShowModal(false);
          setEditing(false);
          setErrors({});
          setForm(emptyForm);
          setOriginalForm(null);
          closeAlert();
        },
      });
      return;
    }

    setShowModal(false);
    setEditing(false);
    setErrors({});
    setForm(emptyForm);
    setOriginalForm(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.title.trim()) newErrors.title = "Agrega un título.";
    if (!form.description.trim())
      newErrors.description = "Agrega una descripción.";
    if (!form.date) newErrors.date = "Agrega una fecha.";

    if (form.type === "Alekey") {
      if (form.alekeyRole === "Encargado" && !form.time) {
        newErrors.time = "Agrega una hora de entrega.";
      }

      if (form.alekeyRole === "Trabajador") {
        const hasValidSegment = form.workSegments.some(
          (segment) => segment.start && segment.end
        );

        if (!hasValidSegment) {
          newErrors.workSegments = "Agrega al menos una entrada y salida.";
        }
      }
    } else {
      if (!form.time) newErrors.time = "Agrega una hora.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildChecklist = () =>
    form.checklist
      .split("\n")
      .filter((item) => item.trim() !== "")
      .map((item) => {
        const oldItem = editing
          ? selectedTask.checklist.find(
              (old) => old.text.trim() === item.trim()
            )
          : null;

        return {
          text: item,
          done: oldItem ? oldItem.done : false,
        };
      });

  const saveTask = async () => {
    if (!validateForm()) {
      showAlert({
        type: "warning",
        title: "Falta información",
        message: "Revisa los campos marcados en rojo antes de guardar.",
        confirmText: "Entendido",
        onlyConfirm: true,
        onConfirm: closeAlert,
      });
      return;
    }

    const taskData = {
      userId: user.uid,
      title: form.title,
      type: form.type,
      course: form.type === "Universidad" ? form.course : "",
      alekeyRole: form.type === "Alekey" ? form.alekeyRole : "",
      description: form.description,
      date: form.date,
      time: form.time,
      priority: form.priority,
      progressActive: form.progressActive ?? true,
      resources: form.resources.filter(
        (resource) => resource.name.trim() && resource.url.trim()
      ),
      driveFolderUrl: form.driveFolderUrl,
      checklist: buildChecklist(),
      workSegments: form.type === "Alekey" ? form.workSegments : [],
      totalHours:
        form.type === "Alekey" && form.alekeyRole === "Trabajador"
          ? form.totalHours || String(calculateHours(form.workSegments))
          : "",
      hourlyRate:
        form.type === "Alekey" && form.alekeyRole === "Trabajador"
          ? form.hourlyRate
          : "",
      hoursActive:
        form.type === "Alekey" && form.alekeyRole === "Trabajador"
          ? form.hoursActive ?? true
          : true,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editing) {
        const taskRef = doc(db, "users", user.uid, "tasks", selectedTask.id);

        await setDoc(
          taskRef,
          {
            ...taskData,
            createdAt: selectedTask.createdAt || serverTimestamp(),
          },
          { merge: true }
        );

        setSelectedTask({
          ...selectedTask,
          ...taskData,
          id: selectedTask.id,
        });

        setShowModal(false);
        setEditing(false);
      } else {
        const newTaskRef = doc(collection(db, "users", user.uid, "tasks"));

        await setDoc(newTaskRef, {
          ...taskData,
          id: newTaskRef.id,
          createdAt: serverTimestamp(),
        });

        setShowModal(false);
      }

      setErrors({});
      setForm(emptyForm);
      setOriginalForm(null);

      showAlert({
        type: "success",
        title: editing ? "Cambios guardados" : "Actividad guardada",
        message: "La información se guardó correctamente.",
        confirmText: "Listo",
        onlyConfirm: true,
        onConfirm: closeAlert,
      });
    } catch {
      showAlert({
        type: "warning",
        title: "Error al guardar",
        message: "No se pudo guardar la actividad.",
        confirmText: "Entendido",
        onlyConfirm: true,
        onConfirm: closeAlert,
      });
    }
  };

    const openEdit = (task) => {
    const editForm = {
      title: task.title,
      type: task.type,
      course: task.course || "Pensamiento Crítico",
      alekeyRole: task.alekeyRole || "Encargado",
      description: task.description,
      date: task.date,
      time: task.time,
      priority: task.priority,
      progressActive: task.progressActive ?? true,
      hoursActive: task.hoursActive ?? true,
      resources: task.resources?.length
        ? task.resources
        : [{ name: "", url: "", type: "PDF" }],
      driveFolderUrl: task.driveFolderUrl || "",
      checklist: task.checklist?.map((item) => item.text).join("\n") || "",
      workSegments: task.workSegments?.length
        ? task.workSegments
        : [{ start: "", end: "" }],
      totalHours: task.totalHours || "",
      hourlyRate: task.hourlyRate || "1500",
    };

    setForm(editForm);
    setOriginalForm(editForm);
    setEditing(true);
    setShowModal(true);
    setErrors({});
  };

  const deleteTask = (id) => {
    showAlert({
      type: "danger",
      title: "Eliminar actividad",
      message:
        "¿Seguro que quieres eliminarla? Esta acción no se puede deshacer.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        await deleteDoc(doc(db, "users", user.uid, "tasks", id));
        setSelectedTask(null);
        closeAlert();
      },
    });
  };

  const toggleChecklistItem = async (taskId, index) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    const updatedChecklist = task.checklist.map((item, i) =>
      i === index ? { ...item, done: !item.done } : item
    );

    await updateDoc(doc(db, "users", user.uid, "tasks", taskId), {
      checklist: updatedChecklist,
      updatedAt: serverTimestamp(),
    });

    setSelectedTask((prev) =>
      prev && prev.id === taskId
        ? { ...prev, checklist: updatedChecklist }
        : prev
    );
  };

  const updateSegment = (index, field, value) => {
    const updatedSegments = form.workSegments.map((segment, i) =>
      i === index ? { ...segment, [field]: value } : segment
    );

    setForm({
      ...form,
      workSegments: updatedSegments,
      totalHours: String(calculateHours(updatedSegments)),
    });
  };

  const addSegment = () => {
    if (form.workSegments.length >= 3) return;

    setForm({
      ...form,
      workSegments: [...form.workSegments, { start: "", end: "" }],
    });
  };

  const removeSegment = (index) => {
    const updatedSegments = form.workSegments.filter((_, i) => i !== index);

    setForm({
      ...form,
      workSegments: updatedSegments.length
        ? updatedSegments
        : [{ start: "", end: "" }],
      totalHours: String(calculateHours(updatedSegments)),
    });
  };

  const getPayment = (task) => {
    const hours = Number(task.totalHours || 0);
    const rate = Number(task.hourlyRate || 0);
    return Number((hours * rate).toFixed(0));
  };

  const addResource = () => {
    if (form.resources.length >= 3) return;

    setForm({
      ...form,
      resources: [...form.resources, { name: "", url: "", type: "PDF" }],
    });
  };

  const updateResource = (index, field, value) => {
    setForm({
      ...form,
      resources: form.resources.map((resource, i) =>
        i === index ? { ...resource, [field]: value } : resource
      ),
    });
  };

  const removeResource = (index) => {
    setForm({
      ...form,
      resources: form.resources.filter((_, i) => i !== index),
    });
  };

  const saveQuickNote = async () => {
    await setDoc(
      doc(db, "users", user.uid, "meta", "tools"),
      {
        quickNote: toolsData.quickNote || "",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    showAlert({
      type: "success",
      title: "Nota guardada",
      message: "Tu bloc de notas se guardó correctamente.",
      confirmText: "Listo",
      onlyConfirm: true,
      onConfirm: closeAlert,
    });
  };

  const calculateBasicResult = () => {
    const a = Number(calcA);
    const b = Number(calcB);

    if (calcA === "" || calcB === "" || Number.isNaN(a) || Number.isNaN(b)) {
      return "";
    }

    if (calcOperation === "+") return a + b;
    if (calcOperation === "-") return a - b;
    if (calcOperation === "×") return a * b;
    if (calcOperation === "÷") return b === 0 ? "No válido" : a / b;

    return "";
  };

  const clearCalculator = () => {
    setCalcA("");
    setCalcB("");
    setCalcOperation("+");
  };

  const addClientProduct = () => {
    setClientForm({
      ...clientForm,
      products: [...clientForm.products, { name: "", price: "" }],
    });
  };

  const updateClientProduct = (index, field, value) => {
    setClientForm({
      ...clientForm,
      products: clientForm.products.map((product, i) =>
        i === index ? { ...product, [field]: value } : product
      ),
    });
  };

  const removeClientProduct = (index) => {
    setClientForm({
      ...clientForm,
      products:
        clientForm.products.length > 1
          ? clientForm.products.filter((_, i) => i !== index)
          : [{ name: "", price: "" }],
    });
  };

  const saveClient = async () => {
    const newErrors = {};

    if (!clientForm.name.trim()) {
      newErrors.name = "Agrega el nombre de la persona.";
    }

    setClientErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const cleanedProducts = clientForm.products.filter(
      (product) => product.name.trim() || product.price.trim()
    );

    if (editingClient) {
      await updateDoc(doc(db, "users", user.uid, "clients", editingClient), {
        ...clientForm,
        products: cleanedProducts,
        total: calculateClientTotal(cleanedProducts),
        updatedAt: serverTimestamp(),
      });
    } else {
      const clientRef = doc(collection(db, "users", user.uid, "clients"));

      await setDoc(clientRef, {
        ...clientForm,
        products: cleanedProducts,
        total: calculateClientTotal(cleanedProducts),
        id: clientRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    setEditingClient(null);
    setClientForm(emptyClientForm);
    setShowClientModal(false);
  };

  const toggleClientPaid = async (client) => {
    await updateDoc(doc(db, "users", user.uid, "clients", client.id), {
      paid: !client.paid,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteClient = async (id) => {
    showAlert({
      type: "danger",
      title: "Eliminar cliente",
      message: "¿Seguro que quieres eliminar este cliente?",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        await deleteDoc(doc(db, "users", user.uid, "clients", id));
        closeAlert();
      },
    });
  };

  const unlockAccountsSession = () => {
    const endTime = Date.now() + UNLOCK_TIME;

    setAccountsUnlocked(true);
    setAccountsUnlockEnd(endTime);
    setUnlockSecondsLeft(Math.ceil(UNLOCK_TIME / 1000));
    setMasterInput("");

    localStorage.setItem(`remora_accounts_unlock_${user.uid}`, String(endTime));
  };

  const unlockAccounts = () => {
    if (masterInput === MASTER_PASSWORD) {
      unlockAccountsSession();
      return;
    }

    showAlert({
      type: "warning",
      title: "Contraseña incorrecta",
      message: "No se pudo desbloquear la sección de cuentas.",
      confirmText: "Entendido",
      onlyConfirm: true,
      onConfirm: closeAlert,
    });
  };

  const registerPasskeyForAccounts = async () => {
    try {
      const credentialId = await registerPasskey(user);

      await setDoc(
        doc(db, "users", user.uid, "meta", "security"),
        {
          passkeyCredentialId: credentialId,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      showAlert({
        type: "success",
        title: "Passkey registrada",
        message:
          "Ahora puedes desbloquear Cuentas con huella, rostro o PIN del dispositivo.",
        confirmText: "Listo",
        onlyConfirm: true,
        onConfirm: closeAlert,
      });
    } catch (error) {
      showAlert({
        type: "warning",
        title: "No se pudo registrar",
        message: error.message,
        confirmText: "Entendido",
        onlyConfirm: true,
        onConfirm: closeAlert,
      });
    }
  };

  const unlockAccountsWithPasskey = async () => {
    try {
      if (!securityData.passkeyCredentialId) {
        throw new Error("Primero registra una Passkey.");
      }

      await unlockWithPasskey(securityData.passkeyCredentialId);
      unlockAccountsSession();
    } catch (error) {
      showAlert({
        type: "warning",
        title: "No se pudo desbloquear",
        message: error.message,
        confirmText: "Entendido",
        onlyConfirm: true,
        onConfirm: closeAlert,
      });
    }
  };

    const saveAccount = async () => {
    const newErrors = {};

    if (!accountForm.title.trim()) {
      newErrors.title = "Agrega un título.";
    }

    setAccountErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const accountRef = doc(collection(db, "users", user.uid, "accounts"));

    await setDoc(accountRef, {
      ...accountForm,
      id: accountRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setAccountForm(emptyAccountForm);
    setShowAccountModal(false);
  };

  const deleteAccount = async (id) => {
    showAlert({
      type: "danger",
      title: "Eliminar cuenta",
      message:
        "¿Seguro que quieres eliminar esta cuenta? Esta acción no se puede deshacer.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        await deleteDoc(doc(db, "users", user.uid, "accounts", id));
        closeAlert();
      },
    });
  };

  const handleEyeClick = async (accountId) => {
    if (visibleAccountId === accountId) {
      setVisibleAccountId(null);
      return;
    }

    if (mobilePasskeyAvailable && securityData.passkeyCredentialId) {
      try {
        await unlockWithPasskey(securityData.passkeyCredentialId);
        setVisibleAccountId(accountId);
      } catch {
        showAlert({
          type: "warning",
          title: "No se pudo verificar",
          message: "No se pudo mostrar la información protegida.",
          confirmText: "Entendido",
          onlyConfirm: true,
          onConfirm: closeAlert,
        });
      }

      return;
    }

    setPasswordInput("");

    showAlert({
      type: "password",
      title: "Ver cuenta",
      message: "Introduce la contraseña maestra para ver la información.",
      confirmText: "Ver cuenta",
      cancelText: "Cancelar",
      accountId,
      onConfirm: null,
    });
  };

  const gradeResult =
    gradeScore && gradeTotal
      ? ((Number(gradeScore) / Number(gradeTotal)) * 100).toFixed(2)
      : "";

  const categoryStats = [
    "Universidad",
    "Trabajo",
    "Tarea",
    "Recordatorio",
    "Alekey",
  ].map((category) => ({
    category,
    count: tasks.filter((task) => task.type === category).length,
  }));

  const weeklyStats = useMemo(() => {
    const today = new Date(getTodayDate());

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      const key = date.toISOString().split("T")[0];

      return {
        label: date.toLocaleDateString("es-CR", { weekday: "short" }),
        count: tasks.filter((task) => task.date === key).length,
      };
    });
  }, [tasks]);

  const maxWeekly = Math.max(...weeklyStats.map((item) => item.count), 1);

  const totalAlekeyHours = tasks.reduce((sum, task) => {
    if (task.type !== "Alekey") return sum;
    if (task.alekeyRole !== "Trabajador") return sum;
    if (task.hoursActive === false) return sum;

    return sum + Number(task.totalHours || 0);
  }, 0);

  const pendingClients = clients.filter((client) => !client.paid);
  const pendingClientsTotal = pendingClients.reduce(
    (sum, client) =>
      sum + Number(client.total || calculateClientTotal(client.products)),
    0
  );

  const alekeySalaryTotal = totalAlekeyHours * HOURLY_RATE;

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <img src={icono} alt="Remora" className="auth-logo" />
          <h1>Remora</h1>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <img src={icono} alt="Remora" className="auth-logo" />
          <h1>Remora</h1>
          <p>Que nada te detenga.</p>

          <button className="google-login-btn" onClick={handleLogin}>
            Continuar con Google
          </button>
        </div>
      </div>
    );
  }

  const renderTaskCard = (task) => (
    <motion.div
      layoutId={`task-${task.id}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`task-card ${task.priority.toLowerCase()} ${
        isExpired(task) ? "expired" : ""
      }`}
      key={task.id}
      onClick={() => setSelectedTask(task)}
    >
      <img className="task-cover" src={getCover(task)} alt={task.title} />

      <div className="task-body">
        <h3>{task.title}</h3>

        {task.type === "Universidad" && task.course ? (
          <p>{task.course}</p>
        ) : task.type === "Alekey" ? (
          <p>Alekey · {task.alekeyRole}</p>
        ) : (
          <p>{task.type}</p>
        )}

        <small>
          📅 {task.date || "Sin fecha"} · {task.time || "Sin hora"}
        </small>

        {isExpired(task) && <span className="expired-label">Vencida</span>}

        <span className={`priority ${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
      </div>
    </motion.div>
  );

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div className="brand">
            <img src={icono} alt="Remora" className="brand-icon" />

            <div>
              <h1>Remora</h1>
              <p>Que nada te detenga.</p>
            </div>
          </div>

          <div className="user-profile">
            <img
              src={
                user?.photoURL ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              }
              alt={user?.displayName || "Usuario"}
              referrerPolicy="no-referrer"
            />

            <div className="user-info">
              <strong>{user?.displayName || "Usuario"}</strong>

              <button onClick={handleLogout}>
                <LogOut size={16} />
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="content">
        {view === "Inicio" && (
          <>
            <div className="filters">
              {[
                "Todas",
                "Universidad",
                "Trabajo",
                "Tarea",
                "Recordatorio",
                "Alekey",
              ].map((item) => (
                <button
                  key={item}
                  className={filter === item ? "active-filter" : ""}
                  onClick={() => {
                    setFilter(item);
                    setPage(1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  {item === "Tarea" ? "Tareas" : item}
                </button>
              ))}
            </div>

            {tasksLoading ? (
              <section className="empty-state">
                <h2>Cargando tareas...</h2>
                <p>Estamos trayendo tus actividades.</p>
              </section>
            ) : visibleTasks.length === 0 && expiredTasks.length === 0 ? (
              <section className="empty-state">
                <h2>No tienes tareas todavía</h2>
                <p>Presiona el botón + para crear tu primera actividad.</p>
              </section>
            ) : (
              <>
                {visibleTasks.length > 0 &&
                  Object.keys(groupedVisibleTasks).map((date) => (
                    <section key={date} className="date-group">
                      <h2>{formatDateTitle(date)}</h2>
                      <div className="task-grid">
                        {groupedVisibleTasks[date].map((task) =>
                          renderTaskCard(task)
                        )}
                      </div>
                    </section>
                  ))}

                {expiredTasks.length > 0 && (
                  <section className="expired-section">
                    <div className="expired-divider">
                      <span>Vencidas ({expiredTasks.length})</span>
                    </div>

                    <button
                      className="show-expired-btn"
                      onClick={() => setShowExpired(!showExpired)}
                    >
                      {showExpired ? "Ocultar vencidas" : "Ver vencidas"}
                    </button>

                    {showExpired &&
                      Object.keys(groupedExpiredTasks).map((date) => (
                        <section key={date} className="date-group">
                          <h2>{formatDateTitle(date)}</h2>
                          <div className="task-grid">
                            {groupedExpiredTasks[date].map((task) =>
                              renderTaskCard(task)
                            )}
                          </div>
                        </section>
                      ))}
                  </section>
                )}

                {totalPages > 1 && visibleTasks.length > 0 && (
                  <div className="pagination">
                    <button
                      disabled={page === 1}
                      onClick={() => {
                        setPage(page - 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Anterior
                    </button>

                    <span>
                      Página {page} de {totalPages}
                    </span>

                    <button
                      disabled={page === totalPages}
                      onClick={() => {
                        setPage(page + 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {view === "Herramientas" && (
          <section className="tools-page">
            {!selectedTool ? (
              <div className="tools-app-grid">
                {[
                  {
                    id: "calculator",
                    title: "Calculadora",
                    text: "Suma, resta, multiplica y divide.",
                    icon: <Calculator />,
                  },
                  {
                    id: "grades",
                    title: "Conversor de notas",
                    text: "Calcula porcentajes rápido.",
                    icon: <BookOpen />,
                  },
                  {
                    id: "notes",
                    title: "Bloc de notas",
                    text: "Notas cortas y organizadas.",
                    icon: <StickyNote />,
                  },
                  {
                    id: "clients",
                    title: "Clientes",
                    text: "Pendientes, productos y pagos.",
                    icon: <UserPlus />,
                  },
                ].map((tool) => (
                  <motion.button
                    key={tool.id}
                    className="tool-app-button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setSelectedTool(tool.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <div className="tool-app-icon">{tool.icon}</div>
                    <h3>{tool.title}</h3>
                    <p>{tool.text}</p>
                  </motion.button>
                ))}
              </div>
            ) : (
              <motion.div
                className="tool-inner"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  className="back-btn"
                  onClick={() => setSelectedTool(null)}
                >
                  <ArrowLeft />
                </button>

                {selectedTool === "calculator" && (
                  <div className="tool-card">
                    <Calculator size={38} />
                    <h2>Calculadora</h2>

                    <input
                      placeholder="Primer número"
                      value={calcA}
                      onChange={(e) => setCalcA(e.target.value)}
                    />

                    <select
                      value={calcOperation}
                      onChange={(e) => setCalcOperation(e.target.value)}
                    >
                      <option>+</option>
                      <option>-</option>
                      <option>×</option>
                      <option>÷</option>
                    </select>

                    <input
                      placeholder="Segundo número"
                      value={calcB}
                      onChange={(e) => setCalcB(e.target.value)}
                    />

                    <div className="grade-result">
                      {calculateBasicResult() !== ""
                        ? calculateBasicResult()
                        : "Resultado"}
                    </div>

                    <button className="save-btn" onClick={clearCalculator}>
                      Quitar todo
                    </button>
                  </div>
                )}

                                {selectedTool === "grades" && (
                  <div className="tool-card">
                    <BookOpen size={38} />
                    <h2>Conversor de notas</h2>

                    <input
                      placeholder="Puntos obtenidos"
                      value={gradeScore}
                      onChange={(e) => setGradeScore(e.target.value)}
                    />

                    <input
                      placeholder="Puntos totales"
                      value={gradeTotal}
                      onChange={(e) => setGradeTotal(e.target.value)}
                    />

                    <div className="grade-result">
                      {gradeResult ? `${gradeResult}%` : "Resultado"}
                    </div>
                  </div>
                )}

                {selectedTool === "notes" && (
                  <section className="notes-page">
                  <div className="notes-header">
                    <div>
                      <h2>Bloc de notas</h2>
                      <p>Notas rápidas, simples y guardadas por usuario.</p>
                    </div>

                    <div className="notes-search-box">
                      <Search size={18} />
                      <input
                        placeholder="Buscar notas..."
                        value={noteSearch}
                        onChange={(e) => {
                          setNoteSearch(e.target.value);
                          setNotePage(1);
                        }}
                      />
                    </div>

                    <div className="notes-actions">

                    <button
                    className={`notes-reorder-btn ${
                    notesReorderMode ? "active" : ""
                    }`}
                    onClick={()=>{
                    setNotesReorderMode(!notesReorderMode);

                    if(!notesReorderMode && navigator.vibrate){
                    navigator.vibrate(40);
                    }
                    }}
                    >
                    {notesReorderMode ? "Listo" : "Ordenar"}
                    </button>

                    <button
                    className="save-btn"
                    onClick={openCreateNote}
                    >
                    <FilePlus2 size={18}/>
                    Nueva nota
                    </button>

                    </div>
                    </div>

                    {notes.length === 0 ? (
                      <div className="notes-empty">
                        <StickyNote size={48} />
                        <h3>No tienes notas todavía</h3>
                        <p>Presiona “Nueva nota” para escribir la primera.</p>
                      </div>
                    ) : (
                      <>
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleNoteDragEnd}
                        >
                          <SortableContext
                            items={visibleNotes.map((note) => note.id)}
                            strategy={rectSortingStrategy}
                          >
                            <div className="notes-grid">
                              {visibleNotes.map((note) => (
                              <SortableNoteCard
                                key={note.id}
                                note={note}
                                onOpen={openViewNote}
                                notesReorderMode={notesReorderMode}
                                noteMenuId={noteMenuId}
                                setNoteMenuId={setNoteMenuId}
                                toggleNotePinned={toggleNotePinned}
                                deleteNote={deleteNote}
                                openEditNote={openEditNote}
                                toggleChecklistItemInNote={toggleChecklistItemInNote}
                              />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>

                        {totalNotePages > 1 && (
                          <div className="pagination">
                            <button
                              disabled={notePage === 1}
                              onClick={() => {
                                setNotePage(notePage - 1);
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });
                              }}
                            >
                              Anterior
                            </button>

                            <span>
                              Página {notePage} de {totalNotePages}
                            </span>

                            <button
                              disabled={notePage === totalNotePages}
                              onClick={() => {
                                setNotePage(notePage + 1);
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });
                              }}
                            >
                              Siguiente
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </section>
                )}

                {selectedTool === "clients" && (
                  <div className="tool-card">
                    <Users size={38} />
                    <h2>Clientes pendientes</h2>

                    <button
                      className="save-btn"
                      onClick={() => setShowClientModal(true)}
                    >
                      + Agregar persona
                    </button>

                    <div className="clients-list">
                      {clients.length === 0 ? (
                        <p className="empty-private">
                          No tienes clientes agregados.
                        </p>
                      ) : (
                        clients.map((client) => (
                          <div className="client-card" key={client.id}>
                            <div className="client-main">
                              <button
                                className={`client-check ${
                                  client.paid ? "paid" : ""
                                }`}
                                onClick={() => toggleClientPaid(client)}
                              >
                                {client.paid ? <BadgeCheck /> : <BadgeX />}
                              </button>

                              <div>
                                <h3>{client.name}</h3>
                                <p>
                                  Total: ₡
                                  {Number(
                                    client.total ||
                                      calculateClientTotal(client.products)
                                  ).toLocaleString("es-CR")}
                                </p>
                              </div>
                            </div>

                            {client.products?.length > 0 && (
                              <div className="client-products">
                                {client.products.map((product, index) => (
                                  <span key={index}>
                                    {product.name || "Producto"}{" "}
                                    {product.price
                                      ? `₡${Number(
                                          product.price
                                        ).toLocaleString("es-CR")}`
                                      : ""}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="client-actions">
                              <button
                                className="edit-mini-btn"
                                onClick={() => {
                                  setEditingClient(client.id);
                                  setClientForm({
                                    name: client.name || "",
                                    products:
                                      client.products?.length > 0
                                        ? client.products
                                        : [{ name: "", price: "" }],
                                    paid: client.paid || false,
                                  });
                                  setClientErrors({});
                                  setShowClientModal(true);
                                }}
                              >
                                Editar
                              </button>

                              <button
                                className="delete-mini-btn"
                                onClick={() => deleteClient(client.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </section>
        )}

        {view === "Progreso" && (
          <section className="progress-page">
            <div className="progress-card">
              <h2>Gráfico semanal</h2>

              <div className="weekly-chart">
                {weeklyStats.map((item) => (
                  <div className="bar-item" key={item.label}>
                    <div
                      className="bar"
                      style={{
                        height: `${(item.count / maxWeekly) * 120 + 12}px`,
                      }}
                    />
                    <span>{item.label}</span>
                    <small>{item.count}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="progress-card disabled-card">
              <h2>Notificaciones (Próximamente)</h2>
              <p>Los recordatorios automáticos estarán disponibles después.</p>

              <button className="save-btn disabled-btn" disabled>
                🔔 Activar notificaciones
              </button>
            </div>

            <div className="progress-card">
              <h2>Tareas por categoría</h2>

              {categoryStats.map((item) => (
                <div className="category-row" key={item.category}>
                  <span>{item.category}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>

            <div className="progress-card">
              <h2>Próximas entregas</h2>

              {activeTasks.filter((task) => task.progressActive !== false)
                .length === 0 ? (
                <p className="empty-private">
                  No hay próximas entregas activas.
                </p>
              ) : (
                activeTasks
                  .filter((task) => task.progressActive !== false)
                  .slice(0, 5)
                  .map((task) => (
                    <div className="next-task" key={task.id}>
                      <strong>{task.title}</strong>
                      <span>{formatDateTitle(task.date)}</span>
                    </div>
                  ))
              )}
            </div>

            <div className="progress-card">
              <h2>Clientes pendientes de pagar</h2>

              {pendingClients.length === 0 ? (
                <p className="empty-private">No hay clientes pendientes.</p>
              ) : (
                pendingClients.map((client) => (
                  <div className="next-task" key={client.id}>
                    <strong>{client.name}</strong>
                    <span>
                      ₡
                      {Number(
                        client.total || calculateClientTotal(client.products)
                      ).toLocaleString("es-CR")}
                    </span>
                  </div>
                ))
              )}

              <div className="payment-preview">
                Pendiente total: ₡{pendingClientsTotal.toLocaleString("es-CR")}
              </div>
            </div>

            <div className="progress-card">
              <h2>Horas trabajadas Alekey</h2>
              <div className="hours-total">{totalAlekeyHours.toFixed(2)} h</div>
              <p className="salary-text">Salario fijo: ₡1.500 por hora</p>
              <div className="payment-preview">
                Total: ₡{alekeySalaryTotal.toLocaleString("es-CR")}
              </div>
            </div>
          </section>
        )}

        {view === "Cuentas" && (
          <section className="accounts-page">
            {!accountsUnlocked ? (
              <div className="lock-card">
                <Lock size={54} />
                <h2>Cuentas protegidas</h2>

                {mobilePasskeyAvailable && securityData.passkeyCredentialId ? (
                  <p>Usa tu huella, rostro o PIN del dispositivo para entrar.</p>
                ) : (
                  <p>
                    Introduce la contraseña maestra
                    {mobilePasskeyAvailable
                      ? " o registra tu huella / Passkey."
                      : "."}
                  </p>
                )}

                {(!mobilePasskeyAvailable ||
                  !securityData.passkeyCredentialId) && (
                  <>
                    <input
                      type="password"
                      placeholder="Contraseña maestra"
                      value={masterInput}
                      onChange={(e) => setMasterInput(e.target.value)}
                    />

                    <button className="save-btn" onClick={unlockAccounts}>
                      Desbloquear
                    </button>
                  </>
                )}

                {mobilePasskeyAvailable && securityData.passkeyCredentialId ? (
                  <button
                    className="passkey-btn"
                    onClick={unlockAccountsWithPasskey}
                  >
                    Desbloquear con huella / Passkey
                  </button>
                ) : mobilePasskeyAvailable ? (
                  <button
                    className="passkey-btn"
                    onClick={registerPasskeyForAccounts}
                  >
                    Registrar huella / Passkey
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="accounts-header">
                  <div>
                    <h2>Cuentas</h2>
                    <p>
                      Desbloqueado por {Math.floor(unlockSecondsLeft / 60)}:
                      {String(unlockSecondsLeft % 60).padStart(2, "0")}
                    </p>
                  </div>

                  <button
                    className="add-segment-btn"
                    onClick={() => setShowAccountModal(true)}
                  >
                    + Agregar
                  </button>
                </div>

                <div className="accounts-list">
                  {accounts.length === 0 ? (
                    <div className="empty-private">
                      No tienes cuentas guardadas todavía.
                    </div>
                  ) : (
                    accounts.map((account) => (
                      <div className="account-card" key={account.id}>
                        <div className="account-title-row">
                          <h3>{account.title}</h3>

                          <button onClick={() => handleEyeClick(account.id)}>
                            {visibleAccountId === account.id ? (
                              <EyeOff />
                            ) : (
                              <Eye />
                            )}
                          </button>
                        </div>

                        {visibleAccountId === account.id ? (
                          <div className="account-data">
                            <p>Usuario: {account.username || "—"}</p>
                            <p>Cédula: {account.cedula || "—"}</p>
                            <p>Correo: {account.email || "—"}</p>
                            <p>User: {account.user || "—"}</p>
                            <p>Contraseña: {account.password || "—"}</p>
                            <p>PIN: {account.pin || "—"}</p>
                          </div>
                        ) : (
                          <p className="censored">Información oculta •••••••</p>
                        )}

                        <button
                          className="delete-mini-btn"
                          onClick={() => deleteAccount(account.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </main>

            {view === "Inicio" && (
        <button
          className="fab"
          onClick={() => {
            setEditing(false);
            setOriginalForm(null);
            setForm(emptyForm);
            setErrors({});
            setShowModal(true);
          }}
        >
          <Plus size={38} strokeWidth={4} />
        </button>
      )}

      <nav className="bottom-nav">
        <button onClick={() => goToView("Inicio")}>
          <ListTodo /> Inicio
        </button>

        <button onClick={() => goToView("Herramientas")}>
          <NotebookText /> Herramientas
        </button>

        <button onClick={() => goToView("Progreso")}>
          <BarChart3 /> Progreso
        </button>

        <button onClick={() => goToView("Cuentas")}>
          <Lock /> Cuentas
        </button>
      </nav>

      <AnimatePresence>
        {selectedTask && !showModal && (
          <motion.div className="overlay" onClick={() => setSelectedTask(null)}>
            <motion.div
              layoutId={`task-${selectedTask.id}`}
              className="detail-card"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close-btn"
                onClick={() => setSelectedTask(null)}
              >
                <X />
              </button>

              <img
                className="detail-cover"
                src={getCover(selectedTask)}
                alt={selectedTask.title}
              />

              <span
                className={`priority ${selectedTask.priority.toLowerCase()}`}
              >
                {selectedTask.priority}
              </span>

              {isExpired(selectedTask) && (
                <span className="expired-label">Vencida</span>
              )}

              <h2>{selectedTask.title}</h2>

              <div className="task-progress-toggle">
                <button
                  className={`client-check ${
                    selectedTask.progressActive === false ? "" : "paid"
                  }`}
                  onClick={async () => {
                    const newValue =
                      selectedTask.progressActive === false ? true : false;

                    await updateDoc(
                      doc(db, "users", user.uid, "tasks", selectedTask.id),
                      {
                        progressActive: newValue,
                        updatedAt: serverTimestamp(),
                      }
                    );

                    setSelectedTask({
                      ...selectedTask,
                      progressActive: newValue,
                    });
                  }}
                >
                  {selectedTask.progressActive === false ? (
                    <BadgeX />
                  ) : (
                    <BadgeCheck />
                  )}
                </button>

                <p className="progress-toggle-text">
                  {selectedTask.progressActive === false
                    ? "No aparece en Progreso."
                    : "Sí aparece en Progreso."}
                </p>
              </div>

              <p className="type">{selectedTask.type}</p>

              {selectedTask.type === "Universidad" && selectedTask.course && (
                <p className="course-name">{selectedTask.course}</p>
              )}

              {selectedTask.type === "Alekey" && (
                <div className="alekey-detail">
                  <p>
                    <strong>Rol:</strong> {selectedTask.alekeyRole}
                  </p>

                  {selectedTask.alekeyRole === "Trabajador" && (
                    <>
                      <h3>Jornada</h3>

                      {selectedTask.workSegments?.map((segment, index) => (
                        <p key={index}>
                          Entrada: {segment.start || "--:--"} · Salida:{" "}
                          {segment.end || "--:--"}
                        </p>
                      ))}

                      <p>
                        <strong>Horas totales:</strong>{" "}
                        {selectedTask.totalHours || "0"} horas
                      </p>

                      <p>
                        <strong>Pago por hora:</strong> ₡
                        {selectedTask.hourlyRate || "1500"} colones
                      </p>

                      <p>
                        <strong>Total:</strong> ₡{getPayment(selectedTask)}{" "}
                        colones
                      </p>

                      <div className="task-progress-toggle">
                        <button
                          className={`client-check ${
                            selectedTask.hoursActive === false ? "" : "paid"
                          }`}
                          onClick={async () => {
                            const newValue =
                              selectedTask.hoursActive === false ? true : false;

                            await updateDoc(
                              doc(
                                db,
                                "users",
                                user.uid,
                                "tasks",
                                selectedTask.id
                              ),
                              {
                                hoursActive: newValue,
                                updatedAt: serverTimestamp(),
                              }
                            );

                            setSelectedTask({
                              ...selectedTask,
                              hoursActive: newValue,
                            });
                          }}
                        >
                          {selectedTask.hoursActive === false ? (
                            <BadgeX />
                          ) : (
                            <BadgeCheck />
                          )}
                        </button>

                        <p className="progress-toggle-text">
                          {selectedTask.hoursActive === false
                            ? "Estas horas no cuentan en Progreso."
                            : "Estas horas sí cuentan en Progreso."}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="date-box">
                📅 {selectedTask.date || "Sin fecha"} ·{" "}
                {selectedTask.time || "Sin hora"}
              </div>

              <p>{selectedTask.description}</p>

              {selectedTask.driveFolderUrl && (
                <>
                  <h3>Carpeta principal</h3>
                  <div className="docs-list">
                    <a
                      href={selectedTask.driveFolderUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText size={18} />
                      Abrir carpeta de Drive
                    </a>
                  </div>
                </>
              )}

              {selectedTask.resources?.length > 0 && (
                <>
                  <h3>Recursos</h3>

                  <div className="docs-list">
                    {selectedTask.resources.map((resource, index) => (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        key={resource.name + index}
                      >
                        <FileText size={18} />
                        {resource.type} · {resource.name}
                      </a>
                    ))}
                  </div>
                </>
              )}

              {selectedTask.checklist?.length > 0 && (
                <>
                  <h3>Checklist</h3>

                  {selectedTask.checklist.map((item, index) => (
                    <label className="check-item" key={item.text + index}>
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() =>
                          toggleChecklistItem(selectedTask.id, index)
                        }
                      />
                      <span>{item.text}</span>
                    </label>
                  ))}
                </>
              )}

              <div className="detail-actions">
                <button
                  className="edit-btn"
                  onClick={() => openEdit(selectedTask)}
                >
                  <Pencil size={18} />
                  Editar
                </button>

                <button
                  className="delete-btn"
                  onClick={() => deleteTask(selectedTask.id)}
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

{showNoteModal && (
  <motion.div className="overlay" onClick={closeNoteModal}>
    <motion.div
      className={`note-modal ${noteForm.color}`}
      initial={{ y: 80, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 80, opacity: 0, scale: 0.96 }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="back-btn" onClick={closeNoteModal}>
        <X />
      </button>

      {noteMode === "view" ? (
        <>
          <div className="note-modal-header">
            <span className="note-emoji">📝</span>

            <div className="note-view-actions">
              <small>{formatNoteDate(selectedNote)}</small>

              {selectedNote?.pinned && (
                <span className="note-pin-indicator">
                  <Pin size={15} />
                </span>
              )}
            </div>
          </div>

          <h2>{selectedNote?.title}</h2>

          {selectedNote?.content && (
            <p className="note-full-content">{selectedNote.content}</p>
          )}

          {(selectedNote?.blocks || []).map((block) => (
            <div className="note-view-block" key={block.id}>
              {block.type === "text" && (
                <p className="note-full-content">{block.text}</p>
              )}

              {block.type === "checklist" && (
                <div className="note-view-checklist">
                  <h3>{block.title || "Checklist"}</h3>

                  {(block.items || []).map((item) => (
                    <label
                      className={`note-view-check ${
                        item.done ? "completed" : ""
                      }`}
                      key={item.id}
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() =>
                          toggleChecklistItemInNote(
                            selectedNote,
                            block.id,
                            item.id
                          )
                        }
                      />
                      <span>{item.text || "Elemento sin nombre"}</span>
                    </label>
                  ))}
                </div>
              )}

              {block.type === "pending" && (
                <div
                  className={`note-view-pending ${
                    Number(block.amount || 0) > 0 ? "pending-red" : "pending-green"
                  }`}
                >
                  <div>
                    <UserRound size={18} />
                    <span>{block.person || "Persona pendiente"}</span>
                  </div>

                  <strong>
                    ₡{Number(block.amount || 0).toLocaleString("es-CR")}
                  </strong>
                </div>
              )}
            </div>
          ))}

          <div className="detail-actions">
            <button
              className="edit-btn"
              onClick={() => openEditNote(selectedNote)}
            >
              <Pencil size={18} />
              Editar
            </button>

            <button
              className={`edit-btn ${selectedNote?.pinned ? "pinned-active-btn" : ""}`}
              onClick={() => toggleNotePinned(selectedNote)}
            >
              {selectedNote?.pinned ? <PinOff size={18} /> : <Pin size={18} />}
              {selectedNote?.pinned ? "Desfijar" : "Fijar"}
            </button>

            <button
              className="delete-btn"
              onClick={() => deleteNote(selectedNote.id)}
            >
              <Trash2 size={18} />
              Eliminar
            </button>
          </div>
        </>
      ) : (
        <>
          <h2>{noteMode === "edit" ? "Editar nota" : "Nueva nota"}</h2>

          <input
            placeholder="Título de la nota"
            value={noteForm.title}
            onChange={(e) =>
              setNoteForm({ ...noteForm, title: e.target.value })
            }
          />

          {noteErrors.title && (
            <span className="field-error">{noteErrors.title}</span>
          )}

          <textarea
            className="note-editor-textarea"
            placeholder="Escribe tu nota..."
            value={noteForm.content}
            onChange={(e) =>
              setNoteForm({ ...noteForm, content: e.target.value })
            }
          />

          <div className="note-builder-actions">
            <button type="button" onClick={addNoteTextBlock}>
              <Type size={17} />
              Texto
            </button>

            <button type="button" onClick={addNoteChecklistBlock}>
              <CheckSquare size={17} />
              Checklist
            </button>

            <button type="button" onClick={addNotePendingBlock}>
              <UserRound size={17} />
              Pendiente
            </button>
          </div>

          <div className="note-blocks-editor">
            {(noteForm.blocks || []).map((block) => (
              <div className="note-edit-block" key={block.id}>
                <button
                  className="note-remove-block"
                  type="button"
                  onClick={() => removeNoteBlock(block.id)}
                >
                  <X size={16} />
                </button>

                {block.type === "text" && (
                  <>
                    <label>Texto adicional</label>
                    <textarea
                      placeholder="Escribe otro bloque de texto..."
                      value={block.text}
                      onChange={(e) =>
                        updateNoteBlock(block.id, "text", e.target.value)
                      }
                    />
                  </>
                )}

                {block.type === "checklist" && (
                  <>
                    <label>Checklist</label>

                    <input
                      placeholder="Título del checklist"
                      value={block.title}
                      onChange={(e) =>
                        updateNoteBlock(block.id, "title", e.target.value)
                      }
                    />

                    {(block.items || []).map((item) => (
                  <div className="note-check-edit-row" key={item.id}>
                    <input
                      className="note-big-checkbox"
                      type="checkbox"
                      checked={item.done}
                      onChange={(e) =>
                        updateChecklistItem(
                          block.id,
                          item.id,
                          "done",
                          e.target.checked
                        )
                      }
                    />

                    <input
                      className={item.done ? "check-input-done" : ""}
                      placeholder="Elemento del checklist"
                      value={item.text}
                      onChange={(e) =>
                        updateChecklistItem(
                          block.id,
                          item.id,
                          "text",
                          e.target.value
                        )
                      }
                    />
                  </div>
                    ))}

                    <button
                      type="button"
                      className="note-small-action"
                      onClick={() => addChecklistItem(block.id)}
                    >
                      <PlusCircle size={16} />
                      Agregar punto
                    </button>
                  </>
                )}

                {block.type === "pending" && (
                  <>
                    <label>Pendiente</label>

                    <div className="note-pending-edit-row">
                      <input
                        placeholder="Persona"
                        value={block.person}
                        onChange={(e) =>
                          updateNoteBlock(block.id, "person", e.target.value)
                        }
                      />

                      <input
                        placeholder="Cantidad"
                        value={block.amount}
                        onChange={(e) =>
                          updateNoteBlock(block.id, "amount", e.target.value)
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            className={`note-pin-toggle ${noteForm.pinned ? "active" : ""}`}
            onClick={() =>
              setNoteForm({ ...noteForm, pinned: !noteForm.pinned })
            }
          >
            {noteForm.pinned ? <PinOff size={18} /> : <Pin size={18} />}
            {noteForm.pinned ? "Nota fijada arriba" : "Fijar nota arriba"}
          </button>

          <div className="note-color-picker">
            {NOTE_COLORS.map((color) => (
              <button
                key={color}
                className={`note-color-dot ${color} ${
                  noteForm.color === color ? "active" : ""
                }`}
                onClick={() => setNoteForm({ ...noteForm, color })}
                type="button"
              />
            ))}
          </div>

          <button className="save-btn" onClick={saveNote}>
            <Save size={18} />
            {noteMode === "edit" ? "Guardar cambios" : "Guardar nota"}
          </button>
        </>
      )}
    </motion.div>
  </motion.div>
)}

        {showModal && (
          <motion.div className="overlay" onClick={closeForm}>
            <motion.div
              className="modal"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="back-btn" onClick={closeForm}>
                {editing ? <ArrowLeft /> : <X />}
              </button>

              <h2>{editing ? "Editar actividad" : "Nueva actividad"}</h2>

              <input
                placeholder="Título"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              {errors.title && (
                <span className="field-error">{errors.title}</span>
              )}

              <select
                value={form.type}
                onChange={(e) => {
                  const newType = e.target.value;

                  setForm({
                    ...form,
                    type: newType,
                    course:
                      newType === "Universidad"
                        ? form.course || "Pensamiento Crítico"
                        : "",
                    alekeyRole:
                      newType === "Alekey" ? form.alekeyRole : "Encargado",
                  });
                }}
              >
                <option>Universidad</option>
                <option>Trabajo</option>
                <option>Tarea</option>
                <option>Recordatorio</option>
                <option>Alekey</option>
              </select>

              {form.type === "Universidad" && (
                <select
                  value={form.course}
                  onChange={(e) =>
                    setForm({ ...form, course: e.target.value })
                  }
                >
                  {UNIVERSITY_COURSES.map((course) => (
                    <option key={course}>{course}</option>
                  ))}
                </select>
              )}

              {form.type === "Alekey" && (
                <select
                  value={form.alekeyRole}
                  onChange={(e) =>
                    setForm({ ...form, alekeyRole: e.target.value })
                  }
                >
                  <option>Encargado</option>
                  <option>Trabajador</option>
                </select>
              )}

              <textarea
                placeholder="Descripción"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              {errors.description && (
                <span className="field-error">{errors.description}</span>
              )}

              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    date: e.target.value,
                    priority: getAutoPriority(e.target.value),
                  })
                }
              />

              {errors.date && (
                <span className="field-error">{errors.date}</span>
              )}

              {form.type === "Alekey" && form.alekeyRole === "Trabajador" ? (
                <>
                  <h3 className="form-section-title">Horas de trabajo</h3>

                  {form.workSegments.map((segment, index) => (
                    <div className="work-segment" key={index}>
                      <input
                        type="time"
                        value={segment.start}
                        onChange={(e) =>
                          updateSegment(index, "start", e.target.value)
                        }
                      />

                      <input
                        type="time"
                        value={segment.end}
                        onChange={(e) =>
                          updateSegment(index, "end", e.target.value)
                        }
                      />

                      {form.workSegments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSegment(index)}
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  ))}

                  {form.workSegments.length < 3 && (
                    <button
                      type="button"
                      className="add-segment-btn"
                      onClick={addSegment}
                    >
                      + Agregar intermedia
                    </button>
                  )}

                  {errors.workSegments && (
                    <span className="field-error">{errors.workSegments}</span>
                  )}

                  <input
                    placeholder="Horas totales"
                    value={form.totalHours}
                    onChange={(e) =>
                      setForm({ ...form, totalHours: e.target.value })
                    }
                  />

                  <input
                    placeholder="Pago por hora en colones"
                    value={form.hourlyRate}
                    onChange={(e) =>
                      setForm({ ...form, hourlyRate: e.target.value })
                    }
                  />

                  <div className="payment-preview">
                    Total aproximado: ₡
                    {Number(form.totalHours || 0) *
                      Number(form.hourlyRate || 0)}{" "}
                    colones
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) =>
                      setForm({ ...form, time: e.target.value })
                    }
                  />

                  {errors.time && (
                    <span className="field-error">{errors.time}</span>
                  )}
                </>
              )}

              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value })
                }
              >
                <option>Baja</option>
                <option>Media</option>
                <option>Alta</option>
                <option>Inminente</option>
              </select>

              <textarea
                placeholder="Checklist, una línea por punto"
                value={form.checklist}
                onChange={(e) =>
                  setForm({ ...form, checklist: e.target.value })
                }
              />

              <input
                placeholder="Link de carpeta Drive principal (opcional)"
                value={form.driveFolderUrl}
                onChange={(e) =>
                  setForm({ ...form, driveFolderUrl: e.target.value })
                }
              />

              <h3 className="form-section-title">Links de recursos</h3>

              {form.resources.map((resource, index) => (
                <div className="resource-box" key={index}>
                  <input
                    placeholder="Nombre del recurso"
                    value={resource.name}
                    onChange={(e) =>
                      updateResource(index, "name", e.target.value)
                    }
                  />

                  <input
                    placeholder="Link de Google Drive, OneDrive, Moodle..."
                    value={resource.url}
                    onChange={(e) =>
                      updateResource(index, "url", e.target.value)
                    }
                  />

                  <select
                    value={resource.type}
                    onChange={(e) =>
                      updateResource(index, "type", e.target.value)
                    }
                  >
                    <option>PDF</option>
                    <option>DOCX</option>
                    <option>XLSX</option>
                    <option>TXT</option>
                    <option>Drive</option>
                    <option>Otro</option>
                  </select>

                  {form.resources.length > 1 && (
                    <button
                      type="button"
                      className="remove-resource-btn"
                      onClick={() => removeResource(index)}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}

              {form.resources.length < 3 && (
                <button
                  type="button"
                  className="add-segment-btn"
                  onClick={addResource}
                >
                  + Agregar otro link
                </button>
              )}

              <button className="save-btn" onClick={saveTask}>
                <Save size={18} />
                {editing ? "Guardar cambios" : "Guardar actividad"}
              </button>
            </motion.div>
          </motion.div>
        )}

        {showAccountModal && (
          <motion.div
            className="overlay"
            onClick={() => setShowAccountModal(false)}
          >
            <motion.div
              className="modal"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="back-btn"
                onClick={() => setShowAccountModal(false)}
              >
                <X />
              </button>

              <h2>Nueva cuenta</h2>

              <input
                placeholder="Título"
                value={accountForm.title}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, title: e.target.value })
                }
              />

              {accountErrors.title && (
                <span className="field-error">{accountErrors.title}</span>
              )}

              <input
                placeholder="Usuario"
                value={accountForm.username}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, username: e.target.value })
                }
              />

              <input
                placeholder="Cédula"
                value={accountForm.cedula}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, cedula: e.target.value })
                }
              />

              <input
                placeholder="Correo"
                value={accountForm.email}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, email: e.target.value })
                }
              />

              <input
                placeholder="User"
                value={accountForm.user}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, user: e.target.value })
                }
              />

              <input
                placeholder="Contraseña"
                value={accountForm.password}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, password: e.target.value })
                }
              />

              <input
                placeholder="PIN"
                value={accountForm.pin}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, pin: e.target.value })
                }
              />

              <button className="save-btn" onClick={saveAccount}>
                Guardar cuenta
              </button>
            </motion.div>
          </motion.div>
        )}

        {showClientModal && (
          <motion.div
            className="overlay"
            onClick={() => setShowClientModal(false)}
          >
            <motion.div
              className="modal"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="back-btn"
                onClick={() => setShowClientModal(false)}
              >
                <X />
              </button>

              <h2>{editingClient ? "Editar cliente" : "Nuevo cliente"}</h2>

              <input
                placeholder="Nombre de la persona"
                value={clientForm.name}
                onChange={(e) =>
                  setClientForm({ ...clientForm, name: e.target.value })
                }
              />

              {clientErrors.name && (
                <span className="field-error">{clientErrors.name}</span>
              )}

              <h3 className="form-section-title">Productos</h3>

              {clientForm.products.map((product, index) => (
                <div className="resource-box" key={index}>
                  <input
                    placeholder="Producto o detalle"
                    value={product.name}
                    onChange={(e) =>
                      updateClientProduct(index, "name", e.target.value)
                    }
                  />

                  <input
                    placeholder="Precio opcional"
                    value={product.price}
                    onChange={(e) =>
                      updateClientProduct(index, "price", e.target.value)
                    }
                  />

                  {clientForm.products.length > 1 && (
                    <button
                      type="button"
                      className="remove-resource-btn"
                      onClick={() => removeClientProduct(index)}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="add-segment-btn"
                onClick={addClientProduct}
              >
                + Agregar producto
              </button>

              <label className="client-paid-toggle">
                <input
                  type="checkbox"
                  checked={clientForm.paid}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, paid: e.target.checked })
                  }
                />
                Ya está pagado
              </label>

              <div className="payment-preview">
                Total: ₡
                {calculateClientTotal(clientForm.products).toLocaleString(
                  "es-CR"
                )}
              </div>

              <button className="save-btn" onClick={saveClient}>
                {editingClient ? "Guardar cambios" : "Guardar cliente"}
              </button>
            </motion.div>
          </motion.div>
        )}

        {alertData && (
          <motion.div className="alert-overlay">
            <motion.div
              className={`custom-alert ${alertData.type}`}
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
            >
              <div className="alert-icon">
                {alertData.type === "success" ? (
                  <CheckCircle2 />
                ) : alertData.type === "password" ? (
                  <Lock />
                ) : (
                  <AlertTriangle />
                )}
              </div>

              <h3>{alertData.title}</h3>
              <p>{alertData.message}</p>

              {alertData.type === "password" && (
                <input
                  className="alert-password-input"
                  type="password"
                  placeholder="Contraseña maestra"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (passwordInput === MASTER_PASSWORD) {
                        setVisibleAccountId(alertData.accountId);
                        setPasswordInput("");
                        closeAlert();
                      } else {
                        setPasswordInput("");

                        showAlert({
                          type: "warning",
                          title: "Contraseña incorrecta",
                          message:
                            "No se pudo mostrar la información protegida.",
                          confirmText: "Entendido",
                          onlyConfirm: true,
                          onConfirm: closeAlert,
                        });
                      }
                    }
                  }}
                />
              )}

              <div className="alert-actions">
                {!alertData.onlyConfirm && (
                  <button className="alert-cancel" onClick={closeAlert}>
                    {alertData.cancelText || "Cancelar"}
                  </button>
                )}

                <button
                  className="alert-confirm"
                  onClick={() => {
                    if (alertData.type === "password") {
                      if (passwordInput === MASTER_PASSWORD) {
                        setVisibleAccountId(alertData.accountId);
                        setPasswordInput("");
                        closeAlert();
                        return;
                      }

                      setPasswordInput("");

                      showAlert({
                        type: "warning",
                        title: "Contraseña incorrecta",
                        message:
                          "No se pudo mostrar la información protegida.",
                        confirmText: "Entendido",
                        onlyConfirm: true,
                        onConfirm: closeAlert,
                      });

                      return;
                    }

                    alertData.onConfirm?.();
                  }}
                >
                  {alertData.confirmText || "Aceptar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;