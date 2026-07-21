export class AccessibilityAnnouncer {
  private readonly polite: HTMLDivElement;
  private readonly assertive: HTMLDivElement;
  private tokens: string[] = [];
  constructor(root: HTMLElement, private readonly enabled: () => boolean, private readonly limit = 24) {
    this.polite = this.region('polite'); this.assertive = this.region('assertive'); root.append(this.polite, this.assertive);
  }
  announce(message: string, token: string, priority: 'polite' | 'assertive' = 'polite'): boolean {
    if (!this.enabled() || this.tokens.includes(token)) return false;
    this.tokens = [...this.tokens.slice(-(this.limit - 1)), token];
    const region = priority === 'assertive' ? this.assertive : this.polite;
    region.textContent = message;
    return true;
  }
  clear(): void { this.tokens = []; this.polite.textContent = ''; this.assertive.textContent = ''; }
  size(): number { return this.tokens.length; }
  dispose(): void { this.clear(); this.polite.remove(); this.assertive.remove(); }
  private region(live: 'polite' | 'assertive'): HTMLDivElement { const node = document.createElement('div'); node.className = 'sr-only'; node.setAttribute('aria-live', live); node.setAttribute('aria-atomic', 'true'); return node; }
}
