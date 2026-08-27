type TokenType =
  | "player"
  | "npc"
  | "monster"
  | "object";

interface Token {
  id: string;
  sourceId?: string;

  name: string;
  type: TokenType;

  imageUrl?: string;
  relativePath?: string;

  row?: number;
  col?: number;

  isDefault?: boolean;
  allowDuplicates: boolean;
}

interface Scene {
  id: string;
  name: string;

  mapWidth?: number;
  mapHeight?: number;

  gridSize: number;
  gridEnabled: boolean;
  gridColor: string;

  mapImage: string;
  tokens: Token[];
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  scenes: Scene[];
  activeSceneId?: string;
  updatedAt?: string;
}
