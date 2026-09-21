import {
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_UNIVERSITY_COURSE,
  ITEMS_PER_PAGE,
  UNIVERSITY_COURSES,
} from "../constants/app";

import {
  calculateHours,
} from "../utils/taskHelpers";

import {
  getTodayDate,
  isExpiredTask,
} from "../utils/dates";

const LABOR_TITLE =
  "Horas laborales";

const LABOR_DESCRIPTION =
  "Horas laborales";

const DEFAULT_HOURLY_RATE =
  "1500";

export const EMPTY_TASK_FORM = {
  title: "",

  type: "Universidad",

  course:
    DEFAULT_UNIVERSITY_COURSE,

  alekeyRole:
    "Encargado",

  description: "",

  date: "",

  time: "",

  priority: "Media",

  progressActive: true,

  hoursActive: true,

  checklist: "",

  resources: [
    {
      name: "",
      url: "",
      type: "PDF",
    },
  ],

  driveFolderUrl: "",

  workSegments: [
    {
      start: "",
      end: "",
    },
  ],

  totalHours: "",

  hourlyRate:
    DEFAULT_HOURLY_RATE,

  paymentMode:
    "hourly-default",

  fixedPayment: "",
};

export default function useTaskWorkspace({
  user,
  tasks,
  createTask,
  updateTask,
  removeTask,
  toggleChecklistItem,
  toggleCompleted,
  toggleArchived,
  toggleProgress,
  toggleHours,
  showAlert,
  closeAlert,
}) {
  const [
    filter,
    setFilter,
  ] = useState(
    "Todas"
  );

  const [
    homeScope,
    setHomeScope,
  ] = useState(
    "all"
  );

  const [
    historyOpen,
    setHistoryOpen,
  ] = useState(
    false
  );

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    showExpired,
    setShowExpired,
  ] = useState(
    false
  );

  const [
    showModal,
    setShowModal,
  ] = useState(
    false
  );

  const [
    selectedTask,
    setSelectedTask,
  ] = useState(
    null
  );

  const [
    editing,
    setEditing,
  ] = useState(
    false
  );

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_TASK_FORM
  );

  const [
    originalForm,
    setOriginalForm,
  ] = useState(
    null
  );

  const [
    errors,
    setErrors,
  ] = useState({});

  const pendingHomeTasks =
    useMemo(() => {
      let result =
        tasks.filter(
          (task) =>
            !task.completed &&
            !task.archived
        );

      if (
        filter !==
        "Todas"
      ) {
        result =
          result.filter(
            (task) =>
              task.type ===
              filter
          );
      }

      if (
        homeScope ===
        "today"
      ) {
        result =
          result.filter(
            (task) =>
              task.date ===
              getTodayDate()
          );
      }

      return [
        ...result,
      ].sort(
        (a, b) => {
          if (!a.date) {
            return 1;
          }

          if (!b.date) {
            return -1;
          }

          return `${a.date}T${a.time || "23:59"}`
            .localeCompare(
              `${b.date}T${b.time || "23:59"}`
            );
        }
      );
    }, [
      tasks,
      filter,
      homeScope,
    ]);

  const activeTasks =
    pendingHomeTasks.filter(
      (task) =>
        !isExpiredTask(
          task
        )
    );

  const expiredTasks =
    pendingHomeTasks.filter(
      isExpiredTask
    );

  const totalPages =
    Math.max(
      1,

      Math.ceil(
        activeTasks.length /
          ITEMS_PER_PAGE
      )
    );

  const visibleTasks =
    activeTasks.slice(
      (page - 1) *
        ITEMS_PER_PAGE,

      page *
        ITEMS_PER_PAGE
    );

  const groupByDate = (
    items
  ) =>
    items.reduce(
      (
        groups,
        task
      ) => {
        const key =
          task.date ||
          "Sin fecha";

        if (
          !groups[key]
        ) {
          groups[key] =
            [];
        }

        groups[key].push(
          task
        );

        return groups;
      },
      {}
    );

  const groupedVisibleTasks =
    useMemo(
      () =>
        groupByDate(
          visibleTasks
        ),
      [
        visibleTasks,
      ]
    );

  const groupedExpiredTasks =
    useMemo(
      () =>
        groupByDate(
          expiredTasks
        ),
      [
        expiredTasks,
      ]
    );

  const historyTasks =
    useMemo(
      () =>
        tasks.filter(
          (task) =>
            task.completed ||
            task.archived
        ),
      [tasks]
    );

  const formChanged =
    () =>
      Boolean(
        originalForm
      ) &&
      JSON.stringify(
        form
      ) !==
        JSON.stringify(
          originalForm
        );

  const resetForm =
    () => {
      setShowModal(
        false
      );

      setEditing(
        false
      );

      setErrors({});

      setForm(
        EMPTY_TASK_FORM
      );

      setOriginalForm(
        null
      );
    };

  const closeForm =
    () => {
      if (
        editing &&
        formChanged()
      ) {
        showAlert({
          type:
            "warning",

          title:
            "Cambios sin guardar",

          message:
            "¿Quieres salir sin guardar los cambios?",

          confirmText:
            "Sí, salir",

          cancelText:
            "No, volver",

          onConfirm:
            () => {
              resetForm();

              closeAlert();
            },
        });

        return;
      }

      resetForm();
    };

  const openCreate =
    () => {
      setEditing(
        false
      );

      setOriginalForm(
        null
      );

      setForm(
        EMPTY_TASK_FORM
      );

      setErrors({});

      setShowModal(
        true
      );
    };

  const openEdit = (
    task
  ) => {
    const isWorker =
      task.type ===
        "Alekey" &&
      task.alekeyRole ===
        "Trabajador";

    const inferredPaymentMode =
      task.paymentMode
        ? task.paymentMode
        : task.fixedPayment
          ? "fixed"
          : Number(
                task.hourlyRate ||
                  DEFAULT_HOURLY_RATE
              ) ===
              1500
            ? "hourly-default"
            : "hourly-custom";

    const editForm = {
      title:
        task.title ||
        (isWorker
          ? LABOR_TITLE
          : ""),

      type:
        task.type ||
        "Universidad",

      course:
        UNIVERSITY_COURSES.includes(
          task.course
        )
          ? task.course
          : DEFAULT_UNIVERSITY_COURSE,

      alekeyRole:
        task.alekeyRole ||
        "Encargado",

      description:
        isWorker
          ? LABOR_DESCRIPTION
          : task.description ||
            "",

      date:
        task.date ||
        "",

      time:
        task.time ||
        "",

      priority:
        task.priority ||
        "Media",

      progressActive:
        task.progressActive ??
        true,

      hoursActive:
        task.hoursActive ??
        true,

      resources:
        task.resources
          ?.length
          ? task.resources
          : [
              {
                name: "",
                url: "",
                type: "PDF",
              },
            ],

      driveFolderUrl:
        task.driveFolderUrl ||
        "",

      checklist:
        task.checklist
          ?.map(
            (item) =>
              item.text
          )
          .join("\n") ||
        "",

      workSegments:
        task.workSegments
          ?.length
          ? task.workSegments.slice(
              0,
              5
            )
          : [
              {
                start: "",
                end: "",
              },
            ],

      totalHours:
        task.totalHours ||
        (isWorker
          ? String(
              calculateHours(
                task.workSegments ||
                  []
              )
            )
          : ""),

      hourlyRate:
        task.hourlyRate ||
        DEFAULT_HOURLY_RATE,

      paymentMode:
        inferredPaymentMode,

      fixedPayment:
        task.fixedPayment ||
        "",
    };

    setForm(
      editForm
    );

    setOriginalForm(
      editForm
    );

    setEditing(
      true
    );

    setShowModal(
      true
    );

    setErrors({});
  };

  const validate =
    () => {
      const next = {};

      const isWorker =
        form.type ===
          "Alekey" &&
        form.alekeyRole ===
          "Trabajador";

      if (
        !form.title.trim()
      ) {
        next.title =
          "Agrega un título.";
      }

      if (
        !form.description.trim()
      ) {
        next.description =
          "Agrega una descripción.";
      }

      if (
        !form.date
      ) {
        next.date =
          "Agrega una fecha.";
      }

      if (
        isWorker
      ) {
        if (
          !form.workSegments.some(
            (segment) =>
              segment.start &&
              segment.end
          )
        ) {
          next.workSegments =
            "Agrega al menos una entrada y salida.";
        }

        if (
          form.paymentMode ===
            "hourly-custom" &&
          Number(
            form.hourlyRate ||
              0
          ) <= 0
        ) {
          next.payment =
            "Agrega un monto por hora válido.";
        }

        if (
          form.paymentMode ===
            "fixed" &&
          Number(
            form.fixedPayment ||
              0
          ) <= 0
        ) {
          next.payment =
            "Agrega el monto total de la jornada.";
        }
      } else if (
        !form.time
      ) {
        next.time =
          "Agrega una hora.";
      }

      setErrors(
        next
      );

      return (
        Object.keys(
          next
        ).length === 0
      );
    };

  const buildChecklist =
    () =>
      form.checklist
        .split("\n")
        .filter(
          (item) =>
            item.trim()
        )
        .map(
          (text) => {
            const previous =
              editing
                ? (
                    selectedTask?.checklist ||
                    []
                  ).find(
                    (item) =>
                      item.text.trim() ===
                      text.trim()
                  )
                : null;

            return {
              text,

              done:
                previous?.done ||
                false,
            };
          }
        );

  const save =
    async () => {
      if (
        !validate()
      ) {
        showAlert({
          type:
            "warning",

          title:
            "Falta información",

          message:
            "Revisa los campos marcados antes de guardar.",

          confirmText:
            "Entendido",

          onlyConfirm:
            true,

          onConfirm:
            closeAlert,
        });

        return;
      }

      const isWorker =
        form.type ===
          "Alekey" &&
        form.alekeyRole ===
          "Trabajador";

      const calculatedHours =
        isWorker
          ? String(
              calculateHours(
                form.workSegments
              )
            )
          : "";

      const taskData = {
        userId:
          user.uid,

        title:
          form.title.trim(),

        type:
          form.type,

        course:
          form.type ===
          "Universidad"
            ? form.course
            : "",

        alekeyRole:
          form.type ===
          "Alekey"
            ? form.alekeyRole
            : "",

        description:
          isWorker
            ? LABOR_DESCRIPTION
            : form.description,

        date:
          form.date,

        time:
          isWorker
            ? ""
            : form.time,

        priority:
          isWorker
            ? ""
            : form.priority,

        progressActive:
          form.progressActive ??
          true,

        hoursActive:
          form.hoursActive ??
          true,

        resources:
          isWorker
            ? []
            : form.resources.filter(
                (
                  resource
                ) =>
                  resource.name.trim() &&
                  resource.url.trim()
              ),

        driveFolderUrl:
          isWorker
            ? ""
            : form.driveFolderUrl,

        checklist:
          buildChecklist(),

        workSegments:
          isWorker
            ? form.workSegments.slice(
                0,
                5
              )
            : [],

        totalHours:
          calculatedHours,

        hourlyRate:
          isWorker
            ? form.paymentMode ===
              "hourly-default"
              ? DEFAULT_HOURLY_RATE
              : form.paymentMode ===
                  "hourly-custom"
                ? String(
                    form.hourlyRate ||
                      ""
                  )
                : ""
            : "",

        paymentMode:
          isWorker
            ? form.paymentMode ||
              "hourly-default"
            : "",

        fixedPayment:
          isWorker &&
          form.paymentMode ===
            "fixed"
            ? String(
                form.fixedPayment ||
                  ""
              )
            : "",
      };

      try {
        if (
          editing &&
          selectedTask
        ) {
          await updateTask(
            selectedTask.id,
            taskData
          );

          setSelectedTask({
            ...selectedTask,
            ...taskData,
          });
        } else {
          await createTask(
            taskData
          );
        }

        resetForm();

        showAlert({
          type:
            "success",

          title:
            editing
              ? "Cambios guardados"
              : "Actividad guardada",

          message:
            "La información se guardó correctamente.",

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
            "Error al guardar",

          message:
            error.message ||
            "No se pudo guardar la actividad.",

          confirmText:
            "Entendido",

          onlyConfirm:
            true,

          onConfirm:
            closeAlert,
        });
      }
    };

  const deleteTask = (
    id
  ) => {
    showAlert({
      type: "danger",

      title:
        "Eliminar actividad",

      message:
        "¿Seguro que quieres eliminarla? Esta acción no se puede deshacer.",

      confirmText:
        "Sí, eliminar",

      cancelText:
        "Cancelar",

      onConfirm:
        async () => {
          await removeTask(
            id
          );

          setSelectedTask(
            null
          );

          closeAlert();
        },
    });
  };

  const handleToggleChecklist =
    async (
      task,
      index
    ) => {
      const checklist =
        await toggleChecklistItem(
          task,
          index
        );

      setSelectedTask(
        (current) =>
          current?.id ===
          task.id
            ? {
                ...current,
                checklist,
              }
            : current
      );
    };

  const handleToggleCompleted =
    async (
      task
    ) => {
      const completed =
        await toggleCompleted(
          task
        );

      setSelectedTask({
        ...task,

        completed,

        archived:
          completed
            ? task.archived ||
              false
            : false,
      });
    };

  const handleToggleArchived =
    async (
      task
    ) => {
      const archived =
        await toggleArchived(
          task
        );

      setSelectedTask({
        ...task,
        archived,
      });
    };

  const handleToggleProgress =
    async (
      task
    ) => {
      const progressActive =
        await toggleProgress(
          task
        );

      setSelectedTask({
        ...task,
        progressActive,
      });
    };

  const handleToggleHours =
    async (
      task
    ) => {
      const hoursActive =
        await toggleHours(
          task
        );

      setSelectedTask({
        ...task,
        hoursActive,
      });
    };

  const updateSegment = (
    index,
    field,
    value
  ) => {
    const workSegments =
      form.workSegments.map(
        (
          segment,
          i
        ) =>
          i === index
            ? {
                ...segment,
                [field]:
                  value,
              }
            : segment
      );

    setForm({
      ...form,

      workSegments,

      totalHours:
        String(
          calculateHours(
            workSegments
          )
        ),
    });
  };

  const addSegment =
    () => {
      if (
        form.workSegments
          .length >= 5
      ) {
        return;
      }

      setForm({
        ...form,

        workSegments: [
          ...form.workSegments,

          {
            start: "",
            end: "",
          },
        ],
      });
    };

  const removeSegment = (
    index
  ) => {
    const segments =
      form.workSegments.filter(
        (_, i) =>
          i !== index
      );

    const workSegments =
      segments.length
        ? segments
        : [
            {
              start: "",
              end: "",
            },
          ];

    setForm({
      ...form,

      workSegments,

      totalHours:
        String(
          calculateHours(
            workSegments
          )
        ),
    });
  };

  const addResource =
    () => {
      if (
        form.resources
          .length < 3
      ) {
        setForm({
          ...form,

          resources: [
            ...form.resources,

            {
              name: "",
              url: "",
              type: "PDF",
            },
          ],
        });
      }
    };

  const updateResource = (
    index,
    field,
    value
  ) =>
    setForm({
      ...form,

      resources:
        form.resources.map(
          (
            resource,
            i
          ) =>
            i === index
              ? {
                  ...resource,

                  [field]:
                    value,
                }
              : resource
        ),
    });

  const removeResource = (
    index
  ) =>
    setForm({
      ...form,

      resources:
        form.resources.filter(
          (_, i) =>
            i !== index
        ),
    });

  const getPayment = (
    task
  ) => {
    if (
      task.paymentMode ===
      "fixed"
    ) {
      return Number(
        task.fixedPayment ||
          0
      );
    }

    const hours =
      Number(
        task.totalHours ||
          0
      );

    const rate =
      Number(
        task.hourlyRate ||
          DEFAULT_HOURLY_RATE
      );

    return Number(
      (
        hours * rate
      ).toFixed(0)
    );
  };

  return {
    filter,
    setFilter,

    homeScope,
    setHomeScope,

    historyOpen,
    setHistoryOpen,

    page,
    setPage,

    showExpired,
    setShowExpired,

    showModal,

    selectedTask,
    setSelectedTask,

    editing,

    form,
    setForm,

    errors,

    activeTasks,
    expiredTasks,

    visibleTasks,

    totalPages,

    groupedVisibleTasks,
    groupedExpiredTasks,

    historyTasks,

    openCreate,
    openEdit,

    closeForm,

    save,

    deleteTask,

    handleToggleChecklist,
    handleToggleCompleted,
    handleToggleArchived,
    handleToggleProgress,
    handleToggleHours,

    updateSegment,
    addSegment,
    removeSegment,

    addResource,
    updateResource,
    removeResource,

    getPayment,
  };
}