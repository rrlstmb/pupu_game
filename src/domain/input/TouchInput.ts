import type { TouchInputConfig } from '../../data/touchInput';
import type { ActionSnapshot } from './ActionState';

export type TouchInputSnapshot = {
  readonly horizontalAxis: number;
  readonly charge: ActionSnapshot;
  readonly activeThisFrame: boolean;
};

export function touchHorizontalAxis(startX: number, currentX: number, config: TouchInputConfig, sensitivity = 1): number {
  const distance = (currentX - startX) * clamp(sensitivity, 0.5, 1.5);
  if (!config.enabled || Math.abs(distance) <= config.movementDeadZonePx) return 0;
  return clamp(distance / Math.max(config.movementDeadZonePx, config.movementFullAxisDistancePx), -1, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
