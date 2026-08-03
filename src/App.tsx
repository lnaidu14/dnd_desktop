import { useState, useEffect } from "react";
import {
  exists,
  readTextFile,
  writeTextFile,
  readDir,
  mkdir,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import { CreateCampaignModal } from "./components/campaigns/CreateCampaignModal/CreateCampaignModal";
import { CampaignDashboard } from "./components/campaigns/CampaignDashboard/CampaignDashboard";
import { Campaign } from "./types/campaigns";
import { remove } from "@tauri-apps/plugin-fs";
import "./App.css";

const SETTINGS_FILE = "settings.json";

interface Settings {
  user_name?: string | null;
  theme: string;
  last_opened_campaign: string | null;
  volume: number;
}

const DEFAULT_SETTINGS: Settings = {
  user_name: null,
  theme: "dark",
  last_opened_campaign: null,
  volume: 80,
};

function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [inputName, setInputName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function loadAllCampaigns(lastOpenedId?: string | null) {
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

  // Delete a campaign and all its embedded scenes
  async function handleDeleteCampaign(e: React.MouseEvent, campaignId: string) {
    e.stopPropagation(); // Prevents opening the campaign when clicking delete

    if (
      !confirm(
        "Are you sure you want to delete this campaign? All scenes inside it will be permanently deleted.",
      )
    ) {
      return;
    }

    try {
      // 1. Delete the JSON file from disk (cascades to all scenes inside)
      await remove(`campaigns/${campaignId}/${campaignId}.json`, {
        baseDir: BaseDirectory.AppData,
      });

      // 2. Remove from React state
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));

      // 3. Clear active campaign if the deleted one was open
      if (activeCampaign?.id === campaignId) {
        setActiveCampaign(null);
        await updateSettings({ last_opened_campaign: null });
      }
    } catch (err) {
      console.error("Failed to delete campaign:", err);
    }
  }

  // 2. Initial Boot Load
  useEffect(() => {
    async function loadSettingsAndCampaigns() {
      try {
        const fileExists = await exists(SETTINGS_FILE, {
          baseDir: BaseDirectory.AppData,
        });

        let loadedSettings = DEFAULT_SETTINGS;

        if (fileExists) {
          const content = await readTextFile(SETTINGS_FILE, {
            baseDir: BaseDirectory.AppData,
          });
          loadedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
          setSettings(loadedSettings);
        } else {
          await mkdir("", { baseDir: BaseDirectory.AppData, recursive: true });
          await writeTextFile(
            SETTINGS_FILE,
            JSON.stringify(DEFAULT_SETTINGS, null, 2),
            { baseDir: BaseDirectory.AppData },
          );
        }

        // Fetch campaigns after settings are ready
        await loadAllCampaigns(loadedSettings.last_opened_campaign);
      } catch (err) {
        console.error("Failed during boot initialization:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettingsAndCampaigns();
  }, []);

  async function updateSettings(newPartialSettings: Partial<Settings>) {
    const updated = { ...settings, ...newPartialSettings };
    setSettings(updated);

    try {
      await writeTextFile(SETTINGS_FILE, JSON.stringify(updated, null, 2), {
        baseDir: BaseDirectory.AppData,
      });
    } catch (err) {
      console.error("Failed to update settings.json:", err);
    }
  }

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!inputName.trim()) return;
    updateSettings({ user_name: inputName.trim() });
  }

  // 3. Handle when a new campaign is created
  async function handleCampaignCreated(newCampaign: Campaign) {
    setCampaigns((prev) => [...prev, newCampaign]);
    setActiveCampaign(newCampaign);
    setIsModalOpen(false);

    await updateSettings({ last_opened_campaign: newCampaign.id });
  }

  // 4. Handle switching active campaigns
  async function handleSelectCampaign(campaign: Campaign) {
    setActiveCampaign(campaign);
    await updateSettings({ last_opened_campaign: campaign.id });
  }

  // 5. Handle updating a campaign (e.g. adding scenes)
  function handleUpdateCampaign(updatedCampaign: Campaign) {
    setActiveCampaign(updatedCampaign);
    setCampaigns((prev) =>
      prev.map((c) => (c.id === updatedCampaign.id ? updatedCampaign : c)),
    );
  }

  // 6. Handle back button from dashboard
  async function handleBackToCampaigns() {
    setActiveCampaign(null);
    await updateSettings({ last_opened_campaign: null });
  }

  if (isLoading) {
    return <div style={{ padding: "20px" }}>Loading app settings...</div>;
  }

  if (!settings.user_name) {
    return (
      <div style={{ padding: "40px", maxWidth: "400px", margin: "0 auto" }}>
        <h2>Welcome to VTT Desktop 🎲</h2>
        <p>
          Looks like this is your first time opening the app. What should we
          call you?
        </p>

        <form
          onSubmit={handleSaveName}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <input
            type="text"
            placeholder="Enter your name..."
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "1rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
            autoFocus
          />
          <button
            type="submit"
            style={{
              padding: "10px",
              cursor: "pointer",
              fontSize: "1rem",
              background: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Save & Continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        margin: 0,
        padding: 0,
      }}
    >
      {/* If a campaign is active, render the Campaign Dashboard taking 100% viewport space */}
      {activeCampaign ? (
        <CampaignDashboard
          campaign={activeCampaign}
          onUpdateCampaign={handleUpdateCampaign}
          onBack={handleBackToCampaigns}
        />
      ) : (
        /* Otherwise, render the Campaign Selection View */
        <div
          style={{
            padding: "20px",
            height: "100%",
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1>Welcome back, {settings.user_name}! 👋</h1>
            <span>
              Theme: {settings.theme} | Volume: {settings.volume}%
            </span>
          </header>

          <hr />

          <section style={{ marginTop: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2>Campaigns</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                style={{ padding: "8px 16px", cursor: "pointer" }}
              >
                + New Campaign
              </button>
            </div>

            {campaigns.length === 0 ? (
              <p style={{ color: "#888", marginTop: "12px" }}>
                No campaigns found. Click "+ New Campaign" to get started!
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "16px",
                  marginTop: "16px",
                }}
              >
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    onClick={() => handleSelectCampaign(camp)}
                    style={{
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #444",
                      backgroundColor: "#1e1e1e",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <h3 style={{ margin: "0 0 8px 0" }}>{camp.name}</h3>
                      <button
                        onClick={(e) => handleDeleteCampaign(e, camp.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "1rem",
                        }}
                        title="Delete Campaign"
                      >
                        🗑️
                      </button>
                    </div>
                    <p
                      style={{ fontSize: "0.85rem", color: "#aaa", margin: 0 }}
                    >
                      {camp.description || "No description provided."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {isModalOpen && (
        <CreateCampaignModal
          onCampaignCreated={handleCampaignCreated}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
