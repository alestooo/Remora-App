import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  CheckSquare2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Clock3,
  Coins,
  Info,
  Target,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import WeeklyChart from "../components/progress/WeeklyChart";
import CategoryStats from "../components/progress/CategoryStats";
import UpcomingTasks from "../components/progress/UpcomingTasks";

import {
  calculateClientTotal,
} from "../utils/currency";

import {
  getTodayDate,
  isDateInRange,
  taskDateTime,
} from "../utils/dates";

import {
  calculateHours,
} from "../utils/taskHelpers";

import {
  PROGRESS_RANGES,
} from "../constants/app";

/* =========================================================
   ALEKEY HELPERS
========================================================= */

const DEFAULT_HOURLY_RATE = 1500;

const getTaskHours = (task) => {
  const savedHours =
    Number(
      task.totalHours ||
        0
    );

  if (savedHours > 0) {
    return savedHours;
  }

  return calculateHours(
    task.workSegments ||
      []
  );
};

const getAlekeyTaskPayment = (
  task
) => {
  const hours =
    getTaskHours(task);

  if (
    task.paymentMode ===
    "fixed"
  ) {
    return Number(
      task.fixedPayment ||
        0
    );
  }

  if (
    !task.paymentMode &&
    Number(
      task.fixedPayment ||
        0
    ) > 0
  ) {
    return Number(
      task.fixedPayment ||
        0
    );
  }

  if (
    task.paymentMode ===
    "hourly-custom"
  ) {
    const customRate =
      Number(
        task.hourlyRate ||
          DEFAULT_HOURLY_RATE
      );

    return Number(
      (
        hours *
        customRate
      ).toFixed(0)
    );
  }

  const rate =
    Number(
      task.hourlyRate ||
        DEFAULT_HOURLY_RATE
    );

  return Number(
    (
      hours *
      rate
    ).toFixed(0)
  );
};

const getPaymentModeLabel = (
  task
) => {
  if (
    task.paymentMode ===
      "fixed" ||
    (
      !task.paymentMode &&
      Number(
        task.fixedPayment ||
          0
      ) > 0
    )
  ) {
    return "Monto fijo";
  }

  if (
    task.paymentMode ===
    "hourly-custom"
  ) {
    return `₡${Number(
      task.hourlyRate ||
        DEFAULT_HOURLY_RATE
    ).toLocaleString(
      "es-CR"
    )}/h`;
  }

  const rate =
    Number(
      task.hourlyRate ||
        DEFAULT_HOURLY_RATE
    );

  return `₡${rate.toLocaleString(
    "es-CR"
  )}/h`;
};

const formatDateLabel = (
  dateValue
) => {
  if (!dateValue) {
    return "Sin fecha";
  }

  const [
    year,
    month,
    day,
  ] = dateValue
    .split("-")
    .map(Number);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateValue;
  }

  const weekday =
    date.toLocaleDateString(
      "es-CR",
      {
        weekday:
          "long",
      }
    );

  const dayNumber =
    date.toLocaleDateString(
      "es-CR",
      {
        day:
          "numeric",
      }
    );

  const monthName =
    date.toLocaleDateString(
      "es-CR",
      {
        month:
          "long",
      }
    );

  return `${weekday} ${dayNumber} ${monthName}`;
};

const capitalize = (
  value
) => {
  if (!value) {
    return "";
  }

  return (
    value
      .charAt(0)
      .toUpperCase() +
    value.slice(1)
  );
};

const getRangeLabel = (
  range
) => {
  return (
    PROGRESS_RANGES.find(
      (item) =>
        item.id ===
        range
    )?.label ||
    "Todo"
  );
};

/* =========================================================
   PAGE
========================================================= */

export default function ProgressPage({
  tasks,
  clients,

  range,
  onRangeChange,

  onDeleteTask,

  showAlert,
  closeAlert,
}) {
  /* =======================================================
     ESTADO HORAS POR DÍA
  ======================================================= */

  const [
    showAllAlekeyDays,
    setShowAllAlekeyDays,
  ] = useState(false);

  const [
    selectionMode,
    setSelectionMode,
  ] = useState(false);

  const [
    selectedTaskIds,
    setSelectedTaskIds,
  ] = useState([]);

  const [
    deletingPaid,
    setDeletingPaid,
  ] = useState(false);

  /*
    Al cambiar Semana / Mes / Todo,
    volvemos al estado limpio.
  */

  useEffect(() => {
    setShowAllAlekeyDays(
      false
    );

    setSelectionMode(
      false
    );

    setSelectedTaskIds(
      []
    );
  }, [range]);

  /* =======================================================
     GENERAL PROGRESS
  ======================================================= */

  const scopedTasks =
    tasks.filter(
      (task) =>
        !task.archived &&
        task.progressActive !==
          false &&
        isDateInRange(
          task.date,
          range
        )
    );

  const completedTasks =
    scopedTasks.filter(
      (task) =>
        task.completed
    );

  const pendingTasks =
    scopedTasks.filter(
      (task) =>
        !task.completed
    );

  const completionPercent =
    scopedTasks.length
      ? Math.round(
          (
            completedTasks.length /
            scopedTasks.length
          ) *
            100
        )
      : 0;

  const categoryStats = [
    "Universidad",
    "Trabajo",
    "Tarea",
    "Recordatorio",
    "Alekey",
  ].map(
    (category) => ({
      category,

      count:
        scopedTasks.filter(
          (task) =>
            task.type ===
            category
        ).length,
    })
  );

  /* =======================================================
     WEEKLY GRAPH
  ======================================================= */

  const today =
    new Date(
      getTodayDate()
    );

  const weeklyStats =
    Array.from({
      length: 7,
    }).map(
      (_, index) => {
        const date =
          new Date(today);

        date.setDate(
          today.getDate() +
            index
        );

        const key = `${
          date.getFullYear()
        }-${String(
          date.getMonth() +
            1
        ).padStart(
          2,
          "0"
        )}-${String(
          date.getDate()
        ).padStart(
          2,
          "0"
        )}`;

        return {
          label:
            date.toLocaleDateString(
              "es-CR",
              {
                weekday:
                  "short",
              }
            ),

          count:
            tasks.filter(
              (task) =>
                task.date ===
                  key &&
                !task.archived
            ).length,
        };
      }
    );

  const maxWeekly =
    Math.max(
      ...weeklyStats.map(
        (item) =>
          item.count
      ),
      1
    );

  /* =======================================================
     UPCOMING
  ======================================================= */

  const upcoming = [
    ...pendingTasks,
  ]
    .filter(
      (task) =>
        task.date
    )
    .sort(
      (a, b) =>
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
    );

  /* =======================================================
     CLIENTS
  ======================================================= */

  const pendingClients =
    clients.filter(
      (client) =>
        !client.paid
    );

  const pendingClientsTotal =
    pendingClients.reduce(
      (
        sum,
        client
      ) =>
        sum +
        Number(
          client.total ||
            calculateClientTotal(
              client.products
            )
        ),
      0
    );

  /* =======================================================
     ALEKEY
  ======================================================= */

  const allAlekeyWorkerTasks =
    tasks.filter(
      (task) =>
        task.type ===
          "Alekey" &&
        task.alekeyRole ===
          "Trabajador" &&
        !task.archived &&
        task.hoursActive !==
          false
    );

  const alekeyWorkerTasks =
    allAlekeyWorkerTasks.filter(
      (task) =>
        isDateInRange(
          task.date,
          range
        )
    );

  const alekeyTasksOutsideRange =
    allAlekeyWorkerTasks.filter(
      (task) =>
        !isDateInRange(
          task.date,
          range
        )
    );

  const totalAlekeyHours =
    alekeyWorkerTasks.reduce(
      (
        sum,
        task
      ) =>
        sum +
        getTaskHours(
          task
        ),
      0
    );

  const alekeySalaryTotal =
    alekeyWorkerTasks.reduce(
      (
        sum,
        task
      ) =>
        sum +
        getAlekeyTaskPayment(
          task
        ),
      0
    );

  const normalPaymentCount =
    alekeyWorkerTasks.filter(
      (task) =>
        !task.paymentMode ||
        task.paymentMode ===
          "hourly-default"
    ).length;

  const customHourlyCount =
    alekeyWorkerTasks.filter(
      (task) =>
        task.paymentMode ===
        "hourly-custom"
    ).length;

  const fixedPaymentCount =
    alekeyWorkerTasks.filter(
      (task) =>
        task.paymentMode ===
        "fixed"
    ).length;

  /* =======================================================
     AGRUPAR POR DÍA
  ======================================================= */

  const alekeyHoursByDayMap =
    alekeyWorkerTasks.reduce(
      (
        accumulator,
        task
      ) => {
        const key =
          task.date ||
          "Sin fecha";

        if (
          !accumulator[
            key
          ]
        ) {
          accumulator[
            key
          ] = {
            date: key,

            label:
              formatDateLabel(
                key
              ),

            hours: 0,

            total: 0,

            tasks: [],
          };
        }

        const hours =
          getTaskHours(
            task
          );

        const payment =
          getAlekeyTaskPayment(
            task
          );

        accumulator[
          key
        ].hours +=
          hours;

        accumulator[
          key
        ].total +=
          payment;

        accumulator[
          key
        ].tasks.push({
          ...task,

          calculatedHours:
            hours,

          calculatedPayment:
            payment,
        });

        return accumulator;
      },
      {}
    );

  const alekeyHoursByDay =
    Object.values(
      alekeyHoursByDayMap
    ).sort(
      (a, b) => {
        if (
          a.date ===
          "Sin fecha"
        ) {
          return 1;
        }

        if (
          b.date ===
          "Sin fecha"
        ) {
          return -1;
        }

        /*
          Los más recientes primero.
        */

        return b.date.localeCompare(
          a.date
        );
      }
    );

  /* =======================================================
     SOLO 2 DÍAS AL PRINCIPIO
  ======================================================= */

  const visibleAlekeyDays =
    showAllAlekeyDays
      ? alekeyHoursByDay
      : alekeyHoursByDay.slice(
          0,
          2
        );

  const hasMoreAlekeyDays =
    alekeyHoursByDay.length >
    2;

  /* =======================================================
     SELECCIÓN
  ======================================================= */

  const currentAlekeyIds =
    alekeyWorkerTasks
      .map(
        (task) =>
          task.id
      )
      .filter(Boolean);

  const allSelected =
    currentAlekeyIds.length >
      0 &&
    currentAlekeyIds.every(
      (id) =>
        selectedTaskIds.includes(
          id
        )
    );

  const selectedTasks =
    alekeyWorkerTasks.filter(
      (task) =>
        selectedTaskIds.includes(
          task.id
        )
    );

  const selectedHours =
    selectedTasks.reduce(
      (
        sum,
        task
      ) =>
        sum +
        getTaskHours(
          task
        ),
      0
    );

  const selectedPayment =
    selectedTasks.reduce(
      (
        sum,
        task
      ) =>
        sum +
        getAlekeyTaskPayment(
          task
        ),
      0
    );

  const toggleTaskSelection = (
    taskId
  ) => {
    setSelectedTaskIds(
      (current) =>
        current.includes(
          taskId
        )
          ? current.filter(
              (id) =>
                id !==
                taskId
            )
          : [
              ...current,
              taskId,
            ]
    );
  };

  const toggleSelectAll =
    () => {
      if (allSelected) {
        setSelectedTaskIds(
          []
        );

        return;
      }

      setSelectedTaskIds(
        currentAlekeyIds
      );
    };

  const startSelection =
    () => {
      setSelectionMode(
        true
      );

      setSelectedTaskIds(
        []
      );
    };

  const cancelSelection =
    () => {
      setSelectionMode(
        false
      );

      setSelectedTaskIds(
        []
      );
    };

  /* =======================================================
     ELIMINAR JORNADAS PAGADAS
  ======================================================= */

  const confirmDeletePaid =
    () => {
      if (
        selectedTasks.length ===
          0 ||
        deletingPaid
      ) {
        return;
      }

      const count =
        selectedTasks.length;

      showAlert({
        type:
          "danger",

        title:
          count === 1
            ? "Eliminar jornada pagada"
            : "Eliminar jornadas pagadas",

        message:
          `¿Está seguro de que ya se le pagó lo correspondiente? ` +
          `Se eliminarán ${count} ${
            count === 1
              ? "jornada"
              : "jornadas"
          }, ${selectedHours.toFixed(
            2
          )} horas y ₡${selectedPayment.toLocaleString(
            "es-CR"
          )}. ` +
          `Estos registros se eliminarán de Remora y esta acción no se puede deshacer.`,

        confirmText:
          count === 1
            ? "Sí, ya me pagaron"
            : "Sí, ya me pagaron",

        cancelText:
          "Cancelar",

        onConfirm:
          async () => {
            closeAlert();

            setDeletingPaid(
              true
            );

            try {
              await Promise.all(
                selectedTasks.map(
                  (task) =>
                    onDeleteTask(
                      task.id
                    )
                )
              );

              setSelectedTaskIds(
                []
              );

              setSelectionMode(
                false
              );

              /*
                Si al borrar quedan 2 o menos,
                regresamos al modo compacto.
              */

              if (
                alekeyHoursByDay.length <=
                3
              ) {
                setShowAllAlekeyDays(
                  false
                );
              }

              showAlert({
                type:
                  "success",

                title:
                  count === 1
                    ? "Jornada eliminada"
                    : "Jornadas eliminadas",

                message:
                  `Se eliminaron ${count} ${
                    count === 1
                      ? "jornada"
                      : "jornadas"
                  } pagadas correctamente.`,

                confirmText:
                  "Listo",

                onlyConfirm:
                  true,

                onConfirm:
                  closeAlert,
              });
            } catch (
              error
            ) {
              showAlert({
                type:
                  "warning",

                title:
                  "No se pudo eliminar",

                message:
                  error.message ||
                  "Ocurrió un error al eliminar las jornadas seleccionadas.",

                confirmText:
                  "Entendido",

                onlyConfirm:
                  true,

                onConfirm:
                  closeAlert,
              });
            } finally {
              setDeletingPaid(
                false
              );
            }
          },
      });
    };

  return (
    <section className="progress-page">
      {/* =====================================================
          PERIOD FILTER
      ===================================================== */}

      <div className="progress-range-tabs">
        {PROGRESS_RANGES.map(
          (item) => (
            <button
              key={
                item.id
              }
              className={
                range ===
                item.id
                  ? "active"
                  : ""
              }
              onClick={() =>
                onRangeChange(
                  item.id
                )
              }
            >
              {
                item.label
              }
            </button>
          )
        )}
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="progress-summary-grid">
        <div className="progress-summary-card">
          <div className="progress-summary-icon">
            <Target />
          </div>

          <span>
            Completado
          </span>

          <strong>
            {
              completionPercent
            }
            %
          </strong>
        </div>

        <div className="progress-summary-card">
          <div className="progress-summary-icon">
            <CheckCircle2 />
          </div>

          <span>
            Completadas
          </span>

          <strong>
            {
              completedTasks.length
            }
          </strong>
        </div>

        <div className="progress-summary-card">
          <div className="progress-summary-icon">
            <CircleDashed />
          </div>

          <span>
            Pendientes
          </span>

          <strong>
            {
              pendingTasks.length
            }
          </strong>
        </div>
      </div>

      <WeeklyChart
        weeklyStats={
          weeklyStats
        }
        maxWeekly={
          maxWeekly
        }
      />

      <CategoryStats
        items={
          categoryStats
        }
      />

      <UpcomingTasks
        tasks={
          upcoming
        }
      />

      {/* =====================================================
          CLIENTS
      ===================================================== */}

      <div className="progress-card">
        <h2>
          Clientes pendientes
          de pagar
        </h2>

        {pendingClients.length ===
        0 ? (
          <p className="empty-private">
            No hay clientes
            pendientes.
          </p>
        ) : (
          pendingClients.map(
            (client) => (
              <div
                className="next-task"
                key={
                  client.id
                }
              >
                <strong>
                  {
                    client.name
                  }
                </strong>

                <span>
                  ₡
                  {Number(
                    client.total ||
                      calculateClientTotal(
                        client.products
                      )
                  ).toLocaleString(
                    "es-CR"
                  )}
                </span>
              </div>
            )
          )
        )}

        <div className="payment-preview">
          Pendiente total:
          {" "}₡
          {pendingClientsTotal.toLocaleString(
            "es-CR"
          )}
        </div>
      </div>

      {/* =====================================================
          ALEKEY SUMMARY
      ===================================================== */}

      <div className="progress-card alekey-progress-card">
        <div className="alekey-progress-heading">
          <div>
            <span className="progress-eyebrow">
              Alekey
            </span>

            <h2>
              Horas trabajadas
            </h2>

            <p>
              {
                getRangeLabel(
                  range
                )
              }
            </p>
          </div>

          <div className="alekey-progress-heading-icon">
            <BriefcaseBusiness />
          </div>
        </div>

        <div className="alekey-progress-main-grid">
          <div className="alekey-main-stat hours">
            <div className="alekey-main-stat-icon">
              <Clock3 />
            </div>

            <span>
              Horas totales
            </span>

            <strong>
              {totalAlekeyHours.toFixed(
                2
              )}{" "}
              h
            </strong>
          </div>

          <div className="alekey-main-stat money">
            <div className="alekey-main-stat-icon">
              <Coins />
            </div>

            <span>
              Total ganado
            </span>

            <strong>
              ₡
              {alekeySalaryTotal.toLocaleString(
                "es-CR"
              )}
            </strong>
          </div>
        </div>

        <div className="alekey-payment-types">
          <div>
            <strong>
              {
                normalPaymentCount
              }
            </strong>

            <span>
              ₡1.500/h
            </span>
          </div>

          <div>
            <strong>
              {
                customHourlyCount
              }
            </strong>

            <span>
              Pago/h personalizado
            </span>
          </div>

          <div>
            <strong>
              {
                fixedPaymentCount
              }
            </strong>

            <span>
              Monto fijo
            </span>
          </div>
        </div>

        {range !==
          "all" &&
          alekeyTasksOutsideRange.length >
            0 && (
            <div className="alekey-range-notice">
              <Info
                size={19}
              />

              <div>
                <strong>
                  {
                    alekeyTasksOutsideRange.length
                  }{" "}
                  jornada
                  {alekeyTasksOutsideRange.length !==
                  1
                    ? "s"
                    : ""}{" "}
                  fuera de este
                  período
                </strong>

                <p>
                  No se incluyen en
                  los totales de{" "}
                  {getRangeLabel(
                    range
                  ).toLowerCase()}
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onRangeChange(
                    "all"
                  )
                }
              >
                Ver todo
              </button>
            </div>
          )}
      </div>

      {/* =====================================================
          HORAS POR DÍA
      ===================================================== */}

      <div className="progress-card alekey-days-card">
        <div className="alekey-progress-heading">
          <div>
            <span className="progress-eyebrow">
              Detalle
            </span>

            <h2>
              Horas por día
            </h2>

            <p>
              Jornadas y pagos
              registrados
            </p>
          </div>

          <div className="alekey-progress-heading-icon">
            <CalendarDays />
          </div>
        </div>

        {/* =================================================
            CONTROLES DE SELECCIÓN
        ================================================= */}

        {alekeyWorkerTasks.length >
          0 && (
          <div className="alekey-days-selection-bar">
            {!selectionMode ? (
              <button
                type="button"
                className="alekey-selection-start-btn"
                onClick={
                  startSelection
                }
              >
                <CheckSquare2
                  size={17}
                />

                Seleccionar
              </button>
            ) : (
              <>
                <div className="alekey-selection-count">
                  <strong>
                    {
                      selectedTaskIds.length
                    }
                  </strong>

                  <span>
                    {selectedTaskIds.length ===
                    1
                      ? "seleccionada"
                      : "seleccionadas"}
                  </span>
                </div>

                <button
                  type="button"
                  className="alekey-select-all-btn"
                  onClick={
                    toggleSelectAll
                  }
                >
                  <CheckSquare2
                    size={17}
                  />

                  {allSelected
                    ? "Quitar selección"
                    : "Seleccionar todas"}
                </button>

                <button
                  type="button"
                  className="alekey-delete-paid-btn"
                  onClick={
                    confirmDeletePaid
                  }
                  disabled={
                    selectedTaskIds.length ===
                      0 ||
                    deletingPaid
                  }
                >
                  <Trash2
                    size={17}
                  />

                  {deletingPaid
                    ? "Eliminando..."
                    : "Eliminar pagadas"}
                </button>

                <button
                  type="button"
                  className="alekey-selection-cancel-btn"
                  onClick={
                    cancelSelection
                  }
                  disabled={
                    deletingPaid
                  }
                >
                  <X
                    size={17}
                  />

                  Cancelar
                </button>
              </>
            )}
          </div>
        )}

        {/* =================================================
            RESUMEN DE LO SELECCIONADO
        ================================================= */}

        {selectionMode &&
          selectedTasks.length >
            0 && (
          <div className="alekey-selected-summary">
            <div>
              <span>
                Jornadas
              </span>

              <strong>
                {
                  selectedTasks.length
                }
              </strong>
            </div>

            <div>
              <span>
                Horas
              </span>

              <strong>
                {selectedHours.toFixed(
                  2
                )}{" "}
                h
              </strong>
            </div>

            <div>
              <span>
                Total
              </span>

              <strong>
                ₡
                {selectedPayment.toLocaleString(
                  "es-CR"
                )}
              </strong>
            </div>
          </div>
        )}

        {alekeyHoursByDay.length ===
        0 ? (
          <div className="alekey-empty-hours">
            <Clock3
              size={28}
            />

            <strong>
              No hay jornadas
              registradas
            </strong>

            <p>
              No existen horas de
              Alekey dentro de este
              período.
            </p>
          </div>
        ) : (
          <>
            <div className="alekey-days-grid">
              {visibleAlekeyDays.map(
                (day) => (
                  <article
                    className="alekey-day-card"
                    key={
                      day.date
                    }
                  >
                    <div className="alekey-day-header">
                      <div className="alekey-day-date-icon">
                        <CalendarDays
                          size={19}
                        />
                      </div>

                      <div>
                        <strong>
                          {capitalize(
                            day.label
                          )}
                        </strong>

                        <span>
                          {
                            day.tasks
                              .length
                          }{" "}
                          jornada
                          {day.tasks
                            .length !==
                          1
                            ? "s"
                            : ""}
                        </span>
                      </div>
                    </div>

                    <div className="alekey-day-totals">
                      <div>
                        <span>
                          Horas
                        </span>

                        <strong>
                          {day.hours.toFixed(
                            2
                          )}{" "}
                          h
                        </strong>
                      </div>

                      <div>
                        <span>
                          Ganado
                        </span>

                        <strong>
                          ₡
                          {day.total.toLocaleString(
                            "es-CR"
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="alekey-day-jobs">
                      {day.tasks.map(
                        (
                          task,
                          index
                        ) => {
                          const selected =
                            selectedTaskIds.includes(
                              task.id
                            );

                          return (
                            <div
                              className={`alekey-day-job ${
                                selectionMode
                                  ? "selection-active"
                                  : ""
                              } ${
                                selected
                                  ? "selected"
                                  : ""
                              }`}
                              key={
                                task.id ||
                                `${day.date}-${index}`
                              }
                            >
                              {selectionMode && (
                                <button
                                  type="button"
                                  className={`alekey-select-check ${
                                    selected
                                      ? "selected"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    toggleTaskSelection(
                                      task.id
                                    )
                                  }
                                  aria-label={
                                    selected
                                      ? "Quitar selección"
                                      : "Seleccionar jornada"
                                  }
                                  aria-pressed={
                                    selected
                                  }
                                >
                                  {selected && (
                                    <Check
                                      size={17}
                                    />
                                  )}
                                </button>
                              )}

                              <div className="alekey-day-job-copy">
                                <strong>
                                  {task.title ||
                                    "Horas laborales"}
                                </strong>

                                <span>
                                  {getPaymentModeLabel(
                                    task
                                  )}
                                </span>
                              </div>

                              <div className="alekey-day-job-values">
                                <strong>
                                  {task.calculatedHours.toFixed(
                                    2
                                  )}{" "}
                                  h
                                </strong>

                                <span>
                                  ₡
                                  {task.calculatedPayment.toLocaleString(
                                    "es-CR"
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </article>
                )
              )}
            </div>

            {/* =============================================
                VER TODAS / MINIMIZAR

                Solo aparece si existen más de 2 días.
            ============================================= */}

            {hasMoreAlekeyDays && (
              <button
                type="button"
                className="alekey-days-expand-btn"
                onClick={() =>
                  setShowAllAlekeyDays(
                    (current) =>
                      !current
                  )
                }
              >
                {showAllAlekeyDays ? (
                  <>
                    <ChevronUp
                      size={18}
                    />

                    Minimizar
                  </>
                ) : (
                  <>
                    <ChevronDown
                      size={18}
                    />

                    Ver todas (
                    {
                      alekeyHoursByDay.length
                    }
                    )
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}