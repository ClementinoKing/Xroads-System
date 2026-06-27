import { useEffect, useState } from "react";
import { loadUsers, type StaffUser } from "./staff-directory-service";

export function useUsers() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;

    async function run() {
      setIsLoading(true);
      const result = await loadUsers();

      if (!active) {
        return;
      }

      setUsers(result.data);
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

  return { users, isLoading, error, refetch };
}

