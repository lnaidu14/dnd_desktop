import { useState } from "react";
import { useForm } from "@mantine/form";
import { Button, SimpleGrid, Textarea, TextInput } from "@mantine/core";
import { Settings } from "../../../types/system";

interface InitUserModalProps {
  onSettingsInit: (settings: Settings) => void;
}

interface UserInitFormValues {
  username: string;
}

export function InitUserModal({ onSettingsInit }: InitUserModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  const settingsForm = useForm<UserInitFormValues>({
    mode: "uncontrolled",
    initialValues: {
      username: "",
    },

    validate: {
      username: (value) =>
        value.length < 1 ? "Username must have at least 1 letter" : null,
    },
  });

  async function handleInitUser(values: UserInitFormValues) {
    const { username } = values;
    if (!username.trim()) return;

    setIsSaving(true);
    try {
      const newSettings: Settings = {
        username: username,
        lastOpenedCampaign: "",
      };

      onSettingsInit(newSettings);
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert(`Error saving settings: ${err}`);
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
        <form onSubmit={settingsForm.onSubmit(handleInitUser)}>
          <TextInput
            label="Username"
            key={settingsForm.key("username")}
            {...settingsForm.getInputProps("username")}
          />
          <SimpleGrid cols={2}>
            <Button disabled={isSaving} type="submit" mt="sm">
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </SimpleGrid>
        </form>
      </div>
    </div>
  );
}
