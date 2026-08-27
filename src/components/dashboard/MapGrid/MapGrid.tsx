import { Token } from "../../../types/campaigns";
import { PlacedToken } from "../PlaceToken/PlacedToken";
import { GridCell } from "../GridCell/GridCell";
import "./MapGrid.css";
import { Box, Flex, Image, Text, Loader, Menu } from "@mantine/core";
import { Copy, Search, TrashIcon } from "lucide-react";
import { useState } from "react";
import { notifications } from "@mantine/notifications";

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

export interface GridPosition {
  row: number;
  col: number;
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
  const movementRange = 6;

  const [movementPath, setMovementPath] = useState<GridPosition[]>([]);
  const [isMoving, setIsMoving] = useState(false);

  const [visualTokenPositions, setVisualTokenPositions] = useState<
    Record<string, GridPosition>
  >({});

  function getSelectedToken() {
    if (!selectedTokenId) return null;

    return tokens.find((token) => token.id === selectedTokenId) ?? null;
  }

  async function animateTokenMovement(tokenId: string, path: GridPosition[]) {
    for (const position of path) {
      setVisualTokenPositions((prev) => ({
        ...prev,
        [tokenId]: position,
      }));

      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  function calculateSimplePath(
    startRow: number,
    startCol: number,
    targetRow: number,
    targetCol: number,
  ) {
    const path: GridPosition[] = [];

    let row = startRow;
    let col = startCol;

    while (col !== targetCol) {
      col += col < targetCol ? 1 : -1;

      path.push({
        row,
        col,
      });
    }

    while (row !== targetRow) {
      row += row < targetRow ? 1 : -1;

      path.push({
        row,
        col,
      });
    }

    return path;
  }

  function calculateMovementCost(path: GridPosition[]) {
    return path.length;
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

    const movementCost = calculateMovementCost(path);

    if (movementCost > movementRange) {
      notifications.show({
        title: "Invalid movement",
        message: `That movement costs ${movementCost} points, but this token can only move ${movementRange}.`,
        color: "red",
      });

      return;
    }

    setIsMoving(true);
    setMovementPath([]);

    await animateTokenMovement(selectedToken.id, path);

    onMoveToken(selectedToken.id, row, col);

    setVisualTokenPositions((prev) => {
      const next = { ...prev };
      delete next[selectedToken.id];
      return next;
    });

    setIsMoving(false);
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

              const movementCost = calculateMovementCost(movementPath);
              const isMovementTooFar = movementCost > movementRange;

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
                    .filter((token) => {
                      const visualPosition = visualTokenPositions[token.id];

                      const tokenRow = visualPosition?.row ?? token.row;
                      const tokenCol = visualPosition?.col ?? token.col;

                      return tokenRow === row && tokenCol === col;
                    })
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
