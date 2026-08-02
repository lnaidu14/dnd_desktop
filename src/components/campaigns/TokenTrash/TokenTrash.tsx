import { useDroppable } from "@dnd-kit/react";
import { Trash2 } from "lucide-react";

export function TokenTrash() {
  const { ref } = useDroppable({
    id: "trash",
  });

  return (
    <div
      ref={ref}
      style={{
        height: 50,
        width: 50,
        marginTop: 10,
        background: "red",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "10%",
      }}
    >
      <Trash2 />
    </div>
  );
}