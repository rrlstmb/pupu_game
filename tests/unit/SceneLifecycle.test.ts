import { EventEmitter } from 'node:events';
import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { registerSceneDisposer } from '../../src/runtime/sceneLifecycle';

vi.mock('phaser', () => ({
  default: {
    Scenes: {
      Events: {
        SHUTDOWN: 'shutdown',
        DESTROY: 'destroy'
      }
    }
  }
}));

const SceneEvents = {
  Shutdown: 'shutdown',
  Destroy: 'destroy'
} as const;

function sceneWithEvents(events: EventEmitter): Phaser.Scene {
  return { events } as unknown as Phaser.Scene;
}

describe('registerSceneDisposer', () => {
  it('removes both lifecycle listeners after shutdown and disposes once', () => {
    const events = new EventEmitter();
    const disposer = vi.fn();
    registerSceneDisposer(sceneWithEvents(events), disposer);

    expect(events.listenerCount(SceneEvents.Shutdown)).toBe(1);
    expect(events.listenerCount(SceneEvents.Destroy)).toBe(1);

    events.emit(SceneEvents.Shutdown);
    events.emit(SceneEvents.Destroy);

    expect(disposer).toHaveBeenCalledTimes(1);
    expect(events.listenerCount(SceneEvents.Shutdown)).toBe(0);
    expect(events.listenerCount(SceneEvents.Destroy)).toBe(0);
  });

  it('removes both lifecycle listeners when destroy occurs first', () => {
    const events = new EventEmitter();
    const disposer = vi.fn();
    registerSceneDisposer(sceneWithEvents(events), disposer);

    events.emit(SceneEvents.Destroy);
    events.emit(SceneEvents.Shutdown);

    expect(disposer).toHaveBeenCalledTimes(1);
    expect(events.listenerCount(SceneEvents.Shutdown)).toBe(0);
    expect(events.listenerCount(SceneEvents.Destroy)).toBe(0);
  });
});
