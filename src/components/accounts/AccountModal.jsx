import { motion } from "framer-motion";
import { X } from "lucide-react";
import AccountForm from "./AccountForm";
export default function AccountModal({ show, onClose, ...props }) {
  if (!show) return null;
  return <motion.div className="overlay" onClick={onClose}><motion.div className="modal" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} onClick={(e) => e.stopPropagation()}><button className="back-btn" onClick={onClose}><X /></button><AccountForm {...props} /></motion.div></motion.div>;
}
