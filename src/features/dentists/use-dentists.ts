import { useCallback, useEffect, useState } from "react";
import { CREATED_EVENTS } from "../../lib/create-events";
import type { Dentist } from "../../data/dentists";
import { loadDentists } from "./dentists-service";

export function useDentists(branchId: string | null = null, enabled = true) {
  const [dentists, setDentists] = useState<Dentist[]>([]);
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
      const result = await loadDentists(branchId);

      if (!active) {
        return;
      }

      setDentists(result.data);
      setError(result.error);
      setIsLoading(false);
    }

    void run();

    const handleCreated = (event: Event) => {
      const customEvent = event as CustomEvent<Dentist>;
      if (!customEvent.detail?.id) {
        return;
      }

      setRefreshIndex((current) => current + 1);
    };

    window.addEventListener(CREATED_EVENTS.dentist, handleCreated);

    return () => {
      active = false;
      window.removeEventListener(CREATED_EVENTS.dentist, handleCreated);
    };
  }, [branchId, enabled, refreshIndex]);

  const refetch = useCallback(() => {
    setRefreshIndex((current) => current + 1);
  }, []);

  return { dentists, isLoading, error, refetch };
}
