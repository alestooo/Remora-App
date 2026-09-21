import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { MASTER_PASSWORD } from "../../constants/app";
export default function ConfirmDialog({ alertData, passwordInput, setPasswordInput, setVisibleAccountId, closeAlert, showAlert }) {
  if (!alertData) return null;
  const verifyPassword = () => {
    if (passwordInput === MASTER_PASSWORD) {
      setVisibleAccountId(alertData.accountId);
      setPasswordInput("");
      closeAlert();
      return;
    }
    setPasswordInput("");
    showAlert({ type: "warning", title: "Contraseña incorrecta", message: "No se pudo mostrar la información protegida.", confirmText: "Entendido", onlyConfirm: true, onConfirm: closeAlert });
  };
  return <motion.div className="alert-overlay"><motion.div className={`custom-alert ${alertData.type}`} initial={{ scale: .85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: .85, opacity: 0, y: 20 }}>
    <div className="alert-icon">{alertData.type === "success" ? <CheckCircle2 /> : alertData.type === "password" ? <Lock /> : <AlertTriangle />}</div>
    <h3>{alertData.title}</h3><p>{alertData.message}</p>
    {alertData.type === "password" && <input className="alert-password-input" type="password" placeholder="Contraseña maestra" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === "Enter") verifyPassword(); }} />}
    <div className="alert-actions">
      {!alertData.onlyConfirm && <button className="alert-cancel" onClick={closeAlert}>{alertData.cancelText || "Cancelar"}</button>}
      <button className="alert-confirm" onClick={() => { if (alertData.type === "password") verifyPassword(); else alertData.onConfirm?.(); }}>{alertData.confirmText || "Aceptar"}</button>
    </div>
  </motion.div></motion.div>;
}
