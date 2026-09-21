import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy, serverTimestamp, writeBatch } from "firebase/firestore";
import { LogOut, Plus } from "lucide-react";
import { auth, provider, db } from "./services/firebase";
import { requestNotificationPermission } from "./services/notifications";
import { registerPasskey, unlockWithPasskey } from "./services/passkey";
import icono from "./assets/icono.png";
import { DESKTOP_COVERS, MOBILE_COVERS, ITEMS_PER_PAGE, NOTES_PER_PAGE, MASTER_PASSWORD, UNLOCK_TIME, HOURLY_RATE } from "./constants/app";
import { getTodayDate } from "./utils/dates";
import { calculateClientTotal } from "./utils/currency";
import { calculateHours, createNoteId, isMobileDevice } from "./utils/taskHelpers";
import useNotes from "./hooks/useNotes";
import useClients from "./hooks/useClients";
import useAccounts from "./hooks/useAccounts";
import HomePage from "./pages/HomePage";
import ToolsPage from "./pages/ToolsPage";
import ProgressPage from "./pages/ProgressPage";
import AccountsPage from "./pages/AccountsPage";
import BottomNavigation from "./components/navigation/BottomNavigation";
import TaskDetail from "./components/tasks/TaskDetail";
import TaskModal from "./components/tasks/TaskModal";
import NoteEditor from "./components/notes/NoteEditor";
import AccountModal from "./components/accounts/AccountModal";
import ClientModal from "./components/clients/ClientModal";
import ConfirmDialog from "./components/common/ConfirmDialog";

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
  const { accounts, securityData } = useAccounts(user);
  const { clients } = useClients(user);

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

  const { notes, setNotes } = useNotes(user);
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


  const toggleTaskProgress = async (task) => {
    const newValue = task.progressActive === false ? true : false;
    await updateDoc(doc(db, "users", user.uid, "tasks", task.id), { progressActive: newValue, updatedAt: serverTimestamp() });
    setSelectedTask({ ...task, progressActive: newValue });
  };

  const toggleTaskHours = async (task) => {
    const newValue = task.hoursActive === false ? true : false;
    await updateDoc(doc(db, "users", user.uid, "tasks", task.id), { hoursActive: newValue, updatedAt: serverTimestamp() });
    setSelectedTask({ ...task, hoursActive: newValue });
  };

  const openEditClient = (client) => {
    setEditingClient(client.id);
    setClientForm({ name: client.name || "", products: client.products?.length > 0 ? client.products : [{ name: "", price: "" }], paid: client.paid || false });
    setClientErrors({});
    setShowClientModal(true);
  };

  if (authLoading) {
    return <div className="auth-page"><div className="auth-card"><img src={icono} alt="Remora" className="auth-logo" /><h1>Remora</h1><p>Cargando...</p></div></div>;
  }

  if (!user) {
    return <div className="auth-page"><div className="auth-card"><img src={icono} alt="Remora" className="auth-logo" /><h1>Remora</h1><p>Que nada te detenga.</p><button className="google-login-btn" onClick={handleLogin}>Continuar con Google</button></div></div>;
  }

  return <div className="app">
    <header className="header"><div className="header-top"><div className="brand"><img src={icono} alt="Remora" className="brand-icon" /><div><h1>Remora</h1><p>Que nada te detenga.</p></div></div><div className="user-profile"><img src={user?.photoURL || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt={user?.displayName || "Usuario"} referrerPolicy="no-referrer" /><div className="user-info"><strong>{user?.displayName || "Usuario"}</strong><button onClick={handleLogout}><LogOut size={16} />Salir</button></div></div></div></header>

    <main className="content">
      {view === "Inicio" && <HomePage filter={filter} setFilter={setFilter} setPage={setPage} tasksLoading={tasksLoading} visibleTasks={visibleTasks} expiredTasks={expiredTasks} groupedVisibleTasks={groupedVisibleTasks} groupedExpiredTasks={groupedExpiredTasks} showExpired={showExpired} setShowExpired={setShowExpired} totalPages={totalPages} page={page} getCover={getCover} isExpired={isExpired} setSelectedTask={setSelectedTask} />}
      {view === "Herramientas" && <ToolsPage selectedTool={selectedTool} setSelectedTool={setSelectedTool} calcA={calcA} setCalcA={setCalcA} calcB={calcB} setCalcB={setCalcB} calcOperation={calcOperation} setCalcOperation={setCalcOperation} calculateBasicResult={calculateBasicResult} clearCalculator={clearCalculator} gradeScore={gradeScore} setGradeScore={setGradeScore} gradeTotal={gradeTotal} setGradeTotal={setGradeTotal} gradeResult={gradeResult} noteSearch={noteSearch} setNoteSearch={setNoteSearch} notePage={notePage} setNotePage={setNotePage} notesReorderMode={notesReorderMode} setNotesReorderMode={setNotesReorderMode} openCreateNote={openCreateNote} notes={notes} sensors={sensors} handleNoteDragEnd={handleNoteDragEnd} visibleNotes={visibleNotes} totalNotePages={totalNotePages} noteMenuId={noteMenuId} setNoteMenuId={setNoteMenuId} openViewNote={openViewNote} toggleNotePinned={toggleNotePinned} deleteNote={deleteNote} openEditNote={openEditNote} clients={clients} toggleClientPaid={toggleClientPaid} openEditClient={openEditClient} deleteClient={deleteClient} setShowClientModal={setShowClientModal} />}
      {view === "Progreso" && <ProgressPage weeklyStats={weeklyStats} maxWeekly={maxWeekly} categoryStats={categoryStats} activeTasks={activeTasks} pendingClients={pendingClients} pendingClientsTotal={pendingClientsTotal} totalAlekeyHours={totalAlekeyHours} alekeySalaryTotal={alekeySalaryTotal} />}
      {view === "Cuentas" && <AccountsPage accountsUnlocked={accountsUnlocked} mobilePasskeyAvailable={mobilePasskeyAvailable} securityData={securityData} masterInput={masterInput} setMasterInput={setMasterInput} unlockAccounts={unlockAccounts} unlockAccountsWithPasskey={unlockAccountsWithPasskey} registerPasskeyForAccounts={registerPasskeyForAccounts} unlockSecondsLeft={unlockSecondsLeft} setShowAccountModal={setShowAccountModal} accounts={accounts} visibleAccountId={visibleAccountId} handleEyeClick={handleEyeClick} deleteAccount={deleteAccount} />}
    </main>

    {view === "Inicio" && <button className="fab" onClick={() => { setEditing(false); setOriginalForm(null); setForm(emptyForm); setErrors({}); setShowModal(true); }}><Plus size={38} strokeWidth={4} /></button>}
    <BottomNavigation goToView={goToView} />

    <AnimatePresence>
      <TaskDetail task={selectedTask} showForm={showModal} getCover={getCover} isExpired={isExpired} getPayment={getPayment} onClose={() => setSelectedTask(null)} onToggleProgress={toggleTaskProgress} onToggleHours={toggleTaskHours} onToggleChecklist={toggleChecklistItem} onEdit={openEdit} onDelete={deleteTask} />
      <NoteEditor show={showNoteModal} closeNoteModal={closeNoteModal} noteForm={noteForm} setNoteForm={setNoteForm} noteMode={noteMode} selectedNote={selectedNote} noteErrors={noteErrors} formatNoteDate={formatNoteDate} toggleChecklistItemInNote={toggleChecklistItemInNote} openEditNote={openEditNote} toggleNotePinned={toggleNotePinned} deleteNote={deleteNote} addNoteTextBlock={addNoteTextBlock} addNoteChecklistBlock={addNoteChecklistBlock} addNotePendingBlock={addNotePendingBlock} removeNoteBlock={removeNoteBlock} updateNoteBlock={updateNoteBlock} updateChecklistItem={updateChecklistItem} addChecklistItem={addChecklistItem} saveNote={saveNote} />
      <TaskModal show={showModal} closeForm={closeForm} editing={editing} form={form} setForm={setForm} errors={errors} updateSegment={updateSegment} removeSegment={removeSegment} addSegment={addSegment} updateResource={updateResource} removeResource={removeResource} addResource={addResource} saveTask={saveTask} />
      <AccountModal show={showAccountModal} onClose={() => setShowAccountModal(false)} accountForm={accountForm} setAccountForm={setAccountForm} accountErrors={accountErrors} saveAccount={saveAccount} />
      <ClientModal show={showClientModal} onClose={() => setShowClientModal(false)} editingClient={editingClient} clientForm={clientForm} setClientForm={setClientForm} clientErrors={clientErrors} updateClientProduct={updateClientProduct} removeClientProduct={removeClientProduct} addClientProduct={addClientProduct} saveClient={saveClient} />
      <ConfirmDialog alertData={alertData} passwordInput={passwordInput} setPasswordInput={setPasswordInput} setVisibleAccountId={setVisibleAccountId} closeAlert={closeAlert} showAlert={showAlert} />
    </AnimatePresence>
  </div>;
}

export default App;
