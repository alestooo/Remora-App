import { BarChart3, ListTodo, Lock, NotebookText } from "lucide-react";
export default function BottomNavigation({ goToView }) {
  return <nav className="bottom-nav">
    <button onClick={() => goToView("Inicio")}><ListTodo /> Inicio</button>
    <button onClick={() => goToView("Herramientas")}><NotebookText /> Herramientas</button>
    <button onClick={() => goToView("Progreso")}><BarChart3 /> Progreso</button>
    <button onClick={() => goToView("Cuentas")}><Lock /> Cuentas</button>
  </nav>;
}
