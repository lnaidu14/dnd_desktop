import { useDraggable } from "@dnd-kit/react";
import { Token } from "../../../types/campaigns";
import { motion } from "motion/react";

interface PlacedTokenProps {
  token: Token;
  isNew?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  visualOffset?: {
    x: number;
    y: number;
  };
  onMovementAnimationComplete?: () => void;
}

export function PlacedToken({
  token,
  isNew = false,
  selected = false,
  onSelect,
  visualOffset,
  onMovementAnimationComplete,
}: PlacedTokenProps) {
  const { ref, isDragging } = useDraggable({
    id: token.id,
    data: token,
  });

  return (
    <motion.div
      ref={ref}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
      className={`h-full w-full cursor-grab rounded-full active:cursor-grabbing ${
        isNew ? "token-placement" : ""
      }`}
      animate={{
        x: visualOffset?.x ?? 0,
        y: visualOffset?.y ?? 0,
      }}
      transition={{
        duration: 0.15,
        ease: "easeOut",
      }}
      style={{
        opacity: isDragging ? 0 : 1,
        boxShadow: selected
          ? "0 0 0 3px #228be6, 0 0 14px rgba(34, 139, 230, 0.8)"
          : undefined,
      }}
      onAnimationComplete={onMovementAnimationComplete}
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
    </motion.div>
  );
}
