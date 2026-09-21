import { motion } from "framer-motion";
import { CheckSquare, Pencil, Pin, PinOff, PlusCircle, Save, Trash2, Type, UserRound, X } from "lucide-react";
import { NOTE_COLORS } from "../../constants/app";
import NoteChecklist from "./NoteChecklist";
export default function NoteEditor({ show, closeNoteModal, noteForm, setNoteForm, noteMode, selectedNote, noteErrors, formatNoteDate, toggleChecklistItemInNote, openEditNote, toggleNotePinned, deleteNote, addNoteTextBlock, addNoteChecklistBlock, addNotePendingBlock, removeNoteBlock, updateNoteBlock, updateChecklistItem, addChecklistItem, saveNote }) {
  if (!show) return null;
  return <motion.div className="overlay" onClick={closeNoteModal}><motion.div className={`note-modal ${noteForm.color}`} initial={{ y: 80, opacity: 0, scale: .96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 80, opacity: 0, scale: .96 }} onClick={(e) => e.stopPropagation()}>
    <button className="back-btn" onClick={closeNoteModal}><X /></button>
    {noteMode === "view" ? <>
      <div className="note-modal-header"><span className="note-emoji">📝</span><div className="note-view-actions"><small>{formatNoteDate(selectedNote)}</small>{selectedNote?.pinned && <span className="note-pin-indicator"><Pin size={15} /></span>}</div></div>
      <h2>{selectedNote?.title}</h2>{selectedNote?.content && <p className="note-full-content">{selectedNote.content}</p>}
      {(selectedNote?.blocks || []).map((block) => <div className="note-view-block" key={block.id}>{block.type === "text" && <p className="note-full-content">{block.text}</p>}{block.type === "checklist" && <NoteChecklist block={block} onToggle={(itemId) => toggleChecklistItemInNote(selectedNote, block.id, itemId)} />}{block.type === "pending" && <div className={`note-view-pending ${Number(block.amount || 0) > 0 ? "pending-red" : "pending-green"}`}><div><UserRound size={18} /><span>{block.person || "Persona pendiente"}</span></div><strong>₡{Number(block.amount || 0).toLocaleString("es-CR")}</strong></div>}</div>)}
      <div className="detail-actions"><button className="edit-btn" onClick={() => openEditNote(selectedNote)}><Pencil size={18} />Editar</button><button className={`edit-btn ${selectedNote?.pinned ? "pinned-active-btn" : ""}`} onClick={() => toggleNotePinned(selectedNote)}>{selectedNote?.pinned ? <PinOff size={18} /> : <Pin size={18} />}{selectedNote?.pinned ? "Desfijar" : "Fijar"}</button><button className="delete-btn" onClick={() => deleteNote(selectedNote.id)}><Trash2 size={18} />Eliminar</button></div>
    </> : <>
      <h2>{noteMode === "edit" ? "Editar nota" : "Nueva nota"}</h2>
      <input placeholder="Título de la nota" value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} />{noteErrors.title && <span className="field-error">{noteErrors.title}</span>}
      <textarea className="note-editor-textarea" placeholder="Escribe tu nota..." value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} />
      <div className="note-builder-actions"><button type="button" onClick={addNoteTextBlock}><Type size={17} />Texto</button><button type="button" onClick={addNoteChecklistBlock}><CheckSquare size={17} />Checklist</button><button type="button" onClick={addNotePendingBlock}><UserRound size={17} />Pendiente</button></div>
      <div className="note-blocks-editor">{(noteForm.blocks || []).map((block) => <div className="note-edit-block" key={block.id}><button className="note-remove-block" type="button" onClick={() => removeNoteBlock(block.id)}><X size={16} /></button>
        {block.type === "text" && <><label>Texto adicional</label><textarea placeholder="Escribe otro bloque de texto..." value={block.text} onChange={(e) => updateNoteBlock(block.id, "text", e.target.value)} /></>}
        {block.type === "checklist" && <><label>Checklist</label><input placeholder="Título del checklist" value={block.title} onChange={(e) => updateNoteBlock(block.id, "title", e.target.value)} />{(block.items || []).map((item) => <div className="note-check-edit-row" key={item.id}><input className="note-big-checkbox" type="checkbox" checked={item.done} onChange={(e) => updateChecklistItem(block.id, item.id, "done", e.target.checked)} /><input className={item.done ? "check-input-done" : ""} placeholder="Elemento del checklist" value={item.text} onChange={(e) => updateChecklistItem(block.id, item.id, "text", e.target.value)} /></div>)}<button type="button" className="note-small-action" onClick={() => addChecklistItem(block.id)}><PlusCircle size={16} />Agregar punto</button></>}
        {block.type === "pending" && <><label>Pendiente</label><div className="note-pending-edit-row"><input placeholder="Persona" value={block.person} onChange={(e) => updateNoteBlock(block.id, "person", e.target.value)} /><input placeholder="Cantidad" value={block.amount} onChange={(e) => updateNoteBlock(block.id, "amount", e.target.value)} /></div></>}
      </div>)}</div>
      <button type="button" className={`note-pin-toggle ${noteForm.pinned ? "active" : ""}`} onClick={() => setNoteForm({ ...noteForm, pinned: !noteForm.pinned })}>{noteForm.pinned ? <PinOff size={18} /> : <Pin size={18} />}{noteForm.pinned ? "Nota fijada arriba" : "Fijar nota arriba"}</button>
      <div className="note-color-picker">{NOTE_COLORS.map((color) => <button key={color} className={`note-color-dot ${color} ${noteForm.color === color ? "active" : ""}`} onClick={() => setNoteForm({ ...noteForm, color })} type="button" />)}</div>
      <button className="save-btn" onClick={saveNote}><Save size={18} />{noteMode === "edit" ? "Guardar cambios" : "Guardar nota"}</button>
    </>}
  </motion.div></motion.div>;
}
