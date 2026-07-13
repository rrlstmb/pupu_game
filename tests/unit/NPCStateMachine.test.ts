import { describe, expect, it } from 'vitest';
import { NPC_DEFINITIONS } from '../../src/data/npcDefinitions';
import { createNPCInstance, updateNPCState } from '../../src/domain/npc/NPCStateMachine';
import { SeededRng } from '../../src/domain/random/SeededRng';

describe('NPCStateMachine', () => {
  it('transitions entering to walking after travel begins', () => {
    const definition = NPC_DEFINITIONS.find((npc) => npc.id === 'office_worker')!;
    const rng = new SeededRng('state');
    const npc = createNPCInstance(1, definition, { laneId: 'mid_sidewalk', x: 1300, y: 300, scale: 1, depth: 1 }, rng);
    const updated = updateNPCState(npc, definition, 0.5, -80, rng);

    expect(updated.state).toBe('Walking');
    expect(updated.x).toBeLessThan(npc.x);
  });

  it('uses seeded distracted schedule for phone users', () => {
    const definition = NPC_DEFINITIONS.find((npc) => npc.id === 'phone_user')!;
    const rng = new SeededRng('phone');
    let npc = createNPCInstance(1, definition, { laneId: 'mid_sidewalk', x: 1300, y: 300, scale: 1, depth: 1 }, rng);

    for (let index = 0; index < 20 && npc.state !== 'Distracted'; index += 1) {
      npc = updateNPCState(npc, definition, 0.2, -80, rng);
    }

    expect(npc.state).toBe('Distracted');
    expect(npc.currentSpeed).toBeLessThan(npc.baseSpeed);

    for (let index = 0; index < 20 && npc.state === 'Distracted'; index += 1) {
      npc = updateNPCState(npc, definition, 0.2, -80, rng);
    }

    expect(npc.state).toBe('Walking');
    expect(npc.currentSpeed).toBe(npc.baseSpeed);
  });

  it('does not mutate readonly definitions while updating runtime state', () => {
    const definition = NPC_DEFINITIONS.find((npc) => npc.id === 'jogger')!;
    const before = JSON.stringify(definition);
    const rng = new SeededRng('readonly');
    const npc = createNPCInstance(1, definition, { laneId: 'front_road', x: 1300, y: 400, scale: 1, depth: 1 }, rng);

    updateNPCState(npc, definition, 1, -80, rng);

    expect(JSON.stringify(definition)).toBe(before);
  });

  it('enters Exiting after crossing the configured left boundary', () => {
    const definition = NPC_DEFINITIONS.find((npc) => npc.id === 'jogger')!;
    const rng = new SeededRng('exit');
    const npc = createNPCInstance(1, definition, { laneId: 'front_road', x: -70, y: 400, scale: 1, depth: 1 }, rng);
    const exited = updateNPCState({ ...npc, state: 'Walking' }, definition, 0.1, -80, rng);

    expect(exited.state).toBe('Exiting');
    expect(exited.x).toBeLessThanOrEqual(-80);
  });
});
