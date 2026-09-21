import { motion } from "framer-motion";
export default function Modal({ className = "modal", overlayClassName = "overlay", onClose, children }) {
  return <motion.div className={overlayClassName} onClick={onClose}><motion.div className={className} onClick={(event) => event.stopPropagation()}>{children}</motion.div></motion.div>;
}
