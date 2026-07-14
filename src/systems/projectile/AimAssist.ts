import type Phaser from 'phaser';
import type { ProjectileConfig } from '../../data/projectileConfig';
import { Depths } from '../../domain/layout/Depth';
import {
  type LandingPrediction,
  type TrajectoryInput,
  type Vector2
} from '../../domain/projectile/ProjectileTrajectory';
import { buildAimAssistPrediction } from '../../domain/projectile/AimAssistPrediction';

export class AimAssist {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private visible = false;
  private lastLanding?: LandingPrediction;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(Depths.debug - 2);
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.graphics.setVisible(visible);
  }

  update(input: TrajectoryInput, _groundY: number, config: ProjectileConfig, actualLandingError?: number): void {
    this.graphics.clear();
    const prediction = buildAimAssistPrediction(input, config);
    this.lastLanding = { point: prediction.collisionPoint, landed: true };

    if (!this.visible || !config.aimAssistEnabled) {
      return;
    }

    this.graphics.lineStyle(3, 0xa7f3d0, 0.86);
    for (let index = 1; index < prediction.visualPath.length; index += 1) {
      const previous = prediction.visualPath[index - 1];
      const current = prediction.visualPath[index];
      this.graphics.lineBetween(previous.x, previous.y, current.x, current.y);
    }

    this.graphics.lineStyle(2, 0x38bdf8, 0.82);
    for (let index = 1; index < prediction.groundProjectionPath.length; index += 1) {
      const previous = prediction.groundProjectionPath[index - 1];
      const current = prediction.groundProjectionPath[index];
      this.graphics.lineBetween(previous.x, previous.y, current.x, current.y);
    }

    this.graphics.lineStyle(2, 0xfacc15, 0.65);
    this.graphics.strokeRect(
      0,
      prediction.topLaneReach.minY,
      1280,
      prediction.topLaneReach.maxY - prediction.topLaneReach.minY
    );

    if (this.lastLanding.landed) {
      this.graphics.lineStyle(2, 0xffffff, 0.9);
      this.graphics.strokeCircle(this.lastLanding.point.x, this.lastLanding.point.y, 18);
      this.graphics.fillStyle(0xf6bd60, 0.8);
      this.graphics.fillCircle(this.lastLanding.point.x, this.lastLanding.point.y, 6);
    }

    if (actualLandingError !== undefined) {
      this.graphics.fillStyle(actualLandingError <= config.landingTolerance ? 0x34d399 : 0xf87171, 0.95);
      this.graphics.fillRect(18, 18, Math.min(actualLandingError * 8, 180), 10);
    }
  }

  getPredictedLanding(): Vector2 | undefined {
    return this.lastLanding?.landed ? this.lastLanding.point : undefined;
  }

  isVisible(): boolean {
    return this.visible;
  }

  dispose(): void {
    this.graphics.destroy();
  }
}
