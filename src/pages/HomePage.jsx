import EmptyState from "../components/common/EmptyState";
import TaskCard from "../components/tasks/TaskCard";
import { formatDateTitle } from "../utils/dates";
export default function HomePage({ filter, setFilter, setPage, tasksLoading, visibleTasks, expiredTasks, groupedVisibleTasks, groupedExpiredTasks, showExpired, setShowExpired, totalPages, page, getCover, isExpired, setSelectedTask }) {
  const renderTaskCard = (task) => <TaskCard key={task.id} task={task} getCover={getCover} isExpired={isExpired} onOpen={setSelectedTask} />;
  return <>
    <div className="filters">{["Todas", "Universidad", "Trabajo", "Tarea", "Recordatorio", "Alekey"].map((item) => <button key={item} className={filter === item ? "active-filter" : ""} onClick={() => { setFilter(item); setPage(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{item === "Tarea" ? "Tareas" : item}</button>)}</div>
    {tasksLoading ? <EmptyState title="Cargando tareas..." text="Estamos trayendo tus actividades." /> : visibleTasks.length === 0 && expiredTasks.length === 0 ? <EmptyState title="No tienes tareas todavía" text="Presiona el botón + para crear tu primera actividad." /> : <>
      {visibleTasks.length > 0 && Object.keys(groupedVisibleTasks).map((date) => <section key={date} className="date-group"><h2>{formatDateTitle(date)}</h2><div className="task-grid">{groupedVisibleTasks[date].map(renderTaskCard)}</div></section>)}
      {expiredTasks.length > 0 && <section className="expired-section"><div className="expired-divider"><span>Vencidas ({expiredTasks.length})</span></div><button className="show-expired-btn" onClick={() => setShowExpired(!showExpired)}>{showExpired ? "Ocultar vencidas" : "Ver vencidas"}</button>{showExpired && Object.keys(groupedExpiredTasks).map((date) => <section key={date} className="date-group"><h2>{formatDateTitle(date)}</h2><div className="task-grid">{groupedExpiredTasks[date].map(renderTaskCard)}</div></section>)}</section>}
      {totalPages > 1 && visibleTasks.length > 0 && <div className="pagination"><button disabled={page === 1} onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Anterior</button><span>Página {page} de {totalPages}</span><button disabled={page === totalPages} onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Siguiente</button></div>}
    </>}
  </>;
}
