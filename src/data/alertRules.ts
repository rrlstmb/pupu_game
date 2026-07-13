import type { AlertRules } from '../domain/alert/AlertSystem';

export const ALERT_RULES: AlertRules = {
  minValue: 0,
  maxValue: 100,
  normalHitIncrease: 14,
  repeatHitIncrease: 9,
  rapidThrowIncrease: 7,
  rapidThrowWindowSeconds: 0.9,
  stationaryThresholdSeconds: 2.5,
  stationaryTolerance: 10,
  stationaryIncreasePerSecond: 3,
  idleDecayPerSecond: 2,
  coverDecayPerSecond: 8,
  recentChangeLimit: 6,
  stageThresholds: {
    suspicious: 30,
    highAlert: 60,
    exposedSoon: 80,
    caught: 100
  },
  riskMultipliers: {
    safe: 1,
    suspicious: 1.15,
    high_alert: 1.35,
    exposed_soon: 1.7,
    caught: 1.7
  }
};
