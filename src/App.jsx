import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
} from "framer-motion";

import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  LogOut,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  X,
} from "lucide-react";

import icono from "./assets/icono.png";

import {
  DEFAULT_PREFERENCES,
  DESKTOP_COVERS,
  MOBILE_COVERS,
} from "./constants/app";

import {
  isExpiredTask,
} from "./utils/dates";

import {
  notificationSupported,
  requestNotificationPermission,
} from "./services/notifications";

import {
  downloadBackup,
  importBackupFile,
} from "./services/backup";

import useAuth from "./hooks/useAuth";
import useTasks from "./hooks/useTasks";
import useTaskWorkspace from "./hooks/useTaskWorkspace";
import useNotes from "./hooks/useNotes";
import useNotesWorkspace from "./hooks/useNotesWorkspace";
import useClients from "./hooks/useClients";
import useClientsWorkspace from "./hooks/useClientsWorkspace";
import useSecurityData from "./hooks/useSecurityData";
import useSecurity from "./hooks/useSecurity";
import useAccounts from "./hooks/useAccounts";
import useAccountVault from "./hooks/useAccountVault";
import usePreferences from "./hooks/usePreferences";
import useOnlineStatus from "./hooks/useOnlineStatus";
import useInstallPrompt from "./hooks/useInstallPrompt";

import HomePage from "./pages/HomePage";
import ToolsPage from "./pages/ToolsPage";
import ProgressPage from "./pages/ProgressPage";
import AccountsPage from "./pages/AccountsPage";
import SettingsPage from "./pages/SettingsPage";

import BottomNavigation from "./components/navigation/BottomNavigation";

import TaskDetail from "./components/tasks/TaskDetail";
import TaskModal from "./components/tasks/TaskModal";

import NoteEditor from "./components/notes/NoteEditor";

import AccountModal from "./components/accounts/AccountModal";
import RecoveryCodeModal from "./components/accounts/RecoveryCodeModal";

import ClientModal from "./components/clients/ClientModal";

import ConfirmDialog from "./components/common/ConfirmDialog";

import DashboardSettings from "./components/dashboard/DashboardSettings";

import GlobalSearch from "./components/search/GlobalSearch";

function App() {
  const [
    alertData,
    setAlertData,
  ] = useState(null);

  const showAlert =
    useCallback(
      (data) =>
        setAlertData(
          data
        ),
      []
    );

  const closeAlert =
    useCallback(
      () =>
        setAlertData(
          null
        ),
      []
    );

  /* =========================================================
     AUTH
  ========================================================= */

  const {
    user,
    authLoading,
    login,
    logout,
  } = useAuth({
    onLoginError:
      (error) =>
        showAlert({
          type:
            "warning",

          title:
            "No se pudo iniciar sesión",

          message:
            error.message,

          confirmText:
            "Entendido",

          onlyConfirm:
            true,

          onConfirm:
            closeAlert,
        }),
  });

  /* =========================================================
     TASKS
  ========================================================= */

  const taskStore =
    useTasks(
      user,
      {
        onLoadError:
          () =>
            showAlert({
              type:
                "warning",

              title:
                "Error al cargar tareas",

              message:
                "No se pudieron cargar tus actividades desde Firestore.",

              confirmText:
                "Entendido",

              onlyConfirm:
                true,

              onConfirm:
                closeAlert,
            }),
      }
    );

  const taskWorkspace =
    useTaskWorkspace({
      user,

      tasks:
        taskStore.tasks,

      createTask:
        taskStore.createTask,

      updateTask:
        taskStore.updateTask,

      removeTask:
        taskStore.removeTask,

      toggleChecklistItem:
        taskStore.toggleChecklistItem,

      toggleCompleted:
        taskStore.toggleCompleted,

      toggleArchived:
        taskStore.toggleArchived,

      toggleProgress:
        taskStore.toggleProgress,

      toggleHours:
        taskStore.toggleHours,

      showAlert,

      closeAlert,
    });

  /* =========================================================
     NOTES
  ========================================================= */

  const notesStore =
    useNotes(user);

  const notesWorkspace =
    useNotesWorkspace({
      user,

      notes:
        notesStore.notes,

      setNotes:
        notesStore.setNotes,

      showAlert,

      closeAlert,
    });

  /* =========================================================
     CLIENTS
  ========================================================= */

  const {
    clients,
  } = useClients(
    user
  );

  const clientsWorkspace =
    useClientsWorkspace({
      user,

      showAlert,

      closeAlert,
    });

  /* =========================================================
     SECURITY / ACCOUNTS
  ========================================================= */

  const {
    securityData,
    securityLoading,
  } =
    useSecurityData(
      user
    );

  const security =
    useSecurity({
      user,

      securityData,

      showAlert,
    });

  const {
    accounts,
    accountsLoading,
  } =
    useAccounts(
      user,
      security.vaultKey
    );

  const accountVault =
    useAccountVault({
      user,

      security,

      showAlert,

      closeAlert,
    });

  /* =========================================================
     PREFERENCES / PWA
  ========================================================= */

  const {
    preferences,
    savePreferences,
  } =
    usePreferences(
      user
    );

  const online =
    useOnlineStatus();

  const {
    canInstall,
    installed,
    install,
  } =
    useInstallPrompt();

  /* =========================================================
     APP STATE
  ========================================================= */

  const [
    view,
    setView,
  ] =
    useState(
      "Inicio"
    );

  const [
    previousView,
    setPreviousView,
  ] =
    useState(
      "Inicio"
    );

  const [
    selectedTool,
    setSelectedTool,
  ] =
    useState(
      null
    );

  const [
    searchOpen,
    setSearchOpen,
  ] =
    useState(
      false
    );

  const [
    globalSearch,
    setGlobalSearch,
  ] =
    useState(
      ""
    );

  const [
    showDashboardSettings,
    setShowDashboardSettings,
  ] =
    useState(
      false
    );

  const [
    dashboardDraft,
    setDashboardDraft,
  ] =
    useState(
      DEFAULT_PREFERENCES.dashboardCards
    );

  const [
    backupBusy,
    setBackupBusy,
  ] =
    useState(
      false
    );

  const [
    gradeScore,
    setGradeScore,
  ] =
    useState(
      ""
    );

  const [
    gradeTotal,
    setGradeTotal,
  ] =
    useState(
      ""
    );

  const [
    calcA,
    setCalcA,
  ] =
    useState(
      ""
    );

  const [
    calcB,
    setCalcB,
  ] =
    useState(
      ""
    );

  const [
    calcOperation,
    setCalcOperation,
  ] =
    useState(
      "+"
    );

  const [
    isMobileCover,
    setIsMobileCover,
  ] =
    useState(
      window.innerWidth <=
        768
    );

  const [
    mobileHeaderMenuOpen,
    setMobileHeaderMenuOpen,
  ] =
    useState(
      false
    );

  const mobileHeaderMenuRef =
    useRef(null);

  /* =========================================================
     DND
  ========================================================= */

  const sensors =
    useSensors(
      useSensor(
        PointerSensor,
        {
          activationConstraint:
            {
              distance: 8,
            },
        }
      ),

      useSensor(
        TouchSensor,
        {
          activationConstraint:
            {
              delay: 650,

              tolerance: 8,
            },
        }
      )
    );

  /* =========================================================
     RESPONSIVE COVER
  ========================================================= */

  useEffect(() => {
    const resize =
      () =>
        setIsMobileCover(
          window.innerWidth <=
            768
        );

    window.addEventListener(
      "resize",
      resize
    );

    return () =>
      window.removeEventListener(
        "resize",
        resize
      );
  }, []);

  /* =========================================================
     KEYBOARD SEARCH
  ========================================================= */

  useEffect(() => {
    const onKeyDown =
      (event) => {
        if (
          (
            event.ctrlKey ||
            event.metaKey
          ) &&
          event.key.toLowerCase() ===
            "k"
        ) {
          event.preventDefault();

          setSearchOpen(
            true
          );
        }

        if (
          event.key ===
          "Escape"
        ) {
          setSearchOpen(
            false
          );
        }
      };

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
  }, []);

  /* =========================================================
     MOBILE HEADER MENU
  ========================================================= */

  useEffect(() => {
    if (
      !mobileHeaderMenuOpen
    ) {
      return undefined;
    }

    const handlePointerDown =
      (event) => {
        if (
          mobileHeaderMenuRef.current &&
          !mobileHeaderMenuRef.current.contains(
            event.target
          )
        ) {
          setMobileHeaderMenuOpen(
            false
          );
        }
      };

    const handleEscape =
      (event) => {
        if (
          event.key ===
          "Escape"
        ) {
          setMobileHeaderMenuOpen(
            false
          );
        }
      };

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    mobileHeaderMenuOpen,
  ]);

  /* =========================================================
     COVERS
  ========================================================= */

  const covers =
    isMobileCover
      ? MOBILE_COVERS
      : DESKTOP_COVERS;

  const getCover =
    (task) =>
      covers[
        task.type
      ] ||
      covers.Tarea;

  const isExpired =
    isExpiredTask;

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const goToView =
    (nextView) => {
      setMobileHeaderMenuOpen(
        false
      );

      setView(
        nextView
      );

      setSelectedTool(
        null
      );

      taskWorkspace.setHistoryOpen(
        false
      );

      window.setTimeout(
        () =>
          window.scrollTo({
            top: 0,

            behavior:
              "smooth",
          }),
        40
      );
    };

  const openSettings =
    () => {
      setMobileHeaderMenuOpen(
        false
      );

      setPreviousView(
        view ===
          "Ajustes"
          ? "Inicio"
          : view
      );

      setView(
        "Ajustes"
      );

      setSelectedTool(
        null
      );

      window.scrollTo({
        top: 0,

        behavior:
          "smooth",
      });
    };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout =
    async () => {
      setMobileHeaderMenuOpen(
        false
      );

      accountVault.lockAccounts();

      taskWorkspace.setSelectedTask(
        null
      );

      setSearchOpen(
        false
      );

      await logout();
    };

  /* =========================================================
     CALCULATOR
  ========================================================= */

  const gradeResult =
    gradeScore &&
    gradeTotal
      ? (
          (
            Number(
              gradeScore
            ) /
            Number(
              gradeTotal
            )
          ) *
          100
        ).toFixed(2)
      : "";

  const calculateBasicResult =
    () => {
      const a =
        Number(
          calcA
        );

      const b =
        Number(
          calcB
        );

      if (
        calcA === "" ||
        calcB === "" ||
        Number.isNaN(a) ||
        Number.isNaN(b)
      ) {
        return "";
      }

      if (
        calcOperation ===
        "+"
      ) {
        return a + b;
      }

      if (
        calcOperation ===
        "-"
      ) {
        return a - b;
      }

      if (
        calcOperation ===
        "×"
      ) {
        return a * b;
      }

      if (
        calcOperation ===
        "÷"
      ) {
        return b === 0
          ? "No válido"
          : a / b;
      }

      return "";
    };

  /* =========================================================
     DASHBOARD SETTINGS
  ========================================================= */

  const openDashboardSettings =
    () => {
      setDashboardDraft(
        preferences.dashboardCards ||
          DEFAULT_PREFERENCES.dashboardCards
      );

      setShowDashboardSettings(
        true
      );
    };

  const saveDashboardSettings =
    async () => {
      await savePreferences({
        dashboardCards:
          dashboardDraft,
      });

      setShowDashboardSettings(
        false
      );
    };

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  const enableNotifications =
    async () => {
      try {
        await requestNotificationPermission(
          user,
          preferences
        );

        await savePreferences({
          notificationsEnabled:
            true,
        });

        showAlert({
          type:
            "success",

          title:
            "Notificaciones activadas",

          message:
            "Este dispositivo ya está listo. Para el envío automático en segundo plano debes desplegar la Firebase Function incluida en el proyecto.",

          confirmText:
            "Listo",

          onlyConfirm:
            true,

          onConfirm:
            closeAlert,
        });
      } catch (
        error
      ) {
        showAlert({
          type:
            "warning",

          title:
            "No se pudieron activar",

          message:
            error.message,

          confirmText:
            "Entendido",

          onlyConfirm:
            true,

          onConfirm:
            closeAlert,
        });
      }
    };

  /* =========================================================
     BACKUP
  ========================================================= */

  const exportBackup =
    async () => {
      setBackupBusy(
        true
      );

      try {
        await downloadBackup(
          user
        );
      } catch (
        error
      ) {
        showAlert({
          type:
            "warning",

          title:
            "No se pudo exportar",

          message:
            error.message,

          confirmText:
            "Entendido",

          onlyConfirm:
            true,

          onConfirm:
            closeAlert,
        });
      } finally {
        setBackupBusy(
          false
        );
      }
    };

  const importBackup =
    (file) => {
      showAlert({
        type:
          "warning",

        title:
          "Importar copia de seguridad",

        message:
          "La copia se combinará con tus datos actuales. Los documentos con el mismo ID se actualizarán.",

        confirmText:
          "Importar",

        cancelText:
          "Cancelar",

        onConfirm:
          async () => {
            closeAlert();

            setBackupBusy(
              true
            );

            try {
              await importBackupFile(
                user,
                file
              );

              accountVault.lockAccounts();

              showAlert({
                type:
                  "success",

                title:
                  "Copia importada",

                message:
                  "Los datos fueron restaurados. Si la copia incluía una bóveda diferente, usa la contraseña de esa copia para abrir Cuentas.",

                confirmText:
                  "Listo",

                onlyConfirm:
                  true,

                onConfirm:
                  closeAlert,
              });
            } catch (
              error
            ) {
              showAlert({
                type:
                  "warning",

                title:
                  "No se pudo importar",

                message:
                  error.message,

                confirmText:
                  "Entendido",

                onlyConfirm:
                  true,

                onConfirm:
                  closeAlert,
              });
            } finally {
              setBackupBusy(
                false
              );
            }
          },
      });
    };

  /* =========================================================
     GLOBAL SEARCH
  ========================================================= */

  const closeGlobalSearch =
    () => {
      setSearchOpen(
        false
      );

      setGlobalSearch(
        ""
      );
    };

  const openTaskFromSearch =
    (task) => {
      closeGlobalSearch();

      setView(
        "Inicio"
      );

      taskWorkspace.setHistoryOpen(
        Boolean(
          task.completed ||
            task.archived
        )
      );

      taskWorkspace.setSelectedTask(
        task
      );
    };

  const openNoteFromSearch =
    (note) => {
      closeGlobalSearch();

      setView(
        "Herramientas"
      );

      setSelectedTool(
        "notes"
      );

      notesWorkspace.openView(
        note
      );
    };

  const openClientFromSearch =
    (client) => {
      closeGlobalSearch();

      setView(
        "Herramientas"
      );

      setSelectedTool(
        "clients"
      );

      clientsWorkspace.openEdit(
        client
      );
    };

  const openAccountFromSearch =
    (account) => {
      closeGlobalSearch();

      setView(
        "Cuentas"
      );

      accountVault.setVisibleAccountId(
        account.id
      );
    };

  /* =========================================================
     AUTH LOADING
  ========================================================= */

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <img
            src={
              icono
            }
            alt="Remora"
            className="auth-logo"
          />

          <h1>
            Remora
          </h1>

          <p>
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <img
            src={
              icono
            }
            alt="Remora"
            className="auth-logo"
          />

          <h1>
            Remora
          </h1>

          <p>
            Que nada te detenga.
          </p>

          <button
            className="google-login-btn"
            onClick={
              login
            }
          >
            Continuar con Google
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     APP
  ========================================================= */

  return (
    <div className="app">
      {!online && (
        <div className="offline-banner">
          Sin conexión · Remora está usando la información disponible offline.
        </div>
      )}

      {/* =====================================================
          HEADER DESKTOP
      ===================================================== */}

      <header className="header">
        <div className="header-top">
          <div className="brand">
            <img
              src={
                icono
              }
              alt="Remora"
              className="brand-icon"
            />

            <div>
              <h1>
                Remora
              </h1>

              <p>
                Que nada te detenga.
              </p>
            </div>
          </div>

          <div className="header-desktop-actions">
            <div className="header-action-stack">
              <button
                type="button"
                className="header-square-action"
                onClick={() =>
                  setSearchOpen(
                    true
                  )
                }
                title="Buscar (Ctrl + K)"
                aria-label="Buscar"
              >
                <Search
                  size={19}
                />
              </button>

              <button
                type="button"
                className="header-square-action"
                onClick={
                  openSettings
                }
                title="Ajustes"
                aria-label="Ajustes"
              >
                <Settings
                  size={19}
                />
              </button>
            </div>

            <div className="user-profile header-user-profile">
              <img
                src={
                  user.photoURL ||
                  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                }
                alt={
                  user.displayName ||
                  "Usuario"
                }
                referrerPolicy="no-referrer"
              />

              <div className="user-info">
                <strong>
                  {user.displayName ||
                    "Usuario"}
                </strong>

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                >
                  <LogOut
                    size={16}
                  />

                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          HEADER MENU MOBILE
      ===================================================== */}

      <div
        className="mobile-header-menu"
        ref={
          mobileHeaderMenuRef
        }
      >
        <button
          type="button"
          className={`mobile-header-menu-trigger ${
            mobileHeaderMenuOpen
              ? "open"
              : ""
          }`}
          onClick={() =>
            setMobileHeaderMenuOpen(
              (
                current
              ) =>
                !current
            )
          }
          aria-label={
            mobileHeaderMenuOpen
              ? "Cerrar menú"
              : "Abrir menú"
          }
          aria-expanded={
            mobileHeaderMenuOpen
          }
        >
          {mobileHeaderMenuOpen ? (
            <X
              size={21}
            />
          ) : (
            <MoreHorizontal
              size={23}
            />
          )}
        </button>

        {mobileHeaderMenuOpen && (
          <div className="mobile-header-menu-panel">
            <button
              type="button"
              className="mobile-header-menu-option"
              onClick={() => {
                setMobileHeaderMenuOpen(
                  false
                );

                setSearchOpen(
                  true
                );
              }}
            >
              <span className="mobile-header-menu-icon">
                <Search
                  size={19}
                />
              </span>

              <span>
                Buscar
              </span>
            </button>

            <button
              type="button"
              className="mobile-header-menu-option mobile-header-account-option"
              onClick={
                handleLogout
              }
            >
              <span className="mobile-header-account-photo">
                <img
                  src={
                    user.photoURL ||
                    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                  }
                  alt=""
                  referrerPolicy="no-referrer"
                />
              </span>

              <span className="mobile-header-account-copy">
                <strong>
                  {user.displayName ||
                    "Usuario"}
                </strong>

                <small>
                  Salir
                </small>
              </span>

              <LogOut
                className="mobile-header-logout-icon"
                size={17}
              />
            </button>

            <button
              type="button"
              className="mobile-header-menu-option"
              onClick={
                openSettings
              }
            >
              <span className="mobile-header-menu-icon">
                <Settings
                  size={19}
                />
              </span>

              <span>
                Ajustes
              </span>
            </button>
          </div>
        )}
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <main className="content">
        {view ===
          "Inicio" && (
          <HomePage
            filter={
              taskWorkspace.filter
            }
            setFilter={
              taskWorkspace.setFilter
            }
            setPage={
              taskWorkspace.setPage
            }
            tasksLoading={
              taskStore.tasksLoading
            }
            visibleTasks={
              taskWorkspace.visibleTasks
            }
            expiredTasks={
              taskWorkspace.expiredTasks
            }
            groupedVisibleTasks={
              taskWorkspace.groupedVisibleTasks
            }
            groupedExpiredTasks={
              taskWorkspace.groupedExpiredTasks
            }
            showExpired={
              taskWorkspace.showExpired
            }
            setShowExpired={
              taskWorkspace.setShowExpired
            }
            totalPages={
              taskWorkspace.totalPages
            }
            page={
              taskWorkspace.page
            }
            getCover={
              getCover
            }
            isExpired={
              isExpired
            }
            setSelectedTask={
              taskWorkspace.setSelectedTask
            }
            allTasks={
              taskStore.tasks
            }
            dashboardCards={
              preferences.dashboardCards ||
              DEFAULT_PREFERENCES.dashboardCards
            }
            onOpenDashboardSettings={
              openDashboardSettings
            }
            homeScope={
              taskWorkspace.homeScope
            }
            setHomeScope={
              taskWorkspace.setHomeScope
            }
            historyOpen={
              taskWorkspace.historyOpen
            }
            setHistoryOpen={
              taskWorkspace.setHistoryOpen
            }
            historyTasks={
              taskWorkspace.historyTasks
            }
          />
        )}

        {view ===
          "Herramientas" && (
          <ToolsPage
            selectedTool={
              selectedTool
            }
            setSelectedTool={
              setSelectedTool
            }

            calcA={
              calcA
            }
            setCalcA={
              setCalcA
            }

            calcB={
              calcB
            }
            setCalcB={
              setCalcB
            }

            calcOperation={
              calcOperation
            }
            setCalcOperation={
              setCalcOperation
            }

            calculateBasicResult={
              calculateBasicResult
            }

            clearCalculator={() => {
              setCalcA(
                ""
              );

              setCalcB(
                ""
              );

              setCalcOperation(
                "+"
              );
            }}

            gradeScore={
              gradeScore
            }
            setGradeScore={
              setGradeScore
            }

            gradeTotal={
              gradeTotal
            }
            setGradeTotal={
              setGradeTotal
            }

            gradeResult={
              gradeResult
            }

            noteSearch={
              notesWorkspace.search
            }
            setNoteSearch={
              notesWorkspace.setSearch
            }

            notePage={
              notesWorkspace.page
            }
            setNotePage={
              notesWorkspace.setPage
            }

            notesReorderMode={
              notesWorkspace.reorderMode
            }
            setNotesReorderMode={
              notesWorkspace.setReorderMode
            }

            openCreateNote={
              notesWorkspace.openCreate
            }

            notes={
              notesStore.notes
            }

            sensors={
              sensors
            }

            handleNoteDragEnd={
              notesWorkspace.handleDragEnd
            }

            visibleNotes={
              notesWorkspace.visibleNotes
            }

            totalNotePages={
              notesWorkspace.totalPages
            }

            noteMenuId={
              notesWorkspace.menuId
            }
            setNoteMenuId={
              notesWorkspace.setMenuId
            }

            openViewNote={
              notesWorkspace.openView
            }

            toggleNotePinned={
              notesWorkspace.togglePinned
            }

            deleteNote={
              notesWorkspace.remove
            }

            openEditNote={
              notesWorkspace.openEdit
            }

            clients={
              clients
            }

            toggleClientPaid={
              clientsWorkspace.togglePaid
            }

            openEditClient={
              clientsWorkspace.openEdit
            }

            deleteClient={
              clientsWorkspace.remove
            }

            setShowClientModal={
              (open) =>
                open
                  ? clientsWorkspace.openCreate()
                  : clientsWorkspace.closeModal()
            }
          />
        )}

        {view ===
          "Progreso" && (
          <ProgressPage
            tasks={
              taskStore.tasks
            }

            clients={
              clients
            }

            range={
              preferences.progressRange ||
              "week"
            }

            onRangeChange={
              (
                progressRange
              ) =>
                savePreferences({
                  progressRange,
                })
            }

            onDeleteTask={
              taskStore.removeTask
            }

            showAlert={
              showAlert
            }

            closeAlert={
              closeAlert
            }
          />
        )}

        {view ===
          "Cuentas" && (
          <AccountsPage
            accountsUnlocked={
              security.accountsUnlocked
            }

            securityLoading={
              securityLoading
            }

            accountsLoading={
              accountsLoading
            }

            hasPassword={
              security.hasPassword
            }

            passkeyAvailable={
              security.passkeyAvailable
            }

            hasPasskey={
              security.hasPasskey
            }

            masterInput={
              accountVault.masterInput
            }

            setMasterInput={
              accountVault.setMasterInput
            }

            newMasterPassword={
              accountVault.newMasterPassword
            }

            setNewMasterPassword={
              accountVault.setNewMasterPassword
            }

            confirmMasterPassword={
              accountVault.confirmMasterPassword
            }

            setConfirmMasterPassword={
              accountVault.setConfirmMasterPassword
            }

            recoveryCode={
              accountVault.recoveryCode
            }

            setRecoveryCode={
              accountVault.setRecoveryCode
            }

            passwordResetAuthorized={
              security.passwordResetAuthorized
            }

            securityBusy={
              security.securityBusy
            }

            unlockAccounts={
              accountVault.unlockAccounts
            }

            unlockAccountsWithPasskey={
              accountVault.unlockAccountsWithPasskey
            }

            createInitialPassword={
              accountVault.createInitialPassword
            }

            beginForgotPassword={
              accountVault.beginForgotPassword
            }

            resetForgottenPassword={
              accountVault.resetForgottenPassword
            }

            cancelPasswordReset={() => {
              security.cancelPasswordReset();

              accountVault.clearSecurityInputs();
            }}

            registerPasskeyForAccounts={
              accountVault.registerPasskeyForAccounts
            }

            lockAccounts={
              accountVault.lockAccounts
            }

            unlockSecondsLeft={
              security.unlockSecondsLeft
            }

            setShowAccountModal={
              accountVault.setShowModal
            }

            accounts={
              accounts
            }

            visibleAccountId={
              accountVault.visibleAccountId
            }

            handleEyeClick={
              accountVault.toggleVisible
            }

            deleteAccount={
              accountVault.remove
            }
          />
        )}

        {view ===
          "Ajustes" && (
          <SettingsPage
            onBack={() =>
              setView(
                previousView ||
                "Inicio"
              )
            }

            preferences={
              preferences
            }

            savePreferences={
              savePreferences
            }

            notificationsSupported={
              notificationSupported()
            }

            onEnableNotifications={
              enableNotifications
            }

            onExportBackup={
              exportBackup
            }

            onImportBackup={
              importBackup
            }

            backupBusy={
              backupBusy
            }

            online={
              online
            }

            canInstall={
              canInstall
            }

            installed={
              installed
            }

            onInstall={
              install
            }
          />
        )}
      </main>

      {/* =====================================================
          FAB
      ===================================================== */}

      {view ===
        "Inicio" &&
        !taskWorkspace.historyOpen && (
        <button
          className="fab"
          onClick={
            taskWorkspace.openCreate
          }
        >
          <Plus
            size={38}
            strokeWidth={4}
          />
        </button>
      )}

      {/* =====================================================
          BOTTOM NAV
      ===================================================== */}

      {view !==
        "Ajustes" && (
        <BottomNavigation
          view={
            view
          }

          goToView={
            goToView
          }
        />
      )}

      {/* =====================================================
          MODALS
      ===================================================== */}

      <AnimatePresence>
        <TaskDetail
          task={
            taskWorkspace.selectedTask
          }

          showForm={
            taskWorkspace.showModal
          }

          getCover={
            getCover
          }

          isExpired={
            isExpired
          }

          getPayment={
            taskWorkspace.getPayment
          }

          onClose={() =>
            taskWorkspace.setSelectedTask(
              null
            )
          }

          onToggleProgress={
            taskWorkspace.handleToggleProgress
          }

          onToggleHours={
            taskWorkspace.handleToggleHours
          }

          onToggleChecklist={
            taskWorkspace.handleToggleChecklist
          }

          onToggleCompleted={
            taskWorkspace.handleToggleCompleted
          }

          onToggleArchived={
            taskWorkspace.handleToggleArchived
          }

          onEdit={
            taskWorkspace.openEdit
          }

          onDelete={
            taskWorkspace.deleteTask
          }
        />

        <NoteEditor
          show={
            notesWorkspace.showModal
          }

          closeNoteModal={
            notesWorkspace.closeModal
          }

          noteForm={
            notesWorkspace.form
          }

          setNoteForm={
            notesWorkspace.setForm
          }

          noteMode={
            notesWorkspace.mode
          }

          selectedNote={
            notesWorkspace.selectedNote
          }

          noteErrors={
            notesWorkspace.errors
          }

          formatNoteDate={
            notesWorkspace.formatDate
          }

          toggleChecklistItemInNote={
            notesWorkspace.toggleChecklistItemInNote
          }

          openEditNote={
            notesWorkspace.openEdit
          }

          toggleNotePinned={
            notesWorkspace.togglePinned
          }

          deleteNote={
            notesWorkspace.remove
          }

          addNoteTextBlock={
            notesWorkspace.addTextBlock
          }

          addNoteChecklistBlock={
            notesWorkspace.addChecklistBlock
          }

          addNotePendingBlock={
            notesWorkspace.addPendingBlock
          }

          removeNoteBlock={
            notesWorkspace.removeBlock
          }

          updateNoteBlock={
            notesWorkspace.updateBlock
          }

          updateChecklistItem={
            notesWorkspace.updateChecklistItem
          }

          addChecklistItem={
            notesWorkspace.addChecklistItem
          }

          saveNote={
            notesWorkspace.save
          }
        />

        <TaskModal
          show={
            taskWorkspace.showModal
          }

          closeForm={
            taskWorkspace.closeForm
          }

          editing={
            taskWorkspace.editing
          }

          form={
            taskWorkspace.form
          }

          setForm={
            taskWorkspace.setForm
          }

          errors={
            taskWorkspace.errors
          }

          updateSegment={
            taskWorkspace.updateSegment
          }

          removeSegment={
            taskWorkspace.removeSegment
          }

          addSegment={
            taskWorkspace.addSegment
          }

          updateResource={
            taskWorkspace.updateResource
          }

          removeResource={
            taskWorkspace.removeResource
          }

          addResource={
            taskWorkspace.addResource
          }

          saveTask={
            taskWorkspace.save
          }
        />

        <AccountModal
          show={
            accountVault.showModal
          }

          onClose={() =>
            accountVault.setShowModal(
              false
            )
          }

          accountForm={
            accountVault.form
          }

          setAccountForm={
            accountVault.setForm
          }

          accountErrors={
            accountVault.errors
          }

          saveAccount={
            accountVault.save
          }
        />

        <ClientModal
          show={
            clientsWorkspace.showModal
          }

          onClose={
            clientsWorkspace.closeModal
          }

          editingClient={
            clientsWorkspace.editingId
          }

          clientForm={
            clientsWorkspace.form
          }

          setClientForm={
            clientsWorkspace.setForm
          }

          clientErrors={
            clientsWorkspace.errors
          }

          updateClientProduct={
            clientsWorkspace.updateProduct
          }

          removeClientProduct={
            clientsWorkspace.removeProduct
          }

          addClientProduct={
            clientsWorkspace.addProduct
          }

          saveClient={
            clientsWorkspace.save
          }
        />

        {showDashboardSettings && (
          <DashboardSettings
            cards={
              dashboardDraft
            }

            onChange={
              setDashboardDraft
            }

            onClose={() =>
              setShowDashboardSettings(
                false
              )
            }

            onSave={
              saveDashboardSettings
            }
          />
        )}

        <RecoveryCodeModal
          code={
            security.recoveryCodeToShow
          }

          onClose={
            security.clearRecoveryCodeToShow
          }

          showAlert={
            showAlert
          }
        />

        <ConfirmDialog
          alertData={
            alertData
          }

          closeAlert={
            closeAlert
          }
        />
      </AnimatePresence>

      {/* =====================================================
          GLOBAL SEARCH
      ===================================================== */}

      <GlobalSearch
        open={
          searchOpen
        }

        query={
          globalSearch
        }

        setQuery={
          setGlobalSearch
        }

        onClose={
          closeGlobalSearch
        }

        tasks={
          taskStore.tasks
        }

        notes={
          notesStore.notes
        }

        clients={
          clients
        }

        accounts={
          accounts
        }

        accountsUnlocked={
          security.accountsUnlocked
        }

        onOpenTask={
          openTaskFromSearch
        }

        onOpenNote={
          openNoteFromSearch
        }

        onOpenClient={
          openClientFromSearch
        }

        onOpenAccount={
          openAccountFromSearch
        }
      />
    </div>
  );
}

export default App;