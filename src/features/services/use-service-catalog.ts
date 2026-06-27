import { useCallback, useEffect, useState } from "react";
import type { ServiceCatalog } from "../../data/services";
import { loadServiceCatalog } from "./services-service";

const emptyCatalog: ServiceCatalog = {
  services: [],
  categories: [],
  sections: [],
  priceLists: [],
};

export function useServiceCatalog(enabled = true) {
  const [catalog, setCatalog] = useState<ServiceCatalog>(emptyCatalog);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let active = true;

    async function run() {
      setIsLoading(true);
      const result = await loadServiceCatalog();

      if (!active) {
        return;
      }

      setCatalog(result.data ?? emptyCatalog);
      setError(result.error);
      setIsLoading(false);
    }

    void run();

    return () => {
      active = false;
    };
  }, [enabled, refreshIndex]);

  const refetch = useCallback(() => {
    setRefreshIndex((current) => current + 1);
  }, []);

  return {
    ...catalog,
    isLoading,
    error,
    refetch,
  };
}
