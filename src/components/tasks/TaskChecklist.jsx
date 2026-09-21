export default function TaskChecklist({ checklist = [], onToggle }) {
  if (!checklist.length) return null;
  return <><h3>Checklist</h3>{checklist.map((item, index) => <label className="check-item" key={item.text + index}><input type="checkbox" checked={item.done} onChange={() => onToggle(index)} /><span>{item.text}</span></label>)}</>;
}
