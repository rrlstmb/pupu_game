import type { Projectile } from './ProjectileSystem';

export type GroundProjectionShadowState = {
  readonly projectileId: number;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly alpha: number;
};

export function groundProjectionShadow(projectile: Projectile): GroundProjectionShadowState {
  const visualHeight = Math.max(0, projectile.position.y - projectile.visualPosition.y);
  const heightRatio = Math.min(1, visualHeight / Math.max(1, projectile.trajectory.apexHeight));
  return {
    projectileId: projectile.id,
    x: projectile.position.x,
    y: projectile.position.y,
    scale: 1 - heightRatio * 0.28,
    alpha: 0.42 - heightRatio * 0.18
  };
}
