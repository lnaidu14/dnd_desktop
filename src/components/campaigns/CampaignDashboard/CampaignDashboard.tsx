import { useState, useEffect } from "react";
import { writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";
import { Campaign, Scene, Token } from "../../../types/campaigns";
import {
  saveMapAsset,
  getAssetUrl,
  saveTokenAsset,
} from "../../../utils/assets";
import "./CampaignDashboard.css";
import { MapCanvas } from "../MapCanvas/MapCanvas";
import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import { DragDropProvider } from "@dnd-kit/react";
import { DraggableToken } from "../DraggableToken/DraggableToken";

interface CampaignDashboardProps {
  campaign: Campaign;
  onUpdateCampaign: (updated: Campaign) => void;
  onBack: () => void;
}

export function CampaignDashboard({
  campaign,
  onUpdateCampaign,
  onBack,
}: CampaignDashboardProps) {
  const [activeTab, setActiveTab] = useState<"scenes" | "tokens" | "settings">(
    "scenes",
  );
  const [newSceneName, setNewSceneName] = useState("");
  const [selectedMapPath, setSelectedMapPath] = useState<string | null>(null);
  const [isAddingScene, setIsAddingScene] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeMapUrl, setActiveMapUrl] = useState<string | null>(null);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([
    { id: "1", name: "Goblin", imageUrl: "", x: 0, y: 0, size: 0 },
    { id: "2", name: "Hero", imageUrl: "", x: 0, y: 0, size: 0 },
    { id: "3", name: "Chest", imageUrl: "", x: 0, y: 0, size: 0 },
    { id: "4", name: "Dragon", imageUrl: "", x: 0, y: 0, size: 0 },
  ]);

  const activeScene = campaign.scenes.find(
    (s) => s.id === campaign.activeSceneId,
  );

  // Load the map asset for the currently active scene
  useEffect(() => {
    if (activeScene?.mapImage) {
      getAssetUrl(activeScene.mapImage)
        .then((url) => {
          setActiveMapUrl(url);
        })
        .catch((err) => console.error("Failed to load map asset:", err));
    } else {
      setActiveMapUrl(null);
    }
  }, [activeScene?.id, activeScene?.mapImage]);

  // Function to handle adding a token image file via Tauri file picker
  async function handleImportToken() {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] },
        ],
      });

      if (selected && typeof selected === "string") {
        // 1. Copy to AppData storage
        const relativePath = await saveTokenAsset(selected);

        // 2. Resolve to absolute path on disk
        const appData = await appDataDir();
        const cleanPath = relativePath.replace(/^[/\\]+/, "");
        const fullAbsolutePath = await join(appData, cleanPath);

        // 3. Convert absolute path for WebView rendering
        const displayUrl = convertFileSrc(fullAbsolutePath);

        const fileName =
          selected.split(/[/\\]/).pop()?.split(".")[0] || "New Token";

        setAvailableTokens((prev) => [
          ...prev,
          {
            id: `token_${Date.now()}`,
            name: fileName,
            relativePath,
            imageUrl: displayUrl, // Safe asset:// schema URL,
            x: 0,
            y: 0,
            size: 0,
          },
        ]);
      }
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("already been imported")
      ) {
        console.warn(err.message);
      } else {
        console.error("Failed to import token:", err);
      }
    }
  }

  // Function to handle adding token placement to active scene
  const handleAddTokenToActiveScene = async (Token: Token) => {
    if (!activeScene) return;

    const updatedTokens = [...(activeScene.tokens || []), Token];
    await handleUpdateActiveScene({ tokens: updatedTokens });
  };

  // Save changes to disk and lift state up
  async function saveAndEmit(updatedCampaign: Campaign) {
    try {
      await writeTextFile(
        `campaigns/${campaign.id}.json`,
        JSON.stringify(updatedCampaign, null, 2),
        { baseDir: BaseDirectory.AppData },
      );
      onUpdateCampaign(updatedCampaign);
    } catch (err) {
      console.error("Failed to save campaign JSON:", err);
    }
  }

  // Update properties on the active scene directly
  async function handleUpdateActiveScene(updatedFields: Partial<Scene>) {
    if (!campaign.activeSceneId) return;

    const updatedScenes = campaign.scenes.map((sc) =>
      sc.id === campaign.activeSceneId ? { ...sc, ...updatedFields } : sc,
    );

    const updatedCampaign: Campaign = {
      ...campaign,
      scenes: updatedScenes,
    };

    await saveAndEmit(updatedCampaign);
  }

  async function handlePickMapFile() {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] },
        ],
      });

      if (selected && typeof selected === "string") {
        setSelectedMapPath(selected);
      }
    } catch (err) {
      console.error("Failed to pick file:", err);
    }
  }

  async function handleDeleteScene(
    e: React.MouseEvent,
    sceneIdToDelete: string,
  ) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this scene?")) return;

    const remainingScenes = campaign.scenes.filter(
      (s) => s.id !== sceneIdToDelete,
    );
    const nextActiveId =
      campaign.activeSceneId === sceneIdToDelete
        ? remainingScenes[0]?.id
        : campaign.activeSceneId;

    const updatedCampaign: Campaign = {
      ...campaign,
      scenes: remainingScenes,
      activeSceneId: nextActiveId,
    };

    await saveAndEmit(updatedCampaign);
  }

  async function handleAddScene(e: React.FormEvent) {
    e.preventDefault();
    if (!newSceneName.trim()) return;

    let savedRelativePath = "";

    if (selectedMapPath) {
      try {
        savedRelativePath = await saveMapAsset(selectedMapPath);
      } catch (err) {
        console.error("Failed to copy map file to assets:", err);
      }
    }

    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      name: newSceneName.trim(),
      gridSize: 50,
      gridColor: "#ffffffff",
      gridEnabled: false,
      mapImage: savedRelativePath,
      tokens: [],
    };

    const updatedCampaign: Campaign = {
      ...campaign,
      scenes: [...campaign.scenes, newScene],
      activeSceneId: campaign.activeSceneId || newScene.id,
    };

    await saveAndEmit(updatedCampaign);
    setNewSceneName("");
    setSelectedMapPath(null);
    setIsAddingScene(false);
  }

  return (
    <div className="workspace-container">
      {/* Workspace Header */}
      <div className="workspace-header">
        <button onClick={onBack} className="btn-secondary">
          ← Back to Campaigns
        </button>
        <h2 style={{ margin: 0 }}>{campaign.name}</h2>
      </div>

      {/* Workspace Body */}
      <div className="workspace-body">
        {/* Collapsible Sidebar Inspector */}
        <aside className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
          <div className="sidebar-header">
            {!isSidebarCollapsed && (
              /* Tab Navigation Bar */
              <div className="inspector-tabs">
                <button
                  className={`tab-btn ${activeTab === "scenes" ? "active" : ""}`}
                  onClick={() => setActiveTab("scenes")}
                >
                  Scenes
                </button>
                <button
                  className={`tab-btn ${activeTab === "tokens" ? "active" : ""}`}
                  onClick={() => setActiveTab("tokens")}
                >
                  Tokens
                </button>
                <button
                  className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
                  onClick={() => setActiveTab("settings")}
                >
                  Settings
                </button>
              </div>
            )}
            <button
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? "▶" : "◀"}
            </button>
          </div>

          {!isSidebarCollapsed && (
            <>
              {/* TAB 1: SCENES */}
              {activeTab === "scenes" && (
                <div className="tab-content">
                  <ul className="scene-list">
                    {campaign.scenes.map((scene) => (
                      <li
                        key={scene.id}
                        className={`scene-item ${
                          scene.id === campaign.activeSceneId
                            ? "active-scene"
                            : ""
                        }`}
                        onClick={async () => {
                          const updated = {
                            ...campaign,
                            activeSceneId: scene.id,
                          };
                          await saveAndEmit(updated);
                        }}
                      >
                        <span>🗺️ {scene.name}</span>
                        <button
                          onClick={(e) => handleDeleteScene(e, scene.id)}
                          className="delete-scene-btn"
                          title="Delete Scene"
                        >
                          🗑️
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="sidebar-footer">
                    {isAddingScene ? (
                      <form
                        onSubmit={handleAddScene}
                        className="add-scene-form"
                      >
                        <input
                          type="text"
                          placeholder="Scene Name..."
                          value={newSceneName}
                          onChange={(e) => setNewSceneName(e.target.value)}
                          autoFocus
                        />

                        <button
                          type="button"
                          onClick={handlePickMapFile}
                          className="btn-secondary"
                        >
                          {selectedMapPath
                            ? "📁 Change Map Image"
                            : "📁 Choose Map Image"}
                        </button>

                        {selectedMapPath && (
                          <span className="selected-path-text">
                            Selected: {selectedMapPath.split(/[/\\]/).pop()}
                          </span>
                        )}

                        <div className="form-action-row">
                          <button type="submit" className="btn-primary">
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                              setIsAddingScene(false);
                              setSelectedMapPath(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setIsAddingScene(true)}
                        className="btn-primary full-width"
                      >
                        + Add Scene
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TOKENS */}
              {activeTab === "tokens" && (
                <div className="tab-content">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <h4 className="tab-section-title" style={{ margin: 0 }}>
                      Token Library
                    </h4>
                    <button
                      className="btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                      onClick={handleImportToken}
                    >
                      + Import Token
                    </button>
                  </div>
                  <p className="tab-section-subtitle">
                    Drag any token onto the active map view.
                  </p>

                  <DragDropProvider>
                    <DraggableToken tokens={availableTokens} />
                  </DragDropProvider>
                </div>
              )}

              {/* TAB 3: SCENE SETTINGS */}
              {activeTab === "settings" && (
                <div className="tab-content">
                  {activeScene ? (
                    <div className="settings-form">
                      <label>
                        Scene Name
                        <input
                          type="text"
                          value={activeScene.name}
                          onChange={(e) =>
                            handleUpdateActiveScene({ name: e.target.value })
                          }
                        />
                      </label>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={activeScene.gridEnabled ?? false}
                          onChange={(e) =>
                            handleUpdateActiveScene({
                              gridEnabled: e.target.checked,
                            })
                          }
                        />
                        Show Grid Overlay
                      </label>

                      <label>
                        Grid Size (px)
                        <input
                          type="number"
                          value={activeScene.gridSize || 50}
                          onChange={(e) =>
                            handleUpdateActiveScene({
                              gridSize: Number(e.target.value),
                            })
                          }
                        />
                      </label>
                    </div>
                  ) : (
                    <p style={{ color: "#71717a", fontSize: "0.85rem" }}>
                      No active scene to configure.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </aside>

        {/* Viewport Map Area */}
        <main
          className="map-viewport"
          onDragOver={(e) => {
            e.preventDefault();
            console.log("Hovering over map drop zone");
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragEnter={(e) => e.preventDefault()}
        >
          {activeScene ? (
            <MapCanvas
              activeScene={activeScene}
              mapUrl={activeMapUrl}
              onAddTokenToScene={handleAddTokenToActiveScene}
            />
          ) : (
            <div className="empty-viewport-message">
              <p style={{ color: "#71717a" }}>
                No active scene selected. Add a scene to get started!
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
