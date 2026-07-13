import type { ProjectileConfig } from '../../data/projectileConfig';
import type { PoopType, ProjectilePoopRules, SurfaceTag } from '../poop/PoopModel';
import { positionAt, type TrajectoryInput, type TrajectoryPoint, type Vector2 } from './ProjectileTrajectory';

export type ProjectileStatus = 'active' | 'landed' | 'expired';

export const PROJECTILE_SAFETY_LIMITS = {
  maxTotalActiveProjectiles: 18
} as const;

export type BounceSurface = {
  readonly y: number;
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
  readonly trajectory: TrajectoryInput;
  readonly ageSeconds: number;
  readonly previousPosition: TrajectoryPoint;
  readonly position: TrajectoryPoint;
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
    origin,
    initialVelocity: config.initialVelocity,
    gravity: config.gravity,
    windAccelerationX: config.windAccelerationX
  };
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
    previousPosition: positionAt(trajectory, 0),
    position: positionAt(trajectory, 0),
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
    const previousPosition = positionAt(projectile.trajectory, projectile.ageSeconds);
    const position = positionAt(projectile.trajectory, ageSeconds);
    const splitAt = projectile.rules.splitAtSeconds;
    if (
      splitAt !== undefined &&
      !projectile.hasSplit &&
      projectile.generation < projectile.rules.maxSplitGeneration &&
      projectile.ageSeconds < splitAt &&
      ageSeconds >= splitAt
    ) {
      const splitPosition = positionAt(projectile.trajectory, splitAt);
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
          windAccelerationX: projectile.trajectory.windAccelerationX
        };
        const child: Projectile = {
          ...projectile,
          id: nextId,
          parentId: projectile.id,
          generation: projectile.generation + 1,
          bounceCount: projectile.bounceCount,
          hasSplit: true,
          trajectory: childTrajectory,
          ageSeconds: 0,
          previousPosition: positionAt(childTrajectory, 0),
          position: positionAt(childTrajectory, 0),
          status: 'active'
        };
        spawned.push(child);
        projectiles.push(child);
        nextId += 1;
      }
      splitSpawnedCount += spawnCount;

      recycled.push({ ...projectile, ageSeconds, previousPosition, position, status: 'expired', hasSplit: true });
      continue;
    }

    const crossedSurface = surfaces.find(
      (surface) =>
        ((previousPosition.y < surface.y && position.y >= surface.y) ||
          (projectile.ageSeconds === 0 && previousPosition.y >= surface.y && projectile.trajectory.initialVelocity.y >= 0)) &&
        projectile.rules.bounceSurfaceTags.includes(surface.tag)
    );

    if (crossedSurface && projectile.bounceCount < projectile.rules.maxBounces) {
      const segmentDy = position.y - previousPosition.y;
      const ratio = segmentDy === 0 ? 0 : (crossedSurface.y - previousPosition.y) / segmentDy;
      const bounceTime = projectile.ageSeconds + (ageSeconds - projectile.ageSeconds) * ratio;
      const bouncePosition = { ...positionAt(projectile.trajectory, bounceTime), y: crossedSurface.y };
      const incomingVelocity = {
        x: projectile.trajectory.initialVelocity.x + projectile.trajectory.windAccelerationX * bounceTime,
        y: projectile.trajectory.initialVelocity.y + projectile.trajectory.gravity * bounceTime
      };
      const trajectory: TrajectoryInput = {
        origin: bouncePosition,
        initialVelocity: {
          x: incomingVelocity.x,
          y: -Math.abs(incomingVelocity.y) * projectile.rules.bounceRestitution
        },
        gravity: projectile.trajectory.gravity,
        windAccelerationX: projectile.trajectory.windAccelerationX
      };
      projectiles.push({
        ...projectile,
        trajectory,
        ageSeconds: 0,
        previousPosition: positionAt(trajectory, 0),
        position: positionAt(trajectory, 0),
        bounceCount: projectile.bounceCount + 1
      });
      bouncedCount += 1;
      continue;
    }

    const crossesLandingPlane =
      (previousPosition.y < groundY && position.y >= groundY) ||
      (projectile.ageSeconds === 0 && previousPosition.y >= groundY && projectile.trajectory.initialVelocity.y >= 0);

    if (crossesLandingPlane) {
      const segmentDy = position.y - previousPosition.y;
      const ratio = segmentDy === 0 ? 0 : (groundY - previousPosition.y) / segmentDy;
      const landingTime = projectile.ageSeconds + (ageSeconds - projectile.ageSeconds) * ratio;
      const landingPosition = { ...positionAt(projectile.trajectory, landingTime), y: groundY };
      const landedProjectile: Projectile = {
        ...projectile,
        ageSeconds,
        position: landingPosition,
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
        status: 'expired'
      };
      recycled.push(expiredProjectile);
      continue;
    }

    projectiles.push({
      ...projectile,
      ageSeconds,
      previousPosition,
      position
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
