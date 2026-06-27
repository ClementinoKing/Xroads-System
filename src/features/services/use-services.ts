import { useCallback, useEffect, useState } from "react";
import { CREATED_EVENTS } from "../../lib/create-events";
import type { DentalService } from "../../data/services";
import { loadServices } from "./services-service";

export function useServices() {
  const [services, setServices] = useState<DentalService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;

    async function run() {
      setIsLoading(true);
      const result = await loadServices();

      if (!active) {
        return;
      }

      setServices(result.data);
      setError(result.error);
      setIsLoading(false);
    }

    void run();

    const handleCreated = (event: Event) => {
      const customEvent = event as CustomEvent<DentalService>;
      if (!customEvent.detail?.id) {
        return;
      }

      setRefreshIndex((current) => current + 1);
    };

    window.addEventListener(CREATED_EVENTS.service, handleCreated);

    return () => {
      active = false;
      window.removeEventListener(CREATED_EVENTS.service, handleCreated);
    };
  }, [refreshIndex]);

  const refetch = useCallback(() => {
    setRefreshIndex((current) => current + 1);
  }, []);

  return { services, isLoading, error, refetch };
}
