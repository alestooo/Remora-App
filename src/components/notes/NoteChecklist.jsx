export default function NoteChecklist({ block, onToggle }) {
  return <div className="note-view-checklist"><h3>{block.title || "Checklist"}</h3>{(block.items || []).map((item) => <label className={`note-view-check ${item.done ? "completed" : ""}`} key={item.id}><input type="checkbox" checked={item.done} onChange={() => onToggle(item.id)} /><span>{item.text || "Elemento sin nombre"}</span></label>)}</div>;
}
