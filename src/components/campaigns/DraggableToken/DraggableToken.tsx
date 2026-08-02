import { useDraggable } from "@dnd-kit/react";
import { Token } from "../../../types/campaigns";
import "./DraggableToken.css";

interface DraggableTokenProps {
  token: Token;
}

export function DraggableToken({ token }: DraggableTokenProps) {
  const { ref } = useDraggable({
    id: token.id,
    data: token,
  });

  return (
    <div ref={ref} className="token-card">
      <div className="token-avatar">
        {token.imageUrl ? (
          <img src={token.imageUrl} alt={token.name} draggable={false} />
        ) : (
          <span>{token.name[0]}</span>
        )}
      </div>

      <span className="token-name">{token.name}</span>
    </div>
  );
}