interface Token {
  id: string;
  sourceId?: string;

  name: string;
  imageUrl?: string;
  relativePath?: string;

  x?: number;
  y?: number;
  size?: number;

  row?: number;
  col?: number;
  isDefault?: boolean;
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
