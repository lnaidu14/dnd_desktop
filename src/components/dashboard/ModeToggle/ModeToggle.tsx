import { Button, Tooltip } from "@mantine/core";
import { Swords, Telescope } from "lucide-react";

interface ModeToggleProps {
  toggled: boolean;
  onChange: (toggled: boolean) => void;
}

export default function ModeToggle({ toggled, onChange }: ModeToggleProps) {
  return (
    <Tooltip
      label={toggled ? "Switch to Exploration Mode" : "Switch to Combat Mode"}
      withArrow
      openDelay={300}
    >
      <Button
        onClick={() => onChange(!toggled)}
        aria-label={
          toggled ? "Switch to Exploration Mode" : "Switch to Combat Mode"
        }
        p={0}
        className="
          group
          h-11 w-11
          rounded-full
          transition-transform duration-150
          hover:scale-105
          hover:ring-2
          hover:ring-white/70
          hover:ring-offset-0
          active:scale-95
        "
        styles={{
          root: {
            minWidth: 44,
            minHeight: 44,
            border: "none",
            background: "transparent",
            boxShadow: "none",
          },
        }}
      >
        <div
          className="relative h-11 w-11"
          style={{
            perspective: "600px",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              transformStyle: "preserve-3d",
              transform: toggled ? "rotateY(180deg)" : "rotateY(0deg)",
              transition: "transform 500ms ease-in-out",
            }}
          >
            <div
              className="
                absolute inset-0
                flex items-center justify-center
                rounded-full
                border-2 border-yellow-300
                bg-gradient-to-br
                from-yellow-300 via-yellow-500 to-yellow-700
                shadow-[0_3px_8px_rgba(0,0,0,0.5)]
              "
              style={{
                backfaceVisibility: "hidden",
              }}
            >
              <Telescope
                size={28}
                strokeWidth={2.3}
                className="text-zinc-900"
              />
            </div>

            <div
              className="
                absolute inset-0
                flex items-center justify-center
                rounded-full
                border-2 border-yellow-300
                bg-gradient-to-br
                from-yellow-300 via-yellow-500 to-yellow-700
                shadow-[0_3px_8px_rgba(0,0,0,0.5)]
              "
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <Swords size={28} strokeWidth={2.3} className="text-zinc-900" />
            </div>
          </div>
        </div>
      </Button>
    </Tooltip>
  );
}
