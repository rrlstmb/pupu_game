import type Phaser from 'phaser';
import type { NPCDefinition } from '../../domain/npc/NPCModel';
import type { NPCSpawnerState } from '../../domain/npc/NPCModel';

type NPCView = {
  readonly container: Phaser.GameObjects.Container;
  readonly body: Phaser.GameObjects.Rectangle;
  readonly head: Phaser.GameObjects.Arc;
  readonly label: Phaser.GameObjects.Text;
  readonly bubble: Phaser.GameObjects.Text;
};

export type NPCViewPoolStats = {
  readonly active: number;
  readonly pooled: number;
  readonly created: number;
  readonly reused: number;
};

export class PhaserNPCSystem {
  private readonly views = new Map<number, NPCView>();
  private readonly pooledViews: NPCView[] = [];
  private createdViewCount = 0;
  private reusedViewCount = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly definitions: readonly NPCDefinition[]
  ) {}

  sync(state: NPCSpawnerState, debugVisible: boolean): void {
    const activeIds = new Set(state.npcs.map((npc) => npc.id));

    for (const id of this.views.keys()) {
      if (!activeIds.has(id)) {
        this.releaseView(id);
      }
    }

    for (const npc of state.npcs) {
      const definition = this.definitionById(npc.definitionId);
      const view = this.views.get(npc.id) ?? this.acquireView(npc.id, definition);
      view.container.setPosition(npc.x, npc.y);
      view.container.setScale(npc.scale);
      view.container.setDepth(npc.depth);
      view.body.setFillStyle(colorForState(definition.color, npc.state), 1);
      view.label.setText(
        `#${npc.id} ${definition.id}\n${npc.state} ${Math.round(npc.currentSpeed)}\n${npc.dangerPhase} ${npc.dangerKind ?? '-'}\n${npc.laneId}`
      );
      view.label.setVisible(debugVisible);
      view.bubble.setText(bubbleText(npc.state, npc.dangerPhase, npc.validHitCount));
      view.bubble.setVisible(npc.state === 'Hit' || npc.state === 'Ranting' || npc.dangerPhase !== 'none');
    }
  }

  dispose(): void {
    for (const view of this.views.values()) {
      view.container.destroy(true);
    }
    for (const view of this.pooledViews) {
      view.container.destroy(true);
    }
    this.views.clear();
    this.pooledViews.length = 0;
  }

  viewCount(): number {
    return this.views.size;
  }

  viewPoolStats(): NPCViewPoolStats {
    return {
      active: this.views.size,
      pooled: this.pooledViews.length,
      created: this.createdViewCount,
      reused: this.reusedViewCount
    };
  }

  private acquireView(id: number, definition: NPCDefinition): NPCView {
    const view = this.pooledViews.pop();
    if (!view) {
      this.createdViewCount += 1;
      return this.createView(id, definition);
    }

    this.reusedViewCount += 1;
    this.configureView(view, id, definition);
    view.container.setActive(true).setVisible(true);
    this.views.set(id, view);
    return view;
  }

  private createView(id: number, definition: NPCDefinition): NPCView {
    const container = this.scene.add.container(0, 0);
    const body = this.scene.add.rectangle(0, -definition.height / 2, definition.width, definition.height, definition.color, 1);
    const head = this.scene.add.circle(0, -definition.height - 8, definition.width * 0.42, 0xf7f0dc, 1);
    const label = this.scene.add
      .text(0, -definition.height - 48, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#ffffff',
        backgroundColor: '#111827',
        padding: { x: 4, y: 3 },
        align: 'center'
      })
      .setOrigin(0.5, 1);
    const bubble = this.scene.add
      .text(0, -definition.height - 76, '', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#111827',
        backgroundColor: '#f7f0dc',
        padding: { x: 8, y: 5 }
      })
      .setOrigin(0.5, 1)
      .setVisible(false);

    container.add([body, head, bubble, label]);
    container.setData('npc-id', id);
    const view = { container, body, head, label, bubble };
    this.views.set(id, view);
    return view;
  }

  private configureView(view: NPCView, id: number, definition: NPCDefinition): void {
    view.container.setData('npc-id', id).setScale(1);
    view.body
      .setPosition(0, -definition.height / 2)
      .setDisplaySize(definition.width, definition.height)
      .setFillStyle(definition.color, 1);
    const headDiameter = definition.width * 0.84;
    view.head
      .setPosition(0, -definition.height - 8)
      .setDisplaySize(headDiameter, headDiameter)
      .setFillStyle(0xf7f0dc, 1);
    view.label.setPosition(0, -definition.height - 48).setText('').setVisible(false);
    view.bubble.setPosition(0, -definition.height - 76).setText('').setVisible(false);
  }

  private releaseView(id: number): void {
    const view = this.views.get(id);
    if (!view) {
      return;
    }

    view.container.setActive(false).setVisible(false);
    this.pooledViews.push(view);
    this.views.delete(id);
  }

  private definitionById(id: NPCDefinition['id']): NPCDefinition {
    const definition = this.definitions.find((candidate) => candidate.id === id);
    if (!definition) {
      throw new Error(`Unknown NPC definition: ${id}`);
    }
    return definition;
  }
}

function colorForState(baseColor: number, state: string): number {
  if (state === 'Distracted') {
    return 0xf87171;
  }
  if (state === 'Hit' || state === 'Ranting') {
    return 0xfb923c;
  }
  if (state === 'Recovering') {
    return 0xfacc15;
  }
  if (state === 'Recording') {
    return 0x818cf8;
  }
  if (state === 'Searching') {
    return 0x111827;
  }
  if (state === 'Retaliating') {
    return 0xdc2626;
  }
  if (state === 'Cleaning') {
    return 0x16a34a;
  }
  if (state === 'DogAlert') {
    return 0xfacc15;
  }
  if (state === 'Entering') {
    return 0xf6bd60;
  }
  return baseColor;
}

function bubbleText(state: string, phase: string, validHitCount: number): string {
  if (phase === 'telegraph') {
    return '...';
  }
  if (state === 'Recording') {
    return 'REC';
  }
  if (state === 'Searching') {
    return 'LOOK';
  }
  if (state === 'Retaliating') {
    return 'HEY!';
  }
  if (state === 'Cleaning') {
    return 'CLEAN';
  }
  if (state === 'DogAlert') {
    return 'DOG!';
  }
  return `! #${validHitCount}`;
}
