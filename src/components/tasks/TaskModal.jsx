import { motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import TaskForm from "./TaskForm";
export default function TaskModal({ show, closeForm, editing, ...formProps }) {
  if (!show) return null;
  return <motion.div className="overlay" onClick={closeForm}><motion.div className="modal" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
    <button className="back-btn" onClick={closeForm}>{editing ? <ArrowLeft /> : <X />}</button>
    <TaskForm editing={editing} {...formProps} />
  </motion.div></motion.div>;
}
