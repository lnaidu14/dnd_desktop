import { Token } from "../types/campaigns";
import { GridPosition } from "../types/movement";

export const METERS_PER_CELL = 5;

export function calculateSimplePath(
    startRow: number,
    startCol: number,
    targetRow: number,
    targetCol: number,
): GridPosition[] {
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

export function calculateMovementDistance(
    path: GridPosition[],
): number {
    return path.length * METERS_PER_CELL;
}

export function getTokenMovementRange(token: Token) {
    // race
    // status effects
    // injuries
    // equipment
    // encumbrance
    // etc.

    return 30;
}

