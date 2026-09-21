import {
  motion,
} from "framer-motion";

import {
  Archive,
  CheckCircle2,
} from "lucide-react";

export default function TaskCard({
  task,
  getCover,
  isExpired,
  onOpen,
}) {
  const isAlekeyWorker =
    task.type === "Alekey" &&
    task.alekeyRole ===
      "Trabajador";

  const priority =
    isAlekeyWorker
      ? ""
      : (
          task.priority ||
          "Media"
        ).toLowerCase();

  return (
    <motion.div
      layoutId={`task-${task.id}`}
      whileHover={{
        scale: 1.01,
      }}
      whileTap={{
        scale: 0.98,
      }}
      className={`
        task-card
        ${priority}
        ${
          isExpired(task)
            ? "expired"
            : ""
        }
        ${
          task.completed
            ? "completed"
            : ""
        }
        ${
          task.archived
            ? "archived"
            : ""
        }
      `}
      onClick={() =>
        onOpen(task)
      }
    >
      <img
        className="task-cover"
        src={getCover(task)}
        alt={task.title}
      />

      <div className="task-body">
        <h3>
          {task.title}
        </h3>

        {task.type ===
          "Universidad" &&
        task.course ? (
          <p>
            {task.course}
          </p>
        ) : task.type ===
          "Alekey" ? (
          <p>
            Alekey ·{" "}
            {
              task.alekeyRole
            }
          </p>
        ) : (
          <p>
            {task.type}
          </p>
        )}

        <small>
          📅{" "}
          {task.date ||
            "Sin fecha"}

          {!isAlekeyWorker &&
            ` · ${
              task.time ||
              "Sin hora"
            }`}
        </small>

        {task.completed && (
          <span className="completed-label">
            <CheckCircle2
              size={13}
            />

            Completada
          </span>
        )}

        {task.archived && (
          <span className="archived-label">
            <Archive
              size={13}
            />

            Archivada
          </span>
        )}

        {!task.completed &&
          !task.archived &&
          isExpired(task) && (
            <span className="expired-label">
              Vencida
            </span>
          )}

        {!isAlekeyWorker && (
          <span
            className={`priority ${priority}`}
          >
            {task.priority ||
              "Media"}
          </span>
        )}
      </div>
    </motion.div>
  );
}