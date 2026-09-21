import { Archive, X } from "lucide-react";
import DashboardCards from "../components/dashboard/DashboardCards";
import HistoryPanel from "../components/history/HistoryPanel";
import EmptyState from "../components/common/EmptyState";
import TaskCard from "../components/tasks/TaskCard";
import { formatDateTitle } from "../utils/dates";

export default function HomePage({
  filter,
  setFilter,
  setPage,
  tasksLoading,
  visibleTasks,
  expiredTasks,
  groupedVisibleTasks,
  groupedExpiredTasks,
  showExpired,
  setShowExpired,
  totalPages,
  page,
  getCover,
  isExpired,
  setSelectedTask,
  allTasks,
  dashboardCards,
  onOpenDashboardSettings,
  homeScope,
  setHomeScope,
  historyOpen,
  setHistoryOpen,
  historyTasks,
}) {
  const renderTaskCard = (task) => (
    <TaskCard
      key={task.id}
      task={task}
      getCover={getCover}
      isExpired={isExpired}
      onOpen={setSelectedTask}
    />
  );

  if (historyOpen) {
    return (
      <HistoryPanel
        tasks={historyTasks}
        getCover={getCover}
        isExpired={isExpired}
        onOpen={setSelectedTask}
        onBack={() => setHistoryOpen(false)}
      />
    );
  }

  return (
    <>
      <DashboardCards
        tasks={allTasks}
        dashboardCards={dashboardCards}
        onOpenSettings={onOpenDashboardSettings}
        onSelectScope={(scope) => {
          setHomeScope(scope);
          setPage(1);
        }}
        onOpenTask={setSelectedTask}
      />

      <div className="home-toolbar">
        <div className="filters">
          {["Todas", "Universidad", "Trabajo", "Tarea", "Recordatorio", "Alekey"].map((item) => (
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

        <button className="history-open-btn" onClick={() => setHistoryOpen(true)}>
          <Archive size={17} /> Historial
        </button>
      </div>

      {homeScope !== "all" && (
        <div className="home-scope-bar">
          <span>
            Mostrando: <strong>{homeScope === "today" ? "solo hoy" : "pendientes"}</strong>
          </span>
          <button onClick={() => setHomeScope("all")}><X size={15} /> Ver todas</button>
        </div>
      )}

      {tasksLoading ? (
        <EmptyState title="Cargando tareas..." text="Estamos trayendo tus actividades." />
      ) : visibleTasks.length === 0 && expiredTasks.length === 0 ? (
        <EmptyState
          title="No hay actividades aquí"
          text={homeScope === "today" ? "No tienes actividades pendientes para hoy." : "Presiona el botón + para crear una actividad."}
        />
      ) : (
        <>
          {visibleTasks.length > 0 &&
            Object.keys(groupedVisibleTasks).map((date) => (
              <section key={date} className="date-group">
                <h2>{formatDateTitle(date)}</h2>
                <div className="task-grid">{groupedVisibleTasks[date].map(renderTaskCard)}</div>
              </section>
            ))}

          {expiredTasks.length > 0 && homeScope !== "today" && (
            <section className="expired-section">
              <div className="expired-divider"><span>Vencidas ({expiredTasks.length})</span></div>
              <button className="show-expired-btn" onClick={() => setShowExpired(!showExpired)}>
                {showExpired ? "Ocultar vencidas" : "Ver vencidas"}
              </button>
              {showExpired &&
                Object.keys(groupedExpiredTasks).map((date) => (
                  <section key={date} className="date-group">
                    <h2>{formatDateTitle(date)}</h2>
                    <div className="task-grid">{groupedExpiredTasks[date].map(renderTaskCard)}</div>
                  </section>
                ))}
            </section>
          )}

          {totalPages > 1 && visibleTasks.length > 0 && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Anterior</button>
              <span>Página {page} de {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Siguiente</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
