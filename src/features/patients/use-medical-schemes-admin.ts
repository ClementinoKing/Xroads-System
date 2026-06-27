import { useEffect, useState } from "react";
import { loadMedicalSchemesAdmin, type MedicalSchemeRecord } from "./medical-schemes-service";

export function useMedicalSchemesAdmin() {
  const [schemes, setSchemes] = useState<MedicalSchemeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;

    async function run() {
      setIsLoading(true);
      const result = await loadMedicalSchemesAdmin();

      if (!active) {
        return;
      }

      setSchemes(result.data);
      setError(result.error);
      setIsLoading(false);
    }

    void run();

    return () => {
      active = false;
    };
  }, [refreshIndex]);

  function refetch() {
    setRefreshIndex((current) => current + 1);
  }

  return { schemes, isLoading, error, refetch };
}
