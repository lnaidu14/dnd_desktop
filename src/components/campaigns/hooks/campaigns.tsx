import { useState } from "react";
import { Campaign } from "../../../types/campaigns";
import {
  BaseDirectory,
  exists,
  mkdir,
  readDir,
  readTextFile,
  remove,
} from "@tauri-apps/plugin-fs";
import { confirm } from "@tauri-apps/plugin-dialog";

import { useSettings } from "./settings";

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);

  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] =
    useState(false);
  const { updateSettings } = useSettings();

  async function loadCampaigns(lastOpenedId?: string | null) {
    try {
      const dirExists = await exists("campaigns", {
        baseDir: BaseDirectory.AppData,
      });

      if (!dirExists) {
        await mkdir("campaigns", {
          baseDir: BaseDirectory.AppData,
          recursive: true,
        });
        return;
      }

      const entries = await readDir("campaigns", {
        baseDir: BaseDirectory.AppData,
      });

      const loadedCampaigns: Campaign[] = [];

      for (const entry of entries) {
        if (entry.isDirectory) {
          const campaignFile = `campaigns/${entry.name}/${entry.name}.json`;

          const fileExists = await exists(campaignFile, {
            baseDir: BaseDirectory.AppData,
          });

          if (fileExists) {
            const content = await readTextFile(campaignFile, {
              baseDir: BaseDirectory.AppData,
            });

            const campaignData: Campaign = JSON.parse(content);
            loadedCampaigns.push(campaignData);
          }
        }
      }

      setCampaigns(loadedCampaigns);

      if (lastOpenedId) {
        const found = loadedCampaigns.find((c) => c.id === lastOpenedId);
        if (found) setActiveCampaign(found);
      }
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    }
  }

  async function handleDeleteCampaign(e: React.MouseEvent, campaignId: string) {
    e.stopPropagation();

    const confirmed = await confirm(
      "Are you sure you want to delete this campaign? All scenes inside it will be permanently deleted.",
      {
        title: "Delete Campaign",
        kind: "warning",
      },
    );

    if (!confirmed) {
      return;
    }

    try {
      await remove(`campaigns/${campaignId}`, {
        baseDir: BaseDirectory.AppData,
        recursive: true,
      });

      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));

      if (activeCampaign?.id === campaignId) {
        setActiveCampaign(null);
      }
    } catch (err) {
      console.error("Failed to delete campaign:", err);
    }
  }

  function handleUpdateCampaign(updatedCampaign: Campaign) {
    setActiveCampaign(updatedCampaign);
    setCampaigns((prev) =>
      prev.map((c) => (c.id === updatedCampaign.id ? updatedCampaign : c)),
    );
  }

  // 3. Handle when a new campaign is created
  async function handleCampaignCreated(newCampaign: Campaign) {
    setCampaigns((prev) => [...prev, newCampaign]);
    setActiveCampaign(newCampaign);
    setIsCreateCampaignModalOpen(false);

    await updateSettings({ lastOpenedCampaign: newCampaign.id });
  }

  // 4. Handle switching active campaigns
  async function handleSelectCampaign(campaign: Campaign) {
    setActiveCampaign(campaign);
    await updateSettings({ lastOpenedCampaign: campaign.id });
  }

  // 6. Handle back button from dashboard
  async function handleBackToCampaigns() {
    setActiveCampaign(null);
    await updateSettings({ lastOpenedCampaign: null });
  }

  return {
    campaigns,
    loadCampaigns,
    isCreateCampaignModalOpen,
    setIsCreateCampaignModalOpen,
    handleCampaignCreated,
    handleSelectCampaign,
    handleDeleteCampaign,
  };
}
