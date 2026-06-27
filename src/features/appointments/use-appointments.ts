import { useCallback, useEffect, useState } from "react";
import { CREATED_EVENTS, UPDATED_EVENTS } from "../../lib/create-events";
import type { Appointment } from "../../data/appointments";
import { loadAppointments } from "./appointments-service";

export function useAppointments(enabled = true) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
      const result = await loadAppointments();

      if (!active) {
        return;
      }

      setAppointments(result.data);
      setError(result.error);
      setIsLoading(false);
    }

    void run();

    const handleUpsert = (event: Event) => {
      const customEvent = event as CustomEvent<Appointment>;
      if (!customEvent.detail?.id) {
        return;
      }

      setAppointments((current) => {
        const next = customEvent.detail;
        const index = current.findIndex((appointment) => appointment.id === next.id);

        if (index === -1) {
          return [next, ...current];
        }

        const updated = [...current];
        updated[index] = next;
        return updated;
      });
      setRefreshIndex((current) => current + 1);
    };

    window.addEventListener(CREATED_EVENTS.appointment, handleUpsert);
    window.addEventListener(UPDATED_EVENTS.appointment, handleUpsert);

    return () => {
      active = false;
      window.removeEventListener(CREATED_EVENTS.appointment, handleUpsert);
      window.removeEventListener(UPDATED_EVENTS.appointment, handleUpsert);
    };
  }, [enabled, refreshIndex]);

  const refetch = useCallback(() => {
    setRefreshIndex((current) => current + 1);
  }, []);

  return { appointments, isLoading, error, refetch };
}
