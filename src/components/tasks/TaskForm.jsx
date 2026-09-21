import { Save } from "lucide-react";

import {
  UNIVERSITY_COURSES,
  DEFAULT_UNIVERSITY_COURSE,
} from "../../constants/app";

import { getAutoPriority } from "../../utils/priorities";

const LABOR_TITLE = "Horas laborales";
const LABOR_DESCRIPTION = "Horas laborales";
const DEFAULT_HOURLY_RATE = "1500";

const formatLaborDate = (dateValue) => {
  if (!dateValue) return "";

  const [year, month, day] = dateValue
    .split("-")
    .map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const weekday =
    date.toLocaleDateString(
      "es-CR",
      {
        weekday: "long",
      }
    );

  const dayNumber =
    date.toLocaleDateString(
      "es-CR",
      {
        day: "numeric",
      }
    );

  const monthName =
    date.toLocaleDateString(
      "es-CR",
      {
        month: "long",
      }
    );

  return `${weekday} ${dayNumber} ${monthName}`;
};

const buildLaborTitle = (
  dateValue
) => {
  const formattedDate =
    formatLaborDate(dateValue);

  return formattedDate
    ? `${LABOR_TITLE} - ${formattedDate}`
    : LABOR_TITLE;
};

const isAutomaticLaborTitle = (
  title
) => {
  const normalized =
    (title || "").trim();

  return (
    !normalized ||
    normalized ===
      LABOR_TITLE ||
    normalized.startsWith(
      `${LABOR_TITLE} - `
    )
  );
};

export default function TaskForm({
  form,
  setForm,
  errors,
  editing,
  updateSegment,
  removeSegment,
  addSegment,
  updateResource,
  removeResource,
  addResource,
  saveTask,
}) {
  const isAlekeyWorker =
    form.type === "Alekey" &&
    form.alekeyRole ===
      "Trabajador";

  const totalHours =
    Number(
      form.totalHours || 0
    );

  const hourlyRate =
    Number(
      form.hourlyRate ||
        DEFAULT_HOURLY_RATE
    );

  const fixedPayment =
    Number(
      form.fixedPayment || 0
    );

  const paymentTotal =
    form.paymentMode ===
    "fixed"
      ? fixedPayment
      : totalHours *
        hourlyRate;

  const handleTypeChange = (
    newType
  ) => {
    const nextRole =
      newType === "Alekey"
        ? form.alekeyRole
        : "Encargado";

    const nextIsWorker =
      newType === "Alekey" &&
      nextRole ===
        "Trabajador";

    setForm({
      ...form,

      type:
        newType,

      course:
        newType ===
        "Universidad"
          ? form.course ||
            DEFAULT_UNIVERSITY_COURSE
          : "",

      alekeyRole:
        nextRole,

      title:
        nextIsWorker &&
        isAutomaticLaborTitle(
          form.title
        )
          ? buildLaborTitle(
              form.date
            )
          : form.title,

      description:
        nextIsWorker
          ? LABOR_DESCRIPTION
          : form.description ===
              LABOR_DESCRIPTION
            ? ""
            : form.description,

      hourlyRate:
        form.hourlyRate ||
        DEFAULT_HOURLY_RATE,

      paymentMode:
        form.paymentMode ||
        "hourly-default",

      fixedPayment:
        form.fixedPayment ||
        "",
    });
  };

  const handleAlekeyRoleChange = (
    newRole
  ) => {
    const becomingWorker =
      newRole ===
      "Trabajador";

    setForm({
      ...form,

      alekeyRole:
        newRole,

      title:
        becomingWorker &&
        isAutomaticLaborTitle(
          form.title
        )
          ? buildLaborTitle(
              form.date
            )
          : !becomingWorker &&
              isAutomaticLaborTitle(
                form.title
              )
            ? ""
            : form.title,

      description:
        becomingWorker
          ? LABOR_DESCRIPTION
          : form.description ===
              LABOR_DESCRIPTION
            ? ""
            : form.description,

      hourlyRate:
        form.hourlyRate ||
        DEFAULT_HOURLY_RATE,

      paymentMode:
        becomingWorker
          ? form.paymentMode ||
            "hourly-default"
          : form.paymentMode,

      fixedPayment:
        form.fixedPayment ||
        "",
    });
  };

  const handleDateChange = (
    dateValue
  ) => {
    const shouldUpdateTitle =
      isAlekeyWorker &&
      isAutomaticLaborTitle(
        form.title
      );

    setForm({
      ...form,

      date:
        dateValue,

      title:
        shouldUpdateTitle
          ? buildLaborTitle(
              dateValue
            )
          : form.title,

      priority:
        isAlekeyWorker
          ? form.priority
          : getAutoPriority(
              dateValue
            ),
    });
  };

  const handlePaymentModeChange = (
    paymentMode
  ) => {
    setForm({
      ...form,

      paymentMode,

      hourlyRate:
        paymentMode ===
        "hourly-default"
          ? DEFAULT_HOURLY_RATE
          : form.hourlyRate ||
            DEFAULT_HOURLY_RATE,

      fixedPayment:
        paymentMode ===
        "fixed"
          ? form.fixedPayment
          : "",
    });
  };

  return (
    <>
      <h2>
        {editing
          ? "Editar actividad"
          : "Nueva actividad"}
      </h2>

      <input
        placeholder="Título"
        value={form.title}
        onChange={(
          event
        ) =>
          setForm({
            ...form,

            title:
              event.target
                .value,
          })
        }
      />

      {errors.title && (
        <span className="field-error">
          {errors.title}
        </span>
      )}

      <select
        value={form.type}
        onChange={(
          event
        ) =>
          handleTypeChange(
            event.target.value
          )
        }
      >
        <option>
          Universidad
        </option>

        <option>
          Trabajo
        </option>

        <option>
          Tarea
        </option>

        <option>
          Recordatorio
        </option>

        <option>
          Alekey
        </option>
      </select>

      {form.type ===
        "Universidad" && (
        <select
          value={form.course}
          onChange={(
            event
          ) =>
            setForm({
              ...form,

              course:
                event.target
                  .value,
            })
          }
        >
          {UNIVERSITY_COURSES.map(
            (course) => (
              <option
                key={
                  course
                }
              >
                {course}
              </option>
            )
          )}
        </select>
      )}

      {form.type ===
        "Alekey" && (
        <select
          value={
            form.alekeyRole
          }
          onChange={(
            event
          ) =>
            handleAlekeyRoleChange(
              event.target
                .value
            )
          }
        >
          <option>
            Encargado
          </option>

          <option>
            Trabajador
          </option>
        </select>
      )}

      {isAlekeyWorker ? (
        <textarea
          aria-label="Descripción"
          value={
            LABOR_DESCRIPTION
          }
          readOnly
        />
      ) : (
        <textarea
          placeholder="Descripción"
          value={
            form.description
          }
          onChange={(
            event
          ) =>
            setForm({
              ...form,

              description:
                event.target
                  .value,
            })
          }
        />
      )}

      {errors.description && (
        <span className="field-error">
          {
            errors.description
          }
        </span>
      )}

      <input
        type="date"
        value={form.date}
        onChange={(
          event
        ) =>
          handleDateChange(
            event.target.value
          )
        }
      />

      {errors.date && (
        <span className="field-error">
          {errors.date}
        </span>
      )}

      {isAlekeyWorker ? (
        <>
          <h3 className="form-section-title">
            Horas de trabajo
          </h3>

          {form.workSegments.map(
            (
              segment,
              index
            ) => (
              <div
                className="work-segment"
                key={index}
              >
                <input
                  type="time"
                  value={
                    segment.start
                  }
                  aria-label={`Entrada ${
                    index + 1
                  }`}
                  onChange={(
                    event
                  ) =>
                    updateSegment(
                      index,
                      "start",
                      event
                        .target
                        .value
                    )
                  }
                />

                <input
                  type="time"
                  value={
                    segment.end
                  }
                  aria-label={`Salida ${
                    index + 1
                  }`}
                  onChange={(
                    event
                  ) =>
                    updateSegment(
                      index,
                      "end",
                      event
                        .target
                        .value
                    )
                  }
                />

                {form
                  .workSegments
                  .length >
                  1 && (
                  <button
                    type="button"
                    onClick={() =>
                      removeSegment(
                        index
                      )
                    }
                  >
                    Quitar
                  </button>
                )}
              </div>
            )
          )}

          {form.workSegments
            .length < 5 && (
            <button
              type="button"
              className="add-segment-btn"
              onClick={
                addSegment
              }
            >
              + Agregar
              horario (
              {
                form
                  .workSegments
                  .length
              }
              /5)
            </button>
          )}

          {errors.workSegments && (
            <span className="field-error">
              {
                errors.workSegments
              }
            </span>
          )}

          <input
            aria-label="Horas totales"
            value={
              form.totalHours ||
              "0"
            }
            readOnly
            placeholder="Horas totales"
          />

          <h3 className="form-section-title">
            Forma de pago
          </h3>

          <select
            value={
              form.paymentMode ||
              "hourly-default"
            }
            onChange={(
              event
            ) =>
              handlePaymentModeChange(
                event.target
                  .value
              )
            }
          >
            <option value="hourly-default">
              ₡1.500 por hora
              (normal)
            </option>

            <option value="hourly-custom">
              Cambiar monto por
              hora
            </option>

            <option value="fixed">
              Monto fijo por
              toda la jornada
            </option>
          </select>

          {form.paymentMode ===
            "hourly-custom" && (
            <input
              type="number"
              min="0"
              step="100"
              placeholder="Monto por hora"
              value={
                form.hourlyRate
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,

                  hourlyRate:
                    event.target
                      .value,
                })
              }
            />
          )}

          {form.paymentMode ===
            "fixed" && (
            <input
              type="number"
              min="0"
              step="100"
              placeholder="Monto total de la jornada"
              value={
                form.fixedPayment ||
                ""
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,

                  fixedPayment:
                    event.target
                      .value,
                })
              }
            />
          )}

          {errors.payment && (
            <span className="field-error">
              {
                errors.payment
              }
            </span>
          )}

          <div className="payment-preview">
            <strong>
              Horas
              calculadas:
            </strong>{" "}
            {totalHours.toFixed(
              2
            )}{" "}
            h

            <br />

            <strong>
              Total:
            </strong>{" "}
            ₡
            {Math.round(
              paymentTotal
            ).toLocaleString(
              "es-CR"
            )}
          </div>
        </>
      ) : (
        <>
          <input
            type="time"
            value={
              form.time
            }
            onChange={(
              event
            ) =>
              setForm({
                ...form,

                time:
                  event.target
                    .value,
              })
            }
          />

          {errors.time && (
            <span className="field-error">
              {errors.time}
            </span>
          )}
        </>
      )}

      {!isAlekeyWorker && (
        <select
          value={
            form.priority
          }
          onChange={(
            event
          ) =>
            setForm({
              ...form,

              priority:
                event.target
                  .value,
            })
          }
        >
          <option>
            Baja
          </option>

          <option>
            Media
          </option>

          <option>
            Alta
          </option>

          <option>
            Inminente
          </option>
        </select>
      )}

      <textarea
        placeholder="Checklist, una línea por punto"
        value={
          form.checklist
        }
        onChange={(
          event
        ) =>
          setForm({
            ...form,

            checklist:
              event.target
                .value,
          })
        }
      />

      {!isAlekeyWorker && (
        <>
          <input
            placeholder="Link de carpeta Drive principal (opcional)"
            value={
              form.driveFolderUrl
            }
            onChange={(
              event
            ) =>
              setForm({
                ...form,

                driveFolderUrl:
                  event.target
                    .value,
              })
            }
          />

          <h3 className="form-section-title">
            Links de
            recursos
          </h3>

          {form.resources.map(
            (
              resource,
              index
            ) => (
              <div
                className="resource-box"
                key={index}
              >
                <input
                  placeholder="Nombre del recurso"
                  value={
                    resource.name
                  }
                  onChange={(
                    event
                  ) =>
                    updateResource(
                      index,
                      "name",
                      event
                        .target
                        .value
                    )
                  }
                />

                <input
                  placeholder="Link de Google Drive, OneDrive, Moodle..."
                  value={
                    resource.url
                  }
                  onChange={(
                    event
                  ) =>
                    updateResource(
                      index,
                      "url",
                      event
                        .target
                        .value
                    )
                  }
                />

                <select
                  value={
                    resource.type
                  }
                  onChange={(
                    event
                  ) =>
                    updateResource(
                      index,
                      "type",
                      event
                        .target
                        .value
                    )
                  }
                >
                  <option>
                    PDF
                  </option>

                  <option>
                    DOCX
                  </option>

                  <option>
                    XLSX
                  </option>

                  <option>
                    TXT
                  </option>

                  <option>
                    Drive
                  </option>

                  <option>
                    Otro
                  </option>
                </select>

                {form.resources
                  .length >
                  1 && (
                  <button
                    type="button"
                    className="remove-resource-btn"
                    onClick={() =>
                      removeResource(
                        index
                      )
                    }
                  >
                    Quitar
                  </button>
                )}
              </div>
            )
          )}

          {form.resources
            .length < 3 && (
            <button
              type="button"
              className="add-segment-btn"
              onClick={
                addResource
              }
            >
              + Agregar otro
              link
            </button>
          )}
        </>
      )}

      <button
        className="save-btn"
        onClick={
          saveTask
        }
      >
        <Save size={18} />

        {editing
          ? "Guardar cambios"
          : "Guardar actividad"}
      </button>
    </>
  );
}