import { describe, expect, it } from 'vitest';
import { LEVEL_09 } from '../../src/data/levels/level09';
import {
  createSecurityState, getReachableHorizontalIntervals, hasValidSecurityRoute, isPlayerOccludedFromSource,
  registerThrowExposure, relocatePlayerFromBlockade, updateSecurity
} from '../../src/domain/security/SecuritySystem';

const rules = LEVEL_09.security!;
const blockade = LEVEL_09.blockade!;
const bounds = { minX: 102, maxX: 1178 };
const guard = [{ id: 3, x: 900 }];

function context(overrides = {}) {
  return { deltaSeconds: 0.1, playerX: 650, isCharging: false, movementBounds: bounds, guards: guard, activateBlockade: false, detectionRateMultiplier: 1, ...overrides };
}

describe('SecuritySystem', () => {
  it('warns before guard observation and accumulates detection only while visible', () => {
    let state = updateSecurity(createSecurityState(), context(), rules, blockade).state;
    expect(state.instances.some((item) => item.sourceType === 'guard' && item.state === 'warning')).toBe(true);
    state = updateSecurity(state, context({ deltaSeconds: 2 }), rules, blockade).state;
    const observing = state.instances.find((item) => item.sourceType === 'guard')!;
    expect(observing.state).toBe('observing');
    const centerX = observing.zone.centerX;
    state = updateSecurity(state, context({ deltaSeconds: 0.5, playerX: centerX }), rules, blockade).state;
    expect(state.instances.find((item) => item.sourceType === 'guard')!.detectionProgress).toBeGreaterThan(0);
    const progress = state.instances.find((item) => item.sourceType === 'guard')!.detectionProgress;
    state = updateSecurity(state, context({ deltaSeconds: 0.2, playerX: 1150 }), rules, blockade).state;
    expect(state.instances.find((item) => item.sourceType === 'guard')!.detectionProgress).toBeLessThan(progress);
  });

  it('uses cover geometry, while throw exposure disables cover temporarily', () => {
    expect(isPlayerOccludedFromSource(250, 'guard', rules.covers, false, false)).toBe(true);
    expect(isPlayerOccludedFromSource(250, 'searchlight', rules.covers, false, false)).toBe(true);
    expect(isPlayerOccludedFromSource(250, 'guard', rules.covers, true, false)).toBe(false);
    const exposed = registerThrowExposure(createSecurityState(), 250, rules);
    expect(exposed.throwExposureSeconds).toBe(rules.throwExposureSeconds);
    expect(exposed.throwExposureToken).toBe(1);
    expect(exposed.stats.throwsWhileConcealed).toBe(1);
    expect(updateSecurity(exposed, context({ deltaSeconds: 0 }), rules, blockade).state).toBe(exposed);
  });

  it('detects once, applies bounded penalty state, and reset is clean', () => {
    let state = updateSecurity(createSecurityState(), context(), rules, blockade).state;
    state = updateSecurity(state, context({ deltaSeconds: 2 }), rules, blockade).state;
    const center = state.instances.find((item) => item.sourceType === 'guard')!.zone.centerX;
    const detected = updateSecurity(state, context({ deltaSeconds: 4, playerX: center, isCharging: true }), rules, blockade);
    expect(detected.results.filter((result) => result.outcome === 'detected')).toHaveLength(1);
    expect(detected.state.stats.securityDetections).toBe(1);
    expect(detected.state.throwLockSeconds).toBe(rules.spottedThrowLockSeconds);
    expect(createSecurityState()).toMatchObject({ instances: [], queuedGuardIds: [], throwExposureSeconds: 0, throwLockSeconds: 0, invulnerabilitySeconds: 0 });
  });

  it('moves searchlights deterministically without sharing phase and keeps bounded sources', () => {
    const first = updateSecurity(createSecurityState(), context({ guards: [] }), rules, blockade).state;
    const second = updateSecurity(createSecurityState(), context({ guards: [] }), rules, blockade).state;
    expect(first).toEqual(second);
    expect(first.instances.filter((item) => item.sourceType === 'searchlight')).toHaveLength(2);
    expect(first.instances.filter((item) => item.sourceType === 'searchlight').map((item) => item.remainingSeconds)[0])
      .not.toBe(first.instances.filter((item) => item.sourceType === 'searchlight').map((item) => item.remainingSeconds)[1]);
  });

  it('warns before blockade, preserves reachability, cover, and relocates deterministically', () => {
    let state = updateSecurity(createSecurityState(), context({ activateBlockade: true }), rules, blockade).state;
    expect(state.blockade.phase).toBe('warning');
    state = updateSecurity(state, context({ deltaSeconds: 3, activateBlockade: true }), rules, blockade).state;
    expect(state.blockade.phase).toBe('active');
    const reachable = getReachableHorizontalIntervals(bounds, state.blockade.blockedIntervals);
    expect(reachable).toEqual([{ start: 102, end: 899 }]);
    expect(reachable[0].end - reachable[0].start).toBeGreaterThanOrEqual(blockade.minimumReachableWidth);
    expect(relocatePlayerFromBlockade(1000, reachable)).toBe(899);
    expect(hasValidSecurityRoute(bounds, state.blockade.blockedIntervals, [], rules.covers, rules.minimumSafeWidth)).toBe(true);
    expect(hasValidSecurityRoute(bounds, [{ start: 102, end: 1178 }], [], rules.covers, rules.minimumSafeWidth)).toBe(false);
  });
});
