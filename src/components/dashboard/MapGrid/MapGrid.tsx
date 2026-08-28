import { Token } from "../../../types/campaigns";
import { PlacedToken } from "../PlaceToken/PlacedToken";
import { GridCell } from "../GridCell/GridCell";
import "./MapGrid.css";
import { Box, Flex, Image, Text, Loader, Menu } from "@mantine/core";
import { Copy, Search, TrashIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { notifications } from "@mantine/notifications";
import {
  calculateSimplePath,
  calculateMovementDistance,
  getTokenMovementRange,
} from "../../../utils/movement";
import { GridPosition } from "../../../types/movement";

interface MapGridProps {
  rows: number;
  cols: number;
  cellSize: number;
  mapUrl: string | null;
  tokens: Token[];
  onDeleteToken: (tokenId: string) => void;

  selectedTokenId: string | null;
  onSelectToken: (tokenId: string | null) => void;

  onMoveToken: (tokenId: string, row: number, col: number) => void;
}

export function MapGrid({
  mapUrl,
  rows,
  cols,
  cellSize,
  tokens,
  onDeleteToken,
  selectedTokenId,
  onSelectToken,
  onMoveToken,
}: MapGridProps) {
  const [movementPath, setMovementPath] = useState<GridPosition[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [pendingMovement, setPendingMovement] = useState<{
    tokenId: string;
    row: number;
    col: number;
  } | null>(null);

  const [visualTokenOffsets, setVisualTokenOffsets] = useState<
    Record<string, { x: number; y: number }>
  >({});

  const animationResolvers = useRef<Record<string, () => void>>({});

  const selectedToken = getSelectedToken();

  const movementRangeMeters = selectedToken
    ? getTokenMovementRange(selectedToken)
    : 0;

  function getSelectedToken() {
    if (!selectedTokenId) return null;

    return tokens.find((token) => token.id === selectedTokenId) ?? null;
  }

  async function animateTokenMovement(token: Token, path: GridPosition[]) {
    for (const position of path) {
      const offsetX = (position.col - token.col!) * cellSize;
      const offsetY = (position.row - token.row!) * cellSize;

      await new Promise<void>((resolve) => {
        animationResolvers.current[token.id] = resolve;

        setVisualTokenOffsets((prev) => ({
          ...prev,
          [token.id]: {
            x: offsetX,
            y: offsetY,
          },
        }));
      });
    }
  }

  function handleCellMouseEnter(row: number, col: number) {
    if (isMoving) return;

    const selectedToken = getSelectedToken();

    if (!selectedToken) return;

    if (selectedToken.row === undefined || selectedToken.col === undefined) {
      return;
    }

    const path = calculateSimplePath(
      selectedToken.row,
      selectedToken.col,
      row,
      col,
    );

    setMovementPath(path);
  }

  async function handleCellClick(row: number, col: number) {
    if (isMoving) return;

    if (!selectedTokenId) return;

    const selectedToken = getSelectedToken();

    if (!selectedToken) return;

    if (selectedToken.row === undefined || selectedToken.col === undefined) {
      return;
    }

    const path = calculateSimplePath(
      selectedToken.row,
      selectedToken.col,
      row,
      col,
    );

    if (path.length === 0) {
      onSelectToken(null);
      setMovementPath([]);
      return;
    }

    const occupiedCell = path.find((position) =>
      isCellOccupied(position.row, position.col, selectedToken.id),
    );

    if (occupiedCell) {
      notifications.show({
        title: "Invalid movement",
        message: "That path is blocked by another token.",
        color: "red",
      });

      return;
    }

    const movementDistance = calculateMovementDistance(path);

    if (movementDistance > movementRangeMeters) {
      notifications.show({
        title: "Invalid movement",
        message: `That movement is ${movementDistance} meters, but this token can only move ${movementRangeMeters} meters.`,
        color: "red",
      });

      return;
    }

    setIsMoving(true);
    setMovementPath([]);

    setPendingMovement({
      tokenId: selectedToken.id,
      row,
      col,
    });

    await animateTokenMovement(selectedToken, path);

    onMoveToken(selectedToken.id, row, col);

    onSelectToken(null);
  }

  function handleTokenClick(tokenId: string) {
    if (selectedTokenId === tokenId) {
      onSelectToken(null);
      setMovementPath([]);
      return;
    }

    onSelectToken(tokenId);
    setMovementPath([]);
  }

  function isCellOccupied(row: number, col: number, movingTokenId: string) {
    return tokens.some(
      (token) =>
        token.id !== movingTokenId && token.row === row && token.col === col,
    );
  }

  useEffect(() => {
    if (!pendingMovement) return;

    const token = tokens.find((token) => token.id === pendingMovement.tokenId);

    if (!token) return;

    if (
      token.row === pendingMovement.row &&
      token.col === pendingMovement.col
    ) {
      setVisualTokenOffsets((prev) => {
        const next = { ...prev };
        delete next[pendingMovement.tokenId];
        return next;
      });

      setPendingMovement(null);
      setIsMoving(false);
    }
  }, [tokens, pendingMovement]);

  if (!mapUrl || !cellSize || !rows || !cols) {
    return (
      <Flex
        w="100%"
        h="100%"
        direction="column"
        align="center"
        justify="center"
        gap="sm"
      >
        <Loader size="md" />
        <Text c="dimmed" size="sm">
          Loading map...
        </Text>
      </Flex>
    );
  }

  const mapWidth = cols * cellSize;
  const mapHeight = rows * cellSize;

  const movementDistance = calculateMovementDistance(movementPath);
  const isMovementTooFar = movementDistance > movementRangeMeters;

  return (
    <Flex
      w="100%"
      h="100%"
      justify="center"
      align="center"
      style={{
        overflow: "auto",
      }}
    >
      <Box
        pos="relative"
        w={mapWidth}
        h={mapHeight}
        style={{
          flexShrink: 0,
        }}
      >
        <Image
          src={mapUrl}
          alt="Map"
          w={mapWidth}
          h={mapHeight}
          fit="fill"
          style={{
            position: "absolute",
            inset: 0,
          }}
        />

        <Box
          pos="absolute"
          inset={0}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          }}
        >
          {Array.from({ length: rows }).flatMap((_, row) =>
            Array.from({ length: cols }).map((_, col) => {
              const isPathCell = movementPath.some(
                (position) => position.row === row && position.col === col,
              );

              return (
                <GridCell
                  key={`${row}-${col}`}
                  row={row}
                  col={col}
                  size={cellSize}
                  isPathCell={isPathCell}
                  isMovementTooFar={isMovementTooFar}
                  onClick={() =>
                    isMovementTooFar
                      ? notifications.show({
                          title: "Invalid placement!",
                          message: "Can't move token too far",
                          color: "red",
                        })
                      : handleCellClick(row, col)
                  }
                  onMouseEnter={() => handleCellMouseEnter(row, col)}
                >
                  {tokens
                    .filter((token) => token.row === row && token.col === col)

                    .map((token) => (
                      <Menu key={token.id} shadow="md" width={200}>
                        <Menu.ContextMenu>
                          <Box
                            style={{
                              width: "100%",
                              height: "100%",
                            }}
                          >
                            <PlacedToken
                              token={token}
                              selected={selectedTokenId === token.id}
                              onSelect={() => handleTokenClick(token.id)}
                              visualOffset={visualTokenOffsets[token.id]}
                              onMovementAnimationComplete={() => {
                                const resolve =
                                  animationResolvers.current[token.id];

                                if (resolve) {
                                  delete animationResolvers.current[token.id];
                                  resolve();
                                }
                              }}
                            />
                          </Box>
                        </Menu.ContextMenu>

                        <Menu.Dropdown>
                          <Menu.Label>{token.name}</Menu.Label>

                          <Menu.Item leftSection={<Search />}>
                            Examine
                          </Menu.Item>

                          <Menu.Divider />

                          <Menu.Item leftSection={<Copy />}>
                            Duplicate
                          </Menu.Item>

                          <Menu.Item
                            color="red"
                            leftSection={<TrashIcon />}
                            onClick={() => onDeleteToken(token.id)}
                          >
                            Delete token
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    ))}
                </GridCell>
              );
            }),
          )}
        </Box>
      </Box>
    </Flex>
  );
}
