import { useState } from "react";
import { Settings } from "../../../types/system";
import { BaseDirectory, writeTextFile } from "@tauri-apps/plugin-fs";

const DEFAULT_SETTINGS: Settings = {
  username: "Lala",
  lastOpenedCampaign: null,
};

const SETTINGS_FILE = "settings.json";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

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

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!inputName.trim()) return;
    updateSettings({ user_name: inputName.trim() });
  }
  return {
    settings,
    updateSettings,
  };
}
