import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

type TablePaginationProps = {
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
};

export function TablePagination({
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = "items",
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(safePage * pageSize, totalItems);

  return (
    <div className={cn("flex flex-col gap-4 border-t border-slate-100 px-5 py-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {totalItems === 0 ? (
          <span>No {itemLabel} to show</span>
        ) : (
          <span>
            Showing <span className="font-semibold text-slate-950 dark:text-slate-50">{start}</span> to{" "}
            <span className="font-semibold text-slate-950 dark:text-slate-50">{end}</span> of{" "}
            <span className="font-semibold text-slate-950 dark:text-slate-50">{totalItems}</span> {itemLabel}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {onPageSizeChange ? (
          <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Rows</span>
            <select
              className="input h-10 w-20 px-3 text-sm"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-3"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage <= 1 || totalItems === 0}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
            Prev
          </Button>
          <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-200">
            Page {safePage} of {totalPages}
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-3"
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages || totalItems === 0}
            aria-label="Next page"
          >
            Next
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
