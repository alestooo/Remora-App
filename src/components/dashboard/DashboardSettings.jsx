import { ArrowDown, ArrowUp, Eye, EyeOff, X } from "lucide-react";
import { DASHBOARD_CARD_DEFINITIONS } from "../../constants/app";

export default function DashboardSettings({ cards, onChange, onClose, onSave }) {
  const labelFor = (id) => DASHBOARD_CARD_DEFINITIONS.find((item) => item.id === id)?.label || id;

  const toggle = (index) => {
    const next = cards.map((card, i) => i === index ? { ...card, visible: card.visible === false } : card);
    onChange(next);
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= cards.length) return;
    const next = [...cards];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dashboard-settings-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><X /></button>
        <h2>Personalizar Inicio</h2>
        <p>Elige qué tarjetas quieres ver y en qué orden aparecen.</p>

        <div className="dashboard-settings-list">
          {cards.map((card, index) => (
            <div className="dashboard-setting-row" key={card.id}>
              <button className={`dashboard-visibility-btn ${card.visible === false ? "off" : ""}`} onClick={() => toggle(index)}>
                {card.visible === false ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <strong>{labelFor(card.id)}</strong>
              <div className="dashboard-order-actions">
                <button disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={17} /></button>
                <button disabled={index === cards.length - 1} onClick={() => move(index, 1)}><ArrowDown size={17} /></button>
              </div>
            </div>
          ))}
        </div>

        <button className="save-btn" onClick={onSave}>Guardar preferencias</button>
      </div>
    </div>
  );
}
