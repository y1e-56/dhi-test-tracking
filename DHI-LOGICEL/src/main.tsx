import Clarity from "@microsoft/clarity";
import * as Sentry from "@sentry/react";

const origRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function (child) {
  if (child.parentNode !== this) return child;
  return origRemoveChild.call(this, child);
};

import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || "development",
    tracesSampleRate: 0.1,
  });
}

Clarity.init("xszwj7abht");

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<AppErrorFallback />}>
    <App />
  </Sentry.ErrorBoundary>
);

function AppErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md px-6">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Une erreur est survenue</h1>
        <p className="text-slate-500 mb-4">
          L'application a rencontré un problème inattendu. Rechargez la page pour continuer.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Recharger la page
        </button>
      </div>
    </div>
  );
}