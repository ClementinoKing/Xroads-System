import { useEffect, useState } from "react";
import { loadBranches, type BranchDirectoryItem } from "./branches-service";

export function useBranches() {
  const [branches, setBranches] = useState<BranchDirectoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;

    async function run() {
      setIsLoading(true);
      const result = await loadBranches();

      if (!active) {
        return;
      }

      setBranches(result.data);
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

  return { branches, isLoading, error, refetch };
}
