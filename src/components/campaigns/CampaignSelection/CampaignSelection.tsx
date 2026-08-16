import {
  Card,
  Group,
  Text,
  Button,
  Tooltip,
  Box,
  Modal,
  Textarea,
  TextInput,
  ActionIcon,
} from "@mantine/core";
import { Campaign } from "../../../types/campaigns";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

type CampaignSelectionProps = {
  campaigns: Campaign[];

  onSelectCampaign: (campaign: Campaign) => void;

  onUpdateCampaign: (campaign: Campaign) => void;

  onDeleteCampaign: (e: React.MouseEvent, campaignId: string) => void;
};

export default function CampaignSelection({
  campaigns,
  onSelectCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
}: CampaignSelectionProps) {
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleOpenEdit = (e: React.MouseEvent, campaign: Campaign) => {
    e.stopPropagation();

    setEditingCampaign(campaign);
    setName(campaign.name);
    setDescription(campaign.description ?? "");
  };

  const handleSave = () => {
    if (!editingCampaign) {
      return;
    }

    onUpdateCampaign({
      ...editingCampaign,
      name: name.trim(),
      description: description.trim(),
      updatedAt: new Date().toISOString(),
    });

    setEditingCampaign(null);
  };

  return (
    <>
      {campaigns.length === 0 ? (
        <div>
          <h1>No campaigns found. Click "+ New Campaign" to get started!</h1>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "16px",
            marginTop: "16px",
          }}
        >
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="transition-transform duration-300 ease-in-out hover:scale-105"
              shadow="sm"
              padding="lg"
              withBorder
              onClick={() => onSelectCampaign(campaign)}
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                cursor: "pointer",
              }}
            >
              <Group
                justify="space-between"
                align="center"
                wrap="nowrap"
                mb="xs"
              >
                <Tooltip label={campaign.name} withArrow openDelay={500}>
                  <Text
                    fw={500}
                    truncate="end"
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    {campaign.name}
                  </Text>
                </Tooltip>

                <Group gap={4} wrap="nowrap">
                  <Tooltip label="Edit campaign">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      radius="xl"
                      onClick={(e) => handleOpenEdit(e, campaign)}
                      aria-label={`Edit ${campaign.name}`}
                    >
                      <Pencil size={18} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label="Delete campaign">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      radius="xl"
                      onClick={(e) => onDeleteCampaign(e, campaign.id)}
                      aria-label={`Delete ${campaign.name}`}
                    >
                      <Trash2 size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>

              <Box
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Tooltip
                  label={campaign.description}
                  multiline
                  w={300}
                  withArrow
                  openDelay={1000}
                >
                  <Text size="sm" c="dimmed" lineClamp={3}>
                    {campaign.description || ""}
                  </Text>
                </Tooltip>
              </Box>
            </Card>
          ))}
        </div>
      )}

      <Modal
        opened={editingCampaign !== null}
        onClose={() => setEditingCampaign(null)}
        title="Edit Campaign"
        centered
      >
        <TextInput
          label="Campaign Name"
          placeholder="Campaign name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
        />

        <Textarea
          label="Description"
          placeholder="Campaign description"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          minRows={4}
          mt="md"
        />

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={() => setEditingCampaign(null)}>
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={!name.trim()}>
            Save Changes
          </Button>
        </Group>
      </Modal>
    </>
  );
}
