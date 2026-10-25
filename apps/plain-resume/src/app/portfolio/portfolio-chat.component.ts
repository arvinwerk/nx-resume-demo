import {
  Component,
  ElementRef,
  EventEmitter,
  InjectionToken,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import {
  ChatTurn,
  OPENING_QUESTIONS,
  PortfolioAction,
  PortfolioCatalog,
  portfolioQuestionNeedsModel,
} from '@nx-resume/state';
import { PortfolioAiService } from './portfolio-ai.service';
import { PortfolioThinkingState } from './portfolio-thinking';

export const PORTFOLIO_LOCAL_THINK_MS = new InjectionToken<number>('PORTFOLIO_LOCAL_THINK_MS', {
  providedIn: 'root',
  factory: () => 2000,
});

const THINK_LABELS = ['Thinking', 'Reading the portfolio', 'Choosing a layout'];

@Component({
  selector: 'nx-resume-portfolio-chat',
  templateUrl: './portfolio-chat.component.html',
})
export class PortfolioChatComponent implements OnDestroy {
  @Input() catalog!: PortfolioCatalog;
  @Output() actionsChange = new EventEmitter<PortfolioAction[]>();
  @ViewChild('log') log?: ElementRef<HTMLElement>;

  messages: ChatTurn[] = [];
  suggestions: string[] = [];
  draft = '';
  busy = false;
  pending = false;
  thinkLabel = THINK_LABELS[0];

  private readonly ai = inject(PortfolioAiService);
  private readonly thinking = inject(PortfolioThinkingState);
  private readonly localThinkMs = inject(PORTFOLIO_LOCAL_THINK_MS);
  private requestId = 0;
  private cycleTimer: ReturnType<typeof setInterval> | null = null;
  private revealTimer: ReturnType<typeof setTimeout> | null = null;

  get prompts(): readonly string[] {
    return this.messages.length === 0 ? OPENING_QUESTIONS : this.suggestions;
  }

  ngOnDestroy(): void {
    this.requestId += 1;
    this.clearThinkTimers();
    this.thinking.hide();
  }

  choose(question: string): void {
    void this.send(question);
  }

  submit(event: Event): void {
    event.preventDefault();
    void this.send(this.draft);
  }

  canSend(): boolean {
    return !this.busy && this.draft.trim().length > 0;
  }

  updateDraft(event: Event): void {
    const target = event.target;
    this.draft = target instanceof HTMLInputElement ? target.value : '';
  }

  async send(question: string): Promise<void> {
    const content = question.trim();
    if (!content || this.busy) {
      return;
    }

    this.messages = [...this.messages, { role: 'user', content }];
    this.draft = '';
    this.busy = true;
    const requestId = ++this.requestId;
    const theatrical = !portfolioQuestionNeedsModel(this.messages, this.catalog);
    this.thinkLabel = THINK_LABELS[0];
    this.pending = theatrical;
    if (theatrical) {
      this.startThinkCycle();
    } else {
      this.revealTimer = setTimeout(() => {
        if (requestId === this.requestId && this.busy) {
          this.pending = true;
          this.thinking.show('Thinking');
        }
      }, 180);
    }
    this.scrollLog();

    try {
      const started = Date.now();
      const response = await this.ai.ask(this.messages, this.catalog);
      if (requestId !== this.requestId) {
        return;
      }
      if (theatrical) {
        const remaining = this.localThinkMs - (Date.now() - started);
        if (remaining > 0) {
          await this.wait(remaining);
        }
      }
      if (requestId !== this.requestId) {
        return;
      }
      this.messages = [...this.messages, { role: 'assistant', content: response.message }];
      this.suggestions = response.suggestedQuestions ?? [];
      this.actionsChange.emit(response.actions);
      this.scrollLog();
    } catch {
      if (requestId !== this.requestId) {
        return;
      }
      this.messages = [
        ...this.messages,
        {
          role: 'assistant',
          content: 'Something went wrong while answering. The portfolio below is still usable.',
        },
      ];
      this.actionsChange.emit([]);
    } finally {
      if (requestId === this.requestId) {
        this.busy = false;
        this.pending = false;
        this.clearThinkTimers();
        this.thinking.hide();
      }
    }
  }

  private startThinkCycle(): void {
    this.clearThinkTimers();
    let step = 0;
    this.publishThink(THINK_LABELS[0]);
    this.cycleTimer = setInterval(() => {
      step = (step + 1) % THINK_LABELS.length;
      this.publishThink(THINK_LABELS[step]);
    }, 650);
  }

  private publishThink(label: string): void {
    if (!this.busy) {
      return;
    }
    this.thinkLabel = label;
    this.thinking.show(label);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.revealTimer = setTimeout(resolve, ms);
    });
  }

  private scrollLog(): void {
    setTimeout(() => {
      const element = this.log?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }

  private clearThinkTimers(): void {
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
    if (this.revealTimer) {
      clearTimeout(this.revealTimer);
      this.revealTimer = null;
    }
  }
}
