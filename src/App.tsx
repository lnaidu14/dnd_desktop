import { useEffect } from "react";
import { CreateCampaignModal } from "./components/campaigns/CreateCampaignModal/CreateCampaignModal";
import { CampaignDashboard } from "./components/dashboard/CampaignDashboard/CampaignDashboard";
import CampaignSelection from "./components/campaigns/CampaignSelection/CampaignSelection";
import { useCampaigns } from "./components/campaigns/hooks/campaigns";
import { useSettings } from "./components/campaigns/hooks/settings";
import { MantineProvider, Container, Button } from "@mantine/core";
import "@mantine/core/styles.css";
import { Loader, Plus } from "lucide-react";
import { InitUserModal } from "./components/campaigns/InitUserModal/InitUserModal";
import { Notifications, notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import "./App.css";

function App() {
  const { settings, updateSettings, isLoading } = useSettings();

  const {
    campaigns,
    activeCampaign,
    loadCampaigns,
    isCreateCampaignModalOpen,
    setIsCreateCampaignModalOpen,
    handleCampaignCreated,
    handleSelectCampaign,
    handleDeleteCampaign,
    handleUpdateCampaign,
    handleEditCampaign,
    handleBackToCampaigns,
  } = useCampaigns();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    loadCampaigns(settings.lastOpenedCampaign);

    if (settings.username) {
      notifications.show({
        title: `Hi ${settings.username}!`,
        message: "Welcome to dnd-custom!",
        color: "blue",
      });
    }
  }, [isLoading, settings.lastOpenedCampaign, settings.username]);

  if (isLoading) {
    return <Loader color="blue" />;
  }

  return (
    <MantineProvider defaultColorScheme="dark">
      <Notifications />

      {!settings.username ? (
        <InitUserModal onSettingsInit={updateSettings} />
      ) : (
        <Container fluid>
          {activeCampaign ? (
            <CampaignDashboard
              campaign={activeCampaign}
              onUpdateCampaign={handleUpdateCampaign}
              onBack={handleBackToCampaigns}
            />
          ) : (
            <>
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
                onUpdateCampaign={handleEditCampaign}
                onDeleteCampaign={handleDeleteCampaign}
              />

              {isCreateCampaignModalOpen && (
                <CreateCampaignModal
                  onCampaignCreated={handleCampaignCreated}
                  onClose={() => setIsCreateCampaignModalOpen(false)}
                />
              )}
            </>
          )}
        </Container>
      )}
    </MantineProvider>
  );
}

export default App;
