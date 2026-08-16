import { useEffect } from "react";
import { CreateCampaignModal } from "./components/campaigns/CreateCampaignModal/CreateCampaignModal";
import { CampaignDashboard } from "./components/dashboard/CampaignDashboard/CampaignDashboard";
import "./App.css";
import CampaignSelection from "./components/campaigns/CampaignSelection/CampaignSelection";
import { useCampaigns } from "./components/campaigns/hooks/campaigns";
import { useSettings } from "./components/campaigns/hooks/settings";
import { MantineProvider, Container } from "@mantine/core";
import "@mantine/core/styles.css";

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
        <h1 className="text-center text-3xl font-bold pt-5">
          Campaign Selection Screen
        </h1>

        <CampaignSelection
          campaigns={campaigns}
          onCreateCampaign={() => setIsCreateCampaignModalOpen(true)}
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
