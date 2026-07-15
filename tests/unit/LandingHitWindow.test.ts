import { describe, expect, it } from 'vitest';
import { LANDING_HIT_CONFIG } from '../../src/data/hitDetectionConfig';
import { NPC_DEFINITIONS } from '../../src/data/npcDefinitions';
import {
  isNPCInLandingHitWindow,
  landingHitWindow,
  npcDynamicHitRange,
  selectLandingHitCandidates,
  type ProjectileLandingPoint
} from '../../src/domain/gameplay/LandingHitWindow';
import type { NPCDefinition, NPCInstanceState } from '../../src/domain/npc/NPCModel';

const office = NPC_DEFINITIONS.find((definition) => definition.id === 'office_worker')!;
const landing: ProjectileLandingPoint = { x: 500, y: 358, poopType: 'normal_poop' };

describe('LandingHitWindow', () => {
  it('uses one scaled NPC world width on each horizontal side', () => {
    const small = definitionWithSize(30, 58);
    const large = definitionWithSize(80, 58);
    expect(npcDynamicHitRange(npcAt(1, 500, 358), small, LANDING_HIT_CONFIG).horizontalBonusRange).toBe(30);
    expect(npcDynamicHitRange(npcAt(2, 500, 358), large, LANDING_HIT_CONFIG).horizontalBonusRange).toBe(80);
    expect(landingHitWindow(landing, npcAt(2, 500, 358), large, LANDING_HIT_CONFIG)).toMatchObject({
      left: 420,
      right: 580
    });
  });

  it('data-drives multiplier and clamps horizontal/vertical padding', () => {
    const npc = npcAt(1, 500, 358);
    const tiny = definitionWithSize(10, 10);
    const huge = definitionWithSize(300, 300);
    const doubled = { ...LANDING_HIT_CONFIG, hitWindowEnemyWidthMultiplier: 2 };
    expect(npcDynamicHitRange(npc, definitionWithSize(30, 58), doubled).horizontalBonusRange).toBe(60);
    expect(npcDynamicHitRange(npc, tiny, LANDING_HIT_CONFIG)).toMatchObject({
      horizontalBonusRange: LANDING_HIT_CONFIG.hitWindowMinHorizontalPadding,
      verticalBonusRange: LANDING_HIT_CONFIG.hitWindowMinVerticalPadding
    });
    expect(npcDynamicHitRange(npc, huge, LANDING_HIT_CONFIG)).toMatchObject({
      horizontalBonusRange: LANDING_HIT_CONFIG.hitWindowMaxHorizontalPadding,
      verticalBonusRange: LANDING_HIT_CONFIG.hitWindowMaxVerticalPadding
    });
  });

  it('accepts the dynamic horizontal edge but rejects beyond it and another lane', () => {
    const small = definitionWithSize(30, 58);
    expect(isNPCInLandingHitWindow(landing, npcAt(1, 530, 358), small, LANDING_HIT_CONFIG)).toBe(true);
    expect(isNPCInLandingHitWindow(landing, npcAt(1, 530.01, 358), small, LANDING_HIT_CONFIG)).toBe(false);
    expect(isNPCInLandingHitWindow(landing, npcAt(1, 500, 250), small, LANDING_HIT_CONFIG)).toBe(false);
  });

  it('sorts by distance, lane distance, then stable NPC id independent of array order', () => {
    const farther = npcAt(9, 525, 358);
    const nearer = npcAt(8, 510, 358);
    expect(selectLandingHitCandidates(landing, [farther, nearer], [office], LANDING_HIT_CONFIG, () => true)[0].npc.id)
      .toBe(8);

    const tiedHighId = npcAt(7, 510, 358);
    const tiedLowId = npcAt(3, 490, 358);
    const select = (npcs: readonly NPCInstanceState[]) =>
      selectLandingHitCandidates(landing, npcs, [office], LANDING_HIT_CONFIG, () => true)[0].npc.id;
    expect(select([tiedHighId, tiedLowId])).toBe(3);
    expect(select([tiedLowId, tiedHighId])).toBe(3);
  });
});

function definitionWithSize(width: number, height: number): NPCDefinition {
  return { ...office, width, height };
}

function npcAt(id: number, x: number, y: number): NPCInstanceState {
  return {
    id,
    definitionId: 'office_worker',
    laneId: 'mid_sidewalk',
    x,
    y,
    scale: 1,
    depth: 1,
    baseSpeed: office.baseSpeed,
    currentSpeed: office.baseSpeed,
    state: 'Walking',
    ageSeconds: 0,
    distanceTravelled: 100,
    validHitCount: 0,
    hitWindowId: 1,
    rantRemainingSeconds: 0,
    immunityRemainingSeconds: 0,
    reactionLevel: 0,
    activeEffects: [],
    dangerPhase: 'none',
    dangerRemainingSeconds: 0,
    cleanerCooldownSeconds: 0,
    alertPulse: 0,
    retaliationCount: 0
  };
}
