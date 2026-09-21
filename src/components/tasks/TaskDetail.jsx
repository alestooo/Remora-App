import { motion } from "framer-motion";
import { BadgeCheck, BadgeX, Pencil, Trash2, X } from "lucide-react";
import TaskChecklist from "./TaskChecklist";
import TaskResources from "./TaskResources";
export default function TaskDetail({ task, showForm, getCover, isExpired, getPayment, onClose, onToggleProgress, onToggleHours, onToggleChecklist, onEdit, onDelete }) {
  if (!task || showForm) return null;
  return <motion.div className="overlay" onClick={onClose}><motion.div layoutId={`task-${task.id}`} className="detail-card" onClick={(e) => e.stopPropagation()}>
    <button className="close-btn" onClick={onClose}><X /></button>
    <img className="detail-cover" src={getCover(task)} alt={task.title} />
    <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
    {isExpired(task) && <span className="expired-label">Vencida</span>}
    <h2>{task.title}</h2>
    <div className="task-progress-toggle"><button className={`client-check ${task.progressActive === false ? "" : "paid"}`} onClick={() => onToggleProgress(task)}>{task.progressActive === false ? <BadgeX /> : <BadgeCheck />}</button><p className="progress-toggle-text">{task.progressActive === false ? "No aparece en Progreso." : "Sí aparece en Progreso."}</p></div>
    <p className="type">{task.type}</p>
    {task.type === "Universidad" && task.course && <p className="course-name">{task.course}</p>}
    {task.type === "Alekey" && <div className="alekey-detail"><p><strong>Rol:</strong> {task.alekeyRole}</p>{task.alekeyRole === "Trabajador" && <><h3>Jornada</h3>{task.workSegments?.map((segment, index) => <p key={index}>Entrada: {segment.start || "--:--"} · Salida: {segment.end || "--:--"}</p>)}<p><strong>Horas totales:</strong> {task.totalHours || "0"} horas</p><p><strong>Pago por hora:</strong> ₡{task.hourlyRate || "1500"} colones</p><p><strong>Total:</strong> ₡{getPayment(task)} colones</p><div className="task-progress-toggle"><button className={`client-check ${task.hoursActive === false ? "" : "paid"}`} onClick={() => onToggleHours(task)}>{task.hoursActive === false ? <BadgeX /> : <BadgeCheck />}</button><p className="progress-toggle-text">{task.hoursActive === false ? "Estas horas no cuentan en Progreso." : "Estas horas sí cuentan en Progreso."}</p></div></>}</div>}
    <div className="date-box">📅 {task.date || "Sin fecha"} · {task.time || "Sin hora"}</div>
    <p>{task.description}</p>
    <TaskResources driveFolderUrl={task.driveFolderUrl} resources={task.resources} />
    <TaskChecklist checklist={task.checklist} onToggle={(index) => onToggleChecklist(task.id, index)} />
    <div className="detail-actions"><button className="edit-btn" onClick={() => onEdit(task)}><Pencil size={18} />Editar</button><button className="delete-btn" onClick={() => onDelete(task.id)}><Trash2 size={18} />Eliminar</button></div>
  </motion.div></motion.div>;
}
