import {
  motion,
} from "framer-motion";

import {
  Archive,
  ArchiveRestore,
  BadgeCheck,
  BadgeX,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import TaskChecklist from "./TaskChecklist";

import TaskResources from "./TaskResources";

export default function TaskDetail({
  task,
  showForm,
  getCover,
  isExpired,
  getPayment,
  onClose,
  onToggleProgress,
  onToggleHours,
  onToggleChecklist,
  onToggleCompleted,
  onToggleArchived,
  onEdit,
  onDelete,
}) {
  if (
    !task ||
    showForm
  ) {
    return null;
  }

  const isAlekeyWorker =
    task.type === "Alekey" &&
    task.alekeyRole ===
      "Trabajador";

  const paymentMode =
    task.paymentMode ||
    (
      task.fixedPayment
        ? "fixed"
        : "hourly-default"
    );

  const paymentLabel =
    paymentMode ===
    "fixed"
      ? `Monto fijo: ₡${Number(
          task.fixedPayment ||
            0
        ).toLocaleString(
          "es-CR"
        )}`
      : `Pago por hora: ₡${Number(
          task.hourlyRate ||
            1500
        ).toLocaleString(
          "es-CR"
        )}`;

  return (
    <motion.div
      className="overlay"
      onClick={
        onClose
      }
    >
      <motion.div
        layoutId={`task-${task.id}`}
        className="detail-card"
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        <button
          className="close-btn"
          onClick={
            onClose
          }
        >
          <X />
        </button>

        <img
          className="detail-cover"
          src={
            getCover(task)
          }
          alt={
            task.title
          }
        />

        <div className="task-state-row">
          {!isAlekeyWorker && (
            <span
              className={`priority ${
                (
                  task.priority ||
                  "Media"
                ).toLowerCase()
              }`}
            >
              {task.priority ||
                "Media"}
            </span>
          )}

          {task.completed && (
            <span className="completed-label">
              <CheckCircle2
                size={14}
              />

              Completada
            </span>
          )}

          {task.archived && (
            <span className="archived-label">
              <Archive
                size={14}
              />

              Archivada
            </span>
          )}

          {!task.completed &&
            !task.archived &&
            isExpired(
              task
            ) && (
              <span className="expired-label">
                Vencida
              </span>
            )}
        </div>

        <h2>
          {task.title}
        </h2>

        <div className="task-main-state-actions">
          <button
            className={`task-complete-btn ${
              task.completed
                ? "done"
                : ""
            }`}
            onClick={() =>
              onToggleCompleted(
                task
              )
            }
          >
            {task.completed ? (
              <CheckCircle2
                size={18}
              />
            ) : (
              <Circle
                size={18}
              />
            )}

            {task.completed
              ? "Reabrir actividad"
              : "Marcar como completada"}
          </button>

          <button
            className="task-archive-btn"
            onClick={() =>
              onToggleArchived(
                task
              )
            }
          >
            {task.archived ? (
              <ArchiveRestore
                size={18}
              />
            ) : (
              <Archive
                size={18}
              />
            )}

            {task.archived
              ? "Sacar del archivo"
              : "Archivar"}
          </button>
        </div>

        <div className="task-progress-toggle">
          <button
            className={`client-check ${
              task.progressActive ===
              false
                ? ""
                : "paid"
            }`}
            onClick={() =>
              onToggleProgress(
                task
              )
            }
          >
            {task.progressActive ===
            false ? (
              <BadgeX />
            ) : (
              <BadgeCheck />
            )}
          </button>

          <p className="progress-toggle-text">
            {task.progressActive ===
            false
              ? "No aparece en Progreso."
              : "Sí aparece en Progreso."}
          </p>
        </div>

        <p className="type">
          {task.type}
        </p>

        {task.type ===
          "Universidad" &&
          task.course && (
            <p className="course-name">
              {
                task.course
              }
            </p>
          )}

        {task.type ===
          "Alekey" && (
          <div className="alekey-detail">
            <p>
              <strong>
                Rol:
              </strong>{" "}
              {
                task.alekeyRole
              }
            </p>

            {isAlekeyWorker && (
              <>
                <h3>
                  Jornada
                </h3>

                {task.workSegments?.map(
                  (
                    segment,
                    index
                  ) => (
                    <p
                      key={
                        index
                      }
                    >
                      Horario{" "}
                      {index +
                        1}
                      :{" "}
                      {segment.start ||
                        "--:--"}{" "}
                      -{" "}
                      {segment.end ||
                        "--:--"}
                    </p>
                  )
                )}

                <p>
                  <strong>
                    Horas
                    totales:
                  </strong>{" "}
                  {task.totalHours ||
                    "0"}{" "}
                  horas
                </p>

                <p>
                  <strong>
                    {
                      paymentLabel
                    }
                  </strong>
                </p>

                <p>
                  <strong>
                    Total:
                  </strong>{" "}
                  ₡
                  {getPayment(
                    task
                  ).toLocaleString(
                    "es-CR"
                  )}
                </p>

                <div className="task-progress-toggle">
                  <button
                    className={`client-check ${
                      task.hoursActive ===
                      false
                        ? ""
                        : "paid"
                    }`}
                    onClick={() =>
                      onToggleHours(
                        task
                      )
                    }
                  >
                    {task.hoursActive ===
                    false ? (
                      <BadgeX />
                    ) : (
                      <BadgeCheck />
                    )}
                  </button>

                  <p className="progress-toggle-text">
                    {task.hoursActive ===
                    false
                      ? "Estas horas no cuentan en Progreso."
                      : "Estas horas sí cuentan en Progreso."}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <div className="date-box">
          📅{" "}
          {task.date ||
            "Sin fecha"}

          {!isAlekeyWorker &&
            ` · ${
              task.time ||
              "Sin hora"
            }`}
        </div>

        <p>
          {
            task.description
          }
        </p>

        {!isAlekeyWorker && (
          <TaskResources
            driveFolderUrl={
              task.driveFolderUrl
            }
            resources={
              task.resources
            }
          />
        )}

        <TaskChecklist
          checklist={
            task.checklist
          }
          onToggle={(
            index
          ) =>
            onToggleChecklist(
              task,
              index
            )
          }
        />

        <div className="detail-actions">
          <button
            className="edit-btn"
            onClick={() =>
              onEdit(task)
            }
          >
            <Pencil
              size={18}
            />

            Editar
          </button>

          <button
            className="delete-btn"
            onClick={() =>
              onDelete(
                task.id
              )
            }
          >
            <Trash2
              size={18}
            />

            Eliminar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}