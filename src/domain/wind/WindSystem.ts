import type { LevelWindDefinition, WindDirection, WindSegment } from '../level/LevelDefinition';
import type { PoopType } from '../poop/PoopModel';

export type WindState = {
  readonly activeSegmentId?: string;
  readonly warningSegmentId?: string;
  readonly warningDirection?: WindDirection;
  readonly warningStrength?: number;
  readonly direction: WindDirection;
  readonly strength: number;
  readonly accelerationX: number;
  readonly warningRemainingSeconds: number;
};

export const CALM_WIND_STATE: WindState = {
  direction: 'calm', strength: 0, accelerationX: 0, warningRemainingSeconds: 0
};

export function resolveWindState(
  definition: LevelWindDefinition | undefined,
  remainingSeconds: number,
  poopType: PoopType
): WindState {
  if (!definition) return CALM_WIND_STATE;
  const warning = upcomingWarning(definition, remainingSeconds);
  const active = [...definition.segments]
    .filter((segment) => isActive(segment, remainingSeconds))
    .sort((left, right) => left.startAtRemainingSeconds - right.startAtRemainingSeconds)[0];
  if (active) return {
    ...stateForSegment(active, definition, poopType),
    ...(warning ? warningFields(warning, remainingSeconds) : {})
  };
  return warning ? {
    ...CALM_WIND_STATE,
    ...warningFields(warning, remainingSeconds)
  } : CALM_WIND_STATE;
}

export function windOffsetX(accelerationX: number, elapsedSeconds: number, maxOffset: number): number {
  const raw = 0.5 * accelerationX * Math.max(0, elapsedSeconds) ** 2;
  return Math.max(-maxOffset, Math.min(maxOffset, raw));
}

function isActive(segment: WindSegment, remainingSeconds: number): boolean {
  return remainingSeconds <= segment.startAtRemainingSeconds &&
    remainingSeconds > segment.startAtRemainingSeconds - segment.durationSeconds;
}

function upcomingWarning(definition: LevelWindDefinition, remainingSeconds: number): WindSegment | undefined {
  return [...definition.segments]
    .filter((segment) => remainingSeconds > segment.startAtRemainingSeconds &&
      remainingSeconds <= segment.startAtRemainingSeconds + segment.warningSeconds)
    .sort((left, right) => left.startAtRemainingSeconds - right.startAtRemainingSeconds)[0];
}

function warningFields(segment: WindSegment, remainingSeconds: number) {
  return {
    warningSegmentId: segment.id,
    warningDirection: segment.direction,
    warningStrength: segment.strength,
    warningRemainingSeconds: remainingSeconds - segment.startAtRemainingSeconds
  } as const;
}

function stateForSegment(segment: WindSegment, definition: LevelWindDefinition, poopType: PoopType): WindState {
  const sign = segment.direction === 'left' ? -1 : segment.direction === 'right' ? 1 : 0;
  return {
    activeSegmentId: segment.id,
    direction: segment.direction,
    strength: segment.strength,
    accelerationX: sign * segment.strength * definition.influenceCoefficient * definition.resistanceByPoopType[poopType],
    warningRemainingSeconds: 0
  };
}
