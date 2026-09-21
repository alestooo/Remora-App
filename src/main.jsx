import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "./styles/app.css";
import "./styles/tasks.css";
import "./styles/notes.css";
import "./styles/tools.css";
import "./styles/progress.css";
import "./styles/accounts.css";
import "./styles/security.css";
import "./styles/dashboard.css";
import "./styles/history.css";
import "./styles/search.css";
import "./styles/settings.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/firebase-messaging-sw.js").catch((error) => {
      console.warn("No se pudo registrar el Service Worker:", error);
    });
  });
}
