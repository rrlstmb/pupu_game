import type Phaser from 'phaser';
import type { ProjectileConfig } from '../../data/projectileConfig';
import { Depths } from '../../domain/layout/Depth';
import {
  createProjectileSystemState,
  fireProjectile,
  updateProjectileSystem,
  recycleProjectilesById,
  type Projectile,
  type ProjectileSystemState
} from '../../domain/projectile/ProjectileSystem';
import type { Vector2 } from '../../domain/projectile/ProjectileTrajectory';
import type { PoopType, ProjectilePoopRules } from '../../domain/poop/PoopModel';
import { emptyProjectileRules } from '../../domain/projectile/ProjectileSystem';
import { groundProjectionShadow, type GroundProjectionShadowState } from '../../domain/projectile/GroundProjectionShadow';

type ProjectileView = {
  readonly body: Phaser.GameObjects.Arc;
  readonly shadow: Phaser.GameObjects.Ellipse;
  readonly vector: Phaser.GameObjects.Line;
  readonly groundProjection: Phaser.GameObjects.Arc;
  readonly collisionRadius: Phaser.GameObjects.Arc;
};

export type ProjectileViewPoolStats = {
  readonly active: number;
  readonly pooled: number;
  readonly created: number;
  readonly reused: number;
  readonly activeShadows: number;
};

export class PhaserProjectileSystem {
  private state = createProjectileSystemState();
  private readonly views = new Map<number, ProjectileView>();
  private readonly pooledViews: ProjectileView[] = [];
  private createdViewCount = 0;
  private reusedViewCount = 0;
  private lastLanding?: Vector2;
  private actualLandingError?: number;
  private lastNaturalRecycleCount = 0;
  private lastNaturalRecycled: Projectile[] = [];
  private debugVisible = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly groundY: number,
    private config: ProjectileConfig
  ) {}

  setConfig(config: ProjectileConfig): void {
    this.config = config;
  }

  setDebugVisible(visible: boolean): void {
    this.debugVisible = visible;
    for (const view of this.views.values()) {
      view.vector.setVisible(visible);
      view.groundProjection.setVisible(visible);
      view.collisionRadius.setVisible(visible);
    }
  }

  fire(
    origin: Vector2,
    config = this.config,
    poopType: PoopType = 'normal_poop',
    rules: ProjectilePoopRules = emptyProjectileRules()
  ): boolean {
    const beforeNextId = this.state.nextId;
    this.config = config;
    this.state = fireProjectile(this.state, origin, config, poopType, rules);

    if (this.state.nextId === beforeNextId) {
      return false;
    }

    const projectile = this.state.projectiles.find((candidate) => candidate.id === beforeNextId);
    if (projectile) {
      this.views.set(projectile.id, this.acquireView(projectile));
    }

    return true;
  }

  update(deltaSeconds: number, predictedLanding?: Vector2): void {
    const update = updateProjectileSystem(this.state, deltaSeconds, this.groundY, this.config);
    this.state = update.state;
    this.lastNaturalRecycleCount = update.recycled.length;
    this.lastNaturalRecycled = [...update.recycled];

    for (const projectile of this.state.projectiles) {
      this.syncView(projectile);
    }

    for (const projectile of update.landed) {
      if (projectile.landedAt) {
        this.lastLanding = projectile.landedAt;
        this.actualLandingError = predictedLanding ? Math.abs(projectile.landedAt.x - predictedLanding.x) : undefined;
      }
    }

    for (const projectile of update.recycled) {
      this.releaseView(projectile.id);
    }
    for (const projectile of update.spawned) {
      this.views.set(projectile.id, this.acquireView(projectile));
    }
  }

  recycleByIds(projectileIds: readonly number[]): void {
    const result = recycleProjectilesById(this.state, projectileIds);
    this.state = result.state;
    for (const projectile of result.recycled) {
      this.releaseView(projectile.id);
    }
  }

  dispose(): void {
    for (const view of this.views.values()) {
      this.destroyView(view);
    }
    for (const view of this.pooledViews) {
      this.destroyView(view);
    }
    this.views.clear();
    this.pooledViews.length = 0;
  }

  snapshot(): ProjectileSystemState {
    return this.state;
  }

  consumeNaturalRecycleCount(): number {
    const count = this.lastNaturalRecycleCount;
    this.lastNaturalRecycleCount = 0;
    return count;
  }

  consumeNaturalRecycledProjectiles(): readonly Projectile[] {
    const projectiles = this.lastNaturalRecycled;
    this.lastNaturalRecycled = [];
    return projectiles;
  }

  getLastLanding(): Vector2 | undefined {
    return this.lastLanding;
  }

  getActualLandingError(): number | undefined {
    return this.actualLandingError;
  }

  viewPoolStats(): ProjectileViewPoolStats {
    return {
      active: this.views.size,
      pooled: this.pooledViews.length,
      created: this.createdViewCount,
      reused: this.reusedViewCount,
      activeShadows: this.views.size
    };
  }

  private acquireView(projectile: Projectile): ProjectileView {
    const view = this.pooledViews.pop();
    if (!view) {
      this.createdViewCount += 1;
      return this.createView(projectile);
    }

    this.reusedViewCount += 1;
    view.body
      .setPosition(projectile.visualPosition.x, projectile.visualPosition.y)
      .setDisplaySize(projectile.config.radius * 2, projectile.config.radius * 2)
      .setFillStyle(colorForPoop(projectile.poopType), 1)
      .setActive(true)
      .setVisible(true);
    view.shadow
      .setPosition(projectile.position.x, projectile.position.y)
      .setDisplaySize(projectile.config.radius * 2.2, projectile.config.radius * 0.9)
      .setActive(true)
      .setVisible(true);
    view.vector.setActive(true).setVisible(this.debugVisible);
    view.groundProjection.setActive(true).setVisible(this.debugVisible);
    view.collisionRadius.setActive(true).setVisible(this.debugVisible);
    return view;
  }

  private createView(projectile: Projectile): ProjectileView {
    const body = this.scene.add
      .circle(projectile.visualPosition.x, projectile.visualPosition.y, projectile.config.radius, colorForPoop(projectile.poopType), 1)
      .setDepth(Depths.projectile);
    const shadow = this.scene.add
      .ellipse(projectile.position.x, projectile.position.y, projectile.config.radius * 2.2, projectile.config.radius * 0.9, 0x111827, 0.32)
      .setDepth(Depths.projectileShadow);
    const vector = this.scene.add
      .line(0, 0, projectile.visualPosition.x, projectile.visualPosition.y, projectile.position.x, projectile.position.y, 0xffffff, 0.75)
      .setOrigin(0, 0)
      .setDepth(Depths.debug - 5)
      .setVisible(this.debugVisible);
    const groundProjection = this.scene.add
      .circle(projectile.position.x, projectile.position.y, 5, 0x38bdf8, 0.9)
      .setDepth(Depths.debug - 4)
      .setVisible(this.debugVisible);
    const collisionRadius = this.scene.add
      .circle(projectile.position.x, projectile.position.y, projectile.config.collisionRadius)
      .setStrokeStyle(2, 0xfacc15, 0.9)
      .setFillStyle(0x000000, 0)
      .setDepth(Depths.debug - 3)
      .setVisible(this.debugVisible);

    return { body, shadow, vector, groundProjection, collisionRadius };
  }

  private syncView(projectile: Projectile): void {
    const view = this.views.get(projectile.id);
    if (!view) {
      return;
    }

    view.body.setPosition(projectile.visualPosition.x, projectile.visualPosition.y);
    const shadow = groundProjectionShadow(projectile);
    view.shadow
      .setPosition(shadow.x, shadow.y)
      .setScale(shadow.scale)
      .setAlpha(shadow.alpha);
    view.vector.setTo(
      projectile.visualPosition.x,
      projectile.visualPosition.y,
      projectile.position.x,
      projectile.position.y
    );
    view.groundProjection.setPosition(projectile.position.x, projectile.position.y);
    view.collisionRadius
      .setPosition(projectile.position.x, projectile.position.y)
      .setRadius(projectile.config.collisionRadius);
  }

  private releaseView(id: number): void {
    const view = this.views.get(id);
    if (!view) {
      return;
    }

    view.body.setActive(false).setVisible(false);
    view.shadow.setActive(false).setVisible(false);
    view.vector.setActive(false).setVisible(false);
    view.groundProjection.setActive(false).setVisible(false);
    view.collisionRadius.setActive(false).setVisible(false);
    this.pooledViews.push(view);
    this.views.delete(id);
  }

  private destroyView(view: ProjectileView): void {
    view.body.destroy();
    view.shadow.destroy();
    view.vector.destroy();
    view.groundProjection.destroy();
    view.collisionRadius.destroy();
  }

  shadowSnapshot(): readonly GroundProjectionShadowState[] {
    return this.state.projectiles.map(groundProjectionShadow);
  }
}

function colorForPoop(poopType: PoopType): number {
  const colors: Record<PoopType, number> = {
    normal_poop: 0x8b5e34,
    sticky_poop: 0x5f7a2f,
    splash_poop: 0x2dd4bf,
    jumbo_poop: 0x4b2e1d,
    bouncy_poop: 0xf59e0b,
    stink_poop: 0x84cc16,
    split_poop: 0xc084fc,
    golden_poop: 0xfacc15
  };
  return colors[poopType];
}
