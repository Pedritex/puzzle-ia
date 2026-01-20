
import { PuzzleTile } from '../types';

export const ROWS = 4;
export const COLS = 5;
export const PLAY_AREA_HEIGHT_PERCENT = 0.82;

export interface PieceShape {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const getPieceShape = (r: number, c: number): PieceShape => {
  const shape: PieceShape = { top: 0, right: 0, bottom: 0, left: 0 };
  const getTab = (row: number, col: number, horizontal: boolean) => {
    const val = (row * 123 + col * 456 + (horizontal ? 789 : 321)) % 2;
    return val === 0 ? 1 : -1;
  };
  if (r > 0) shape.top = -getTab(r - 1, c, false);
  if (r < ROWS - 1) shape.bottom = getTab(r, c, false);
  if (c > 0) shape.left = -getTab(r, c - 1, true);
  if (c < COLS - 1) shape.right = getTab(r, c, true);
  return shape;
};

/**
 * Genera el path de la pieza con precisión matemática.
 */
export const getPuzzlePath = (r: number, c: number, width: number, height: number) => {
  const shape = getPieceShape(r, c);
  const size = Math.min(width, height);
  const tabSize = size * 0.22;
  const neck = size * 0.14;
  const head = size * 0.25;
  const w = width;
  const h = height;

  let path = `M 0 0`;

  // Superior
  if (shape.top === 0) {
    path += ` L ${w} 0`;
  } else {
    const v = shape.top;
    path += ` L ${w * 0.5 - head / 2} 0`;
    path += ` C ${w * 0.5 - head / 2} ${-v * tabSize * 0.1}, ${w * 0.5 - neck / 2} ${v * tabSize * 0.1}, ${w * 0.5 - neck / 2} ${v * tabSize * 0.8}`;
    path += ` C ${w * 0.5 - neck / 2} ${v * tabSize * 1.1}, ${w * 0.5 + neck / 2} ${v * tabSize * 1.1}, ${w * 0.5 + neck / 2} ${v * tabSize * 0.8}`;
    path += ` C ${w * 0.5 + neck / 2} ${v * tabSize * 0.1}, ${w * 0.5 + head / 2} ${-v * tabSize * 0.1}, ${w * 0.5 + head / 2} 0`;
    path += ` L ${w} 0`;
  }

  // Derecho
  if (shape.right === 0) {
    path += ` L ${w} ${h}`;
  } else {
    const v = shape.right;
    path += ` L ${w} ${h * 0.5 - head / 2}`;
    path += ` C ${w + v * tabSize * 0.1} ${h * 0.5 - head / 2}, ${w - v * tabSize * 0.1} ${h * 0.5 - neck / 2}, ${w + v * tabSize * 0.8} ${h * 0.5 - neck / 2}`;
    path += ` C ${w + v * tabSize * 1.1} ${h * 0.5 - neck / 2}, ${w + v * tabSize * 1.1} ${h * 0.5 + neck / 2}, ${w + v * tabSize * 0.8} ${h * 0.5 + neck / 2}`;
    path += ` C ${w - v * tabSize * 0.1} ${h * 0.5 + neck / 2}, ${w + v * tabSize * 0.1} ${h * 0.5 + head / 2}, ${w} ${h * 0.5 + head / 2}`;
    path += ` L ${w} ${h}`;
  }

  // Inferior
  if (shape.bottom === 0) {
    path += ` L 0 ${h}`;
  } else {
    const v = shape.bottom;
    path += ` L ${w * 0.5 + head / 2} ${h}`;
    path += ` C ${w * 0.5 + head / 2} ${h + v * tabSize * 0.1}, ${w * 0.5 + neck / 2} ${h - v * tabSize * 0.1}, ${w * 0.5 + neck / 2} ${h + v * tabSize * 0.8}`;
    path += ` C ${w * 0.5 + neck / 2} ${h + v * tabSize * 1.1}, ${w * 0.5 - neck / 2} ${h + v * tabSize * 1.1}, ${w * 0.5 - neck / 2} ${h + v * tabSize * 0.8}`;
    path += ` C ${w * 0.5 - neck / 2} ${h - v * tabSize * 0.1}, ${w * 0.5 - head / 2} ${h + v * tabSize * 0.1}, ${w * 0.5 - head / 2} ${h}`;
    path += ` L 0 ${h}`;
  }

  // Izquierdo
  if (shape.left === 0) {
    path += ` L 0 0`;
  } else {
    const v = shape.left;
    path += ` L 0 ${h * 0.5 + head / 2}`;
    path += ` C ${-v * tabSize * 0.1} ${h * 0.5 + head / 2}, ${v * tabSize * 0.1} ${h * 0.5 + neck / 2}, ${-v * tabSize * 0.8} ${h * 0.5 + neck / 2}`;
    path += ` C ${-v * tabSize * 1.1} ${h * 0.5 + neck / 2}, ${-v * tabSize * 1.1} ${h * 0.5 - neck / 2}, ${-v * tabSize * 0.8} ${h * 0.5 - neck / 2}`;
    path += ` C ${v * tabSize * 0.1} ${h * 0.5 - neck / 2}, ${-v * tabSize * 0.1} ${h * 0.5 - head / 2}, 0 ${h * 0.5 - head / 2}`;
    path += ` L 0 0`;
  }

  path += ' Z';
  return path;
};

export const getTileBounds = (r: number, c: number, boardW: number, boardH: number) => {
  const left = Math.floor((c * boardW) / COLS);
  const right = Math.floor(((c + 1) * boardW) / COLS);
  const top = Math.floor((r * boardH) / ROWS);
  const bottom = Math.floor(((r + 1) * boardH) / ROWS);

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  };
};

export const createInitialTiles = (boardW: number, boardH: number): PuzzleTile[] => {
  const tiles: PuzzleTile[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const bounds = getTileBounds(r, c, boardW, boardH);
      tiles.push({
        id: r * COLS + c,
        correctRow: r,
        correctCol: c,
        currentX: bounds.x,
        currentY: bounds.y,
        rotation: 0,
        isSnapped: false,
        zIndex: 1,
      });
    }
  }
  return tiles;
};

export const scatterTiles = (tiles: PuzzleTile[], width: number, height: number): PuzzleTile[] => {
  const playAreaH = Math.floor(height * PLAY_AREA_HEIGHT_PERCENT);
  const trayYStart = playAreaH + 10;
  const trayHeight = height - trayYStart - 10;

  return tiles.map((tile, index) => {
    const tw = width / COLS;
    const th = playAreaH / ROWS;

    return {
      ...tile,
      isSnapped: false,
      currentX: 10 + Math.random() * (width - tw - 20),
      currentY: trayYStart + Math.random() * (trayHeight - th),
      rotation: Math.random() * 20 - 10,
      zIndex: index + 10,
    };
  });
};

export const checkSnap = (
  tileX: number,
  tileY: number,
  correctX: number,
  correctY: number
): boolean => {
  const distance = Math.sqrt(Math.pow(tileX - correctX, 2) + Math.pow(tileY - correctY, 2));
  return distance < 25;
};
