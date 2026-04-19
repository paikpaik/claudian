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

// Idle variations: brief animations that fire randomly while idle
const IDLE_VARIATIONS: [MascotStateName, number][] = [
  ['curious', 1500],
  ['happy', 2000],
];
const IDLE_VARIATION_MIN_MS = 15_000;
const IDLE_VARIATION_RANGE_MS = 30_000;

export class MascotStateManager {
  private _state: MascotStateName = 'idle';
  private autoReturnTimer: ReturnType<typeof setTimeout> | null = null;
  private idleVariationTimer: ReturnType<typeof setTimeout> | null = null;
  private lastActivityTime = Date.now();
  private inactivityTimer: ReturnType<typeof setInterval> | null = null;
  private onChange: (() => void) | null = null;

  constructor(onChange?: () => void) {
    this.onChange = onChange ?? null;
    this.inactivityTimer = setInterval(() => this.checkInactivity(), 30_000);
    this.scheduleIdleVariation();
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

    this.clearIdleVariation();

    // Schedule auto-return if configured
    const config = STATE_CONFIGS[next];
    if (config.autoReturnMs) {
      this.autoReturnTimer = setTimeout(() => {
        this.autoReturnTimer = null;
        this.returnToIdle();
      }, config.autoReturnMs);
    }

    if (next === 'idle') {
      this.scheduleIdleVariation();
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

  private returnToIdle(): void {
    this._state = 'idle';
    this.scheduleIdleVariation();
    this.onChange?.();
  }

  // ── Idle variations ─────────────────────────────────────────────────────────

  private scheduleIdleVariation(): void {
    this.clearIdleVariation();
    const delay = IDLE_VARIATION_MIN_MS + Math.random() * IDLE_VARIATION_RANGE_MS;
    this.idleVariationTimer = setTimeout(() => {
      this.idleVariationTimer = null;
      if (this._state !== 'idle') return;

      const [state, durationMs] = IDLE_VARIATIONS[Math.floor(Math.random() * IDLE_VARIATIONS.length)];
      // Set state directly — idle variations should NOT reset the activity timer
      this._state = state;

      if (this.autoReturnTimer) clearTimeout(this.autoReturnTimer);
      this.autoReturnTimer = setTimeout(() => {
        this.autoReturnTimer = null;
        this.returnToIdle();
      }, durationMs);

      this.onChange?.();
    }, delay);
  }

  private clearIdleVariation(): void {
    if (this.idleVariationTimer) {
      clearTimeout(this.idleVariationTimer);
      this.idleVariationTimer = null;
    }
  }

  // ── Inactivity ──────────────────────────────────────────────────────────────

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
    this.clearIdleVariation();
    this.autoReturnTimer = null;
    this.inactivityTimer = null;
  }
}
