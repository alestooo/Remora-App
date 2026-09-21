import { motion } from "framer-motion";
export default function TaskCard({ task, getCover, isExpired, onOpen }) {
  return <motion.div layoutId={`task-${task.id}`} whileHover={{ scale: 1.01 }} whileTap={{ scale: .98 }} className={`task-card ${task.priority.toLowerCase()} ${isExpired(task) ? "expired" : ""}`} onClick={() => onOpen(task)}>
    <img className="task-cover" src={getCover(task)} alt={task.title} />
    <div className="task-body">
      <h3>{task.title}</h3>
      {task.type === "Universidad" && task.course ? <p>{task.course}</p> : task.type === "Alekey" ? <p>Alekey · {task.alekeyRole}</p> : <p>{task.type}</p>}
      <small>📅 {task.date || "Sin fecha"} · {task.time || "Sin hora"}</small>
      {isExpired(task) && <span className="expired-label">Vencida</span>}
      <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
    </div>
  </motion.div>;
}
