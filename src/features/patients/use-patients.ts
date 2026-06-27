import { useCallback, useEffect, useState } from "react";
import { CREATED_EVENTS } from "../../lib/create-events";
import { loadPatients } from "./patients-service";
import type { Patient } from "../../data/patients";

export function usePatients(enabled = true) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setError(null);
      return;
    }

    let active = true;

    async function run() {
      setIsLoading(true);
      const result = await loadPatients();

      if (!active) {
        return;
      }

      setPatients(result.data);
      setError(result.error);
      setIsLoading(false);
    }

    void run();

    const handleCreated = (event: Event) => {
      const customEvent = event as CustomEvent<Patient>;
      if (!customEvent.detail?.id) {
        return;
      }

      setRefreshIndex((current) => current + 1);
    };

    window.addEventListener(CREATED_EVENTS.patient, handleCreated);

    return () => {
      active = false;
      window.removeEventListener(CREATED_EVENTS.patient, handleCreated);
    };
  }, [enabled, refreshIndex]);

  const refetch = useCallback(() => {
    setRefreshIndex((current) => current + 1);
  }, []);

  return { patients, isLoading, error, refetch };
}
