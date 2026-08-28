import { Switch } from "@mantine/core";
import { Swords, Telescope } from "lucide-react";

export default function ModeToggle() {
  return (
    <>
      <div>
        <Switch
          size="xl"
          color="dark.4"
          onLabel={
            <Telescope size={16} color="var(--mantine-color-yellow-4)" />
          }
          offLabel={<Swords size={16} color="var(--mantine-color-blue-6)" />}
        />
      </div>
    </>
  );
}
