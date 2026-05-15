import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { cn } from "../../lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  rows: T[];
  columns: Array<DataTableColumn<T>>;
  getRowKey: (row: T) => string;
  minWidth?: string;
  emptyTitle: string;
  emptyDescription: string;
  onRowClick?: (row: T) => void;
};

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  minWidth = "760px",
  emptyTitle,
  emptyDescription,
  onRowClick,
}: DataTableProps<T>) {
  if (!rows.length) {
    return (
      <div className="p-5">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={cn("px-5 py-3", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              className={cn(
                onRowClick &&
                  "cursor-pointer hover:bg-xroads-50/40 focus:outline-none focus-visible:bg-xroads-50/60 dark:hover:bg-zinc-900/60 dark:focus-visible:bg-zinc-900/60",
              )}
            >
              {columns.map((column) => (
                <td key={column.key} className={cn("px-5 py-4", column.className)}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
