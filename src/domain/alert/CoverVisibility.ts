import type { CoverSlot } from '../layout/WorldLayout';

export function isPlayerInCover(playerX: number, covers: readonly CoverSlot[]): boolean {
  return covers.some((cover) => playerX >= cover.x && playerX <= cover.x + cover.width);
}
