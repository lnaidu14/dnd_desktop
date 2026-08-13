import { useDraggable } from "@dnd-kit/react";
import { Token } from "../../../types/campaigns";

interface PlacedTokenProps {
  token: Token;
}

export function PlacedToken({ token }: PlacedTokenProps) {
  const { ref } = useDraggable({
    id: token.id,
    data: token,
  });

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "grab",
      }}
    >
      {token.imageUrl ? (
        <img
          src={token.imageUrl}
          alt={token.name}
          style={{
            width: "90%",
            height: "90%",
            objectFit: "contain",
          }}
        />
      ) : (
        token.name[0]
      )}
    </div>
  );
}
