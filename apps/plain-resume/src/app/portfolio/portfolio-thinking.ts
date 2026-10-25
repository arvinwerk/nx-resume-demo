import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PortfolioThinkingState {
  readonly active = signal(false);
  readonly label = signal('Thinking');

  show(label: string): void {
    this.label.set(label);
    this.active.set(true);
  }

  hide(): void {
    this.active.set(false);
  }
}
