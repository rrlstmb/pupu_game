export type TouchInputConfig = {
  readonly enabled: boolean;
  readonly movementDeadZonePx: number;
  readonly movementFullAxisDistancePx: number;
  readonly movementAxisSmoothingMs: number;
  readonly minimumTouchTargetPx: number;
  readonly preventSyntheticMouseMs: number;
  readonly penPolicy: 'touch_like' | 'mouse_like';
};

export const TOUCH_INPUT_CONFIG: TouchInputConfig = {
  enabled: true,
  movementDeadZonePx: 12,
  movementFullAxisDistancePx: 96,
  movementAxisSmoothingMs: 0,
  minimumTouchTargetPx: 56,
  preventSyntheticMouseMs: 700,
  penPolicy: 'touch_like'
};
