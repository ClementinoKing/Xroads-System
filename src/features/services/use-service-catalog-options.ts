import { useEffect, useState } from "react";
import type { ServiceCategoryRecord, ServicePriceListRecord, ServiceSectionRecord } from "../../data/services";
import { loadServiceCatalogOptions } from "./services-service";

type ServiceCatalogOptionsState = {
  categories: ServiceCategoryRecord[];
  sections: ServiceSectionRecord[];
  priceLists: ServicePriceListRecord[];
  isLoading: boolean;
  error: string | null;
};

const emptyState: ServiceCatalogOptionsState = {
  categories: [],
  sections: [],
  priceLists: [],
  isLoading: false,
  error: null,
};

export function useServiceCatalogOptions(enabled: boolean) {
  const [state, setState] = useState<ServiceCatalogOptionsState>({
    ...emptyState,
    isLoading: enabled,
  });

  useEffect(() => {
    if (!enabled) {
      setState(emptyState);
      return;
    }

    let active = true;

    async function run() {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      const result = await loadServiceCatalogOptions();

      if (!active) {
        return;
      }

      setState({
        categories: result.data.categories,
        sections: result.data.sections,
        priceLists: result.data.priceLists,
        isLoading: false,
        error: result.error,
      });
    }

    void run();

    return () => {
      active = false;
    };
  }, [enabled]);

  return state;
}
