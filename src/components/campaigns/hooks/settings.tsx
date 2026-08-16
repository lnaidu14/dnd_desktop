import { useEffect, useState } from "react";
import {
  BaseDirectory,
  exists,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { Settings } from "../../../types/system";

const DEFAULT_SETTINGS: Settings = {
  username: "",
  lastOpenedCampaign: null,
};

const SETTINGS_FILE = "settings.json";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const fileExists = await exists(SETTINGS_FILE, {
          baseDir: BaseDirectory.AppData,
        });

        if (!fileExists) {
          await writeTextFile(
            SETTINGS_FILE,
            JSON.stringify(DEFAULT_SETTINGS, null, 2),
            {
              baseDir: BaseDirectory.AppData,
            },
          );

          setSettings(DEFAULT_SETTINGS);
          return;
        }

        const contents = await readTextFile(SETTINGS_FILE, {
          baseDir: BaseDirectory.AppData,
        });

        const savedSettings = JSON.parse(contents);

        setSettings({
          ...DEFAULT_SETTINGS,
          ...savedSettings,
        });
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function updateSettings(newPartialSettings: Partial<Settings>) {
    const updated = { ...settings, ...newPartialSettings };

    setSettings(updated);

    try {
      await writeTextFile(SETTINGS_FILE, JSON.stringify(updated, null, 2), {
        baseDir: BaseDirectory.AppData,
      });
    } catch (err) {
      console.error("Failed to update settings.json:", err);
    }
  }

  return {
    settings,
    updateSettings,
    isLoading,
  };
}
