import {
  Fingerprint,
  KeyRound,
  Lock,
  RotateCcw,
} from "lucide-react";

export default function AccountsLock({
  securityLoading,

  hasPassword,

  passkeyAvailable,
  hasPasskey,

  masterInput,
  setMasterInput,

  newMasterPassword,
  setNewMasterPassword,

  confirmMasterPassword,
  setConfirmMasterPassword,

  passwordResetAuthorized,

  securityBusy,

  unlockAccounts,
  unlockAccountsWithPasskey,

  createInitialPassword,

  beginForgotPassword,
  resetForgottenPassword,
  cancelPasswordReset,
}) {
  /* =========================================================
     CARGANDO CONFIGURACIÓN DE SEGURIDAD
  ========================================================= */

  if (securityLoading) {
    return (
      <div className="lock-card">
        <Lock size={54} />

        <h2>
          Cuentas protegidas
        </h2>

        <p>
          Cargando configuración de seguridad...
        </p>
      </div>
    );
  }

  /* =========================================================
     PRIMERA VEZ
     CREAR CONTRASEÑA MAESTRA
  ========================================================= */

  if (!hasPassword) {
    return (
      <div className="lock-card">
        <KeyRound size={54} />

        <h2>
          Crea tu contraseña
        </h2>

        <p>
          Es la primera vez que configuras Cuentas
          protegidas.
        </p>

        <p>
          Crea una contraseña de al menos 8 caracteres.
          La contraseña no se guardará como texto visible.
        </p>

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={newMasterPassword}
          onChange={(event) =>
            setNewMasterPassword(event.target.value)
          }
          autoComplete="new-password"
        />

        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmMasterPassword}
          onChange={(event) =>
            setConfirmMasterPassword(event.target.value)
          }
          autoComplete="new-password"
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !securityBusy
            ) {
              createInitialPassword();
            }
          }}
        />

        <button
          className="save-btn"
          onClick={createInitialPassword}
          disabled={securityBusy}
        >
          {securityBusy
            ? "Creando..."
            : "Crear contraseña"}
        </button>
      </div>
    );
  }

  /* =========================================================
     RESTABLECER CONTRASEÑA
  ========================================================= */

  if (passwordResetAuthorized) {
    return (
      <div className="lock-card">
        <RotateCcw size={54} />

        <h2>
          Nueva contraseña
        </h2>

        <p>
          Tu cuenta de Google ya fue verificada.
        </p>

        <p>
          Crea una nueva contraseña para Cuentas
          protegidas.
        </p>

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={newMasterPassword}
          onChange={(event) =>
            setNewMasterPassword(event.target.value)
          }
          autoComplete="new-password"
        />

        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmMasterPassword}
          onChange={(event) =>
            setConfirmMasterPassword(event.target.value)
          }
          autoComplete="new-password"
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !securityBusy
            ) {
              resetForgottenPassword();
            }
          }}
        />

        <button
          className="save-btn"
          onClick={resetForgottenPassword}
          disabled={securityBusy}
        >
          {securityBusy
            ? "Guardando..."
            : "Guardar nueva contraseña"}
        </button>

        <button
          className="security-link-btn"
          onClick={cancelPasswordReset}
          disabled={securityBusy}
        >
          Cancelar
        </button>
      </div>
    );
  }

  /* =========================================================
     DESBLOQUEO NORMAL
  ========================================================= */

  return (
    <div className="lock-card">
      <Lock size={54} />

      <h2>
        Cuentas protegidas
      </h2>

      <p>
        Introduce tu contraseña maestra.
      </p>

      <p>
        También puedes utilizar una Passkey si ya
        registraste huella, rostro, Windows Hello o
        el PIN de este dispositivo.
      </p>

      <input
        type="password"
        placeholder="Contraseña maestra"
        value={masterInput}
        onChange={(event) =>
          setMasterInput(event.target.value)
        }
        autoComplete="current-password"
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !securityBusy
          ) {
            unlockAccounts();
          }
        }}
      />

      {/* =====================================================
          BOTONES DE DESBLOQUEO EN UNA MISMA FILA
      ===================================================== */}

      <div className="accounts-unlock-actions">
        <button
          type="button"
          className="accounts-unlock-password"
          onClick={unlockAccounts}
          disabled={securityBusy}
        >
          {securityBusy
            ? "Verificando..."
            : "Desbloquear"}
        </button>

        {passkeyAvailable && hasPasskey && (
          <button
            type="button"
            className="accounts-unlock-passkey"
            onClick={unlockAccountsWithPasskey}
            disabled={securityBusy}
          >
            <Fingerprint size={18} />

            <span>
              Desbloquear con Passkey
            </span>
          </button>
        )}
      </div>

      <button
        type="button"
        className="security-link-btn"
        onClick={beginForgotPassword}
        disabled={securityBusy}
      >
        ¿Olvidaste tu contraseña?
      </button>
    </div>
  );
}