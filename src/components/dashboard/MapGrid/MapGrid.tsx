import { Token } from "../../../types/campaigns";
import { PlacedToken } from "../PlaceToken/PlacedToken";
import { GridCell } from "../GridCell/GridCell";
import "./MapGrid.css";

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
  return (
    <div
      className="map-grid-wrapper"
      style={{
        width: cols * cellSize,
        height: rows * cellSize,
      }}
    >
      {mapUrl && <img src={mapUrl} className="map-image" alt="Map" />}

      <div
        className="map-grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        }}
      >
        {Array.from({ length: rows }).flatMap((_, row) =>
          Array.from({ length: cols }).map((_, col) => (
            <GridCell key={`${row}-${col}`} row={row} col={col} size={cellSize}>
              {tokens
                .filter((t) => t.row === row && t.col === col)
                .map((token) => (
                  <PlacedToken key={token.id} token={token} />
                ))}
            </GridCell>
          )),
        )}
      </div>
    </div>
  );
}
