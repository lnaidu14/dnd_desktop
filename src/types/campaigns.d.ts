export interface TokenPlacement {
  id: string;
  name: string;
  imageUrl: string;
  x: number;
  y: number;
  size: number;
  color?: string;
}

export interface Scene {
  id: string;
  name: string;
  gridSize: number;
  gridColor: string;
  gridEnabled: boolean;
  tokens: TokenPlacement[];
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