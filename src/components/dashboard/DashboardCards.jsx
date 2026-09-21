import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  ListChecks,
  Settings2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  formatRelativeTaskDate,
  isTaskToday,
  taskDateTime,
} from "../../utils/dates";

const CARD_ICONS = {
  today: CalendarDays,
  next: Clock3,
  pending: ListChecks,
};

export default function DashboardCards({
  tasks,
  dashboardCards,
  onOpenSettings,
  onSelectScope,
  onOpenTask,
}) {
  /* =========================================================
     RESUMEN ABIERTO / CERRADO

     PC:
     abierto por defecto.

     MÓVIL:
     cerrado por defecto.
  ========================================================= */

  const [
    summaryOpen,
    setSummaryOpen,
  ] = useState(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return true;
    }

    return !window
      .matchMedia(
        "(max-width: 800px)"
      )
      .matches;
  });

  /* =========================================================
     DETECTAR CAMBIO ENTRE PC Y MÓVIL
  ========================================================= */

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return undefined;
    }

    const mediaQuery =
      window.matchMedia(
        "(max-width: 800px)"
      );

    const handleBreakpointChange =
      (event) => {
        /*
          Si pasamos a PC:
          abierto.

          Si pasamos a móvil:
          cerrado.
        */

        setSummaryOpen(
          !event.matches
        );
      };

    mediaQuery.addEventListener(
      "change",
      handleBreakpointChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleBreakpointChange
      );
    };
  }, []);

  /* =========================================================
     ACTIVIDADES PENDIENTES
  ========================================================= */

  const pending =
    tasks.filter(
      (task) =>
        !task.completed &&
        !task.archived
    );

  /* =========================================================
     ACTIVIDADES DE HOY
  ========================================================= */

  const today =
    pending.filter(
      isTaskToday
    );

  /* =========================================================
     PRÓXIMA ENTREGA
  ========================================================= */

  const nextTask =
    [...pending]
      .filter(
        (task) =>
          task.date
      )
      .sort(
        (
          a,
          b
        ) =>
          (
            taskDateTime(
              a
            )?.getTime() ||
            Infinity
          ) -
          (
            taskDateTime(
              b
            )?.getTime() ||
            Infinity
          )
      )
      .find(
        (task) =>
          (
            taskDateTime(
              task
            )?.getTime() ||
            0
          ) >=
          Date.now()
      ) ||
    null;

  /* =========================================================
     DATOS DE LAS 3 TARJETAS
  ========================================================= */

  const values = {
    today: {
      label:
        "Hoy",

      value:
        today.length,

      text:
        today.length === 1
          ? "1 actividad para hoy"
          : `${today.length} actividades para hoy`,

      action: () =>
        onSelectScope(
          "today"
        ),
    },

    next: {
      label:
        "Próxima entrega",

      value:
        nextTask
          ? formatRelativeTaskDate(
              nextTask
            )
          : "—",

      text:
        nextTask
          ? nextTask.title
          : "No hay próximas entregas",

      action: () =>
        nextTask &&
        onOpenTask(
          nextTask
        ),
    },

    pending: {
      label:
        "Pendientes",

      value:
        pending.length,

      text:
        pending.length === 1
          ? "1 actividad pendiente"
          : `${pending.length} actividades pendientes`,

      action: () =>
        onSelectScope(
          "pending"
        ),
    },
  };

  /* =========================================================
     TARJETAS QUE EL USUARIO DECIDIÓ MOSTRAR
  ========================================================= */

  const visibleCards =
    (
      dashboardCards ||
      []
    ).filter(
      (card) =>
        card.visible !==
        false
    );

  return (
    <section className="dashboard-section">
      {/* =====================================================
          ENCABEZADO
      ===================================================== */}

      <div className="dashboard-section-heading">
        <div className="dashboard-heading-copy">
          <h2>
            Resumen
          </h2>

          <p>
            Decide qué información quieres ver primero.
          </p>
        </div>

        {/* ===================================================
            PERSONALIZAR EN PC

            En móvil este botón desaparece
            y aparece dentro del resumen
            cuando se abre.
        =================================================== */}

        <button
          type="button"
          className="
            dashboard-settings-btn
            dashboard-settings-desktop
          "
          onClick={
            onOpenSettings
          }
        >
          <Settings2
            size={18}
          />

          Personalizar
        </button>
      </div>

      {/* =====================================================
          ABRIR / MINIMIZAR

          SOLO MÓVIL
      ===================================================== */}

      <button
        type="button"
        className={`dashboard-summary-toggle ${
          summaryOpen
            ? "open"
            : ""
        }`}
        onClick={() =>
          setSummaryOpen(
            (
              current
            ) =>
              !current
          )
        }
        aria-expanded={
          summaryOpen
        }
      >
        <span>
          {summaryOpen
            ? "Minimizar resumen"
            : "Ver resumen"}
        </span>

        <ChevronDown
          size={18}
          className="dashboard-summary-chevron"
        />
      </button>

      {/* =====================================================
          CONTENIDO COLAPSABLE
      ===================================================== */}

      {summaryOpen && (
        <div className="dashboard-summary-content">
          {/* =================================================
              PERSONALIZAR MÓVIL
          ================================================= */}

          <button
            type="button"
            className="
              dashboard-settings-btn
              dashboard-settings-mobile
            "
            onClick={
              onOpenSettings
            }
          >
            <Settings2
              size={18}
            />

            Personalizar
          </button>

          {/* =================================================
              SI OCULTÓ TODAS LAS TARJETAS
          ================================================= */}

          {visibleCards.length ===
          0 ? (
            <div className="dashboard-hidden-state">
              <span>
                Ocultaste todas las tarjetas rápidas.
              </span>

              <button
                type="button"
                onClick={
                  onOpenSettings
                }
              >
                <Settings2
                  size={17}
                />

                Personalizar
              </button>
            </div>
          ) : (
            /* ===============================================
               TARJETAS
            =============================================== */

            <div className="dashboard-cards-grid">
              {visibleCards.map(
                (
                  config
                ) => {
                  const card =
                    values[
                      config.id
                    ];

                  if (
                    !card
                  ) {
                    return null;
                  }

                  const Icon =
                    CARD_ICONS[
                      config.id
                    ] ||
                    ListChecks;

                  return (
                    <button
                      key={
                        config.id
                      }
                      type="button"
                      className={`dashboard-card dashboard-${config.id}`}
                      onClick={
                        card.action
                      }
                    >
                      <div className="dashboard-card-icon">
                        <Icon />
                      </div>

                      <div className="dashboard-card-content">
                        <span>
                          {
                            card.label
                          }
                        </span>

                        <strong>
                          {
                            card.value
                          }
                        </strong>

                        <small>
                          {
                            card.text
                          }
                        </small>
                      </div>

                      <ChevronRight
                        className="dashboard-card-arrow"
                        size={19}
                      />
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}