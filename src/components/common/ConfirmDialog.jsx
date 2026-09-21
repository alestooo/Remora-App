import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ConfirmDialog({ alertData, closeAlert }) {
  if (!alertData) return null;

  return (
    <motion.div className="alert-overlay">
      <motion.div
        className={`custom-alert ${alertData.type}`}
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
      >
        <div className="alert-icon">
          {alertData.type === "success" ? (
            <CheckCircle2 />
          ) : (
            <AlertTriangle />
          )}
        </div>

        <h3>{alertData.title}</h3>
        <p>{alertData.message}</p>

        <div className="alert-actions">
          {!alertData.onlyConfirm && (
            <button className="alert-cancel" onClick={closeAlert}>
              {alertData.cancelText || "Cancelar"}
            </button>
          )}

          <button
            className="alert-confirm"
            onClick={() => alertData.onConfirm?.()}
          >
            {alertData.confirmText || "Aceptar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
