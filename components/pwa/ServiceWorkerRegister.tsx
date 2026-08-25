"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // Registration can fail on unsupported origins (e.g. private LAN IP over HTTP).
        });
    };

    const start = () => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(register, { timeout: 4000 });
        return;
      }
      window.setTimeout(register, 1500);
    };

    if (document.readyState === "complete") {
      start();
      return;
    }

    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  return null;
}
