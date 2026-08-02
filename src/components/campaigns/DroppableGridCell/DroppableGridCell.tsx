import { useDroppable } from "@dnd-kit/react";
import { ReactNode } from "react";

interface DroppableGridCellProps {
  row: number;
  col: number;
  size: number;
  children?: ReactNode;
}

export function DroppableGridCell({
  row,
  col,
  size,
  children,
}: DroppableGridCellProps) {
  const { ref } = useDroppable({
    id: `cell-${row}-${col}`,
    data: {
      row,
      col,
    },
  });

  return (
    <div
      ref={ref}
      style={{
        width: size,
        height: size,
        boxSizing: "border-box",
        border: "1px solid rgba(255,0,0,0.2)",
      }}
    >
      {children}
    </div>
  );
}
