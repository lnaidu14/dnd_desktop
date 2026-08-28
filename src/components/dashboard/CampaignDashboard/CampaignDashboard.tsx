import { useState, useEffect, useRef } from "react";
import {
  writeTextFile,
  BaseDirectory,
  exists,
  readDir,
} from "@tauri-apps/plugin-fs";
import { open, confirm } from "@tauri-apps/plugin-dialog";
import { Campaign, Scene, Token } from "../../../types/campaigns";
import {
  saveMapAsset,
  getAssetUrl,
  saveTokenAsset,
  getImageSize,
  deleteMapAsset,
} from "../../../utils/assets";
import { MapGrid } from "../MapGrid/MapGrid";
import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { DraggableToken } from "../Token/DraggableToken";
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Container,
  Group,
  Flex,
  NumberInput,
  ScrollArea,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  UnstyledButton,
  Collapse,
} from "@mantine/core";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { notifications } from "@mantine/notifications";
import { DragTokenPreview } from "../../campaigns/DragTokenPreview/DragTokenPreview";
import { useForm } from "@mantine/form";

interface CampaignDashboardProps {
  campaign: Campaign;
  onUpdateCampaign: (updated: Campaign) => void;
  onBack: () => void;
}

interface SceneFormValues {
  name: string;
  mapImage: string | null;
}

export function CampaignDashboard({
  campaign,
  onUpdateCampaign,
  onBack,
}: CampaignDashboardProps) {
  const [activeTab, setActiveTab] = useState<"scenes" | "tokens" | "settings">(
    "scenes",
  );

  const sceneForm = useForm<SceneFormValues>({
    mode: "controlled",

    initialValues: {
      name: "",
      mapImage: null,
    },

    validate: {
      name: (value) =>
        value.trim().length < 1 ? "Scene name is required" : null,

      mapImage: (value) => (value === null ? "A map image is required" : null),
    },
  });

  const viewportRef = useRef<HTMLDivElement>(null);

  const [viewportSize, setViewportSize] = useState({
    width: 0,
    height: 0,
  });

  const [isAddingScene, setIsAddingScene] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeMapUrl, setActiveMapUrl] = useState<string | null>(null);
  const [defaultTokensExpanded, setDefaultTokensExpanded] = useState(true);
  const [customTokensExpanded, setCustomTokensExpanded] = useState(true);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

  const defaultTokens: Token[] = [
    {
      id: "default_goblin",
      name: "Goblin",
      imageUrl: "/tokens/goblin.jfif",
      row: 0,
      col: 0,
      type: "monster",
      allowDuplicates: true,
      isDefault: true,
    },
    {
      id: "default_chest",
      name: "Chest",
      imageUrl: "/tokens/chest.jpg",
      row: 0,
      col: 0,
      type: "object",
      allowDuplicates: true,
      isDefault: true,
    },
    {
      id: "default_dragon",
      name: "Dragon",
      imageUrl: "/tokens/dragon.jpg",
      row: 0,
      col: 0,
      type: "monster",
      allowDuplicates: false,
      isDefault: true,
    },
  ];

  const [availableTokens, setAvailableTokens] =
    useState<Token[]>(defaultTokens);

  const [draggingToken, setDraggingToken] = useState<Token | null>(null);
  const activeScene = campaign.scenes.find(
    (s) => s.id === campaign.activeSceneId,
  );

  const placedTokens =
    activeScene?.tokens?.filter(
      (token) => token.row !== undefined && token.col !== undefined,
    ) ?? [];

  async function loadTokenAssets(): Promise<Token[]> {
    const tokenDir = `campaigns/${campaign.id}/assets/tokens`;

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
            row: 0,
            col: 0,
            type: "npc",
            allowDuplicates: true,
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

  const displayCellSize =
    cols > 0 && rows > 0 && viewportSize.width > 0 && viewportSize.height > 0
      ? Math.min(viewportSize.width / cols, viewportSize.height / rows)
      : 0;

  useEffect(() => {
    async function loadTokens() {
      try {
        const importedTokens = await loadTokenAssets();

        const libraryTokens = [...defaultTokens, ...importedTokens];

        const placedSourceIds = new Set(
          activeScene?.tokens?.map((token) => token.sourceId).filter(Boolean),
        );

        const available = libraryTokens.filter((token) => {
          if (token.allowDuplicates) {
            return true;
          }

          return !placedSourceIds.has(token.id);
        });

        setAvailableTokens(available);
      } catch (err) {
        console.error("Failed loading tokens:", err);
      }
    }

    loadTokens();
  }, [activeScene?.id, activeScene?.tokens]);

  useEffect(() => {
    if (!activeScene?.mapImage) {
      setActiveMapUrl(null);
      return;
    }

    getAssetUrl(activeScene.mapImage).then((mapFullPathUrl) => {
      setActiveMapUrl(mapFullPathUrl);
    });
  }, [activeScene?.mapImage]);

  useEffect(() => {
    if (!activeMapUrl || !activeScene) return;

    getImageSize(activeMapUrl).then(async ({ width, height }) => {
      if (activeScene.mapWidth !== width || activeScene.mapHeight !== height) {
        await handleUpdateActiveScene({
          mapWidth: width,
          mapHeight: height,
        });
      }
    });
  }, [activeMapUrl]);

  function handleMoveToken(tokenId: string, row: number, col: number) {
    if (!activeScene) return;

    const updatedTokens = activeScene.tokens.map((token) =>
      token.id === tokenId
        ? {
            ...token,
            row,
            col,
          }
        : token,
    );

    handleUpdateActiveScene({
      tokens: updatedTokens,
    });
  }

  async function handleImportToken() {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] },
        ],
      });

      if (selected && typeof selected === "string") {
        const relativePath = await saveTokenAsset(campaign.id, selected);

        const appData = await appDataDir();
        const cleanPath = relativePath.replace(/^[\/\\]+/, "");
        const fullPath = await join(appData, cleanPath);
        const displayUrl = convertFileSrc(fullPath);

        const fileName =
          selected
            .split(/[\/\\]/)
            .pop()
            ?.split(".")[0] || "New Token";

        setAvailableTokens((prev) => [
          ...prev,
          {
            id: `token_${Date.now()}`,
            name: fileName,
            relativePath,
            imageUrl: displayUrl,
            row: 0,
            col: 0,
            type: "npc",
            allowDuplicates: true,
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
        `campaigns/${campaign.id}/${updatedCampaign.id}.json`,
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
          {
            name: "Images",
            extensions: ["png", "jpg", "jpeg", "webp"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        sceneForm.setFieldValue("mapImage", selected);
      }
    } catch (err) {
      console.error("Failed to pick file:", err);
    }
  }

  async function handleDeleteToken(tokenId: string) {
    if (!activeScene) return;

    const tokenToDelete = activeScene.tokens?.find(
      (token) => token.id === tokenId,
    );

    if (!tokenToDelete) return;

    const updatedTokens = activeScene.tokens.filter(
      (token) => token.id !== tokenId,
    );

    await handleUpdateActiveScene({
      tokens: updatedTokens,
    });

    // Only return non-duplicatable tokens to the sidebar.
    if (!tokenToDelete.allowDuplicates) {
      setAvailableTokens((prev) => {
        const libraryId = tokenToDelete.sourceId ?? tokenToDelete.id;

        if (prev.some((token) => token.id === libraryId)) {
          return prev;
        }

        return [
          ...prev,
          {
            ...tokenToDelete,
            id: libraryId,
            row: undefined,
            col: undefined,
          },
        ];
      });
    }
  }

  async function handleDeleteScene(
    e: React.MouseEvent,
    sceneIdToDelete: string,
  ) {
    e.stopPropagation();

    const confirmed = await confirm(
      "Are you sure you want to delete this scene?",
      {
        title: "Delete Scene",
        kind: "warning",
      },
    );

    if (!confirmed) return;

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

    const sceneToDelete = campaign.scenes.find(
      (scene) => scene.id === sceneIdToDelete,
    );

    if (sceneToDelete?.mapImage) {
      const isMapUsedElsewhere = campaign.scenes.some(
        (scene) =>
          scene.id !== sceneToDelete.id &&
          scene.mapImage === sceneToDelete.mapImage,
      );

      if (!isMapUsedElsewhere) {
        await deleteMapAsset(sceneToDelete.mapImage);
      }
    }

    await saveAndEmit(updatedCampaign);
  }

  async function handleAddScene(values: SceneFormValues) {
    if (!values.mapImage) {
      return;
    }

    let savedRelativePath: string;

    try {
      savedRelativePath = await saveMapAsset(campaign.id, values.mapImage);
    } catch (err) {
      console.error("Failed to copy map file to assets:", err);
      return;
    }

    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      name: values.name.trim(),
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

    sceneForm.reset();
    setIsAddingScene(false);
  }

  function handleDragStart(event: any) {
    if (event.canceled) return;

    const token = event.operation.source.data as Token;

    setDraggingToken(token);
  }

  async function handleDragEnd(event: any) {
    if (event.canceled) return;

    const { source, target } = event.operation;

    if (!target || !activeScene) {
      setDraggingToken(null);
      return;
    }

    const token = source.data as Token;

    const isExistingToken = activeScene.tokens?.some(
      (t) => t.id === source.data.id,
    );

    if (isExistingToken) {
      const cellOccupied = activeScene.tokens?.some(
        (t) =>
          t.id !== token.id &&
          t.row === target.data.row &&
          t.col === target.data.col,
      );

      if (cellOccupied) {
        notifications.show({
          title: "Invalid placement!",
          message: "Cannot move token to an already occupied cell",
          color: "red",
        });
        setDraggingToken(null);

        return;
      }

      const updatedTokens = activeScene.tokens.map((t) =>
        t.id === token.id
          ? {
              ...t,
              row: target.data.row,
              col: target.data.col,
            }
          : t,
      );

      setDraggingToken(null);

      await handleUpdateActiveScene({
        tokens: updatedTokens,
      });

      return;
    }

    const cellOccupied = activeScene.tokens?.some(
      (t) => t.row === target.data.row && t.col === target.data.col,
    );

    if (cellOccupied) {
      notifications.show({
        title: "Invalid placement!",
        message: "Cannot place a token on an already occupied cell",
        color: "red",
      });
      setDraggingToken(null);

      return;
    }

    const placedToken = {
      ...token,
      id: crypto.randomUUID(),
      sourceId: token.id,
      row: target.data.row,
      col: target.data.col,
    };

    setDraggingToken(null);

    await handleUpdateActiveScene({
      tokens: [...(activeScene.tokens ?? []), placedToken],
    });

    if (!token.allowDuplicates) {
      setAvailableTokens((prev) => prev.filter((t) => t.id !== token.id));
    }
  }

  return (
    <Container fluid p={0} h="100vh">
      <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Flex direction="column" h="100vh">
          {/* Workspace Header */}
          <Flex
            h={56}
            px="md"
            align="center"
            justify="space-between"
            style={{
              flexShrink: 0,
            }}
          >
            <Button
              leftSection={<ArrowLeft size={18} />}
              size="md"
              onClick={onBack}
            >
              Back to Campaigns
            </Button>

            <h2 style={{ margin: 0 }}>{campaign.name}</h2>
          </Flex>

          {/* Workspace Body */}
          <Flex
            flex={1}
            mih={0}
            w="100%"
            style={{
              overflow: "hidden",
            }}
          >
            {/* Sidebar / Inspector */}
            <Box
              h="100%"
              w={isSidebarCollapsed ? 0 : 320}
              miw={isSidebarCollapsed ? 0 : 320}
              pos="relative"
              style={{
                flexShrink: 0,
                transition: "width 150ms ease",
              }}
            >
              <Box
                h="100%"
                w={320}
                style={{
                  overflow: "hidden",
                }}
              >
                {!isSidebarCollapsed && (
                  <Tabs
                    value={activeTab}
                    onChange={(value) =>
                      setActiveTab(value as "scenes" | "tokens" | "settings")
                    }
                    h="100%"
                    styles={{
                      root: {
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      },
                      panel: {
                        flex: 1,
                        minHeight: 0,
                        overflow: "hidden",
                      },
                    }}
                  >
                    {/* Tab Navigation */}
                    <Tabs.List>
                      <Tabs.Tab value="scenes">Scenes</Tabs.Tab>

                      <Tabs.Tab value="tokens">Tokens</Tabs.Tab>

                      <Tabs.Tab value="settings">Settings</Tabs.Tab>
                    </Tabs.List>

                    {/* =========================
                    SCENES TAB
                    ========================= */}
                    <Tabs.Panel value="scenes" h="100%">
                      <Flex direction="column" h="100%" p="sm">
                        {/* Scene List */}
                        <ScrollArea flex={1} mih={0}>
                          <Stack gap="xs">
                            {campaign.scenes.map((scene) => (
                              <Group
                                key={scene.id}
                                justify="space-between"
                                wrap="nowrap"
                                px="sm"
                                py="xs"
                                style={{
                                  cursor: "pointer",
                                  borderRadius: 6,
                                  background:
                                    scene.id === campaign.activeSceneId
                                      ? "var(--mantine-color-blue-light)"
                                      : undefined,
                                }}
                                onClick={async () => {
                                  const updated = {
                                    ...campaign,
                                    activeSceneId: scene.id,
                                  };

                                  await saveAndEmit(updated);
                                }}
                              >
                                <Text
                                  size="sm"
                                  truncate
                                  style={{
                                    flex: 1,
                                  }}
                                >
                                  🗺️ {scene.name}
                                </Text>

                                <ActionIcon
                                  color="red"
                                  variant="subtle"
                                  title="Delete Scene"
                                  radius="xl"
                                  onClick={(e) =>
                                    handleDeleteScene(e, scene.id)
                                  }
                                >
                                  <Trash2 size={18} />
                                </ActionIcon>
                              </Group>
                            ))}
                          </Stack>
                        </ScrollArea>

                        {/* Add Scene Footer */}
                        <Box pt="sm">
                          {isAddingScene ? (
                            <form onSubmit={sceneForm.onSubmit(handleAddScene)}>
                              <Stack gap="sm">
                                <TextInput
                                  label="Scene Name"
                                  placeholder="Scene Name..."
                                  autoFocus
                                  {...sceneForm.getInputProps("name")}
                                />

                                <Box>
                                  <Text size="sm" fw={500} mb={4}>
                                    Scene Map Image
                                  </Text>

                                  <Button
                                    type="button"
                                    variant="default"
                                    fullWidth
                                    onClick={handlePickMapFile}
                                    leftSection={<FileIcon size={18} />}
                                  >
                                    {sceneForm.values.mapImage
                                      ? sceneForm.values.mapImage
                                          .split(/[\\/]/)
                                          .pop()
                                      : "Choose Map Image"}
                                  </Button>

                                  {sceneForm.errors.mapImage && (
                                    <Text size="xs" c="red" mt={4}>
                                      {sceneForm.errors.mapImage}
                                    </Text>
                                  )}
                                </Box>

                                <Group grow>
                                  <Button type="submit" size="md">
                                    Save
                                  </Button>

                                  <Button
                                    type="button"
                                    size="md"
                                    color="red"
                                    onClick={() => {
                                      sceneForm.reset();
                                      setIsAddingScene(false);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </Group>
                              </Stack>
                            </form>
                          ) : (
                            <Button
                              fullWidth
                              size="md"
                              leftSection={<Plus size={18} />}
                              onClick={() => {
                                sceneForm.reset();
                                setIsAddingScene(true);
                              }}
                            >
                              Add Scene
                            </Button>
                          )}
                        </Box>
                      </Flex>
                    </Tabs.Panel>

                    {/* =========================
                    TOKENS TAB
                    ========================= */}
                    <Tabs.Panel value="tokens" h="100%">
                      <Flex direction="column" h="100%" p="sm">
                        {/* Token Header */}
                        <Group justify="space-between" mb="xs">
                          <Text fw={600}>Token Library</Text>

                          <Button
                            size="xs"
                            variant="light"
                            leftSection={<Plus size={14} />}
                            onClick={handleImportToken}
                          >
                            Import Token
                          </Button>
                        </Group>

                        <Text size="xs" c="dimmed" mb="sm">
                          Drag any token onto the active map view.
                        </Text>

                        {/* Token Content */}
                        <ScrollArea flex={1} mih={0}>
                          <Stack gap="md">
                            {/* =========================
            DEFAULT TOKENS
            ========================= */}
                            <Box>
                              <UnstyledButton
                                w="100%"
                                onClick={() =>
                                  setDefaultTokensExpanded((prev) => !prev)
                                }
                                aria-expanded={defaultTokensExpanded}
                              >
                                <Group justify="space-between">
                                  <Group gap="xs">
                                    <Box
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        transition: "transform 150ms ease",
                                        transform: defaultTokensExpanded
                                          ? "rotate(0deg)"
                                          : "rotate(0deg)",
                                      }}
                                    >
                                      {defaultTokensExpanded ? (
                                        <ChevronDown size={16} />
                                      ) : (
                                        <ChevronRight size={16} />
                                      )}
                                    </Box>

                                    <Text size="sm" fw={600}>
                                      Default Tokens
                                    </Text>
                                  </Group>

                                  <Text size="sm" c="dimmed">
                                    {
                                      availableTokens.filter(
                                        (token) => token.isDefault,
                                      ).length
                                    }
                                  </Text>
                                </Group>
                              </UnstyledButton>

                              <Collapse
                                expanded={defaultTokensExpanded}
                                transitionDuration={200}
                                transitionTimingFunction="ease"
                              >
                                <Stack gap="xs" mt="xs">
                                  <Text size="xs" c="dimmed">
                                    Built-in game tokens.
                                  </Text>

                                  <SimpleGrid cols={3} spacing="xs">
                                    {availableTokens
                                      .filter((token) => token.isDefault)
                                      .map((token) => (
                                        <DraggableToken
                                          key={token.id}
                                          token={token}
                                        />
                                      ))}
                                  </SimpleGrid>
                                </Stack>
                              </Collapse>
                            </Box>

                            {/* =========================
            CUSTOM TOKENS
            ========================= */}
                            <Box>
                              <UnstyledButton
                                w="100%"
                                onClick={() =>
                                  setCustomTokensExpanded((prev) => !prev)
                                }
                                aria-expanded={customTokensExpanded}
                              >
                                <Group justify="space-between">
                                  <Group gap="xs">
                                    <Box
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      {customTokensExpanded ? (
                                        <ChevronDown size={16} />
                                      ) : (
                                        <ChevronRight size={16} />
                                      )}
                                    </Box>

                                    <Text size="sm" fw={600}>
                                      Custom Tokens
                                    </Text>
                                  </Group>

                                  <Text size="sm" c="dimmed">
                                    {
                                      availableTokens.filter(
                                        (token) => !token.isDefault,
                                      ).length
                                    }
                                  </Text>
                                </Group>
                              </UnstyledButton>

                              <Collapse
                                expanded={customTokensExpanded}
                                transitionDuration={200}
                                transitionTimingFunction="ease"
                              >
                                <Stack gap="xs" mt="xs">
                                  <Text size="xs" c="dimmed">
                                    Imported tokens.
                                  </Text>

                                  <SimpleGrid cols={3} spacing="xs">
                                    {availableTokens
                                      .filter((token) => !token.isDefault)
                                      .map((token) => (
                                        <DraggableToken
                                          key={token.id}
                                          token={token}
                                        />
                                      ))}
                                  </SimpleGrid>
                                </Stack>
                              </Collapse>
                            </Box>
                          </Stack>
                        </ScrollArea>
                      </Flex>
                    </Tabs.Panel>

                    {/* =========================
                    SETTINGS TAB
                    ========================= */}
                    <Tabs.Panel value="settings" h="100%">
                      <ScrollArea h="100%">
                        <Stack gap="md" p="sm">
                          {activeScene ? (
                            <>
                              <TextInput
                                label="Scene Name"
                                value={activeScene.name}
                                onChange={(event) =>
                                  handleUpdateActiveScene({
                                    name: event.currentTarget.value,
                                  })
                                }
                              />

                              <Checkbox
                                label="Show Grid Overlay"
                                checked={activeScene.gridEnabled ?? false}
                                onChange={(e) =>
                                  handleUpdateActiveScene({
                                    gridEnabled: e.target.checked,
                                  })
                                }
                              />

                              <NumberInput
                                label="Grid Size (px)"
                                value={activeScene.gridSize || 50}
                                onChange={(value) =>
                                  handleUpdateActiveScene({
                                    gridSize: Number(value),
                                  })
                                }
                              />
                            </>
                          ) : (
                            <Text c="dimmed" size="sm">
                              No active scene to configure.
                            </Text>
                          )}
                        </Stack>
                      </ScrollArea>
                    </Tabs.Panel>
                  </Tabs>
                )}
              </Box>
              <ActionIcon
                variant="default"
                size="sm"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
                aria-label={
                  isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"
                }
                style={{
                  position: "absolute",
                  top: 12,
                  right: -14,
                  zIndex: 20,
                }}
              >
                {isSidebarCollapsed ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronLeft size={16} />
                )}
              </ActionIcon>
            </Box>

            {/* =========================
              MAP VIEWPORT
              ========================= */}
            <Box
              ref={viewportRef}
              flex={1}
              h="100%"
              miw={0}
              pos="relative"
              style={{
                overflow: "hidden",
              }}
            >
              {activeScene ? (
                <MapGrid
                  mapUrl={activeMapUrl}
                  rows={rows}
                  cols={cols}
                  cellSize={displayCellSize}
                  tokens={placedTokens}
                  onDeleteToken={handleDeleteToken}
                  selectedTokenId={selectedTokenId}
                  onSelectToken={setSelectedTokenId}
                  onMoveToken={handleMoveToken}
                />
              ) : (
                <Flex h="100%" w="100%" align="center" justify="center">
                  <Text c="dimmed">
                    No active scene selected. Add a scene to get started!
                  </Text>
                </Flex>
              )}
            </Box>
          </Flex>
        </Flex>
        <DragOverlay>
          {draggingToken ? <DragTokenPreview token={draggingToken} /> : null}
        </DragOverlay>
      </DragDropProvider>
    </Container>
  );
}
