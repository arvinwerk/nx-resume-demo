import {
  Component,
  ElementRef,
  EventEmitter,
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
} from '@nx-resume/state';
import { PortfolioAiService } from './portfolio-ai.service';

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

  private readonly ai = inject(PortfolioAiService);
  private requestId = 0;
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;

  get prompts(): readonly string[] {
    return this.messages.length === 0 ? OPENING_QUESTIONS : this.suggestions;
  }

  ngOnDestroy(): void {
    this.requestId += 1;
    this.clearPendingTimer();
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
    this.scrollLog();
    const requestId = ++this.requestId;
    this.pendingTimer = setTimeout(() => {
      if (requestId === this.requestId) {
        this.pending = true;
      }
    }, 180);

    try {
      const response = await this.ai.ask(this.messages, this.catalog);
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
        this.clearPendingTimer();
      }
    }
  }

  private scrollLog(): void {
    setTimeout(() => {
      const element = this.log?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }

  private clearPendingTimer(): void {
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
  }
}
