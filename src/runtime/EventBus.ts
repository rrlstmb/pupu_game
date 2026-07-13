import type { GameEventName, GameEventPayloads } from './GameEvents';

type Handler<TEvent extends GameEventName> = (payload: GameEventPayloads[TEvent]) => void;
type StoredHandler = (payload: unknown) => void;

export class TypedEventBus {
  private readonly handlers = new Map<GameEventName, Set<StoredHandler>>();

  emit<TEvent extends GameEventName>(event: TEvent, payload: GameEventPayloads[TEvent]): void {
    const handlers = this.handlers.get(event);
    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      handler(payload);
    }
  }

  on<TEvent extends GameEventName>(event: TEvent, handler: Handler<TEvent>): void {
    const handlers = this.handlers.get(event) ?? new Set<StoredHandler>();
    handlers.add(handler as StoredHandler);
    this.handlers.set(event, handlers);
  }

  off<TEvent extends GameEventName>(event: TEvent, handler: Handler<TEvent>): void {
    this.handlers.get(event)?.delete(handler as StoredHandler);
  }

  once<TEvent extends GameEventName>(event: TEvent, handler: Handler<TEvent>): void {
    const onceHandler: Handler<TEvent> = (payload) => {
      this.off(event, onceHandler);
      handler(payload);
    };
    this.on(event, onceHandler);
  }

  listenerCount(event: GameEventName): number {
    return this.handlers.get(event)?.size ?? 0;
  }

  removeAllListeners(): void {
    for (const handlers of this.handlers.values()) {
      handlers.clear();
    }
  }
}

export const eventBus = new TypedEventBus();
