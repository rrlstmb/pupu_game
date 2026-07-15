import type { ProjectileConfig } from '../../data/projectileConfig';
import type { PoopType, ProjectilePoopRules, SurfaceTag } from '../poop/PoopModel';
import {
  trajectoryStateAt,
  type TrajectoryInput,
  type TrajectoryPoint,
  type Vector2
} from './ProjectileTrajectory';

export type ProjectileStatus = 'active' | 'landed' | 'expired';

export const PROJECTILE_SAFETY_LIMITS = {
  maxTotalActiveProjectiles: 18
} as const;

export type BounceSurface = {
  readonly id?: string;
  readonly bounds?: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly normal?: Vector2;
  readonly bounceCoefficient?: number;
  readonly enabled?: boolean;
  readonly allowedPoopTags?: readonly string[];
  readonly y?: number;
  readonly tag: SurfaceTag;
};

export type Projectile = {
  readonly id: number;
  readonly poopType: PoopType;
  readonly config: ProjectileConfig;
  readonly rules: ProjectilePoopRules;
  readonly generation: number;
  readonly parentId?: number;
  readonly bounceCount: number;
  readonly hasSplit: boolean;
  readonly lastSurfaceId?: string;
  readonly trajectory: TrajectoryInput;
  readonly ageSeconds: number;
  readonly previousPosition: TrajectoryPoint;
  readonly position: TrajectoryPoint;
  readonly previousVisualPosition: TrajectoryPoint;
  readonly visualPosition: TrajectoryPoint;
  readonly status: ProjectileStatus;
  readonly landedAt?: TrajectoryPoint;
};

export type ProjectileSystemState = {
  readonly projectiles: readonly Projectile[];
  readonly cooldownRemainingSeconds: number;
  readonly nextId: number;
  readonly recycledCount: number;
  readonly bouncedCount: number;
  readonly splitSpawnedCount: number;
};

export type ProjectileSystemUpdate = {
  readonly state: ProjectileSystemState;
  readonly landed: readonly Projectile[];
  readonly recycled: readonly Projectile[];
  readonly spawned: readonly Projectile[];
};

export function createProjectileSystemState(): ProjectileSystemState {
  return {
    projectiles: [],
    cooldownRemainingSeconds: 0,
    nextId: 1,
    recycledCount: 0,
    bouncedCount: 0,
    splitSpawnedCount: 0
  };
}

export function canFireProjectile(state: ProjectileSystemState): boolean {
  return state.cooldownRemainingSeconds <= 0;
}

export function fireProjectile(
  state: ProjectileSystemState,
  origin: Vector2,
  config: ProjectileConfig,
  poopType: PoopType = 'normal_poop',
  rules: ProjectilePoopRules = emptyProjectileRules()
): ProjectileSystemState {
  if (!canFireProjectile(state)) {
    return state;
  }

  const active = state.projectiles.filter((projectile) => projectile.status === 'active');
  if (active.length >= Math.min(config.maxActiveProjectiles, PROJECTILE_SAFETY_LIMITS.maxTotalActiveProjectiles)) {
    return state;
  }

  const trajectory: TrajectoryInput = {
    origin: { x: origin.x, y: config.startProjectionY },
    initialVelocity: config.initialVelocity,
    gravity: config.gravity,
    windAccelerationX: config.windAccelerationX,
    startProjectionY: config.startProjectionY,
    targetProjectionY: config.targetProjectionY,
    apexHeight: config.apexHeight,
    travelDuration: config.travelDuration,
    windAffectX: config.windAffectX,
    windAffectY: config.windAffectY,
    windMaxHorizontalOffset: config.windMaxHorizontalOffset
  };
  const initial = trajectoryStateAt(trajectory, 0);
  const projectile: Projectile = {
    id: state.nextId,
    poopType,
    config,
    rules,
    generation: 0,
    bounceCount: 0,
    hasSplit: false,
    trajectory,
    ageSeconds: 0,
    previousPosition: initial.groundProjection,
    position: initial.groundProjection,
    previousVisualPosition: initial.visualPosition,
    visualPosition: initial.visualPosition,
    status: 'active'
  };

  return {
    ...state,
    projectiles: [...active, projectile],
    cooldownRemainingSeconds: config.cooldownSeconds,
    nextId: state.nextId + 1
  };
}

export function updateProjectileSystem(
  state: ProjectileSystemState,
  deltaSeconds: number,
  groundY: number,
  _fallbackConfig: ProjectileConfig,
  surfaces: readonly BounceSurface[] = [{ y: groundY, tag: 'rooftop_floor' }]
): ProjectileSystemUpdate {
  const safeDelta = Math.max(0, deltaSeconds);
  const landed: Projectile[] = [];
  const recycled: Projectile[] = [];
  const spawned: Projectile[] = [];
  const projectiles: Projectile[] = [];
  let nextId = state.nextId;
  let bouncedCount = state.bouncedCount;
  let splitSpawnedCount = state.splitSpawnedCount;

  for (const projectile of state.projectiles) {
    if (projectile.status !== 'active') {
      recycled.push(projectile);
      continue;
    }

    const ageSeconds = projectile.ageSeconds + safeDelta;
    const previous = trajectoryStateAt(projectile.trajectory, projectile.ageSeconds);
    const current = trajectoryStateAt(projectile.trajectory, ageSeconds);
    const previousPosition = previous.groundProjection;
    const position = current.groundProjection;
    const previousVisualPosition = previous.visualPosition;
    const visualPosition = current.visualPosition;
    const splitAt = projectile.rules.splitAtSeconds;
    if (
      splitAt !== undefined &&
      !projectile.hasSplit &&
      projectile.generation < projectile.rules.maxSplitGeneration &&
      projectile.ageSeconds < splitAt &&
      ageSeconds >= splitAt
    ) {
      const splitPosition = trajectoryStateAt(projectile.trajectory, splitAt).groundProjection;
      const childCount = Math.max(0, projectile.rules.splitProjectileCount);
      const center = (childCount - 1) / 2;
      const availableSlots = Math.max(
        0,
        PROJECTILE_SAFETY_LIMITS.maxTotalActiveProjectiles - projectiles.length - spawned.length
      );
      const spawnCount = Math.min(childCount, availableSlots);

      for (let index = 0; index < spawnCount; index += 1) {
        const offset = (index - center) * projectile.rules.splitSpreadVelocityX;
        const childTrajectory: TrajectoryInput = {
          origin: splitPosition,
          initialVelocity: {
            x: projectile.trajectory.initialVelocity.x + offset,
            y: projectile.trajectory.initialVelocity.y * 0.58
          },
          gravity: projectile.trajectory.gravity,
          windAccelerationX: projectile.trajectory.windAccelerationX,
          startProjectionY: splitPosition.y,
          targetProjectionY: projectile.trajectory.targetProjectionY,
          apexHeight: projectile.trajectory.apexHeight * 0.45,
          travelDuration: Math.max(0.2, projectile.trajectory.travelDuration - splitAt),
          windAffectX: projectile.trajectory.windAffectX,
          windAffectY: projectile.trajectory.windAffectY,
          windMaxHorizontalOffset: projectile.trajectory.windMaxHorizontalOffset
        };
        const childInitial = trajectoryStateAt(childTrajectory, 0);
        const child: Projectile = {
          ...projectile,
          id: nextId,
          parentId: projectile.id,
          generation: projectile.generation + 1,
          bounceCount: projectile.bounceCount,
          hasSplit: true,
          trajectory: childTrajectory,
          ageSeconds: 0,
          previousPosition: childInitial.groundProjection,
          position: childInitial.groundProjection,
          previousVisualPosition: childInitial.visualPosition,
          visualPosition: childInitial.visualPosition,
          status: 'active'
        };
        spawned.push(child);
        projectiles.push(child);
        nextId += 1;
      }
      splitSpawnedCount += spawnCount;

      recycled.push({
        ...projectile,
        ageSeconds,
        previousPosition,
        position,
        previousVisualPosition,
        visualPosition,
        status: 'expired',
        hasSplit: true
      });
      continue;
    }

    const completedProjection = ageSeconds >= projectile.trajectory.travelDuration;
    const completedPosition = completedProjection
      ? trajectoryStateAt(projectile.trajectory, projectile.trajectory.travelDuration).groundProjection
      : undefined;
    const crossedSurface = completedPosition
      ? surfaces.find((surface) => surface.enabled !== false && (!surface.id || surface.id !== projectile.lastSurfaceId) &&
        projectile.rules.bounceSurfaceTags.includes(surface.tag) &&
        (!surface.allowedPoopTags || surface.allowedPoopTags.includes(surface.tag)) &&
        pointInsideSurface(completedPosition, surface))
      : undefined;

    if (crossedSurface && projectile.bounceCount < projectile.rules.maxBounces) {
      const bounceTime = projectile.trajectory.travelDuration;
      const bouncePosition = trajectoryStateAt(projectile.trajectory, bounceTime).groundProjection;
      const incomingVelocity = {
        x: projectile.trajectory.initialVelocity.x + projectile.trajectory.windAccelerationX * bounceTime,
        y: projectile.trajectory.initialVelocity.y + projectile.trajectory.gravity * bounceTime
      };
      const trajectory: TrajectoryInput = {
        origin: bouncePosition,
        initialVelocity: {
          x: incomingVelocity.x,
          y: -Math.abs(incomingVelocity.y) * (crossedSurface.bounceCoefficient ?? projectile.rules.bounceRestitution)
        },
        gravity: projectile.trajectory.gravity,
        windAccelerationX: projectile.trajectory.windAccelerationX,
        startProjectionY: bouncePosition.y,
        targetProjectionY: bouncePosition.y,
        apexHeight: projectile.trajectory.apexHeight * (crossedSurface.bounceCoefficient ?? projectile.rules.bounceRestitution),
        travelDuration: projectile.trajectory.travelDuration * (crossedSurface.bounceCoefficient ?? projectile.rules.bounceRestitution),
        windAffectX: projectile.trajectory.windAffectX,
        windAffectY: projectile.trajectory.windAffectY,
        windMaxHorizontalOffset: projectile.trajectory.windMaxHorizontalOffset
      };
      const bounceInitial = trajectoryStateAt(trajectory, 0);
      projectiles.push({
        ...projectile,
        trajectory,
        ageSeconds: 0,
        previousPosition: bounceInitial.groundProjection,
        position: bounceInitial.groundProjection,
        previousVisualPosition: bounceInitial.visualPosition,
        visualPosition: bounceInitial.visualPosition,
        bounceCount: projectile.bounceCount + 1,
        lastSurfaceId: crossedSurface.id ?? crossedSurface.tag
      });
      bouncedCount += 1;
      continue;
    }

    if (completedProjection) {
      const landingPosition = trajectoryStateAt(
        projectile.trajectory,
        projectile.trajectory.travelDuration
      ).groundProjection;
      const landedProjectile: Projectile = {
        ...projectile,
        ageSeconds,
        previousPosition,
        position: landingPosition,
        previousVisualPosition,
        visualPosition: trajectoryStateAt(
          projectile.trajectory,
          projectile.trajectory.travelDuration
        ).visualPosition,
        status: 'landed',
        landedAt: landingPosition
      };
      landed.push(landedProjectile);
      recycled.push(landedProjectile);
      continue;
    }

    if (ageSeconds >= projectile.config.maxLifetimeSeconds) {
      const expiredProjectile: Projectile = {
        ...projectile,
        ageSeconds,
        position,
        previousVisualPosition,
        visualPosition,
        status: 'expired'
      };
      recycled.push(expiredProjectile);
      continue;
    }

    projectiles.push({
      ...projectile,
      ageSeconds,
      previousPosition,
      position,
      previousVisualPosition,
      visualPosition
    });
  }

  return {
    state: {
      ...state,
      projectiles,
      cooldownRemainingSeconds: Math.max(0, state.cooldownRemainingSeconds - safeDelta),
      nextId,
      recycledCount: state.recycledCount + recycled.length,
      bouncedCount,
      splitSpawnedCount
    },
    landed,
    recycled,
    spawned
  };
}

function pointInsideSurface(point: Vector2, surface: BounceSurface): boolean {
  if (!surface.bounds) return true;
  return point.x >= surface.bounds.x && point.x <= surface.bounds.x + surface.bounds.width &&
    point.y >= surface.bounds.y && point.y <= surface.bounds.y + surface.bounds.height;
}

export function recycleProjectilesById(
  state: ProjectileSystemState,
  projectileIds: readonly number[]
): { readonly state: ProjectileSystemState; readonly recycled: readonly Projectile[] } {
  const ids = new Set(projectileIds);
  const recycled = state.projectiles.filter((projectile) => ids.has(projectile.id));
  if (recycled.length === 0) {
    return { state, recycled };
  }

  return {
    state: {
      ...state,
      projectiles: state.projectiles.filter((projectile) => !ids.has(projectile.id)),
      recycledCount: state.recycledCount + recycled.length
    },
    recycled
  };
}

export function emptyProjectileRules(): ProjectilePoopRules {
  return {
    maxBounces: 0,
    bounceRestitution: 0,
    bounceSurfaceTags: [],
    splitProjectileCount: 0,
    splitSpreadVelocityX: 0,
    maxSplitGeneration: 0
  };
}
