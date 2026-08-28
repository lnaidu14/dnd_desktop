import { useDraggable } from "@dnd-kit/react";
import { Token } from "../../../types/campaigns";

interface DraggableTokenProps {
  token: Token;
}

export function DraggableToken({ token }: DraggableTokenProps) {
  const { ref, isDragging } = useDraggable({
    id: token.id,
    data: token,
  });

  return (
    <div
      ref={ref}
      className="flex cursor-grab flex-col items-center gap-1 rounded-md p-2 transition-colors hover:bg-zinc-800 active:cursor-grabbing"
      style={{
        opacity: isDragging ? 0 : 1,
      }}
    >
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-zinc-800">
        {token.imageUrl ? (
          <img
            src={token.imageUrl}
            alt={token.name}
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-lg font-bold">{token.name[0]}</span>
        )}
      </div>

      <span className="w-full truncate text-center text-xs text-zinc-300">
        {token.name}
      </span>
    </div>
  );
}
