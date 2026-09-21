import {
  ArrowLeft,
  Bell,
  Download,
  HardDriveDownload,
  KeyRound,
  RefreshCw,
  Smartphone,
  Upload,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function SettingsPage({
  onBack,

  preferences,
  savePreferences,

  notificationsSupported,
  onEnableNotifications,

  onExportBackup,
  onImportBackup,
  backupBusy,

  online,

  canInstall,
  installed,
  onInstall,
}) {
  const notificationMinutes =
    preferences?.notifyMinutesBefore ?? 120;

  const notificationsEnabled =
    preferences?.notificationsEnabled ?? false;

  const handleNotificationTimeChange = async (
    event
  ) => {
    const minutes = Number(
      event.target.value
    );

    await savePreferences({
      notifyMinutesBefore: minutes,
    });
  };

  return (
    <section className="settings-page">
      {/* =====================================================
          ENCABEZADO
      ===================================================== */}

      <div className="settings-heading">
        <button
          type="button"
          className="back-btn"
          onClick={onBack}
          aria-label="Volver"
        >
          <ArrowLeft />
        </button>

        <div>
          <h2>
            Ajustes
          </h2>

          <p>
            Preferencias, copias, notificaciones y estado de
            Remora.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* ===================================================
            NOTIFICACIONES
        =================================================== */}

        <div className="settings-card">
          <Bell />

          <div>
            <h3>
              Notificaciones
            </h3>

            <p>
              Recibe recordatorios de actividades próximas.
            </p>
          </div>

          <div className="notification-select-wrapper">
            <select
              className="notification-time-select"
              value={notificationMinutes}
              onChange={
                handleNotificationTimeChange
              }
            >
              <option value={30}>
                30 minutos antes
              </option>

              <option value={60}>
                1 hora antes
              </option>

              <option value={120}>
                2 horas antes
              </option>

              <option value={1440}>
                1 día antes
              </option>
            </select>
          </div>

          <button
            type="button"
            className="save-btn"
            disabled={
              !notificationsSupported
            }
            onClick={
              onEnableNotifications
            }
          >
            {notificationsEnabled
              ? "Actualizar notificaciones"
              : "Activar notificaciones"}
          </button>

          {!notificationsSupported && (
            <small>
              Este navegador no soporta las notificaciones
              configuradas por Remora.
            </small>
          )}
        </div>

        {/* ===================================================
            BACKUP
        =================================================== */}

        <div className="settings-card">
          <HardDriveDownload />

          <div>
            <h3>
              Copia de seguridad
            </h3>

            <p>
              Exporta tareas, notas, clientes, preferencias y
              Cuentas cifradas.
            </p>
          </div>

          <div className="settings-inline-actions">
            <button
              type="button"
              disabled={backupBusy}
              onClick={onExportBackup}
            >
              <Download size={17} />

              Exportar JSON
            </button>

            <label
              className={
                backupBusy
                  ? "disabled"
                  : ""
              }
            >
              <Upload size={17} />

              Importar JSON

              <input
                type="file"
                accept="application/json,.json"
                hidden
                disabled={backupBusy}
                onChange={(event) => {
                  const file =
                    event.target.files?.[0];

                  if (file) {
                    onImportBackup(file);
                  }

                  event.target.value = "";
                }}
              />
            </label>
          </div>

          {backupBusy && (
            <small>
              <RefreshCw size={13} />

              Procesando copia...
            </small>
          )}
        </div>

        {/* ===================================================
            INSTALACIÓN
        =================================================== */}

        <div className="settings-card">
          <Smartphone />

          <div>
            <h3>
              Instalar Remora
            </h3>

            <p>
              Úsala como una aplicación desde el escritorio o la
              pantalla de inicio.
            </p>
          </div>

          {installed ? (
            <div className="settings-status success">
              Remora ya está instalada como app.
            </div>
          ) : canInstall ? (
            <button
              type="button"
              className="save-btn"
              onClick={onInstall}
            >
              Instalar aplicación
            </button>
          ) : (
            <small>
              Si tu navegador ofrece “Instalar aplicación” o
              “Agregar a pantalla de inicio”, también puedes
              hacerlo desde su menú.
            </small>
          )}
        </div>

        {/* ===================================================
            OFFLINE
        =================================================== */}

        <div className="settings-card">
          {online ? (
            <Wifi />
          ) : (
            <WifiOff />
          )}

          <div>
            <h3>
              Conexión y modo offline
            </h3>

            <p>
              Firestore conserva una caché local para mostrar tus
              últimos datos cuando pierdes internet.
            </p>
          </div>

          <div
            className={`settings-status ${
              online
                ? "success"
                : "warning"
            }`}
          >
            {online
              ? "Con conexión"
              : "Sin conexión · usando datos disponibles localmente"}
          </div>
        </div>

        {/* ===================================================
            SEGURIDAD
        =================================================== */}

        <div className="settings-card">
          <KeyRound />

          <div>
            <h3>
              Seguridad de Cuentas
            </h3>

            <p>
              La bóveda se bloquea a los 3 minutos. Las
              credenciales se guardan cifradas en Firestore.
            </p>
          </div>

          <small>
            Guarda tu clave de recuperación cuando Remora te la
            muestre. Es necesaria para recuperar la bóveda si
            olvidas la contraseña y no puedes abrirla con una
            Passkey vinculada.
          </small>
        </div>
      </div>
    </section>
  );
}