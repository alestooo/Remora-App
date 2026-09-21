import { Save } from "lucide-react";
import { UNIVERSITY_COURSES } from "../../constants/app";
import { getAutoPriority } from "../../utils/priorities";
export default function TaskForm({ form, setForm, errors, editing, updateSegment, removeSegment, addSegment, updateResource, removeResource, addResource, saveTask }) {
  return <>
    <h2>{editing ? "Editar actividad" : "Nueva actividad"}</h2>
    <input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
    {errors.title && <span className="field-error">{errors.title}</span>}
    <select value={form.type} onChange={(e) => { const newType = e.target.value; setForm({ ...form, type: newType, course: newType === "Universidad" ? form.course || "Pensamiento Crítico" : "", alekeyRole: newType === "Alekey" ? form.alekeyRole : "Encargado" }); }}>
      <option>Universidad</option><option>Trabajo</option><option>Tarea</option><option>Recordatorio</option><option>Alekey</option>
    </select>
    {form.type === "Universidad" && <select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>{UNIVERSITY_COURSES.map((course) => <option key={course}>{course}</option>)}</select>}
    {form.type === "Alekey" && <select value={form.alekeyRole} onChange={(e) => setForm({ ...form, alekeyRole: e.target.value })}><option>Encargado</option><option>Trabajador</option></select>}
    <textarea placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
    {errors.description && <span className="field-error">{errors.description}</span>}
    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value, priority: getAutoPriority(e.target.value) })} />
    {errors.date && <span className="field-error">{errors.date}</span>}
    {form.type === "Alekey" && form.alekeyRole === "Trabajador" ? <>
      <h3 className="form-section-title">Horas de trabajo</h3>
      {form.workSegments.map((segment, index) => <div className="work-segment" key={index}>
        <input type="time" value={segment.start} onChange={(e) => updateSegment(index, "start", e.target.value)} />
        <input type="time" value={segment.end} onChange={(e) => updateSegment(index, "end", e.target.value)} />
        {form.workSegments.length > 1 && <button type="button" onClick={() => removeSegment(index)}>Quitar</button>}
      </div>)}
      {form.workSegments.length < 3 && <button type="button" className="add-segment-btn" onClick={addSegment}>+ Agregar intermedia</button>}
      {errors.workSegments && <span className="field-error">{errors.workSegments}</span>}
      <input placeholder="Horas totales" value={form.totalHours} onChange={(e) => setForm({ ...form, totalHours: e.target.value })} />
      <input placeholder="Pago por hora en colones" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
      <div className="payment-preview">Total aproximado: ₡{Number(form.totalHours || 0) * Number(form.hourlyRate || 0)} colones</div>
    </> : <>
      <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
      {errors.time && <span className="field-error">{errors.time}</span>}
    </>}
    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Baja</option><option>Media</option><option>Alta</option><option>Inminente</option></select>
    <textarea placeholder="Checklist, una línea por punto" value={form.checklist} onChange={(e) => setForm({ ...form, checklist: e.target.value })} />
    <input placeholder="Link de carpeta Drive principal (opcional)" value={form.driveFolderUrl} onChange={(e) => setForm({ ...form, driveFolderUrl: e.target.value })} />
    <h3 className="form-section-title">Links de recursos</h3>
    {form.resources.map((resource, index) => <div className="resource-box" key={index}>
      <input placeholder="Nombre del recurso" value={resource.name} onChange={(e) => updateResource(index, "name", e.target.value)} />
      <input placeholder="Link de Google Drive, OneDrive, Moodle..." value={resource.url} onChange={(e) => updateResource(index, "url", e.target.value)} />
      <select value={resource.type} onChange={(e) => updateResource(index, "type", e.target.value)}><option>PDF</option><option>DOCX</option><option>XLSX</option><option>TXT</option><option>Drive</option><option>Otro</option></select>
      {form.resources.length > 1 && <button type="button" className="remove-resource-btn" onClick={() => removeResource(index)}>Quitar</button>}
    </div>)}
    {form.resources.length < 3 && <button type="button" className="add-segment-btn" onClick={addResource}>+ Agregar otro link</button>}
    <button className="save-btn" onClick={saveTask}><Save size={18} />{editing ? "Guardar cambios" : "Guardar actividad"}</button>
  </>;
}
