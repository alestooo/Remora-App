import { Eye, EyeOff } from "lucide-react";
export default function AccountCard({ account, visible, onEyeClick, onDelete }) {
  return <div className="account-card"><div className="account-title-row"><h3>{account.title}</h3><button onClick={() => onEyeClick(account.id)}>{visible ? <EyeOff /> : <Eye />}</button></div>{visible ? <div className="account-data"><p>Usuario: {account.username || "—"}</p><p>Cédula: {account.cedula || "—"}</p><p>Correo: {account.email || "—"}</p><p>User: {account.user || "—"}</p><p>Contraseña: {account.password || "—"}</p><p>PIN: {account.pin || "—"}</p></div> : <p className="censored">Información oculta •••••••</p>}<button className="delete-mini-btn" onClick={() => onDelete(account.id)}>Eliminar</button></div>;
}
