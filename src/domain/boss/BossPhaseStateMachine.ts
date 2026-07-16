import type { BossEncounterDefinition } from '../level/LevelDefinition';
import type { PoopType } from '../poop/PoopModel';

export type BossEncounterPhase = 'not_started' | 'phase_1_parade' | 'transition_1' |
  'phase_2_protected_boss' | 'transition_2' | 'phase_3_rooftop_lockdown' |
  'final_vulnerable' | 'completed' | 'failed' | 'cancelled';
export type BossProtectionState = { readonly id: string; readonly state: 'locked' | 'active' | 'broken'; readonly progress: number };
export type BossEncounterState = {
  readonly encounterId: string;
  readonly levelSessionId: string;
  readonly phase: BossEncounterPhase;
  readonly phaseSeconds: number;
  readonly transitionSequence: number;
  readonly processedTransitionTokens: readonly string[];
  readonly processedInteractionTokens: readonly string[];
  readonly protections: readonly BossProtectionState[];
  readonly bossX: number;
  readonly movementDirection: -1 | 1;
  readonly blockedStageCount: number;
  readonly blockadeWarningSeconds: number;
  readonly finalWindowState: 'closed' | 'warning' | 'active' | 'recovery';
  readonly finalWindowSeconds: number;
  readonly finalWindowAttempts: number;
  readonly finalGoldenGranted: number;
  readonly finalGoldenRemaining: number;
  readonly finalHitToken?: string;
  readonly completionCount: number;
  readonly failureCount: number;
  readonly feedback: string;
};
export type BossContext = {
  readonly deltaSeconds: number;
  readonly paused: boolean;
  readonly phase1Score: number;
  readonly phase1UniqueInteractions: number;
  readonly paradeWaveCompleted: boolean;
  readonly safetyAllowsProgress: boolean;
};

export function createBossEncounterState(levelSessionId: string, definition: BossEncounterDefinition): BossEncounterState {
  return {
    encounterId: `${levelSessionId}:${definition.id}`, levelSessionId, phase: 'not_started', phaseSeconds: 0,
    transitionSequence: 0, processedTransitionTokens: [], processedInteractionTokens: [],
    protections: definition.protections.map((gate, index) => ({ id: gate.id, state: index === 0 ? 'active' : 'locked', progress: 0 })),
    bossX: definition.movementProfiles[0].minX, movementDirection: 1, blockedStageCount: 0, blockadeWarningSeconds: 0,
    finalWindowState: 'closed', finalWindowSeconds: 0, finalWindowAttempts: 0,
    finalGoldenGranted: 0, finalGoldenRemaining: 0, completionCount: 0, failureCount: 0, feedback: '城市潔淨日準備中'
  };
}

export function updateBossEncounter(state: BossEncounterState, context: BossContext, definition: BossEncounterDefinition): BossEncounterState {
  if (context.paused || context.deltaSeconds <= 0 || terminal(state.phase)) return state;
  const delta = context.deltaSeconds;
  if (state.phase === 'not_started') return transition(state, 'phase_1_parade', 'parade-start', '第一階段：城市潔淨日遊行');
  if (state.phase === 'phase_1_parade') {
    const phase = definition.phases[0];
    if (context.phase1Score >= (phase.phaseScoreTarget ?? 0) &&
      context.phase1UniqueInteractions >= (phase.uniqueInteractionTarget ?? 0) && context.paradeWaveCompleted) {
      return transition(state, 'transition_1', 'phase1-complete', '遊行突破，潔癖網紅登場');
    }
    return tickOrFail(state, delta, phase.timeoutSeconds);
  }
  if (state.phase === 'transition_1') {
    return state.phaseSeconds + delta >= definition.phases[0].transitionSeconds
      ? transition({ ...state, phaseSeconds: state.phaseSeconds + delta }, 'phase_2_protected_boss', 'boss-arrival', '第二階段：依序破解防護')
      : { ...state, phaseSeconds: state.phaseSeconds + delta };
  }
  if (state.phase === 'phase_2_protected_boss') {
    if (state.protections.every((gate) => gate.state === 'broken')) return transition(state, 'transition_2', 'protections-broken', '防護全破，轉進頂樓');
    return moveBoss(tickOrFail(state, delta, definition.phases[1].timeoutSeconds), delta, definition, 1);
  }
  if (state.phase === 'transition_2') {
    if (state.phaseSeconds + delta < definition.phases[1].transitionSeconds) return { ...state, phaseSeconds: state.phaseSeconds + delta };
    const entered = transition(state, 'phase_3_rooftop_lockdown', 'rooftop-enter', '第三階段：頂樓封鎖');
    return { ...entered, finalGoldenGranted: definition.finalGolden.grantedOnPhaseEnter,
      finalGoldenRemaining: definition.finalGolden.grantedOnPhaseEnter };
  }
  if (state.phase === 'phase_3_rooftop_lockdown') {
    const next = moveBoss(tickOrFail(state, delta, definition.phases[2].timeoutSeconds), delta, definition, 1);
    if (!context.safetyAllowsProgress) return { ...next, feedback: '等待安全投擲空間' };
    if (next.blockedStageCount < definition.safety.blockedStages.length) {
      const stage = definition.safety.blockedStages[next.blockedStageCount];
      if (next.blockadeWarningSeconds <= 0) return { ...next, blockadeWarningSeconds: stage.warningSeconds, feedback: `封鎖預告：${stage.id}` };
      const warning = next.blockadeWarningSeconds - delta;
      return warning > 0 ? { ...next, blockadeWarningSeconds: warning }
        : { ...next, blockedStageCount: next.blockedStageCount + 1, blockadeWarningSeconds: 0, feedback: `封鎖生效：${stage.id}` };
    }
    return startFinalWindow(next, definition);
  }
  if (state.phase === 'final_vulnerable') return updateFinalWindow(moveBoss(state, delta, definition, 1), delta, definition);
  return state;
}

export function registerBossInteraction(
  state: BossEncounterState,
  interaction: 'camera_interrupt' | 'jumbo_or_bounce' | 'sticky_slow',
  token: string,
  definition: BossEncounterDefinition
): BossEncounterState {
  if (state.phase !== 'phase_2_protected_boss' || state.processedInteractionTokens.includes(token)) return state;
  const activeIndex = state.protections.findIndex((gate) => gate.state === 'active');
  if (activeIndex < 0) return state;
  const authored = definition.protections[activeIndex];
  if (authored.requiredInteraction !== interaction) return { ...state, processedInteractionTokens: [...state.processedInteractionTokens, token], feedback: authored.feedbackLocked };
  const progress = state.protections[activeIndex].progress + 1;
  const broken = progress >= authored.requiredCount;
  const protections = state.protections.map((gate, index) => index === activeIndex
    ? { ...gate, progress, state: broken ? 'broken' as const : 'active' as const }
    : broken && index === activeIndex + 1 ? { ...gate, state: 'active' as const } : gate);
  return { ...state, protections, processedInteractionTokens: [...state.processedInteractionTokens, token], feedback: broken ? authored.feedbackBroken : `${authored.feedbackBroken} ${progress}/${authored.requiredCount}` };
}

export function consumeFinalGolden(state: BossEncounterState): BossEncounterState {
  if ((state.phase !== 'phase_3_rooftop_lockdown' && state.phase !== 'final_vulnerable') || state.finalGoldenRemaining <= 0) return state;
  const remaining = state.finalGoldenRemaining - 1;
  return remaining === 0 && state.finalWindowState !== 'active'
    ? failBossEncounter({ ...state, finalGoldenRemaining: remaining }, '最終黃金便已耗盡')
    : { ...state, finalGoldenRemaining: remaining };
}

export function acceptFinalBossHit(state: BossEncounterState, poopType: PoopType, projectileToken: string): BossEncounterState {
  if (state.phase !== 'final_vulnerable' || state.finalWindowState !== 'active' || poopType !== 'golden_poop' ||
    state.finalHitToken || state.processedInteractionTokens.includes(projectileToken)) return state;
  return { ...state, phase: 'completed', finalWindowState: 'closed', finalHitToken: projectileToken,
    processedInteractionTokens: [...state.processedInteractionTokens, projectileToken], completionCount: 1, feedback: '屎命完成' };
}

export function isBossLandingHit(state: BossEncounterState, x: number, y: number, definition: BossEncounterDefinition): boolean {
  if (state.phase !== 'phase_2_protected_boss' && state.phase !== 'phase_3_rooftop_lockdown' && state.phase !== 'final_vulnerable') return false;
  return Math.abs(x - state.bossX) <= definition.bossWidth && Math.abs(y - definition.bossY) <= definition.bossHeight * 0.6;
}

export function failBossEncounter(state: BossEncounterState, feedback: string): BossEncounterState {
  if (terminal(state.phase)) return state;
  return { ...state, phase: 'failed', failureCount: 1, finalWindowState: 'closed', feedback };
}

export function failIfFinalAttemptsExhausted(state: BossEncounterState): BossEncounterState {
  return state.finalGoldenRemaining <= 0 && state.phase !== 'completed'
    ? failBossEncounter(state, '最終黃金便已耗盡') : state;
}

function transition(state: BossEncounterState, phase: BossEncounterPhase, reason: string, feedback: string): BossEncounterState {
  if (terminal(state.phase)) return state;
  const token = `${state.encounterId}:${state.transitionSequence + 1}:${reason}`;
  if (state.processedTransitionTokens.includes(token)) return state;
  return { ...state, phase, phaseSeconds: 0, transitionSequence: state.transitionSequence + 1,
    processedTransitionTokens: [...state.processedTransitionTokens, token], feedback };
}

function tickOrFail(state: BossEncounterState, delta: number, timeout: number): BossEncounterState {
  const phaseSeconds = state.phaseSeconds + delta;
  return phaseSeconds >= timeout ? failBossEncounter({ ...state, phaseSeconds }, '階段逾時') : { ...state, phaseSeconds };
}

function moveBoss(state: BossEncounterState, delta: number, definition: BossEncounterDefinition, profileIndex: number): BossEncounterState {
  if (terminal(state.phase)) return state;
  const profile = definition.movementProfiles[profileIndex];
  let x = state.bossX + profile.speed * state.movementDirection * delta;
  let direction = state.movementDirection;
  if (x >= profile.maxX) { x = profile.maxX; direction = -1; }
  if (x <= profile.minX) { x = profile.minX; direction = 1; }
  return { ...state, bossX: x, movementDirection: direction };
}

function startFinalWindow(state: BossEncounterState, definition: BossEncounterDefinition): BossEncounterState {
  if (state.finalWindowAttempts >= definition.finalWindow.repeatLimit) return failBossEncounter(state, '最終投遞機會耗盡');
  return { ...state, phase: 'final_vulnerable', finalWindowState: 'warning', finalWindowSeconds: definition.finalWindow.warningSeconds,
    finalWindowAttempts: state.finalWindowAttempts + 1, feedback: '最終投遞機會即將開啟' };
}

function updateFinalWindow(state: BossEncounterState, delta: number, definition: BossEncounterDefinition): BossEncounterState {
  const remaining = state.finalWindowSeconds - delta;
  if (remaining > 0) return { ...state, phaseSeconds: state.phaseSeconds + delta, finalWindowSeconds: remaining };
  if (state.finalWindowState === 'warning') return { ...state, finalWindowState: 'active', finalWindowSeconds: definition.finalWindow.activeSeconds, feedback: 'FINAL OPEN' };
  if (state.finalWindowState === 'active') return { ...state, finalWindowState: 'recovery', finalWindowSeconds: definition.finalWindow.recoverySeconds, feedback: 'Boss 防護恢復中' };
  return { ...state, phase: 'phase_3_rooftop_lockdown', finalWindowState: 'closed', finalWindowSeconds: 0, feedback: '等待下一次最終投遞機會' };
}

function terminal(phase: BossEncounterPhase): boolean { return phase === 'completed' || phase === 'failed' || phase === 'cancelled'; }
