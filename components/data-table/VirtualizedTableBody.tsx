"use client";

import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Row } from "@tanstack/react-table";

interface VirtualizedTableBodyProps<T> {
  rows: Row<T>[];
  renderRow: (row: Row<T>) => React.ReactNode;
  emptyMessage?: string;
  estimateRowHeight?: number;
  overscan?: number;
  columnCount?: number;
}

export function VirtualizedTableBody<T>({
  rows,
  renderRow,
  emptyMessage = "No data found.",
  estimateRowHeight = 64,
  overscan = 5,
  columnCount = 10,
}: VirtualizedTableBodyProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
  });

  if (rows.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0;

  // For virtual scrolling, we use a div-based structure that mimics a table
  // This allows us to use absolute positioning for rows
  return (
    <div
      ref={parentRef}
      className="relative overflow-auto"
      style={{ maxHeight: "600px" }}
    >
      <div style={{ height: `${totalSize}px`, position: "relative" }}>
        <table className="w-full" style={{ tableLayout: "fixed" }}>
          <TableBody>
            {paddingTop > 0 && (
              <TableRow>
                <TableCell colSpan={columnCount} style={{ height: `${paddingTop}px`, padding: 0, border: "none" }} />
              </TableRow>
            )}
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <TableRow
                  key={row.id}
                  data-index={virtualRow.index}
                  data-state={row.getIsSelected() && "selected"}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: `${virtualRow.start}px`,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    display: "table-row",
                  }}
                >
                  {renderRow(row)}
                </TableRow>
              );
            })}
            {paddingBottom > 0 && (
              <TableRow>
                <TableCell colSpan={columnCount} style={{ height: `${paddingBottom}px`, padding: 0, border: "none" }} />
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>
    </div>
  );
}
