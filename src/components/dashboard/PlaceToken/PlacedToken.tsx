import { useDraggable } from "@dnd-kit/react";
import { Token } from "../../../types/campaigns";

interface PlacedTokenProps {
  token: Token;
  isNew?: boolean;
}

export function PlacedToken({ token, isNew = false }: PlacedTokenProps) {
  const { ref, isDragging } = useDraggable({
    id: token.id,
    data: token,
  });

  return (
    <div
      ref={ref}
      className={`h-full w-full cursor-grab active:cursor-grabbing ${
        isNew ? "token-placement" : ""
      }`}
      style={{
        opacity: isDragging ? 0 : 1,
      }}
    >
      {token.imageUrl ? (
        <img
          src={token.imageUrl}
          alt={token.name}
          draggable={false}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-lg font-bold">
          {token.name[0]}
        </div>
      )}
    </div>
  );
}
