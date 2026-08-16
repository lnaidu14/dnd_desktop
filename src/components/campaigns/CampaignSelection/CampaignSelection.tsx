import { Card, Group, Text, Button } from "@mantine/core";
import { Campaign } from "../../../types/campaigns";

type CampaignSelectionProps = {
  campaigns: Campaign[];

  onCreateCampaign: () => void;

  onSelectCampaign: (campaign: Campaign) => void;

  onDeleteCampaign: (e: React.MouseEvent, campaignId: string) => void;
};

export default function CampaignSelection({
  campaigns,
  onCreateCampaign,
  onSelectCampaign,
  onDeleteCampaign,
}: CampaignSelectionProps) {
  return (
    <>
      <h2>Total: {campaigns.length} campaign(s)</h2>

      <Button onClick={onCreateCampaign}>+ New Campaign</Button>

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
              shadow="sm"
              padding="lg"
              withBorder
              onClick={() => onSelectCampaign(campaign)}
            >
              <Group justify="space-between" mt="md" mb="xs">
                <Text fw={500}>{campaign.name}</Text>
              </Group>

              <Text size="sm" c="dimmed">
                {campaign.description || ""}
              </Text>

              <Button
                variant="filled"
                color="red"
                fullWidth
                mt="md"
                onClick={(e) => onDeleteCampaign(e, campaign.id)}
              >
                Delete
              </Button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
