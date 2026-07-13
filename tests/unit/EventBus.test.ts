import { describe, expect, it } from 'vitest';
import { TypedEventBus } from '../../src/runtime/EventBus';
import { GameEvents } from '../../src/runtime/GameEvents';

describe('TypedEventBus', () => {
  it('registers, emits, and disposes listeners explicitly', () => {
    const bus = new TypedEventBus();
    const seen: string[] = [];
    const handler = (payload: { scene: string }) => {
      seen.push(payload.scene);
    };

    bus.on(GameEvents.SceneReady, handler);
    expect(bus.listenerCount(GameEvents.SceneReady)).toBe(1);

    bus.emit(GameEvents.SceneReady, { scene: 'MenuScene' });
    expect(seen).toEqual(['MenuScene']);

    bus.off(GameEvents.SceneReady, handler);
    expect(bus.listenerCount(GameEvents.SceneReady)).toBe(0);
  });
});

