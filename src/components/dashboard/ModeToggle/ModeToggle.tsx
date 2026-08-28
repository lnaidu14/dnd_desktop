import { Switch, Tooltip } from "@mantine/core";
import { Telescope, Swords } from "lucide-react";

interface ModeToggleProps {
  toggled: boolean;
  onChange: (toggled: boolean) => void;
}

export default function ModeToggle({ toggled, onChange }: ModeToggleProps) {
  return (
    <div className="group relative h-11 w-11">
      <div
        className={`
    flex h-11 w-11 items-center justify-center
    rounded-full
    border border-zinc-600
    bg-zinc-900/90
    shadow-lg
    transition-all duration-150
    group-hover:scale-95
    group-hover:opacity-0
  `}
      >
        {toggled ? (
          <Swords size={20} className="text-blue-500" />
        ) : (
          <Telescope size={20} className="text-yellow-400" />
        )}
      </div>

      <div
        className="
          absolute right-0 top-0
          opacity-0
          pointer-events-none
          transition-opacity duration-150
          group-hover:pointer-events-auto
          group-hover:opacity-100
        "
      >
        <Tooltip
          label={
            toggled ? "Switch to Exploration Mode" : "Switch to Combat Mode"
          }
          withArrow
          openDelay={300}
          refProp="rootRef"
        >
          <Switch
            size="xl"
            color="dark.4"
            checked={toggled}
            onChange={(event) => onChange(event.currentTarget.checked)}
            onLabel={<Telescope size={16} className="text-yellow-400" />}
            offLabel={<Swords size={16} className="text-blue-500" />}
          />
        </Tooltip>
      </div>
    </div>
  );
}
