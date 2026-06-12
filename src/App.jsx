import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "firebase/firestore";
import { auth, provider, db } from "./firebase";

import {
  Plus,
  CalendarDays,
  ListTodo,
  BarChart3,
  Settings,
  Trash2,
  X,
  FileText,
  Pencil,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  LogOut,
} from "lucide-react";

import icono from "./assets/icono.png";
import alekeyCover from "./assets/alekey.png";

const DEFAULT_COVERS = {
  Universidad:
    "https://ucenfotec.ac.cr/wp-content/uploads/2026/02/IMG_2934-scaled.jpg",
  Trabajo:
    "https://uni.edu.gt/wp-content/uploads/sites/19/2025/07/10-carreras-para-trabajar-desde-casa-en-linea1.jpg",
  Tarea:
    "https://s.yimg.com/ny/api/res/1.2/40N9VhmK.OU25e9Scggwzw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTQyNw--/https://s.yimg.com/os/creatr-uploaded-images/2021-11/76209790-4eb4-11ec-966d-836e2fc9cbe0",
  Recordatorio:
    "https://i.pinimg.com/564x/00/96/fd/0096fd58a5460027271b2b1003986baf.jpg",
  Alekey: alekeyCover,
};

const UNIVERSITY_COURSES = [
  "Pensamiento Crítico",
  "Probabilidad y Estadística 2",
  "Calidad, Verificación y Validación del Software",
  "Arquitectura de Software 1",
  "Cálculo Diferencial e Integral",
];

const ITEMS_PER_PAGE = 24;

const getTodayDate = () => new Date().toISOString().split("T")[0];

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
    checklist: "",
    resources: [{ name: "", url: "", type: "PDF" }],
    driveFolderUrl: "",
    workSegments: [{ start: "", end: "" }],
    totalHours: "",
    hourlyRate: "1500",
  };

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [view, setView] = useState("Lista");
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("Todas");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [originalForm, setOriginalForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [alertData, setAlertData] = useState(null);

  const showAlert = (data) => setAlertData(data);
  const closeAlert = () => setAlertData(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
      (error) => {
        console.error(error);
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
    if (filter === "Todas") return tasks;
    return tasks.filter((task) => task.type === filter);
  }, [tasks, filter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)
  );

  const visibleTasks = filteredTasks.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

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
    } catch (error) {
      console.error(error);

      showAlert({
        type: "warning",
        title: "Error al guardar",
        message: "No se pudo guardar la actividad en la base de datos.",
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
      resources: task.resources?.length
        ? task.resources
        : [{ name: "", url: "", type: "PDF" }],
      driveFolderUrl: task.driveFolderUrl || "",
      checklist: task.checklist.map((item) => item.text).join("\n"),
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
        try {
          await deleteDoc(doc(db, "users", user.uid, "tasks", id));
          setSelectedTask(null);
          closeAlert();

          setTimeout(() => {
            showAlert({
              type: "success",
              title: "Actividad eliminada",
              message: "La actividad se eliminó correctamente.",
              confirmText: "Listo",
              onlyConfirm: true,
              onConfirm: closeAlert,
            });
          }, 150);
        } catch (error) {
          console.error(error);

          showAlert({
            type: "warning",
            title: "Error al eliminar",
            message: "No se pudo eliminar la actividad.",
            confirmText: "Entendido",
            onlyConfirm: true,
            onConfirm: closeAlert,
          });
        }
      },
    });
  };

  const toggleChecklistItem = async (taskId, index) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    const updatedChecklist = task.checklist.map((item, i) =>
      i === index ? { ...item, done: !item.done } : item
    );

    try {
      await updateDoc(doc(db, "users", user.uid, "tasks", taskId), {
        checklist: updatedChecklist,
        updatedAt: serverTimestamp(),
      });

      setSelectedTask((prev) =>
        prev && prev.id === taskId
          ? { ...prev, checklist: updatedChecklist }
          : prev
      );
    } catch (error) {
      console.error(error);

      showAlert({
        type: "warning",
        title: "Error al actualizar",
        message: "No se pudo actualizar el checklist.",
        confirmText: "Entendido",
        onlyConfirm: true,
        onConfirm: closeAlert,
      });
    }
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

        <AnimatePresence>
          {alertData && (
            <motion.div className="alert-overlay">
              <motion.div
                className={`custom-alert ${alertData.type}`}
                initial={{ scale: 0.85, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 20 }}
              >
                <div className="alert-icon">
                  <AlertTriangle />
                </div>

                <h3>{alertData.title}</h3>
                <p>{alertData.message}</p>

                <div className="alert-actions">
                  <button
                    className="alert-confirm"
                    onClick={alertData.onConfirm}
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
        {view === "Lista" && (
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
            ) : visibleTasks.length === 0 ? (
              <section className="empty-state">
                <h2>No tienes tareas todavía</h2>
                <p>Presiona el botón + para crear tu primera actividad.</p>
              </section>
            ) : (
              <div className="task-grid">
                {visibleTasks.map((task) => (
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
                    <img
                      className="task-cover"
                      src={getCover(task)}
                      alt={task.title}
                    />

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
                        📅 {task.date || "Sin fecha"} ·{" "}
                        {task.time || "Sin hora"}
                      </small>

                      {isExpired(task) && (
                        <span className="expired-label">Vencida</span>
                      )}

                      <span
                        className={`priority ${task.priority.toLowerCase()}`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Anterior
                </button>

                <span>
                  Página {page} de {totalPages}
                </span>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}

        {view === "Calendario" && (
          <div className="placeholder">
            <CalendarDays size={58} />
            <h2>Calendario</h2>
            <p>Próximamente verás tus tareas por fecha.</p>
          </div>
        )}

        {view === "Progreso" && (
          <div className="placeholder">
            <BarChart3 size={58} />
            <h2>Progreso</h2>
            <p>Próximamente verás estadísticas.</p>
          </div>
        )}

        {view === "Más" && (
          <div className="placeholder">
            <Settings size={58} />
            <h2>Más opciones</h2>
            <p>Configuración y conexión con Google más adelante.</p>
          </div>
        )}
      </main>

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

      <nav className="bottom-nav">
        <button onClick={() => setView("Lista")}>
          <ListTodo /> Lista
        </button>

        <button onClick={() => setView("Calendario")}>
          <CalendarDays /> Calendario
        </button>

        <button onClick={() => setView("Progreso")}>
          <BarChart3 /> Progreso
        </button>

        <button onClick={() => setView("Más")}>
          <Settings /> Más
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

                      {selectedTask.workSegments.map((segment, index) => (
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
                ) : (
                  <AlertTriangle />
                )}
              </div>

              <h3>{alertData.title}</h3>
              <p>{alertData.message}</p>

              <div className="alert-actions">
                {!alertData.onlyConfirm && (
                  <button className="alert-cancel" onClick={closeAlert}>
                    {alertData.cancelText || "Cancelar"}
                  </button>
                )}

                <button className="alert-confirm" onClick={alertData.onConfirm}>
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