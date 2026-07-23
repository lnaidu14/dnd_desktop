import { useDroppable } from "@dnd-kit/react";

interface DroppableGridCellProps {
  row: number;
  col: number;
  size: number;
}

export function DroppableGridCell({ row, col, size }: DroppableGridCellProps) {
  const { ref } = useDroppable({
    id: `${row}-${col}`,
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
    />
  );
}
