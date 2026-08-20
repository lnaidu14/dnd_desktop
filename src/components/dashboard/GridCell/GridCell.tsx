import { useDroppable } from "@dnd-kit/react";
import { ReactNode } from "react";
import "./GridCell.css";

interface GridCellProps {
  row: number;
  col: number;
  size: number;
  children: ReactNode;
}

export function GridCell({ row, col, size, children }: GridCellProps) {
  const { ref } = useDroppable({
    id: `cell-${row}-${col}`,
    data: { row, col },
  });

  return (
    <div
      ref={ref}
      className="relative flex items-center justify-center border border-white/10"
      style={{
        width: size,
        height: size,
      }}
    >
      {children}
    </div>
  );
}
