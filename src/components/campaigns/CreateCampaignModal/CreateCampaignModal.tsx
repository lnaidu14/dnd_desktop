import { useState } from "react";
import {
  writeTextFile,
  mkdir,
  BaseDirectory,
  exists,
} from "@tauri-apps/plugin-fs";

import { useForm } from "@mantine/form";
import { Campaign } from "../../../types/campaigns";
import { Button, SimpleGrid, Textarea, TextInput } from "@mantine/core";

interface CreateCampaignModalProps {
  onCampaignCreated: (campaign: Campaign) => void;
  onClose: () => void;
}

interface CampaignFormValues {
  name: string;
  description: string;
}

export function CreateCampaignModal({
  onCampaignCreated,
  onClose,
}: CreateCampaignModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  const campaignForm = useForm<CampaignFormValues>({
    mode: "uncontrolled",
    initialValues: {
      name: "",
      description: "",
    },

    validate: {
      name: (value) =>
        value.length < 1 ? "Name must have at least 1 letter" : null,
    },
  });

  async function handleCreateCampaign(values: CampaignFormValues) {
    const { name, description } = values;
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const dirExists = await exists("campaigns", {
        baseDir: BaseDirectory.AppData,
      });
      if (!dirExists) {
        await mkdir("campaigns", {
          baseDir: BaseDirectory.AppData,
          recursive: true,
        });
      }

      const id = `campaign_${Date.now()}`;
      const now = new Date().toISOString();

      const newCampaign: Campaign = {
        id,
        name: name.trim(),
        description: description.trim(),
        updatedAt: now,
        activeSceneId: "",
        scenes: [],
      };

      const campaignDir = `campaigns/${id}`;

      if (!(await exists(campaignDir, { baseDir: BaseDirectory.AppData }))) {
        await mkdir(campaignDir, {
          baseDir: BaseDirectory.AppData,
          recursive: true,
        });
      }

      const assetsDir = `${campaignDir}/assets`;

      await mkdir(`${campaignDir}/assets`, {
        baseDir: BaseDirectory.AppData,
        recursive: true,
      });

      await mkdir(`${assetsDir}/tokens`, {
        baseDir: BaseDirectory.AppData,
        recursive: true,
      });

      await mkdir(`${assetsDir}/maps`, {
        baseDir: BaseDirectory.AppData,
        recursive: true,
      });

      await writeTextFile(
        `${campaignDir}/${id}.json`,
        JSON.stringify(newCampaign, null, 2),
        { baseDir: BaseDirectory.AppData },
      );

      console.log("Campaign saved successfully:", newCampaign);
      onCampaignCreated(newCampaign);
    } catch (err) {
      console.error("Failed to create campaign:", err);
      alert(`Error saving campaign: ${err}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#222",
          padding: "24px",
          borderRadius: "8px",
          width: "400px",
        }}
      >
        <h3>Create New Campaign</h3>

        <form onSubmit={campaignForm.onSubmit(handleCreateCampaign)}>
          <TextInput
            label="Name"
            placeholder="e.g., Curse of Strahd"
            key={campaignForm.key("name")}
            {...campaignForm.getInputProps("name")}
          />
          <Textarea
            mt="sm"
            label="Description"
            placeholder="Brief summary..."
            key={campaignForm.key("description")}
            {...campaignForm.getInputProps("description")}
          />
          <SimpleGrid cols={2}>
            <Button mt="sm" onClick={onClose} color="red">
              Cancel
            </Button>
            <Button disabled={isSaving} type="submit" mt="sm">
              {isSaving ? "Creating..." : "Create"}
            </Button>
          </SimpleGrid>
        </form>
      </div>
    </div>
  );
}
