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

  private currentFrame = 0;
  private lastFrameTime = 0;
  private dirty = true;
  private animationId: number | null = null;

  constructor(options: MascotEngineOptions) {
    this.character = options.character;
    this.theme = options.theme;

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

    this.startLoop();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  get state(): MascotStateName { return this.stateManager.state; }

  setState(state: MascotStateName): void {
    this.stateManager.setState(state);
  }

  recordActivity(): void {
    this.stateManager.recordActivity();
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
    this.stateManager.destroy();
    this.canvas.remove();
  }
}
