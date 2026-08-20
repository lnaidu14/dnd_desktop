import { Token } from "../../../types/campaigns";
import { PlacedToken } from "../PlaceToken/PlacedToken";
import { GridCell } from "../GridCell/GridCell";
import "./MapGrid.css";
import { Box, Flex, Image, Text, Loader } from "@mantine/core";

interface MapGridProps {
  rows: number;
  cols: number;
  cellSize: number;
  mapUrl: string | null;
  tokens: Token[];
}

export function MapGrid({
  mapUrl,
  rows,
  cols,
  cellSize,
  tokens,
}: MapGridProps) {
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
            Array.from({ length: cols }).map((_, col) => (
              <GridCell
                key={`${row}-${col}`}
                row={row}
                col={col}
                size={cellSize}
              >
                {tokens
                  .filter((token) => token.row === row && token.col === col)
                  .map((token) => (
                    <PlacedToken key={token.id} token={token} />
                  ))}
              </GridCell>
            )),
          )}
        </Box>
      </Box>
    </Flex>
  );
}
