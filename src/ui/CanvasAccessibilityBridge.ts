import Phaser from 'phaser';

export class CanvasAccessibilityBridge {
  private readonly container: HTMLDivElement;
  private readonly timer: number;
  private signature = '';
  constructor(root: HTMLElement, private readonly game: Phaser.Game) {
    this.container = document.createElement('div'); this.container.className = 'canvas-accessibility-controls'; this.container.setAttribute('aria-label', '遊戲介面控制'); root.append(this.container);
    this.timer = window.setInterval(() => this.sync(), 500); this.sync();
  }
  dispose(): void { window.clearInterval(this.timer); this.container.remove(); }
  count(): number { return this.container.childElementCount; }
  private sync(): void {
    const objects = this.game.scene.getScenes(true).flatMap((scene) => this.collect(scene.children.list));
    const roles = objects.map((object) => String(object.getData('role')));
    const next = roles.join('|'); if (next === this.signature) return; this.signature = next; this.container.replaceChildren();
    objects.forEach((object, index) => {
      const role = roles[index]; const button = document.createElement('button'); button.type = 'button'; button.textContent = labelForRole(role); button.dataset.role = role;
      button.addEventListener('click', () => object.emit(Phaser.Input.Events.POINTER_UP, { pointerType: 'keyboard' })); this.container.append(button);
    });
  }
  private collect(items: readonly Phaser.GameObjects.GameObject[]): Phaser.GameObjects.GameObject[] {
    const output: Phaser.GameObjects.GameObject[] = [];
    for (const item of items) {
      const visible = (item as Phaser.GameObjects.GameObject & { visible?: boolean; active?: boolean }).visible !== false && (item as Phaser.GameObjects.GameObject & { active?: boolean }).active !== false;
      if (visible && item.getData?.('role') && item.input?.enabled) output.push(item);
      const list = (item as Phaser.GameObjects.Container).list; if (Array.isArray(list)) output.push(...this.collect(list));
    }
    return output;
  }
}

function labelForRole(role: string): string {
  const labels: Record<string, string> = {
    'continue-campaign': '繼續 Campaign', 'new-campaign': '從第一關重玩', 'level-select': '關卡選擇', 'extra-modes': '額外模式',
    'watch-opening': '重播開場', 'reset-progress': '清除進度', 'reset-cancel': '取消清除', 'reset-confirm': '確認清除',
    'return-menu': '返回主選單', 'level-intro-skip': '跳過關卡介紹', 'retry-level': '重試', 'next-level': '下一關'
  };
  if (role.startsWith('select-poop-')) return `選擇投擲物 ${Number(role.split('-').at(-1)) + 1}`;
  if (role.startsWith('start-level-')) return `進入第 ${Number(role.split('-').at(-1))} 關`;
  return labels[role] ?? role.replaceAll('-', ' ');
}
