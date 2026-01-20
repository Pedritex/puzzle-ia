
export type Difficulty = 20; // Fijado a 20 piezas según petición

export interface PuzzleTile {
  id: number;
  correctRow: number;
  correctCol: number;
  currentX: number;
  currentY: number;
  rotation: number;
  isSnapped: boolean;
  zIndex: number;
}

export interface GameState {
  image: string | null;
  tiles: PuzzleTile[];
  difficulty: number;
  isSolved: boolean;
  isShuffled: boolean;
  moves: number;
  startTime: number | null;
  elapsedTime: number;
  isGenerating: boolean;
  statusMessage: string;
}

export interface PresetTheme {
  name: string;
  prompt: string;
  icon: string;
}
