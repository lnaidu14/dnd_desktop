import { Card, Group, Text, Button, Tooltip, Box } from "@mantine/core";
import { Campaign } from "../../../types/campaigns";

type CampaignSelectionProps = {
  campaigns: Campaign[];

  onSelectCampaign: (campaign: Campaign) => void;

  onDeleteCampaign: (e: React.MouseEvent, campaignId: string) => void;
};

export default function CampaignSelection({
  campaigns,
  onSelectCampaign,
  onDeleteCampaign,
}: CampaignSelectionProps) {
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
              }}
            >
              <Group justify="space-between" mt="md" mb="xs">
                <Text fw={500}>{campaign.name}</Text>
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
