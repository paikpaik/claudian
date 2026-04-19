/**
 * MascotEngine - Canvas-based 16×16 pixel-art renderer.
 *
 * Uses a dirty-flag pattern: the render loop runs via requestAnimationFrame
 * but only draws when the frame actually changes. At idle (2s per frame),
 * this means ~0.5 actual draws/sec.
 */

import type { MascotCharacter } from '../../../core/types';
import { MascotStateManager, type MascotStateName, STATE_CONFIGS } from './MascotState';
import { getPalette, getSprite } from './sprites';

const SPRITE_SIZE = 16;
const MOVE_TRAVEL_MS = 500;
const MOVE_RETURN_AFTER_MS = 30_000;

export interface MascotEngineOptions {
  character: MascotCharacter;
  theme: string;
  parentEl: HTMLElement;
}

export class MascotEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stateManager: MascotStateManager;
  private character: MascotCharacter;
  private theme: string;
  private parentEl: HTMLElement;

  private currentFrame = 0;
  private lastFrameTime = 0;
  private dirty = true;
  private animationId: number | null = null;
  private displaced = false;
  private returnHomeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly handleRowClick: (e: MouseEvent) => void;

  constructor(options: MascotEngineOptions) {
    this.character = options.character;
    this.theme = options.theme;
    this.parentEl = options.parentEl;

    // Canvas: internal 16×16, displayed at 32×32 with pixel-art scaling
    this.canvas = document.createElement('canvas');
    this.canvas.width = SPRITE_SIZE;
    this.canvas.height = SPRITE_SIZE;
    this.canvas.className = 'claudian-mascot-canvas';
    options.parentEl.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d')!;
    // Disable anti-aliasing for crisp pixels
    this.ctx.imageSmoothingEnabled = false;

    this.stateManager = new MascotStateManager(() => {
      this.currentFrame = 0;
      this.dirty = true;
    });

    this.canvas.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleClick();
    });

    // Listen for clicks on the header row (parent of mascot area)
    this.handleRowClick = (e: MouseEvent) => this.onRowClick(e);
    const headerRow = this.parentEl.parentElement;
    headerRow?.addEventListener('click', this.handleRowClick);

    this.startLoop();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  get state(): MascotStateName { return this.stateManager.state; }

  setState(state: MascotStateName): void {
    // Real events (thinking, happy, etc.) bring the mascot home
    if (this.displaced) this.returnHome();
    this.stateManager.setState(state);
  }

  recordActivity(): void {
    this.stateManager.recordActivity();
  }

  private static readonly CLICK_REACTIONS: MascotStateName[] = ['celebrate', 'happy', 'curious'];

  private handleClick(): void {
    this.stateManager.recordActivity();
    if (this.stateManager.state === 'sleeping' || this.stateManager.state === 'sleepy') {
      this.stateManager.setState('curious');
      return;
    }
    const reactions = MascotEngine.CLICK_REACTIONS;
    const pick = reactions[Math.floor(Math.random() * reactions.length)];
    this.stateManager.setState(pick);
  }

  setCharacter(character: MascotCharacter): void {
    if (this.character === character) return;
    this.character = character;
    this.currentFrame = 0;
    this.dirty = true;
  }

  setTheme(theme: string): void {
    if (this.theme === theme) return;
    this.theme = theme;
    this.dirty = true;
  }

  // ── Row click movement ──────────────────────────────────────────────────────

  private onRowClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('button, .claudian-header-btn, .claudian-tab-badge, .claudian-new-tab-btn')) return;

    // Use the mascot's *home* position (ignore current translateX)
    const canvasRect = this.canvas.getBoundingClientRect();
    const currentTransform = new DOMMatrixReadOnly(getComputedStyle(this.canvas).transform);
    const homeX = canvasRect.left - currentTransform.m41 + canvasRect.width / 2;
    let deltaX = e.clientX - homeX;

    // Clamp: don't go past sibling buttons
    const nextSibling = this.parentEl.nextElementSibling as HTMLElement | null;
    if (nextSibling) {
      const homeRight = canvasRect.right - currentTransform.m41;
      const maxDelta = nextSibling.getBoundingClientRect().left - homeRight - 8;
      if (deltaX > maxDelta) deltaX = maxDelta;
    }
    if (deltaX < 0) deltaX = 0;
    if (deltaX < 10) return;

    this.clearReturnHomeTimer();
    this.displaced = true;
    this.stateManager.recordActivity();
    this.stateManager.setState('curious');

    this.canvas.style.transition = `transform ${MOVE_TRAVEL_MS}ms ease-out`;
    this.canvas.style.transform = `translateX(${deltaX}px)`;

    // Auto-return after a while
    this.returnHomeTimer = setTimeout(() => {
      this.returnHomeTimer = null;
      this.returnHome();
    }, MOVE_RETURN_AFTER_MS);
  }

  private returnHome(): void {
    this.clearReturnHomeTimer();
    if (!this.displaced) return;
    this.displaced = false;
    this.canvas.style.transition = `transform ${MOVE_TRAVEL_MS}ms ease-in`;
    this.canvas.style.transform = '';
    // Clean up transition after animation
    const cleanup = (): void => {
      this.canvas.removeEventListener('transitionend', cleanup);
      this.canvas.style.transition = '';
    };
    this.canvas.addEventListener('transitionend', cleanup, { once: true });
  }

  private clearReturnHomeTimer(): void {
    if (this.returnHomeTimer) {
      clearTimeout(this.returnHomeTimer);
      this.returnHomeTimer = null;
    }
  }

  // ── Render loop ─────────────────────────────────────────────────────────────

  private startLoop(): void {
    const tick = (now: number) => {
      const config = STATE_CONFIGS[this.stateManager.state];

      // Advance frame if enough time has passed
      if (config.frameDurationMs > 0 && now - this.lastFrameTime >= config.frameDurationMs) {
        this.currentFrame = (this.currentFrame + 1) % config.frameCount;
        this.lastFrameTime = now;
        this.dirty = true;
      }

      if (this.dirty) {
        this.render();
        this.dirty = false;
      }

      this.animationId = requestAnimationFrame(tick);
    };
    this.animationId = requestAnimationFrame(tick);
  }

  private render(): void {
    const sprite = getSprite(this.character, this.stateManager.state, this.currentFrame);
    const palette = getPalette(this.character, this.theme);

    this.ctx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    for (let y = 0; y < SPRITE_SIZE; y++) {
      const row = sprite[y];
      if (!row) continue;
      for (let x = 0; x < SPRITE_SIZE; x++) {
        const idx = row[x];
        if (idx === 0) continue; // transparent
        this.ctx.fillStyle = palette[idx] || '#FF00FF'; // magenta = missing color
        this.ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clearReturnHomeTimer();
    const headerRow = this.parentEl.parentElement;
    headerRow?.removeEventListener('click', this.handleRowClick);
    this.stateManager.destroy();
    this.canvas.remove();
  }
}
