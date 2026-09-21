import { Archive, ArrowLeft, CheckCircle2 } from "lucide-react";
import TaskCard from "../tasks/TaskCard";
import { formatDateTitle } from "../../utils/dates";

export default function HistoryPanel({ tasks, getCover, isExpired, onOpen, onBack }) {
  const grouped = tasks.reduce((groups, task) => {
    const key = task.date || "Sin fecha";
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
    return groups;
  }, {});

  return (
    <section className="history-page">
      <div className="history-header">
        <button className="back-btn" onClick={onBack}><ArrowLeft /></button>
        <div>
          <h2>Historial y archivo</h2>
          <p>Actividades completadas o archivadas sin perder su información.</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="history-empty">
          <Archive size={44} />
          <h3>Tu historial está vacío</h3>
          <p>Las actividades completadas o archivadas aparecerán aquí.</p>
        </div>
      ) : (
        Object.keys(grouped)
          .sort((a, b) => b.localeCompare(a))
          .map((date) => (
            <section className="date-group" key={date}>
              <h2>{formatDateTitle(date)}</h2>
              <div className="task-grid">
                {grouped[date].map((task) => (
                  <div className="history-task-wrapper" key={task.id}>
                    <div className="history-state-badge">
                      {task.archived ? <Archive size={14} /> : <CheckCircle2 size={14} />}
                      {task.archived ? "Archivada" : "Completada"}
                    </div>
                    <TaskCard
                      task={task}
                      getCover={getCover}
                      isExpired={isExpired}
                      onOpen={onOpen}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))
      )}
    </section>
  );
}
