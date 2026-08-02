import { useState, useEffect, useRef } from "react";
import {
  writeTextFile,
  BaseDirectory,
  exists,
  readDir,
} from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";
import { Campaign, Scene, Token } from "../../../types/campaigns";
import {
  saveMapAsset,
  getAssetUrl,
  saveTokenAsset,
} from "../../../utils/assets";
import "./CampaignDashboard.css";
import { MapGrid } from "../MapGrid/MapGrid";
import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import { DragDropProvider } from "@dnd-kit/react";
import { DraggableToken } from "../Token/DraggableToken";
import { TokenTrash } from "../TokenTrash/TokenTrash";

const GRID_SIZE = 50;

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

  const viewportRef = useRef<HTMLDivElement>(null);

  const [viewportSize, setViewportSize] = useState({
    width: 0,
    height: 0,
  });
  const [newSceneName, setNewSceneName] = useState("");
  const [selectedMapPath, setSelectedMapPath] = useState<string | null>(null);
  const [isAddingScene, setIsAddingScene] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeMapUrl, setActiveMapUrl] = useState<string | null>(null);
  const [defaultTokensExpanded, setDefaultTokensExpanded] = useState(true);
  const [customTokensExpanded, setCustomTokensExpanded] = useState(true);
  const defaultTokens: Token[] = [
    {
      id: "default_goblin",
      name: "Goblin",
      imageUrl: "/tokens/goblin.jfif",
      x: 0,
      y: 0,
      size: 0,
      isDefault: true,
    },
    {
      id: "default_chest",
      name: "Chest",
      imageUrl: "/tokens/chest.jpg",
      x: 0,
      y: 0,
      size: 0,
      isDefault: true,
    },
    {
      id: "default_dragon",
      name: "Dragon",
      imageUrl: "/tokens/dragon.jpg",
      x: 0,
      y: 0,
      size: 0,
      isDefault: true,
    },
  ];

  const [availableTokens, setAvailableTokens] =
    useState<Token[]>(defaultTokens);

  const [currentTokenDragging, setCurrentTokenDragging] = useState("");
  const activeScene = campaign.scenes.find(
    (s) => s.id === campaign.activeSceneId,
  );

  const placedTokens =
    activeScene?.tokens?.filter(
      (token) => token.row !== undefined && token.col !== undefined,
    ) ?? [];

  async function loadTokenAssets(): Promise<Token[]> {
    const tokenDir = "assets/tokens";

    const existsDir = await exists(tokenDir, {
      baseDir: BaseDirectory.AppData,
    });

    if (!existsDir) {
      return [];
    }

    const files = await readDir(tokenDir, {
      baseDir: BaseDirectory.AppData,
    });

    const appData = await appDataDir();

    return Promise.all(
      files
        .filter((file) => file.name)
        .map(async (file) => {
          const relativePath = `${tokenDir}/${file.name}`;

          const fullPath = await join(appData, relativePath);

          return {
            id: `token_${file.name}`,
            name: file.name.replace(/\.[^/.]+$/, ""),
            relativePath,
            imageUrl: convertFileSrc(fullPath),
            x: 0,
            y: 0,
            size: 0,
            isDefault: false,
          };
        }),
    );
  }

  useEffect(() => {
    if (!viewportRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setViewportSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(viewportRef.current);

    return () => observer.disconnect();
  }, []);

  const gridSize = activeScene?.gridSize ?? 50;

  const cols = Math.ceil((activeScene?.mapWidth ?? 0) / gridSize);
  const rows = Math.ceil((activeScene?.mapHeight ?? 0) / gridSize);

  useEffect(() => {
    console.log(viewportSize, rows, cols);
    console.log(viewportRef.current);
  }, [viewportSize]);

  useEffect(() => {
    async function loadTokens() {
      try {
        const tokens = await loadTokenAssets();

        setAvailableTokens([...defaultTokens, ...tokens]);
      } catch (err) {
        console.error("Failed loading tokens:", err);
      }
    }

    loadTokens();
  }, []);

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
        const relativePath = await saveTokenAsset(selected);

        const appData = await appDataDir();

        const cleanPath = relativePath.replace(/^[/\\]+/, "");

        const fullPath = await join(appData, cleanPath);

        const displayUrl = convertFileSrc(fullPath);

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
            isDefault: false,
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

  // Save changes to disk and lift state up
  async function saveAndEmit(updatedCampaign: Campaign) {
    try {
      await writeTextFile(
        `campaigns/${updatedCampaign.id}.json`,
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

    const updatedCampaign: Campaign = {
      ...campaign,
      scenes: campaign.scenes.map((sc) =>
        sc.id === campaign.activeSceneId ? { ...sc, ...updatedFields } : sc,
      ),
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

  async function handleDragStart(event: any) {
    if (event.cancelled) return;

    const { id } = event.operation.source;
    setCurrentTokenDragging(id);
  }

  async function handleDragMove(event: any) {
    if (event.cancelled) return;
  }

  async function handleDragOver(event: any) {
    if (event.cancelled) return;
  }

  async function handleDragEnd(event: any) {
    if (event.canceled) return;

    const { source, target } = event.operation;

    if (!target || !activeScene) {
      setCurrentTokenDragging("");
      return;
    }

    const token = source.data;

    // Dropped into trash
    if (target.id === "trash") {
      const isExistingToken = activeScene.tokens?.some(
        (t) => t.id === token.id,
      );

      if (isExistingToken) {
        // Remove from scene
        const updatedTokens = activeScene.tokens.filter(
          (t) => t.id !== token.id,
        );

        await handleUpdateActiveScene({
          tokens: updatedTokens,
        });

        // Return token to sidebar library
        setAvailableTokens((prev) => {
          const libraryId = token.sourceId ?? token.id;

          // Prevent duplicate sidebar tokens
          if (prev.some((t) => t.id === libraryId)) {
            return prev;
          }

          return [
            ...prev,
            {
              id: libraryId,
              name: token.name,
              imageUrl: token.imageUrl,
              relativePath: token.relativePath,
              x: 0,
              y: 0,
              size: 0,
              isDefault: token.isDefault ?? false,
            },
          ];
        });
      }

      setCurrentTokenDragging("");
      return;
    }

    const isExistingToken = activeScene.tokens?.some((t) => t.id === token.id);

    // Moving an existing token
    if (isExistingToken) {
      const updatedTokens = activeScene.tokens.map((t) =>
        t.id === token.id
          ? {
              ...t,
              row: target.data.row,
              col: target.data.col,
            }
          : t,
      );

      await handleUpdateActiveScene({
        tokens: updatedTokens,
      });

      setCurrentTokenDragging("");
      return;
    }

    // Adding a new token from library
    const placedToken = {
      ...token,
      id: crypto.randomUUID(),
      sourceId: token.id,
      row: target.data.row,
      col: target.data.col,
    };

    await handleUpdateActiveScene({
      tokens: [...(activeScene.tokens ?? []), placedToken],
    });

    // Remove from sidebar
    setAvailableTokens((prev) => prev.filter((t) => t.id !== token.id));

    setCurrentTokenDragging("");
  }

  return (
    <div className="workspace-container">
      <DragDropProvider
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Workspace Header */}
        <div className="workspace-header">
          <button onClick={onBack} className="btn-secondary">
            ← Back to Campaigns
          </button>
          <h2 style={{ margin: 0 }}>{campaign.name}</h2>
          <TokenTrash />
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
                title={
                  isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"
                }
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

                    {/* Default Tokens */}
                    <div className="token-section">
                      <button
                        className="token-section-header"
                        onClick={() =>
                          setDefaultTokensExpanded((prev) => !prev)
                        }
                      >
                        <span>
                          {defaultTokensExpanded ? "▼" : "▶"} Default Tokens
                        </span>

                        <span>
                          {
                            availableTokens.filter((token) => token.isDefault)
                              .length
                          }
                        </span>
                      </button>

                      {defaultTokensExpanded && (
                        <>
                          <p className="tab-section-subtitle">
                            Built-in game tokens.
                          </p>

                          <div className="token-grid">
                            {availableTokens
                              .filter((token) => token.isDefault)
                              .map((token) => (
                                <DraggableToken key={token.id} token={token} />
                              ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Custom Tokens */}
                    <div className="token-section">
                      <button
                        className="token-section-header"
                        onClick={() => setCustomTokensExpanded((prev) => !prev)}
                      >
                        <span>
                          {customTokensExpanded ? "▼" : "▶"} Custom Tokens
                        </span>

                        <span>
                          {
                            availableTokens.filter((token) => !token.isDefault)
                              .length
                          }
                        </span>
                      </button>

                      {customTokensExpanded && (
                        <>
                          <p className="tab-section-subtitle">
                            Imported tokens.
                          </p>

                          <div className="token-grid">
                            {availableTokens
                              .filter((token) => !token.isDefault)
                              .map((token) => (
                                <DraggableToken key={token.id} token={token} />
                              ))}
                          </div>
                        </>
                      )}
                    </div>
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
          <main ref={viewportRef} className="map-viewport">
            {activeScene ? (
              <MapGrid
                rows={rows}
                cols={cols}
                cellSize={GRID_SIZE}
                tokens={placedTokens}
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
      </DragDropProvider>
    </div>
  );
}
