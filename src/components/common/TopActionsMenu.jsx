import {
  MoreVertical,
  Search,
  Settings,
  User2,
  X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

export default function TopActionsMenu({
  onSearch,
  onSettings,
  onAccount,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <div className="top-actions-mobile" ref={wrapperRef}>
      <button
        type="button"
        className="top-actions-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Abrir menú"
      >
        {open ? <X size={20} /> : <MoreVertical size={20} />}
      </button>

      {open && (
        <div className="top-actions-dropdown">
          <button
            type="button"
            onClick={() => {
              onSearch?.();
              setOpen(false);
            }}
          >
            <Search size={18} />
            Buscar
          </button>

          <button
            type="button"
            onClick={() => {
              onSettings?.();
              setOpen(false);
            }}
          >
            <Settings size={18} />
            Ajustes
          </button>

          <button
            type="button"
            onClick={() => {
              onAccount?.();
              setOpen(false);
            }}
          >
            <User2 size={18} />
            Cuenta
          </button>
        </div>
      )}
    </div>
  );
}