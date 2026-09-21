import { motion } from "framer-motion";

import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";

import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import {
  ArrowLeft,
  BookOpen,
  Calculator,
  FilePlus2,
  Search,
  StickyNote,
  UserPlus,
  Users,
} from "lucide-react";

import SortableNote from "../components/notes/SortableNote";
import ClientCard from "../components/clients/ClientCard";

export default function ToolsPage({
  selectedTool,
  setSelectedTool,

  calcA,
  setCalcA,

  calcB,
  setCalcB,

  calcOperation,
  setCalcOperation,

  calculateBasicResult,
  clearCalculator,

  gradeScore,
  setGradeScore,

  gradeTotal,
  setGradeTotal,

  gradeResult,

  noteSearch,
  setNoteSearch,

  notePage,
  setNotePage,

  notesReorderMode,
  setNotesReorderMode,

  openCreateNote,

  notes,

  sensors,
  handleNoteDragEnd,

  visibleNotes,

  totalNotePages,

  noteMenuId,
  setNoteMenuId,

  openViewNote,
  toggleNotePinned,
  deleteNote,
  openEditNote,

  clients,

  toggleClientPaid,
  openEditClient,
  deleteClient,

  setShowClientModal,
}) {
  /* =========================================================
     MENÚ PRINCIPAL DE HERRAMIENTAS
  ========================================================= */

  if (!selectedTool) {
    const tools = [
      {
        id: "calculator",
        title: "Calculadora",
        text: "Suma, resta, multiplica y divide.",
        icon: <Calculator />,
      },
      {
        id: "grades",
        title: "Conversor de notas",
        text: "Calcula porcentajes rápido.",
        icon: <BookOpen />,
      },
      {
        id: "notes",
        title: "Bloc de notas",
        text: "Notas cortas y organizadas.",
        icon: <StickyNote />,
      },
      {
        id: "clients",
        title: "Clientes",
        text: "Pendientes, productos y pagos.",
        icon: <UserPlus />,
      },
    ];

    return (
      <section className="tools-page">
        <div className="tools-app-grid">
          {tools.map((tool) => (
            <motion.button
              key={tool.id}
              className="tool-app-button"
              whileHover={{
                scale: 1.03,
              }}
              whileTap={{
                scale: 0.96,
              }}
              onClick={() => {
                setSelectedTool(tool.id);

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            >
              <div className="tool-app-icon">
                {tool.icon}
              </div>

              <h3>
                {tool.title}
              </h3>

              <p>
                {tool.text}
              </p>
            </motion.button>
          ))}
        </div>
      </section>
    );
  }

  /* =========================================================
     HERRAMIENTA ABIERTA
  ========================================================= */

  return (
    <section className="tools-page">
      <motion.div
        className="tool-inner"
        initial={{
          opacity: 0,
          y: 18,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
      >
        <button
          className="back-btn"
          onClick={() =>
            setSelectedTool(null)
          }
        >
          <ArrowLeft />
        </button>

        {/* ===================================================
            CALCULADORA
        =================================================== */}

        {selectedTool === "calculator" && (
          <div className="tool-card">
            <Calculator size={38} />

            <h2>
              Calculadora
            </h2>

            <input
              placeholder="Primer número"
              value={calcA}
              onChange={(event) =>
                setCalcA(
                  event.target.value
                )
              }
            />

            <select
              value={calcOperation}
              onChange={(event) =>
                setCalcOperation(
                  event.target.value
                )
              }
            >
              <option>
                +
              </option>

              <option>
                -
              </option>

              <option>
                ×
              </option>

              <option>
                ÷
              </option>
            </select>

            <input
              placeholder="Segundo número"
              value={calcB}
              onChange={(event) =>
                setCalcB(
                  event.target.value
                )
              }
            />

            <div className="grade-result">
              {calculateBasicResult() !== ""
                ? calculateBasicResult()
                : "Resultado"}
            </div>

            <button
              className="save-btn"
              onClick={
                clearCalculator
              }
            >
              Quitar todo
            </button>
          </div>
        )}

        {/* ===================================================
            CONVERSOR DE NOTAS
        =================================================== */}

        {selectedTool === "grades" && (
          <div className="tool-card">
            <BookOpen size={38} />

            <h2>
              Conversor de notas
            </h2>

            <input
              placeholder="Puntos obtenidos"
              value={gradeScore}
              onChange={(event) =>
                setGradeScore(
                  event.target.value
                )
              }
            />

            <input
              placeholder="Puntos totales"
              value={gradeTotal}
              onChange={(event) =>
                setGradeTotal(
                  event.target.value
                )
              }
            />

            <div className="grade-result">
              {gradeResult
                ? `${gradeResult}%`
                : "Resultado"}
            </div>
          </div>
        )}

        {/* ===================================================
            BLOC DE NOTAS
        =================================================== */}

        {selectedTool === "notes" && (
          <section className="notes-page">
            <div className="notes-header">
              {/* =============================================
                  TÍTULO
              ============================================= */}

              <div className="notes-header-info">
                <h2>
                  Bloc de notas
                </h2>

                <p>
                  Notas rápidas, simples y guardadas por usuario.
                </p>
              </div>

              {/* =============================================
                  CONTROLES
              ============================================= */}

              <div className="notes-header-controls">
                <div className="notes-search-box">
                  <Search size={18} />

                  <input
                    placeholder="Buscar notas..."
                    value={noteSearch}
                    onChange={(event) => {
                      setNoteSearch(
                        event.target.value
                      );

                      setNotePage(1);
                    }}
                  />
                </div>

                <div className="notes-actions">
                  <button
                    type="button"
                    className={`
                      notes-action-btn
                      notes-reorder-btn
                      ${
                        notesReorderMode
                          ? "active"
                          : ""
                      }
                    `}
                    onClick={() => {
                      setNotesReorderMode(
                        !notesReorderMode
                      );

                      if (
                        !notesReorderMode &&
                        navigator.vibrate
                      ) {
                        navigator.vibrate(40);
                      }
                    }}
                  >
                    {notesReorderMode
                      ? "Listo"
                      : "Ordenar"}
                  </button>

                  <button
                    type="button"
                    className="
                      notes-action-btn
                      notes-create-btn
                    "
                    onClick={
                      openCreateNote
                    }
                  >
                    <FilePlus2 size={18} />

                    <span>
                      Nueva nota
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* ===============================================
                SIN NOTAS
            =============================================== */}

            {notes.length === 0 ? (
              <div className="notes-empty">
                <StickyNote size={48} />

                <h3>
                  No tienes notas todavía
                </h3>

                <p>
                  Presiona “Nueva nota” para escribir la primera.
                </p>
              </div>
            ) : (
              <>
                {/* ===========================================
                    GRID
                =========================================== */}

                <DndContext
                  sensors={sensors}
                  collisionDetection={
                    closestCenter
                  }
                  onDragEnd={
                    handleNoteDragEnd
                  }
                >
                  <SortableContext
                    items={visibleNotes.map(
                      (note) =>
                        note.id
                    )}
                    strategy={
                      rectSortingStrategy
                    }
                  >
                    <div className="notes-grid">
                      {visibleNotes.map(
                        (note) => (
                          <SortableNote
                            key={note.id}
                            note={note}
                            onOpen={
                              openViewNote
                            }
                            notesReorderMode={
                              notesReorderMode
                            }
                            noteMenuId={
                              noteMenuId
                            }
                            setNoteMenuId={
                              setNoteMenuId
                            }
                            toggleNotePinned={
                              toggleNotePinned
                            }
                            deleteNote={
                              deleteNote
                            }
                            openEditNote={
                              openEditNote
                            }
                          />
                        )
                      )}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* ===========================================
                    PAGINACIÓN
                =========================================== */}

                {totalNotePages > 1 && (
                  <div className="pagination">
                    <button
                      disabled={
                        notePage === 1
                      }
                      onClick={() => {
                        setNotePage(
                          notePage - 1
                        );

                        window.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      }}
                    >
                      Anterior
                    </button>

                    <span>
                      Página {notePage} de{" "}
                      {totalNotePages}
                    </span>

                    <button
                      disabled={
                        notePage ===
                        totalNotePages
                      }
                      onClick={() => {
                        setNotePage(
                          notePage + 1
                        );

                        window.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ===================================================
            CLIENTES
        =================================================== */}

        {selectedTool === "clients" && (
          <div className="tool-card">
            <Users size={38} />

            <h2>
              Clientes pendientes
            </h2>

            <button
              className="save-btn"
              onClick={() =>
                setShowClientModal(
                  true
                )
              }
            >
              + Agregar persona
            </button>

            <div className="clients-list">
              {clients.length === 0 ? (
                <p className="empty-private">
                  No tienes clientes agregados.
                </p>
              ) : (
                clients.map(
                  (client) => (
                    <ClientCard
                      key={
                        client.id
                      }
                      client={
                        client
                      }
                      onTogglePaid={
                        toggleClientPaid
                      }
                      onEdit={
                        openEditClient
                      }
                      onDelete={
                        deleteClient
                      }
                    />
                  )
                )
              )}
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
}