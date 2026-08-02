import { useDroppable } from "@dnd-kit/react";

export function TokenTrash() {
  const { ref } = useDroppable({
    id: "trash",
  });

  return (
    <div
      ref={ref}
      style={{
        height: 50,
        marginTop: 10,
        background: "#441111",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      🗑 Drop token here
    </div>
  );
}