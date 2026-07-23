import { useDraggable } from "@dnd-kit/react";
import { Token } from "../../../types/campaigns";

interface DraggableTokenProps {
  tokens: Token[];
}

interface DraggableTokenItemProps {
  token: Token;
}

function DraggableTokenItem({ token }: DraggableTokenItemProps) {
  const { ref } = useDraggable({
    id: token.id,
  });

  return (
    <button ref={ref} className="token-card">
      <div className="token-avatar">
        {token.imageUrl ? (
          <img src={token.imageUrl} alt={token.name} />
        ) : (
          token.name[0]
        )}
      </div>
      <span style={{ fontSize: "0.75rem", textAlign: "center" }}>
        {token.name}
      </span>
    </button>
  );
}

export function DraggableToken({ tokens }: DraggableTokenProps) {
  return (
    <div className="token-grid">
      {tokens.map((token) => (
        <DraggableTokenItem key={token.id} token={token} />
      ))}
    </div>
  );
}
