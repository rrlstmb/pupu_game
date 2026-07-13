import type Phaser from 'phaser';
import type { ProjectileConfig } from '../../data/projectileConfig';
import { Depths } from '../../domain/layout/Depth';
import {
  predictLanding,
  sampleTrajectory,
  type LandingPrediction,
  type TrajectoryInput,
  type Vector2
} from '../../domain/projectile/ProjectileTrajectory';

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

  update(input: TrajectoryInput, groundY: number, config: ProjectileConfig, actualLandingError?: number): void {
    this.graphics.clear();
    this.lastLanding = predictLanding(input, groundY, config.predictionStepSeconds, config.predictionMaxSeconds);

    if (!this.visible || !config.aimAssistEnabled) {
      return;
    }

    const points = sampleTrajectory(input, config.predictionStepSeconds, config.predictionMaxSeconds).filter(
      (point) => point.y <= groundY
    );

    this.graphics.lineStyle(3, 0xa7f3d0, 0.86);
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      this.graphics.lineBetween(previous.x, previous.y, current.x, current.y);
    }

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
