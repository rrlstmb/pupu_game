export type MouseInputConfig = {
  readonly enabled: boolean;
  readonly deadZonePx: number;
  readonly fullSpeedDistancePx: number;
  readonly axisSmoothingMs: number;
  readonly leaveCanvasBehavior: 'neutral';
  readonly keyboardOverridePolicy: 'held_keyboard_axis';
};

export const MOUSE_INPUT_CONFIG: MouseInputConfig = {
  enabled: true,
  deadZonePx: 22,
  fullSpeedDistancePx: 180,
  axisSmoothingMs: 0,
  leaveCanvasBehavior: 'neutral',
  keyboardOverridePolicy: 'held_keyboard_axis'
};
