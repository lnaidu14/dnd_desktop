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

export interface Scene {
  id: string;
  name: string;
  gridSize: number;
  gridColor: string;
  gridEnabled: boolean;
  tokens: Token[];
  mapImage: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  scenes: Scene[];
  activeSceneId?: string;
  updatedAt?: string;
}
