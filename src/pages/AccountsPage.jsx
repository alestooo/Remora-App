import {
  Fingerprint,
  LockKeyhole,
} from "lucide-react";

import AccountsLock from "../components/accounts/AccountsLock";
import AccountCard from "../components/accounts/AccountCard";

export default function AccountsPage({
  accountsUnlocked,

  securityLoading,
  accountsLoading,

  hasPassword,

  passkeyAvailable,
  hasPasskey,

  masterInput,
  setMasterInput,

  newMasterPassword,
  setNewMasterPassword,

  confirmMasterPassword,
  setConfirmMasterPassword,

  recoveryCode,
  setRecoveryCode,

  passwordResetAuthorized,

  securityBusy,

  unlockAccounts,
  unlockAccountsWithPasskey,

  createInitialPassword,

  beginForgotPassword,
  resetForgottenPassword,
  cancelPasswordReset,

  registerPasskeyForAccounts,

  lockAccounts,

  unlockSecondsLeft,

  setShowAccountModal,

  accounts,

  visibleAccountId,

  handleEyeClick,

  deleteAccount,
}) {
  /* =========================================================
     CUENTAS BLOQUEADAS
  ========================================================= */

  if (!accountsUnlocked) {
    return (
      <section className="accounts-page">
        <AccountsLock
          securityLoading={securityLoading}
          hasPassword={hasPassword}
          passkeyAvailable={passkeyAvailable}
          hasPasskey={hasPasskey}
          masterInput={masterInput}
          setMasterInput={setMasterInput}
          newMasterPassword={newMasterPassword}
          setNewMasterPassword={setNewMasterPassword}
          confirmMasterPassword={confirmMasterPassword}
          setConfirmMasterPassword={setConfirmMasterPassword}
          recoveryCode={recoveryCode}
          setRecoveryCode={setRecoveryCode}
          passwordResetAuthorized={passwordResetAuthorized}
          securityBusy={securityBusy}
          unlockAccounts={unlockAccounts}
          unlockAccountsWithPasskey={
            unlockAccountsWithPasskey
          }
          createInitialPassword={
            createInitialPassword
          }
          beginForgotPassword={
            beginForgotPassword
          }
          resetForgottenPassword={
            resetForgottenPassword
          }
          cancelPasswordReset={
            cancelPasswordReset
          }
        />
      </section>
    );
  }

  /* =========================================================
     CUENTAS DESBLOQUEADAS
  ========================================================= */

  return (
    <section className="accounts-page">
      <div className="accounts-header">
        {/* ===================================================
            INFORMACIÓN
        =================================================== */}

        <div className="accounts-header-info">
          <h2>
            Cuentas
          </h2>

          <p>
            Bóveda cifrada · se bloquea en{" "}
            {Math.floor(
              unlockSecondsLeft / 60
            )}
            :
            {String(
              unlockSecondsLeft % 60
            ).padStart(2, "0")}
          </p>
        </div>

        {/* ===================================================
            ACCIONES
        =================================================== */}

        <div className="accounts-header-actions">
          {passkeyAvailable && (
            <button
              type="button"
              className="passkey-btn compact-passkey-btn"
              onClick={
                registerPasskeyForAccounts
              }
              disabled={securityBusy}
            >
              <Fingerprint size={18} />

              <span>
                {hasPasskey
                  ? "Agregar otra Passkey"
                  : "Agregar Passkey"}
              </span>
            </button>
          )}

          <button
            type="button"
            className="account-lock-now-btn"
            onClick={lockAccounts}
            disabled={securityBusy}
          >
            <LockKeyhole size={17} />

            <span>
              Bloquear ahora
            </span>
          </button>

        <button
        type="button"
        className="account-add-btn"
        onClick={() =>
            setShowAccountModal(true)
        }
        disabled={securityBusy}
        >
        + Agregar
        </button>
        </div>
      </div>

      {/* =====================================================
          LISTA DE CUENTAS
      ===================================================== */}

      <div className="accounts-list">
        {accountsLoading ? (
          <div className="empty-private">
            Descifrando cuentas...
          </div>
        ) : accounts.length === 0 ? (
          <div className="empty-private">
            No tienes cuentas guardadas todavía.
          </div>
        ) : (
          accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              visible={
                visibleAccountId ===
                account.id
              }
              onEyeClick={
                handleEyeClick
              }
              onDelete={
                deleteAccount
              }
            />
          ))
        )}
      </div>
    </section>
  );
}