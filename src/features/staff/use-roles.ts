import { useEffect, useState } from "react";
import { loadRoles, type StaffRole } from "./staff-directory-service";

export function useRoles() {
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;

    async function run() {
      setIsLoading(true);
      const result = await loadRoles();

      if (!active) {
        return;
      }

      setRoles(result.data);
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

  return { roles, isLoading, error, refetch };
}
