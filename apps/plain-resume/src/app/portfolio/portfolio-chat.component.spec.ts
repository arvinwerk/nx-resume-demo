import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { buildCatalog } from '@nx-resume/state';
import { PortfolioChatComponent } from './portfolio-chat.component';
import { PortfolioAiService } from './portfolio-ai.service';
import { PORTFOLIO_PROFILE } from './portfolio-profile';

describe('PortfolioChatComponent', () => {
  let fixture: ComponentFixture<PortfolioChatComponent>;
  let ask: jest.Mock;

  beforeEach(async () => {
    ask = jest.fn().mockResolvedValue({
      message: 'Here is the operational view.',
      actions: [{ type: 'setLayout', value: 'impact' }],
      suggestedQuestions: ['What have you built?'],
    });

    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [PortfolioChatComponent],
      providers: [{ provide: PortfolioAiService, useValue: { ask } }],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioChatComponent);
    fixture.componentInstance.catalog = buildCatalog(PORTFOLIO_PROFILE, []);
    fixture.detectChanges();
  });

  it('shows the opening question and four starters', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('What would you like to know about me?');
    expect(compiled.querySelectorAll('[data-role="conversation-starter"]').length).toBe(4);
  });

  it('sends a starter through the same ask path and escapes the reply', async () => {
    const emitted: unknown[] = [];
    fixture.componentInstance.actionsChange.subscribe((actions) => emitted.push(actions));

    await fixture.componentInstance.send('What can you bring to my organization?');
    fixture.detectChanges();

    expect(ask).toHaveBeenCalledWith(
      [{ role: 'user', content: 'What can you bring to my organization?' }],
      fixture.componentInstance.catalog
    );
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('What can you bring to my organization?');
    expect(compiled.textContent).toContain('Here is the operational view.');
    expect(emitted).toEqual([[{ type: 'setLayout', value: 'impact' }]]);
    expect(compiled.querySelector('[data-role="conversation-starter"]')?.textContent).toContain(
      'What have you built?'
    );
  });

  it('renders model text as text', async () => {
    ask.mockResolvedValue({
      message: '<img src=x onerror=alert(1)>Hello',
      actions: [],
    });

    await fixture.componentInstance.send('Hello');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('img')).toBeNull();
    expect(compiled.textContent).toContain('<img src=x onerror=alert(1)>Hello');
  });
});
