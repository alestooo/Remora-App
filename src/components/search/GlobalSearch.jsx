import { Search, X } from "lucide-react";

const normalize = (value) => String(value || "").toLowerCase();

export default function GlobalSearch({
  open,
  query,
  setQuery,
  onClose,
  tasks,
  notes,
  clients,
  accounts,
  accountsUnlocked,
  onOpenTask,
  onOpenNote,
  onOpenClient,
  onOpenAccount,
}) {
  if (!open) return null;

  const search = normalize(query.trim());

  const taskResults = search
    ? tasks.filter((task) =>
        normalize(
          `${task.title} ${task.description} ${task.type} ${task.course} ${task.priority}`
        ).includes(search)
      ).slice(0, 6)
    : [];

  const noteResults = search
    ? notes.filter((note) => {
        const blocks = (note.blocks || [])
          .map((block) => JSON.stringify(block))
          .join(" ");
        return normalize(`${note.title} ${note.content} ${blocks}`).includes(search);
      }).slice(0, 6)
    : [];

  const clientResults = search
    ? clients.filter((client) =>
        normalize(
          `${client.name} ${(client.products || [])
            .map((product) => `${product.name} ${product.price}`)
            .join(" ")}`
        ).includes(search)
      ).slice(0, 6)
    : [];

  const accountResults = search && accountsUnlocked
    ? accounts.filter((account) =>
        normalize(
          `${account.title} ${account.username} ${account.email} ${account.user}`
        ).includes(search)
      ).slice(0, 6)
    : [];

  const total =
    taskResults.length +
    noteResults.length +
    clientResults.length +
    accountResults.length;

  const ResultSection = ({ title, items, renderItem }) => {
    if (!items.length) return null;
    return (
      <section className="global-search-section">
        <h3>{title}</h3>
        <div className="global-search-results">{items.map(renderItem)}</div>
      </section>
    );
  };

  return (
    <div className="global-search-overlay" onClick={onClose}>
      <div className="global-search-panel" onClick={(event) => event.stopPropagation()}>
        <div className="global-search-input-row">
          <Search size={21} />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar tareas, notas, clientes..."
          />
          <button onClick={onClose} aria-label="Cerrar búsqueda">
            <X />
          </button>
        </div>

        {!search ? (
          <p className="global-search-hint">
            Escribe algo para buscar en toda Remora. Las cuentas protegidas solo aparecen cuando Cuentas está desbloqueado.
          </p>
        ) : total === 0 ? (
          <p className="global-search-hint">No encontré resultados para “{query}”.</p>
        ) : (
          <div className="global-search-scroll">
            <ResultSection
              title="Actividades"
              items={taskResults}
              renderItem={(task) => (
                <button
                  key={task.id}
                  className="global-search-item"
                  onClick={() => onOpenTask(task)}
                >
                  <strong>{task.title}</strong>
                  <span>{task.type}{task.course ? ` · ${task.course}` : ""}</span>
                </button>
              )}
            />

            <ResultSection
              title="Notas"
              items={noteResults}
              renderItem={(note) => (
                <button
                  key={note.id}
                  className="global-search-item"
                  onClick={() => onOpenNote(note)}
                >
                  <strong>{note.title}</strong>
                  <span>Bloc de notas</span>
                </button>
              )}
            />

            <ResultSection
              title="Clientes"
              items={clientResults}
              renderItem={(client) => (
                <button
                  key={client.id}
                  className="global-search-item"
                  onClick={() => onOpenClient(client)}
                >
                  <strong>{client.name}</strong>
                  <span>{client.paid ? "Pagado" : "Pendiente"}</span>
                </button>
              )}
            />

            <ResultSection
              title="Cuentas"
              items={accountResults}
              renderItem={(account) => (
                <button
                  key={account.id}
                  className="global-search-item"
                  onClick={() => onOpenAccount(account)}
                >
                  <strong>{account.title}</strong>
                  <span>{account.email || account.username || "Cuenta protegida"}</span>
                </button>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
