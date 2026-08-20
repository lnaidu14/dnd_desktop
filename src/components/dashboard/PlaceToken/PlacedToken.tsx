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
      className="flex h-full w-full cursor-grab items-center justify-center active:cursor-grabbing"
    >
      {token.imageUrl ? (
        <img
          src={token.imageUrl}
          alt={token.name}
          draggable={false}
          className="h-[90%] w-[90%] object-contain"
        />
      ) : (
        <span className="text-lg font-bold">{token.name[0]}</span>
      )}
    </div>
  );
}
