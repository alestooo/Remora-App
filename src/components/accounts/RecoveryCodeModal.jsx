import { Copy, Download, KeyRound, X } from "lucide-react";

export default function RecoveryCodeModal({ code, onClose, showAlert }) {
  if (!code) return null;

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    showAlert?.({
      type: "success",
      title: "Clave copiada",
      message: "Guárdala en un lugar seguro fuera de Remora.",
      confirmText: "Listo",
      onlyConfirm: true,
      onConfirm: () => showAlert?.(null),
    });
  };

  const downloadCode = () => {
    const blob = new Blob([
      `REMORA - CLAVE DE RECUPERACIÓN\n\n${code}\n\nGuarda este archivo en un lugar seguro. Esta clave permite recuperar la bóveda de Cuentas si olvidas la contraseña.`,
    ], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "remora-clave-recuperacion.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="recovery-code-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><X /></button>
        <KeyRound size={48} />
        <h2>Guarda tu clave de recuperación</h2>
        <p>Remora no puede reconstruir esta clave después. Si olvidas la contraseña, la necesitarás para conservar tus credenciales cifradas.</p>
        <code>{code}</code>
        <div className="recovery-actions">
          <button onClick={copyCode}><Copy size={17} /> Copiar</button>
          <button onClick={downloadCode}><Download size={17} /> Descargar</button>
        </div>
        <button className="save-btn" onClick={onClose}>Ya la guardé</button>
      </div>
    </div>
  );
}
