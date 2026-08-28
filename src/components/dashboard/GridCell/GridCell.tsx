import { useDroppable } from "@dnd-kit/react";
import { ReactNode } from "react";

interface GridCellProps {
  row: number;
  col: number;
  size: number;
  children: ReactNode;
  isPathCell?: boolean;
  onMouseEnter?: () => void;
  onClick?: () => void;
}

export function GridCell({
  row,
  col,
  size,
  children,
  isPathCell = false,
  onMouseEnter,
  onClick,
}: GridCellProps) {
  const { ref } = useDroppable({
    id: `cell-${row}-${col}`,
    data: { row, col },
  });

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className="relative flex items-center justify-center border border-white/10"
      style={{
        width: size,
        height: size,

        backgroundColor: isPathCell ? "rgba(34, 139, 230, 0.25)" : undefined,
      }}
    >
      {children}
    </div>
  );
}
