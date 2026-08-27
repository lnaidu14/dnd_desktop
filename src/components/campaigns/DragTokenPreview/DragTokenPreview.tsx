import { Token } from "../../../types/campaigns";

interface DragTokenPreviewProps {
  token: Token;
}

export function DragTokenPreview({ token }: DragTokenPreviewProps) {
  return (
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: "50%",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        transform: "scale(1.05)",
      }}
    >
      {token.imageUrl ? (
        <img
          src={token.imageUrl}
          alt={token.name}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#27272a",
            fontWeight: 700,
          }}
        >
          {token.name[0]}
        </div>
      )}
    </div>
  );
}
