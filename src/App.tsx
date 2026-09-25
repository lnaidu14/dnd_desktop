import { useEffect, useState } from "react"; // Added useState
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

import Playground from "./components/Playground/Playground";

function App() {
  const { settings, updateSettings, isLoading } = useSettings();

  const [showPlayground, setShowPlayground] = useState(false);

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
    const handleKeyDown = (event: KeyboardEvent) => {
      // Shortcut: Ctrl + Alt + K (case-insensitive check)
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        event.stopPropagation();
        setShowPlayground((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);

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

      {showPlayground ? (
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: 50,
              left: 15,
              color: "#555",
              fontSize: "11px",
              zIndex: 9999,
            }}
          >
            🛠️ Sandbox Mode Active (Press Ctrl+Alt+K to exit)
          </div>
          <Playground />
        </div>
      ) : !settings.username ? (
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
