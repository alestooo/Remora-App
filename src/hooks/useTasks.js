import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../services/firebase";

export default function useTasks(
  user,
  {
    onLoadError,
  } = {}
) {
  const [
    tasks,
    setTasks,
  ] = useState([]);

  const [
    tasksLoading,
    setTasksLoading,
  ] = useState(false);

  /*
    Guardamos el callback en un ref para que
    el listener NO se reinicie cada vez que
    App.jsx vuelve a renderizar.
  */
  const onLoadErrorRef =
    useRef(onLoadError);

  useEffect(() => {
    onLoadErrorRef.current =
      onLoadError;
  }, [onLoadError]);

  /*
    LISTENER DE FIRESTORE

    Muy importante:
    depende solamente del UID.
  */
  useEffect(() => {
    const userId =
      user?.uid;

    if (!userId) {
      setTasks([]);
      setTasksLoading(false);

      return undefined;
    }

    setTasksLoading(true);

    const tasksQuery =
      query(
        collection(
          db,
          "users",
          userId,
          "tasks"
        ),

        orderBy(
          "createdAt",
          "desc"
        )
      );

    const unsubscribe =
      onSnapshot(
        tasksQuery,

        (snapshot) => {
          const nextTasks =
            snapshot.docs.map(
              (document) => ({
                id:
                  document.id,

                /*
                  Valores por defecto para
                  documentos antiguos.
                */
                completed: false,
                archived: false,

                ...document.data(),
              })
            );

          setTasks(
            nextTasks
          );

          setTasksLoading(
            false
          );
        },

        (error) => {
          console.error(
            "Tasks listener error:",
            error
          );

          setTasksLoading(
            false
          );

          onLoadErrorRef.current?.(
            error
          );
        }
      );

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  /* =========================================================
     CREAR TAREA
  ========================================================= */

  const createTask =
    async (
      taskData
    ) => {
      if (!user?.uid) {
        throw new Error(
          "No hay un usuario autenticado."
        );
      }

      const taskRef =
        doc(
          collection(
            db,
            "users",
            user.uid,
            "tasks"
          )
        );

      await setDoc(
        taskRef,
        {
          ...taskData,

          id:
            taskRef.id,

          completed:
            false,

          archived:
            false,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      return taskRef.id;
    };

  /* =========================================================
     ACTUALIZAR TAREA
  ========================================================= */

  const updateTask =
    async (
      taskId,
      patch
    ) => {
      if (!user?.uid) {
        throw new Error(
          "No hay un usuario autenticado."
        );
      }

      await updateDoc(
        doc(
          db,
          "users",
          user.uid,
          "tasks",
          taskId
        ),

        {
          ...patch,

          updatedAt:
            serverTimestamp(),
        }
      );
    };

  /* =========================================================
     ELIMINAR TAREA
  ========================================================= */

  const removeTask =
    async (
      taskId
    ) => {
      if (!user?.uid) {
        throw new Error(
          "No hay un usuario autenticado."
        );
      }

      await deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "tasks",
          taskId
        )
      );
    };

  /* =========================================================
     CHECKLIST
  ========================================================= */

  const toggleChecklistItem =
    async (
      task,
      index
    ) => {
      const checklist =
        (
          task.checklist ||
          []
        ).map(
          (
            item,
            itemIndex
          ) =>
            itemIndex ===
            index
              ? {
                  ...item,

                  done:
                    !item.done,
                }
              : item
        );

      await updateTask(
        task.id,
        {
          checklist,
        }
      );

      return checklist;
    };

  /* =========================================================
     COMPLETAR / REABRIR
  ========================================================= */

  const toggleCompleted =
    async (
      task
    ) => {
      const completed =
        !task.completed;

      await updateTask(
        task.id,
        {
          completed,

          completedAt:
            completed
              ? serverTimestamp()
              : null,

          archived:
            completed
              ? task.archived ||
                false
              : false,
        }
      );

      return completed;
    };

  /* =========================================================
     ARCHIVAR / DESARCHIVAR
  ========================================================= */

  const toggleArchived =
    async (
      task
    ) => {
      const archived =
        !task.archived;

      await updateTask(
        task.id,
        {
          archived,

          archivedAt:
            archived
              ? serverTimestamp()
              : null,
        }
      );

      return archived;
    };

  /* =========================================================
     MOSTRAR / OCULTAR EN PROGRESO
  ========================================================= */

  const toggleProgress =
    async (
      task
    ) => {
      const progressActive =
        task.progressActive ===
        false;

      await updateTask(
        task.id,
        {
          progressActive,
        }
      );

      return progressActive;
    };

  /* =========================================================
     CONTAR / NO CONTAR HORAS ALEKEY
  ========================================================= */

  const toggleHours =
    async (
      task
    ) => {
      const hoursActive =
        task.hoursActive ===
        false;

      await updateTask(
        task.id,
        {
          hoursActive,
        }
      );

      return hoursActive;
    };

  return {
    tasks,

    setTasks,

    tasksLoading,

    createTask,

    updateTask,

    removeTask,

    toggleChecklistItem,

    toggleCompleted,

    toggleArchived,

    toggleProgress,

    toggleHours,
  };
}