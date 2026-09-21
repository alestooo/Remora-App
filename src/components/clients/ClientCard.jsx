import { BadgeCheck, BadgeX } from "lucide-react";
import { calculateClientTotal } from "../../utils/currency";
export default function ClientCard({ client, onTogglePaid, onEdit, onDelete }) {
  return <div className="client-card">
    <div className="client-main"><button className={`client-check ${client.paid ? "paid" : ""}`} onClick={() => onTogglePaid(client)}>{client.paid ? <BadgeCheck /> : <BadgeX />}</button><div><h3>{client.name}</h3><p>Total: ₡{Number(client.total || calculateClientTotal(client.products)).toLocaleString("es-CR")}</p></div></div>
    {client.products?.length > 0 && <div className="client-products">{client.products.map((product, index) => <span key={index}>{product.name || "Producto"} {product.price ? `₡${Number(product.price).toLocaleString("es-CR")}` : ""}</span>)}</div>}
    <div className="client-actions"><button className="edit-mini-btn" onClick={() => onEdit(client)}>Editar</button><button className="delete-mini-btn" onClick={() => onDelete(client.id)}>Eliminar</button></div>
  </div>;
}
