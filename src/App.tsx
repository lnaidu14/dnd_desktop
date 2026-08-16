import { useEffect } from "react";
import { CreateCampaignModal } from "./components/campaigns/CreateCampaignModal/CreateCampaignModal";
import { CampaignDashboard } from "./components/dashboard/CampaignDashboard/CampaignDashboard";
import "./App.css";
import CampaignSelection from "./components/campaigns/CampaignSelection/CampaignSelection";
import { useCampaigns } from "./components/campaigns/hooks/campaigns";
import { useSettings } from "./components/campaigns/hooks/settings";
import { MantineProvider, Container, Button } from "@mantine/core";
import "@mantine/core/styles.css";
import { Plus } from "lucide-react";

function App() {
  const { settings } = useSettings();

  const {
    campaigns,
    loadCampaigns,
    isCreateCampaignModalOpen,
    setIsCreateCampaignModalOpen,
    handleCampaignCreated,
    handleSelectCampaign,
    handleDeleteCampaign,
  } = useCampaigns();

  useEffect(() => {
    loadCampaigns(settings.lastOpenedCampaign);
  }, [settings.lastOpenedCampaign]);

  if (!settings.username) {
    return <div>Username not set</div>;
  }

  return (
    <MantineProvider defaultColorScheme="dark">
      <Container fluid>
        <div className="grid grid-cols-3 items-center pt-5">
          <div />

          <h1 className="text-center text-3xl font-bold">
            Campaign Selection Screen
          </h1>

          <div className="flex justify-end">
            <Button
              size="md"
              color="blue"
              leftSection={<Plus size={18} />}
              onClick={() => setIsCreateCampaignModalOpen(true)}
              className="transition-transform duration-200 hover:scale-[1.03]"
            >
              New Campaign
            </Button>
          </div>
        </div>

        <CampaignSelection
          campaigns={campaigns}
          onSelectCampaign={handleSelectCampaign}
          onDeleteCampaign={handleDeleteCampaign}
        />

        {isCreateCampaignModalOpen && (
          <CreateCampaignModal
            onCampaignCreated={handleCampaignCreated}
            onClose={() => setIsCreateCampaignModalOpen(false)}
          />
        )}
      </Container>
    </MantineProvider>
  );
}

export default App;
