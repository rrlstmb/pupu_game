export type AlertStage = 'safe' | 'suspicious' | 'high_alert' | 'exposed_soon' | 'caught';
export type AlertSource =
  | 'normal_hit'
  | 'rapid_throw'
  | 'repeat_hit'
  | 'stationary'
  | 'idle_decay'
  | 'cover_decay'
  | 'stink_zone'
  | 'npc_danger';

export type AlertChange = {
  readonly source: AlertSource;
  readonly amount: number;
  readonly valueAfter: number;
};

export type AlertState = {
  readonly value: number;
  readonly stage: AlertStage;
  readonly isCaught: boolean;
  readonly recentChanges: readonly AlertChange[];
  readonly timeSinceLastThrowSeconds: number;
  readonly lastPlayerX: number;
  readonly stationarySeconds: number;
};

export type AlertRules = {
  readonly minValue: number;
  readonly maxValue: number;
  readonly normalHitIncrease: number;
  readonly repeatHitIncrease: number;
  readonly rapidThrowIncrease: number;
  readonly rapidThrowWindowSeconds: number;
  readonly stationaryThresholdSeconds: number;
  readonly stationaryTolerance: number;
  readonly stationaryIncreasePerSecond: number;
  readonly idleDecayPerSecond: number;
  readonly coverDecayPerSecond: number;
  readonly recentChangeLimit: number;
  readonly stageThresholds: {
    readonly suspicious: number;
    readonly highAlert: number;
    readonly exposedSoon: number;
    readonly caught: number;
  };
  readonly riskMultipliers: Readonly<Record<AlertStage, number>>;
};

export type AlertUpdateContext = {
  readonly deltaSeconds: number;
  readonly playerX: number;
  readonly isInCover: boolean;
  readonly isThrowing: boolean;
};

export function createAlertState(initialPlayerX = 0): AlertState {
  return {
    value: 0,
    stage: 'safe',
    isCaught: false,
    recentChanges: [],
    timeSinceLastThrowSeconds: Number.POSITIVE_INFINITY,
    lastPlayerX: initialPlayerX,
    stationarySeconds: 0
  };
}

export function updateAlertOverTime(state: AlertState, context: AlertUpdateContext, rules: AlertRules): AlertState {
  if (state.isCaught) {
    return state;
  }

  const delta = Math.max(0, context.deltaSeconds);
  const moved = Math.abs(context.playerX - state.lastPlayerX) > rules.stationaryTolerance;
  let next: AlertState = {
    ...state,
    timeSinceLastThrowSeconds: state.timeSinceLastThrowSeconds + delta,
    lastPlayerX: context.playerX,
    stationarySeconds: moved ? 0 : state.stationarySeconds + delta
  };

  if (!context.isThrowing) {
    const decay = context.isInCover ? rules.coverDecayPerSecond : rules.idleDecayPerSecond;
    next = applyAlertChange(next, context.isInCover ? 'cover_decay' : 'idle_decay', -decay * delta, rules);
  }

  if (
    !context.isInCover &&
    next.stationarySeconds >= rules.stationaryThresholdSeconds &&
    Math.floor(next.stationarySeconds) > Math.floor(state.stationarySeconds)
  ) {
    next = applyAlertChange(next, 'stationary', rules.stationaryIncreasePerSecond, rules);
  }

  return next;
}

export function recordThrow(state: AlertState, rules: AlertRules): AlertState {
  if (state.isCaught) {
    return state;
  }

  const next =
    state.timeSinceLastThrowSeconds <= rules.rapidThrowWindowSeconds
      ? applyAlertChange(state, 'rapid_throw', rules.rapidThrowIncrease, rules)
      : state;

  return {
    ...next,
    timeSinceLastThrowSeconds: 0
  };
}

export function recordHit(state: AlertState, validHitCount: number, rules: AlertRules, extraAlertCost = 0): AlertState {
  if (state.isCaught) {
    return state;
  }

  let next = applyAlertChange(state, 'normal_hit', rules.normalHitIncrease + extraAlertCost, rules);
  if (validHitCount > 1) {
    next = applyAlertChange(next, 'repeat_hit', rules.repeatHitIncrease * (validHitCount - 1), rules);
  }

  return next;
}

export function applyAlertDelta(state: AlertState, amount: number, source: AlertSource, rules: AlertRules): AlertState {
  if (state.isCaught) {
    return state;
  }

  return applyAlertChange(state, source, amount, rules);
}

export function riskMultiplierForAlert(state: AlertState, rules: AlertRules): number {
  return rules.riskMultipliers[state.stage];
}

export function resetAlert(_state: AlertState, initialPlayerX = 0): AlertState {
  return createAlertState(initialPlayerX);
}

export function stageForAlert(value: number, rules: Pick<AlertRules, 'stageThresholds'>): AlertStage {
  if (value >= rules.stageThresholds.caught) {
    return 'caught';
  }
  if (value >= rules.stageThresholds.exposedSoon) {
    return 'exposed_soon';
  }
  if (value >= rules.stageThresholds.highAlert) {
    return 'high_alert';
  }
  if (value >= rules.stageThresholds.suspicious) {
    return 'suspicious';
  }
  return 'safe';
}

function applyAlertChange(state: AlertState, source: AlertSource, amount: number, rules: AlertRules): AlertState {
  if (amount === 0 || (state.value === rules.minValue && amount < 0)) {
    return state;
  }

  const value = clamp(state.value + amount, rules.minValue, rules.maxValue);
  const stage = stageForAlert(value, rules);
  const change: AlertChange = {
    source,
    amount,
    valueAfter: value
  };
  const recentChanges =
    amount > 0 || Math.abs(amount) >= 1
      ? [change, ...state.recentChanges].slice(0, rules.recentChangeLimit)
      : state.recentChanges;

  return {
    ...state,
    value,
    stage,
    isCaught: stage === 'caught',
    recentChanges
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
