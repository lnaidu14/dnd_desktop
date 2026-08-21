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
    <div ref={ref} className="h-full w-full cursor-grab active:cursor-grabbing">
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
