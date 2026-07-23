import { useDroppable } from "@dnd-kit/react";
import { ReactNode } from "react";

interface DroppableGridCellProps {
  id: string;
  children: ReactNode;
}

export function DroppableGridCell({ id, children }: DroppableGridCellProps) {
  const { ref } = useDroppable({
    id,
  });

  return (
    <div ref={ref} style={{ width: 300, height: 300 }}>
      {children}
    </div>
  );
}
