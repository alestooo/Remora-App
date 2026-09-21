import {
  LogOut,
  MoreHorizontal,
  Search,
  Settings,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

export default function HeaderActions({
  user,
  onSearch,
  onSettings,
  onLogout,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const menuRef = useRef(null);

  /* =========================================================
     CERRAR MENÚ AL TOCAR FUERA
  ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "touchstart",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "touchstart",
        handleOutsideClick
      );
    };
  }, []);

  /* =========================================================
     CERRAR CON ESC
  ========================================================= */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, []);

  const handleSearch = () => {
    setMobileMenuOpen(false);
    onSearch();
  };

  const handleSettings = () => {
    setMobileMenuOpen(false);
    onSettings();
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    onLogout();
  };

  return (
    <>
      {/* =====================================================
          PC
      ===================================================== */}

      <div className="desktop-header-actions">
        {/* Buscar arriba / Ajustes abajo */}

        <div className="desktop-header-icon-stack">
          <button
            type="button"
            className="header-square-action"
            onClick={onSearch}
            title="Buscar (Ctrl + K)"
            aria-label="Buscar"
          >
            <Search size={19} />
          </button>

          <button
            type="button"
            className="header-square-action"
            onClick={onSettings}
            title="Ajustes"
            aria-label="Ajustes"
          >
            <Settings size={19} />
          </button>
        </div>

        {/* Usuario a la derecha */}

        <div className="desktop-user-profile">
          <img
            src={
              user?.photoURL ||
              "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            }
            alt={
              user?.displayName ||
              "Usuario"
            }
            referrerPolicy="no-referrer"
          />

          <div className="desktop-user-info">
            <strong>
              {user?.displayName ||
                "Usuario"}
            </strong>

            <button
              type="button"
              onClick={onLogout}
            >
              <LogOut size={16} />

              <span>
                Salir
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          MÓVIL
      ===================================================== */}

      <div
        className="mobile-floating-menu"
        ref={menuRef}
      >
        {/* Botón flotante */}

        <button
          type="button"
          className={`mobile-menu-trigger ${
            mobileMenuOpen
              ? "open"
              : ""
          }`}
          onClick={() =>
            setMobileMenuOpen(
              (current) =>
                !current
            )
          }
          aria-label={
            mobileMenuOpen
              ? "Cerrar menú"
              : "Abrir menú"
          }
          aria-expanded={
            mobileMenuOpen
          }
        >
          {mobileMenuOpen ? (
            <X size={21} />
          ) : (
            <MoreHorizontal
              size={23}
            />
          )}
        </button>

        {/* Panel desplegable */}

        {mobileMenuOpen && (
          <div className="mobile-menu-panel">
            {/* Buscar */}

            <button
              type="button"
              className="mobile-menu-option"
              onClick={handleSearch}
            >
              <div className="mobile-menu-option-icon">
                <Search
                  size={19}
                />
              </div>

              <span>
                Buscar
              </span>
            </button>

            {/* Usuario / salir */}

            <button
              type="button"
              className="mobile-menu-option mobile-account-option"
              onClick={handleLogout}
            >
              <div className="mobile-account-photo">
                <img
                  src={
                    user?.photoURL ||
                    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                  }
                  alt=""
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="mobile-account-text">
                <strong>
                  {user?.displayName ||
                    "Usuario"}
                </strong>

                <span>
                  Salir
                </span>
              </div>

              <LogOut
                className="mobile-account-logout-icon"
                size={17}
              />
            </button>

            {/* Ajustes */}

            <button
              type="button"
              className="mobile-menu-option"
              onClick={
                handleSettings
              }
            >
              <div className="mobile-menu-option-icon">
                <Settings
                  size={19}
                />
              </div>

              <span>
                Ajustes
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}