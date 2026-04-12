/**
 * Mascot state machine.
 *
 * States with `autoReturnMs` revert to 'idle' after the given duration.
 * The inactivity timer promotes idle → sleepy → sleeping.
 */

export type MascotStateName =
  | 'idle'
  | 'curious'
  | 'thinking'
  | 'happy'
  | 'worried'
  | 'celebrate'
  | 'sleepy'
  | 'sleeping';

export interface StateConfig {
  /** Milliseconds per animation frame. 0 = static (single frame). */
  frameDurationMs: number;
  /** Number of animation frames for this state. */
  frameCount: number;
  /** If set, auto-return to idle after this many ms. */
  autoReturnMs?: number;
}

export const STATE_CONFIGS: Record<MascotStateName, StateConfig> = {
  idle:      { frameDurationMs: 2000, frameCount: 2 },
  curious:   { frameDurationMs: 400,  frameCount: 2 },
  thinking:  { frameDurationMs: 1000, frameCount: 2 },
  happy:     { frameDurationMs: 300,  frameCount: 3, autoReturnMs: 2000 },
  worried:   { frameDurationMs: 1500, frameCount: 2, autoReturnMs: 3000 },
  celebrate: { frameDurationMs: 250,  frameCount: 4, autoReturnMs: 3000 },
  sleepy:    { frameDurationMs: 3000, frameCount: 2 },
  sleeping:  { frameDurationMs: 0,    frameCount: 1 },
};

const SLEEPY_AFTER_MS = 5 * 60_000;   // 5 min inactivity
const SLEEPING_AFTER_MS = 10 * 60_000; // 10 min inactivity

export class MascotStateManager {
  private _state: MascotStateName = 'idle';
  private autoReturnTimer: ReturnType<typeof setTimeout> | null = null;
  private lastActivityTime = Date.now();
  private inactivityTimer: ReturnType<typeof setInterval> | null = null;
  private onChange: (() => void) | null = null;

  constructor(onChange?: () => void) {
    this.onChange = onChange ?? null;
    this.inactivityTimer = setInterval(() => this.checkInactivity(), 30_000);
  }

  get state(): MascotStateName { return this._state; }

  setState(next: MascotStateName): void {
    // Activity resets inactivity timer (except sleep states themselves)
    if (next !== 'sleepy' && next !== 'sleeping') {
      this.lastActivityTime = Date.now();
    }

    if (this._state === next) return;
    this._state = next;

    // Clear previous auto-return
    if (this.autoReturnTimer) {
      clearTimeout(this.autoReturnTimer);
      this.autoReturnTimer = null;
    }

    // Schedule auto-return if configured
    const config = STATE_CONFIGS[next];
    if (config.autoReturnMs) {
      this.autoReturnTimer = setTimeout(() => {
        this.autoReturnTimer = null;
        this._state = 'idle';
        this.onChange?.();
      }, config.autoReturnMs);
    }

    this.onChange?.();
  }

  /** Call this when user does something (type, click, etc.) */
  recordActivity(): void {
    this.lastActivityTime = Date.now();
    // Wake up if sleeping/sleepy
    if (this._state === 'sleepy' || this._state === 'sleeping') {
      this.setState('idle');
    }
  }

  private checkInactivity(): void {
    // Don't override non-idle states (e.g. thinking, happy)
    if (this._state !== 'idle' && this._state !== 'sleepy') return;

    const elapsed = Date.now() - this.lastActivityTime;
    if (elapsed >= SLEEPING_AFTER_MS && this._state === 'sleepy') {
      this.setState('sleeping');
    } else if (elapsed >= SLEEPY_AFTER_MS && this._state === 'idle') {
      this.setState('sleepy');
    }
  }

  destroy(): void {
    if (this.autoReturnTimer) clearTimeout(this.autoReturnTimer);
    if (this.inactivityTimer) clearInterval(this.inactivityTimer);
    this.autoReturnTimer = null;
    this.inactivityTimer = null;
  }
}
