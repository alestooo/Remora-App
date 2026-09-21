import { motion } from "framer-motion";
import { GripVertical, MoreHorizontal, Pencil, Pin, PinOff, Trash2, UserRound } from "lucide-react";
export default function NoteCard({ note, onOpen, notesReorderMode, noteMenuId, setNoteMenuId, toggleNotePinned, deleteNote, openEditNote, dragRef, dragStyle, dragAttributes, dragListeners, isDragging }) {
  const noteDate = note?.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" }) : "Hoy";
  const checklistBlocks = (note.blocks || []).filter((block) => block.type === "checklist");
  const pendingBlocks = (note.blocks || []).filter((block) => block.type === "pending" && (block.person || block.amount));
  const textBlocks = (note.blocks || []).filter((block) => block.type === "text" && block.text);
  const totalChecklistItems = checklistBlocks.reduce((sum, block) => sum + (block.items || []).length, 0);
  const completedChecklistItems = checklistBlocks.reduce((sum, block) => sum + (block.items || []).filter((item) => item.done).length, 0);
  return <motion.article ref={dragRef} style={dragStyle} layout whileHover={{ scale: 1.015 }} whileTap={{ scale: .98 }} className={`note-card ${note.color || "note-red"} ${isDragging ? "dragging" : ""} ${notesReorderMode ? "reorder-active" : ""}`} onClick={() => { if (!notesReorderMode) onOpen(note); }}>
    {notesReorderMode && <button className="note-drag-handle" {...dragAttributes} {...dragListeners} onClick={(e) => e.stopPropagation()} aria-label="Mover nota" type="button"><GripVertical size={18} /></button>}
    <div className="note-card-header"><span className="note-emoji">📝</span><div className="note-card-right"><small>{noteDate}</small>{note.pinned && <span className="note-pin-indicator"><Pin size={15} /></span>}<button className="note-menu-btn" type="button" onClick={(e) => { e.stopPropagation(); setNoteMenuId(noteMenuId === note.id ? null : note.id); }}><MoreHorizontal size={18} /></button>
    {noteMenuId === note.id && <div className="note-card-menu" onClick={(e) => e.stopPropagation()}><button onClick={() => { setNoteMenuId(null); openEditNote(note); }}><Pencil size={15} />Editar nota</button><button onClick={() => { setNoteMenuId(null); toggleNotePinned(note); }}>{note.pinned ? <PinOff size={15} /> : <Pin size={15} />}{note.pinned ? "Desfijar" : "Fijar"}</button><button className="danger" onClick={() => { setNoteMenuId(null); deleteNote(note.id); }}><Trash2 size={15} />Eliminar</button></div>}</div></div>
    <h3>{note.title}</h3>{note.content && <p>{note.content}</p>}{textBlocks.slice(0, 1).map((block) => <p key={block.id}>{block.text}</p>)}
    {checklistBlocks.slice(0, 1).map((block) => <div className="note-preview-checklist" key={block.id}><strong>{block.title || "Checklist"}</strong>{(block.items || []).slice(0, 3).map((item) => <div className={`note-preview-check ${item.done ? "completed" : ""}`} key={item.id}><span className={`fake-check ${item.done ? "done" : ""}`}>{item.done ? "✓" : ""}</span><span>{item.text || "Elemento sin nombre"}</span></div>)}</div>)}
    {pendingBlocks.slice(0, 1).map((block) => <div className={`note-preview-pending ${Number(block.amount || 0) > 0 ? "pending-red" : "pending-green"}`} key={block.id}><div><UserRound size={17} /><span>{block.person || "Pendiente"}</span></div><strong>₡{Number(block.amount || 0).toLocaleString("es-CR")}</strong></div>)}
    <div className="note-card-footer">{totalChecklistItems > 0 && <span>{completedChecklistItems}/{totalChecklistItems} tareas</span>}{pendingBlocks.length > 0 && <span>{pendingBlocks.length} pendiente{pendingBlocks.length > 1 ? "s" : ""}</span>}</div>
  </motion.article>;
}
