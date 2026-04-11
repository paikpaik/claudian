/**
 * PomodoroWidget - Floating timer widget for Pomodoro and Design Sprint modes.
 *
 * Rendered as a fixed panel on document.body (no modal overlay) so the user
 * can keep chatting while the timer runs in the corner.
 *
 * Two modes:
 *  - Pomodoro: 25-min work → 5-min break, long break after 4 sessions
 *  - Sprint: 5 sequential design stages (Empathize → Define → Ideate → Prototype → Test)
 */

import { Notice, setIcon } from 'obsidian';

// ── Pomodoro constants ────────────────────────────────────────────────────────

const POMODORO_WORK_MINS = 25;
const POMODORO_SHORT_BREAK_MINS = 5;
const POMODORO_LONG_BREAK_MINS = 15;
const POMODORO_SESSIONS_BEFORE_LONG = 4;

type PomodoroPhase = 'work' | 'short-break' | 'long-break';

// ── Sprint constants ──────────────────────────────────────────────────────────

interface SprintStage {
  emoji: string;
  name: string;
  minutes: number;
  guide: string;
}

const SPRINT_STAGES: SprintStage[] = [
  { emoji: '💭', name: '공감', minutes: 15, guide: '사용자 입장에서 문제를 정의하세요' },
  { emoji: '🎯', name: '정의', minutes: 10, guide: '핵심 문제 하나를 선택하세요' },
  { emoji: '💡', name: '아이디어', minutes: 20, guide: '가능한 많은 아이디어를 스케치하세요' },
  { emoji: '🎨', name: '프로토타입', minutes: 25, guide: '하나를 골라 구체화하세요' },
  { emoji: '🧪', name: '테스트', minutes: 10, guide: '만든 것을 검증하고 기록하세요' },
];

interface SprintBadge { emoji: string; label: string; }

function getSprintBadge(completed: number): SprintBadge {
  if (completed >= 5) return { emoji: '🏆', label: '스프린트 마스터' };
  if (completed >= 4) return { emoji: '🎨', label: '크리에이터' };
  if (completed >= 2) return { emoji: '✏️', label: '스케처' };
  if (completed >= 1) return { emoji: '💭', label: '리서처' };
  return { emoji: '📋', label: '브리프' };
}

// ── Widget ────────────────────────────────────────────────────────────────────

type TimerMode = 'pomodoro' | 'sprint';
type TimerStatus = 'idle' | 'running' | 'paused';

export interface PomodoroWidgetOptions {
  onClose?: () => void;
}

export class PomodoroWidget {
  private containerEl: HTMLElement;
  private options: PomodoroWidgetOptions;

  // Timer core
  private mode: TimerMode = 'pomodoro';
  private status: TimerStatus = 'idle';
  private intervalId: ReturnType<typeof setInterval> | null = null;

  // Pomodoro state
  private pomodoroPhase: PomodoroPhase = 'work';
  private pomodoroCompletedWork = 0; // Completed work sessions (for dot indicator)
  private pomodoroSecondsLeft = POMODORO_WORK_MINS * 60;

  // Sprint state
  private sprintStageIdx = 0;
  private sprintSecondsLeft = SPRINT_STAGES[0].minutes * 60;
  private sprintCompletedStages = 0;

  // UI state
  private collapsed = false;

  // DOM refs for in-place updates (avoids full re-render every second)
  private timerDisplayEl: HTMLElement | null = null;
  private collapsedTimeEl: HTMLElement | null = null;
  private bodyEl: HTMLElement | null = null;
  private modeTabPomodoroEl: HTMLElement | null = null;
  private modeTabSprintEl: HTMLElement | null = null;

  constructor(options: PomodoroWidgetOptions = {}) {
    this.options = options;
    this.containerEl = document.body.createDiv({ cls: 'claudian-pomo-widget' });
    this.render();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  private render(): void {
    this.containerEl.empty();
    this.timerDisplayEl = null;
    this.collapsedTimeEl = null;
    this.modeTabPomodoroEl = null;
    this.modeTabSprintEl = null;
    this.bodyEl = null;

    this.containerEl.toggleClass('collapsed', this.collapsed);

    if (this.collapsed) {
      this.renderCollapsed();
    } else {
      this.renderExpanded();
    }
  }

  /** Compact pill: emoji + countdown + expand button */
  private renderCollapsed(): void {
    const pill = this.containerEl.createDiv({ cls: 'claudian-pomo-pill' });

    const emoji = this.mode === 'pomodoro'
      ? this.pomodoroPhaseEmoji()
      : SPRINT_STAGES[this.sprintStageIdx].emoji;

    pill.createSpan({ cls: 'claudian-pomo-pill-emoji', text: emoji });

    this.collapsedTimeEl = pill.createSpan({ cls: 'claudian-pomo-pill-time' });
    this.collapsedTimeEl.setText(this.currentSeconds() > 0
      ? this.formatTime(this.currentSeconds())
      : '--:--');

    const expandBtn = pill.createDiv({ cls: 'claudian-pomo-pill-btn' });
    setIcon(expandBtn, 'chevron-up');
    expandBtn.setAttribute('aria-label', '펼치기');
    expandBtn.addEventListener('click', () => this.toggleCollapse());

    const closeBtn = pill.createDiv({ cls: 'claudian-pomo-pill-btn' });
    setIcon(closeBtn, 'x');
    closeBtn.setAttribute('aria-label', '닫기');
    closeBtn.addEventListener('click', () => this.close());
  }

  /** Full widget with mode tabs, timer, controls */
  private renderExpanded(): void {
    const header = this.containerEl.createDiv({ cls: 'claudian-pomo-header' });

    // Mode tabs
    const modeTabs = header.createDiv({ cls: 'claudian-pomo-mode-tabs' });
    this.modeTabPomodoroEl = modeTabs.createDiv({ cls: 'claudian-pomo-mode-tab' });
    this.modeTabPomodoroEl.setText('🍅 뽀모도로');
    this.modeTabSprintEl = modeTabs.createDiv({ cls: 'claudian-pomo-mode-tab' });
    this.modeTabSprintEl.setText('🎨 스프린트');
    this.modeTabPomodoroEl.addEventListener('click', () => this.switchMode('pomodoro'));
    this.modeTabSprintEl.addEventListener('click', () => this.switchMode('sprint'));
    this.syncModeTabs();

    // Collapse and close buttons
    const collapseBtn = header.createDiv({ cls: 'claudian-pomo-close-btn' });
    setIcon(collapseBtn, 'chevron-down');
    collapseBtn.setAttribute('aria-label', '최소화');
    collapseBtn.addEventListener('click', () => this.toggleCollapse());

    const closeBtn = header.createDiv({ cls: 'claudian-pomo-close-btn' });
    setIcon(closeBtn, 'x');
    closeBtn.setAttribute('aria-label', '타이머 닫기');
    closeBtn.addEventListener('click', () => this.close());

    // Body
    this.bodyEl = this.containerEl.createDiv({ cls: 'claudian-pomo-body' });
    this.renderBody();
  }

  private toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.render();
  }

  private renderBody(): void {
    if (!this.bodyEl) return;
    this.bodyEl.empty();
    this.timerDisplayEl = null;

    if (this.mode === 'pomodoro') {
      this.renderPomodoroBody(this.bodyEl);
    } else {
      this.renderSprintBody(this.bodyEl);
    }
  }

  private renderPomodoroBody(el: HTMLElement): void {
    el.createDiv({ cls: 'claudian-pomo-phase-label', text: this.pomodoroPhaseLabel() });

    this.timerDisplayEl = el.createDiv({ cls: 'claudian-pomo-time' });
    this.timerDisplayEl.setText(this.formatTime(this.pomodoroSecondsLeft));

    // Session progress dots
    const dotsEl = el.createDiv({ cls: 'claudian-pomo-dots' });
    const sessionInCycle = this.pomodoroCompletedWork % POMODORO_SESSIONS_BEFORE_LONG;
    for (let i = 0; i < POMODORO_SESSIONS_BEFORE_LONG; i++) {
      const dot = dotsEl.createDiv({ cls: 'claudian-pomo-dot' });
      if (i < sessionInCycle || (this.pomodoroPhase !== 'work' && i < sessionInCycle)) {
        dot.addClass('filled');
      }
    }

    this.renderControls(el, false);
  }

  private renderSprintBody(el: HTMLElement): void {
    const stage = SPRINT_STAGES[this.sprintStageIdx];

    el.createDiv({
      cls: 'claudian-pomo-sprint-step',
      text: `${this.sprintStageIdx + 1} / ${SPRINT_STAGES.length}`,
    });

    el.createDiv({ cls: 'claudian-pomo-phase-label', text: `${stage.emoji} ${stage.name}` });

    this.timerDisplayEl = el.createDiv({ cls: 'claudian-pomo-time' });
    this.timerDisplayEl.setText(this.formatTime(this.sprintSecondsLeft));

    el.createDiv({ cls: 'claudian-pomo-guide', text: stage.guide });

    if (this.sprintCompletedStages > 0) {
      const badge = getSprintBadge(this.sprintCompletedStages);
      el.createDiv({ cls: 'claudian-pomo-badge', text: `${badge.emoji} ${badge.label}` });
    }

    this.renderControls(el, true);
  }

  private renderControls(el: HTMLElement, canSkip: boolean): void {
    const controls = el.createDiv({ cls: 'claudian-pomo-controls' });

    // Start / Pause
    const startPauseBtn = controls.createEl('button', { cls: 'claudian-pomo-btn claudian-pomo-btn--primary' });
    if (this.status === 'running') {
      setIcon(startPauseBtn, 'pause');
      startPauseBtn.createSpan({ text: '일시정지' });
      startPauseBtn.addEventListener('click', () => this.pause());
    } else {
      setIcon(startPauseBtn, 'play');
      startPauseBtn.createSpan({ text: this.status === 'paused' ? '계속' : '시작' });
      startPauseBtn.addEventListener('click', () => this.start());
    }

    // Skip (sprint, not last stage)
    if (canSkip && this.sprintStageIdx < SPRINT_STAGES.length - 1) {
      const skipBtn = controls.createEl('button', { cls: 'claudian-pomo-btn' });
      setIcon(skipBtn, 'skip-forward');
      skipBtn.createSpan({ text: '건너뛰기' });
      skipBtn.addEventListener('click', () => this.advanceSprintStage(false));
    }

    // Reset
    const resetBtn = controls.createEl('button', { cls: 'claudian-pomo-btn claudian-pomo-btn--icon' });
    setIcon(resetBtn, 'rotate-ccw');
    resetBtn.setAttribute('aria-label', '초기화');
    resetBtn.addEventListener('click', () => this.reset());
  }

  // ── Timer control ───────────────────────────────────────────────────────────

  private start(): void {
    if (this.status === 'running') return;
    this.status = 'running';
    this.intervalId = setInterval(() => this.tick(), 1000);
    this.renderBody();
  }

  private pause(): void {
    this.clearInterval();
    this.status = 'paused';
    this.renderBody();
  }

  private reset(): void {
    this.clearInterval();
    this.status = 'idle';
    if (this.mode === 'pomodoro') {
      this.pomodoroPhase = 'work';
      this.pomodoroCompletedWork = 0;
      this.pomodoroSecondsLeft = POMODORO_WORK_MINS * 60;
    } else {
      this.sprintStageIdx = 0;
      this.sprintSecondsLeft = SPRINT_STAGES[0].minutes * 60;
      this.sprintCompletedStages = 0;
    }
    this.renderBody();
  }

  private switchMode(mode: TimerMode): void {
    if (this.mode === mode) return;
    this.clearInterval();
    this.status = 'idle';
    this.mode = mode;
    // Reset state for the new mode
    this.pomodoroPhase = 'work';
    this.pomodoroCompletedWork = 0;
    this.pomodoroSecondsLeft = POMODORO_WORK_MINS * 60;
    this.sprintStageIdx = 0;
    this.sprintSecondsLeft = SPRINT_STAGES[0].minutes * 60;
    this.sprintCompletedStages = 0;
    this.syncModeTabs();
    this.renderBody();
  }

  // ── Tick ────────────────────────────────────────────────────────────────────

  private tick(): void {
    if (this.mode === 'pomodoro') {
      this.pomodoroSecondsLeft--;
      if (this.pomodoroSecondsLeft <= 0) {
        this.advancePomodoroPhase();
      } else {
        this.updateTimeDisplays(this.pomodoroSecondsLeft);
      }
    } else {
      this.sprintSecondsLeft--;
      if (this.sprintSecondsLeft <= 0) {
        this.advanceSprintStage(true);
      } else {
        this.updateTimeDisplays(this.sprintSecondsLeft);
      }
    }
  }

  /** Update both the expanded timer display and the collapsed pill time. */
  private updateTimeDisplays(seconds: number): void {
    const formatted = this.formatTime(seconds);
    this.timerDisplayEl?.setText(formatted);
    this.collapsedTimeEl?.setText(formatted);
  }

  private advancePomodoroPhase(): void {
    if (this.pomodoroPhase === 'work') {
      this.pomodoroCompletedWork++;
      const longBreak = this.pomodoroCompletedWork % POMODORO_SESSIONS_BEFORE_LONG === 0;
      this.pomodoroPhase = longBreak ? 'long-break' : 'short-break';
      this.pomodoroSecondsLeft = longBreak
        ? POMODORO_LONG_BREAK_MINS * 60
        : POMODORO_SHORT_BREAK_MINS * 60;
      new Notice(longBreak ? '🌿 긴 휴식 시간입니다!' : '☕ 짧은 휴식 시간입니다!');
    } else {
      this.pomodoroPhase = 'work';
      this.pomodoroSecondsLeft = POMODORO_WORK_MINS * 60;
      new Notice('🍅 작업 시간 시작!');
    }
    this.renderBody();
  }

  private advanceSprintStage(completed: boolean): void {
    if (completed) this.sprintCompletedStages++;

    const next = this.sprintStageIdx + 1;
    if (next >= SPRINT_STAGES.length) {
      this.clearInterval();
      this.status = 'idle';
      this.sprintCompletedStages = SPRINT_STAGES.length;
      new Notice('🏆 디자인 스프린트 완주! 스프린트 마스터 달성!');
      this.renderBody();
      return;
    }

    this.sprintStageIdx = next;
    this.sprintSecondsLeft = SPRINT_STAGES[next].minutes * 60;
    new Notice(`${SPRINT_STAGES[next].emoji} ${SPRINT_STAGES[next].name} 단계 시작!`);
    this.renderBody();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private syncModeTabs(): void {
    this.modeTabPomodoroEl?.toggleClass('active', this.mode === 'pomodoro');
    this.modeTabSprintEl?.toggleClass('active', this.mode === 'sprint');
  }

  private pomodoroPhaseLabel(): string {
    switch (this.pomodoroPhase) {
      case 'work': return '🍅 작업 중';
      case 'short-break': return '☕ 짧은 휴식';
      case 'long-break': return '🌿 긴 휴식';
    }
  }

  private pomodoroPhaseEmoji(): string {
    switch (this.pomodoroPhase) {
      case 'work': return '🍅';
      case 'short-break': return '☕';
      case 'long-break': return '🌿';
    }
  }

  /** Seconds remaining for the current active phase. */
  private currentSeconds(): number {
    return this.mode === 'pomodoro' ? this.pomodoroSecondsLeft : this.sprintSecondsLeft;
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  close(): void {
    this.clearInterval();
    this.containerEl.remove();
    this.options.onClose?.();
  }

  /** Call when the parent view is destroyed to avoid orphaned intervals. */
  destroy(): void {
    this.close();
  }
}
