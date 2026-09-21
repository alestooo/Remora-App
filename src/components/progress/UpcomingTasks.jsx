import { formatDateTitle } from "../../utils/dates";
export default function UpcomingTasks({ tasks }) {
  const active = tasks.filter((task) => task.progressActive !== false);
  return <div className="progress-card"><h2>Próximas entregas</h2>{active.length === 0 ? <p className="empty-private">No hay próximas entregas activas.</p> : active.slice(0, 5).map((task) => <div className="next-task" key={task.id}><strong>{task.title}</strong><span>{formatDateTitle(task.date)}</span></div>)}</div>;
}
