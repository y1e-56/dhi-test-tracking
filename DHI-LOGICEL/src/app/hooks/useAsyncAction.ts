import { useCallback, useRef, useState } from 'react';

/**
 * Protège une action asynchrone contre les double-clics.
 * Tant que l'action est en cours : `pending` vaut true (pour désactiver le bouton)
 * et toute nouvelle invocation est ignorée (évite les doublons de création).
 */
export function useAsyncAction<TArgs extends unknown[]>(fn: (...args: TArgs) => void | Promise<void>) {
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  const run = useCallback(async (...args: TArgs) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    try {
      await fn(...args);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, [fn]);

  return { pending, run };
}
