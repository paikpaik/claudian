/**
 * Procedural 16×16 pixel-art sprite data for mascot characters.
 *
 * Each frame is a 16×16 number array. Color index 0 = transparent.
 * Palette indices are character-specific (see PALETTES below).
 *
 * Sprite lookup: SPRITES[character][state][frameIndex]
 */

import type { MascotCharacter } from '../../../core/types';
import type { MascotStateName } from './MascotState';

// ── Type definitions ──────────────────────────────────────────────────────────

export type SpriteFrame = number[][];
export type CharacterSprites = Record<MascotStateName, SpriteFrame[]>;
export type Palette = string[];

// ── Helper: mirror a frame horizontally (for sway effects) ────────────────────

function mirrorH(frame: SpriteFrame): SpriteFrame {
  return frame.map(row => [...row].reverse());
}

// ── Helper: clone a frame and replace a color index ───────────────────────────

function replaceIdx(frame: SpriteFrame, from: number, to: number): SpriteFrame {
  return frame.map(row => row.map(v => v === from ? to : v));
}

// ── Cloudy (cloud AI companion) ───────────────────────────────────────────────
// Palette: 0=transparent, 1=white body, 2=light gray shadow, 3=dark (eyes), 4=pink (cheeks), 5=sparkle

const C_IDLE_0: SpriteFrame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,1,1,3,1,1,1,1,3,1,1,1,0,0],
  [0,1,1,1,1,3,1,1,1,1,3,1,1,1,1,0],
  [0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0],
  [0,1,1,1,1,1,1,2,2,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,2,1,1,1,1,1,1,1,1,2,1,0,0],
  [0,0,0,2,2,1,1,1,1,1,1,2,2,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Eyes closed (blink)
const C_IDLE_1 = replaceIdx(C_IDLE_0, 3, 2);

// Curious: slight tilt (shift top-right by 1)
const C_CURIOUS_0: SpriteFrame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,1,1,1,3,1,1,1,3,1,1,1,0,0],
  [0,0,1,1,1,1,3,1,1,1,3,1,1,1,1,0],
  [0,0,1,1,4,1,1,1,1,1,1,1,4,1,1,0],
  [0,1,1,1,1,1,1,1,2,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,2,1,1,1,1,1,1,1,1,2,1,0,0],
  [0,0,0,2,2,1,1,1,1,1,1,2,2,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const C_CURIOUS_1 = mirrorH(C_CURIOUS_0);

// Thinking: eyes half-closed
const C_THINKING_0: SpriteFrame = C_IDLE_0;
const C_THINKING_1: SpriteFrame = replaceIdx(C_IDLE_0, 3, 2);

// Happy: bounced up (shift entire frame 2px up + add sparkles)
const C_HAPPY_0: SpriteFrame = [
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,1,1,3,1,1,1,1,3,1,1,1,0,0],
  [0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0],
  [0,1,1,1,1,1,2,1,1,2,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,2,2,1,1,1,1,1,0,0],
  [0,0,1,2,1,1,1,1,1,1,1,1,2,1,0,0],
  [0,0,0,2,2,1,1,1,1,1,1,2,2,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,5,0,0,0,0,0,0,0,0,0,0,0,0,5,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const C_HAPPY_1 = C_IDLE_0;
const C_HAPPY_2 = C_HAPPY_0;

// Worried: sweat drop on right side
const C_WORRIED_0: SpriteFrame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,0,0,5,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,0,5,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,1,1,3,1,1,1,1,3,1,1,1,0,0],
  [0,1,1,1,1,3,1,1,1,1,3,1,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,1,1,1,1,2,2,2,2,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,2,1,1,1,1,1,1,1,1,2,1,0,0],
  [0,0,0,2,2,1,1,1,1,1,1,2,2,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const C_WORRIED_1 = mirrorH(C_WORRIED_0);

// Celebrate: sparkles all around
const C_CELEBRATE_0: SpriteFrame = [
  [0,0,5,0,0,0,0,0,0,0,0,0,0,5,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,5,0,0,1,1,1,1,1,1,1,1,0,0,5,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,3,1,1,1,1,3,1,1,1,0,0],
  [0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0],
  [0,1,1,1,1,1,2,1,1,2,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,2,2,1,1,1,1,1,0,0],
  [0,0,1,2,1,1,1,1,1,1,1,1,2,1,0,0],
  [0,0,0,2,2,1,1,1,1,1,1,2,2,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
  [0,5,0,0,0,0,0,0,0,0,0,0,0,0,5,0],
  [0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const C_CELEBRATE_1 = mirrorH(C_CELEBRATE_0);
const C_CELEBRATE_2: SpriteFrame = replaceIdx(C_CELEBRATE_0, 5, 0); // sparkles off
const C_CELEBRATE_3: SpriteFrame = C_CELEBRATE_1;

// Sleepy: droopy eyes + zzz
const C_SLEEPY_0: SpriteFrame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,1,1,2,2,1,1,2,2,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0],
  [0,1,1,1,1,1,1,2,2,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,2,1,1,1,1,1,1,1,1,2,1,0,0],
  [0,0,0,2,2,1,1,1,1,1,1,2,2,0,0,5],
  [0,0,0,0,2,2,2,2,2,2,2,2,0,5,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const C_SLEEPY_1 = replaceIdx(C_SLEEPY_0, 5, 0); // zzz off

// Sleeping: eyes fully closed, zzz
const C_SLEEPING_0: SpriteFrame = replaceIdx(C_SLEEPY_0, 2, 2); // same as sleepy frame 0

const CLOUDY_SPRITES: CharacterSprites = {
  idle:      [C_IDLE_0, C_IDLE_1],
  curious:   [C_CURIOUS_0, C_CURIOUS_1],
  thinking:  [C_THINKING_0, C_THINKING_1],
  happy:     [C_HAPPY_0, C_HAPPY_1, C_HAPPY_2],
  worried:   [C_WORRIED_0, C_WORRIED_1],
  celebrate: [C_CELEBRATE_0, C_CELEBRATE_1, C_CELEBRATE_2, C_CELEBRATE_3],
  sleepy:    [C_SLEEPY_0, C_SLEEPY_1],
  sleeping:  [C_SLEEPING_0],
};

// ── Pix (fox) ─────────────────────────────────────────────────────────────────
// Palette: 0=transparent, 1=orange body, 2=white belly, 3=dark (eyes/nose), 4=ear tip(dark orange), 5=tail tip(white)

const P_IDLE_0: SpriteFrame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,4,0,0,0,0,0,0,0,0,0,4,0,0,0],
  [0,0,4,4,0,0,0,0,0,0,0,4,4,0,0,0],
  [0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,3,1,1,1,3,1,1,0,0,0,0],
  [0,0,0,1,1,3,1,1,1,3,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,3,1,1,1,1,0,0,0,0],
  [0,0,0,1,2,1,1,1,1,1,2,1,0,0,0,0],
  [0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0],
  [0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,1,1,5,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,1,5,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const P_IDLE_1 = replaceIdx(P_IDLE_0, 3, 1); // blink

const PIX_SPRITES: CharacterSprites = {
  idle:      [P_IDLE_0, P_IDLE_1],
  curious:   [P_IDLE_0, mirrorH(P_IDLE_0)],
  thinking:  [P_IDLE_0, P_IDLE_1],
  happy:     [P_IDLE_0, P_IDLE_1, P_IDLE_0],
  worried:   [P_IDLE_0, mirrorH(P_IDLE_0)],
  celebrate: [P_IDLE_0, mirrorH(P_IDLE_0), P_IDLE_1, mirrorH(P_IDLE_1)],
  sleepy:    [P_IDLE_1, P_IDLE_1],
  sleeping:  [P_IDLE_1],
};

// ── BotBot (robot) ────────────────────────────────────────────────────────────
// Palette: 0=transparent, 1=metal body, 2=darker metal, 3=screen/eyes(cyan), 4=antenna, 5=light blink

const B_IDLE_0: SpriteFrame = [
  [0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,4,4,4,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,0,0,0,0,0],
  [0,0,0,0,2,1,1,1,1,1,2,0,0,0,0,0],
  [0,0,0,0,1,3,1,1,1,3,1,0,0,0,0,0],
  [0,0,0,0,1,3,1,1,1,3,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,2,1,1,1,0,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,0,0,0,0,0],
  [0,0,0,2,0,1,1,1,1,1,0,2,0,0,0,0],
  [0,0,0,2,0,1,1,1,1,1,0,2,0,0,0,0],
  [0,0,0,0,0,1,2,1,2,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0],
  [0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const B_IDLE_1 = replaceIdx(B_IDLE_0, 3, 1); // eyes off blink

const BOTBOT_SPRITES: CharacterSprites = {
  idle:      [B_IDLE_0, B_IDLE_1],
  curious:   [B_IDLE_0, mirrorH(B_IDLE_0)],
  thinking:  [B_IDLE_0, B_IDLE_1],
  happy:     [B_IDLE_0, B_IDLE_1, B_IDLE_0],
  worried:   [B_IDLE_0, mirrorH(B_IDLE_0)],
  celebrate: [B_IDLE_0, mirrorH(B_IDLE_0), B_IDLE_1, mirrorH(B_IDLE_1)],
  sleepy:    [B_IDLE_1, B_IDLE_1],
  sleeping:  [B_IDLE_1],
};

// ── Leaf (sprout in pot) ──────────────────────────────────────────────────────
// Palette: 0=transparent, 1=green leaf, 2=brown stem, 3=dark(eyes), 4=terracotta pot, 5=flower/sparkle

const L_IDLE_0: SpriteFrame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,2,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,3,2,3,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,4,4,4,4,4,4,4,0,0,0,0,0],
  [0,0,0,0,4,4,4,4,4,4,4,0,0,0,0,0],
  [0,0,0,0,4,4,4,4,4,4,4,0,0,0,0,0],
  [0,0,0,0,0,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const L_IDLE_1 = replaceIdx(L_IDLE_0, 3, 2); // blink

const LEAF_SPRITES: CharacterSprites = {
  idle:      [L_IDLE_0, L_IDLE_1],
  curious:   [L_IDLE_0, mirrorH(L_IDLE_0)],
  thinking:  [L_IDLE_0, L_IDLE_1],
  happy:     [L_IDLE_0, L_IDLE_1, L_IDLE_0],
  worried:   [L_IDLE_0, mirrorH(L_IDLE_0)],
  celebrate: [L_IDLE_0, mirrorH(L_IDLE_0), L_IDLE_1, mirrorH(L_IDLE_1)],
  sleepy:    [L_IDLE_1, L_IDLE_1],
  sleeping:  [L_IDLE_1],
};

// ── Moon (crescent/full moon) ─────────────────────────────────────────────────
// Palette: 0=transparent, 1=bright yellow, 2=crater gray, 3=dark(eyes), 4=glow(light yellow), 5=star

const M_IDLE_0: SpriteFrame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,4,4,1,1,1,1,4,4,0,0,0,0],
  [0,0,0,4,1,1,1,1,1,1,1,1,4,0,0,0],
  [0,0,4,1,1,1,1,1,1,1,1,1,1,4,0,0],
  [0,0,4,1,1,2,1,1,1,1,2,1,1,4,0,0],
  [0,0,4,1,1,1,1,1,1,1,1,1,1,4,0,0],
  [0,0,4,1,1,3,1,1,1,3,1,1,1,4,0,0],
  [0,0,4,1,1,3,1,1,1,3,1,1,1,4,0,0],
  [0,0,4,1,1,1,1,1,1,1,1,1,1,4,0,0],
  [0,0,0,4,1,1,1,2,1,1,1,1,4,0,0,0],
  [0,0,0,0,4,4,1,1,1,1,4,4,0,0,0,0],
  [0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const M_IDLE_1 = replaceIdx(M_IDLE_0, 3, 1); // blink

const MOON_SPRITES: CharacterSprites = {
  idle:      [M_IDLE_0, M_IDLE_1],
  curious:   [M_IDLE_0, mirrorH(M_IDLE_0)],
  thinking:  [M_IDLE_0, M_IDLE_1],
  happy:     [M_IDLE_0, M_IDLE_1, M_IDLE_0],
  worried:   [M_IDLE_0, mirrorH(M_IDLE_0)],
  celebrate: [M_IDLE_0, mirrorH(M_IDLE_0), M_IDLE_1, mirrorH(M_IDLE_1)],
  sleepy:    [M_IDLE_1, M_IDLE_1],
  sleeping:  [M_IDLE_1],
};

// ── Otter (sea otter, beige & cute) ────────────────────────────────────────────
// Palette: 0=transparent, 1=beige body, 2=light beige belly, 3=dark(eyes/nose), 4=dark brown(ears/paws), 5=pink(cheeks/sparkle)

const O_IDLE_0: SpriteFrame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,4,0,0,0,0,0,0,4,0,0,0,0],
  [0,0,0,4,4,1,1,1,1,1,1,4,4,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,1,1,3,1,1,1,3,1,1,1,1,0,0],
  [0,0,1,1,1,3,1,1,1,3,1,1,1,1,0,0],
  [0,0,1,5,1,1,1,3,1,1,1,5,1,1,0,0],
  [0,0,1,1,1,1,2,2,2,1,1,1,1,1,0,0],
  [0,0,0,1,1,2,2,2,2,2,1,1,0,0,0,0],
  [0,0,0,1,1,2,2,2,2,2,1,1,0,0,0,0],
  [0,0,0,0,1,1,2,2,2,1,1,0,0,0,0,0],
  [0,0,0,0,4,1,1,1,1,1,4,0,0,0,0,0],
  [0,0,0,0,0,4,0,0,0,4,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
// Eyes closed (blink)
const O_IDLE_1 = replaceIdx(O_IDLE_0, 3, 1);

// Curious: head tilt
const O_CURIOUS_0: SpriteFrame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0],
  [0,0,0,0,4,4,1,1,1,1,1,4,4,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,1,1,3,1,1,1,3,1,1,1,1,0,0],
  [0,0,0,1,1,3,1,1,1,3,1,1,1,1,0,0],
  [0,0,0,5,1,1,1,3,1,1,1,5,1,1,0,0],
  [0,0,0,1,1,1,2,2,2,1,1,1,1,1,0,0],
  [0,0,0,1,1,2,2,2,2,2,1,1,0,0,0,0],
  [0,0,0,1,1,2,2,2,2,2,1,1,0,0,0,0],
  [0,0,0,0,1,1,2,2,2,1,1,0,0,0,0,0],
  [0,0,0,0,4,1,1,1,1,1,4,0,0,0,0,0],
  [0,0,0,0,0,4,0,0,0,4,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const O_CURIOUS_1 = mirrorH(O_CURIOUS_0);

// Happy: bounced up + sparkles
const O_HAPPY_0: SpriteFrame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,4,0,0,0,0,0,0,4,0,0,0,0,0],
  [0,0,4,4,1,1,1,1,1,1,4,4,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,1,1,1,3,1,1,1,3,1,1,1,1,0,0,0],
  [0,1,5,1,1,1,1,1,1,1,5,1,1,0,0,0],
  [0,1,1,1,1,2,1,1,2,1,1,1,1,0,0,0],
  [0,0,1,1,2,2,2,2,2,2,1,1,0,0,0,0],
  [0,0,1,1,2,2,2,2,2,2,1,1,0,0,0,0],
  [0,0,0,1,1,2,2,2,1,1,0,0,0,0,0,0],
  [0,0,0,4,1,1,1,1,1,4,0,0,0,0,0,0],
  [0,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0],
  [0,5,0,0,0,0,0,0,0,0,0,0,0,5,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Sleepy: droopy eyes + zzz
const O_SLEEPY_0: SpriteFrame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,4,0,0,0,0,0,0,4,0,0,0,0],
  [0,0,0,4,4,1,1,1,1,1,1,4,4,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,1,4,4,1,1,1,4,4,1,1,1,0,0],
  [0,0,1,5,1,1,1,1,1,1,1,5,1,1,0,0],
  [0,0,1,1,1,1,2,2,2,1,1,1,1,1,0,0],
  [0,0,0,1,1,2,2,2,2,2,1,1,0,0,0,0],
  [0,0,0,1,1,2,2,2,2,2,1,1,0,0,0,0],
  [0,0,0,0,1,1,2,2,2,1,1,0,0,0,5,0],
  [0,0,0,0,4,1,1,1,1,1,4,0,0,5,0,0],
  [0,0,0,0,0,4,0,0,0,4,0,0,5,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const O_SLEEPY_1 = replaceIdx(O_SLEEPY_0, 5, 0);

const OTTER_SPRITES: CharacterSprites = {
  idle:      [O_IDLE_0, O_IDLE_1],
  curious:   [O_CURIOUS_0, O_CURIOUS_1],
  thinking:  [O_IDLE_0, O_IDLE_1],
  happy:     [O_HAPPY_0, O_IDLE_0, O_HAPPY_0],
  worried:   [O_IDLE_0, mirrorH(O_IDLE_0)],
  celebrate: [O_HAPPY_0, mirrorH(O_HAPPY_0), O_IDLE_1, mirrorH(O_IDLE_1)],
  sleepy:    [O_SLEEPY_0, O_SLEEPY_1],
  sleeping:  [O_SLEEPY_0],
};

// ── Sprite & palette lookup ───────────────────────────────────────────────────

const ALL_SPRITES: Record<MascotCharacter, CharacterSprites> = {
  cloudy: CLOUDY_SPRITES,
  pix:    PIX_SPRITES,
  botbot: BOTBOT_SPRITES,
  leaf:   LEAF_SPRITES,
  moon:   MOON_SPRITES,
  otter:  OTTER_SPRITES,
};

/** Default palettes per character. */
const DEFAULT_PALETTES: Record<MascotCharacter, Palette> = {
  cloudy: ['transparent', '#FFFFFF', '#D0D0D0', '#333333', '#FFB7B2', '#FFD700'],
  pix:    ['transparent', '#FF8C42', '#FFFFFF', '#333333', '#CC5500', '#FFFFFF'],
  botbot: ['transparent', '#B0B8C0', '#707880', '#00E5FF', '#FF4444', '#FFFF00'],
  leaf:   ['transparent', '#4CAF50', '#8B4513', '#333333', '#D2691E', '#FFD700'],
  moon:   ['transparent', '#FFE082', '#BDBDBD', '#333333', '#FFF9C4', '#FFD700'],
  otter:  ['transparent', '#D4B896', '#F0E6D3', '#333333', '#8B6E4E', '#FFB7B2'],
};

/** Theme-specific palette overrides. */
const THEME_PALETTES: Record<string, Partial<Record<MascotCharacter, Palette>>> = {
  cyberpunk: {
    cloudy: ['transparent', '#E0E0FF', '#8080FF', '#FF00FF', '#00FFFF', '#FFFF00'],
    pix:    ['transparent', '#FF4500', '#C0C0FF', '#FF00FF', '#AA2200', '#00FFFF'],
    botbot: ['transparent', '#A0A0D0', '#5050A0', '#00FF80', '#FF0055', '#FFFF00'],
    leaf:   ['transparent', '#00FF80', '#8040C0', '#FF00FF', '#6020A0', '#00FFFF'],
    moon:   ['transparent', '#C0C0FF', '#8080A0', '#FF00FF', '#E0E0FF', '#00FFFF'],
    otter:  ['transparent', '#C0A0FF', '#E0D0FF', '#FF00FF', '#8060CC', '#00FFFF'],
  },
  terminal: {
    cloudy: ['transparent', '#33FF33', '#1A8A1A', '#00CC00', '#22AA22', '#FFFF33'],
    pix:    ['transparent', '#33FF33', '#1A8A1A', '#00CC00', '#22AA22', '#33FF33'],
    botbot: ['transparent', '#33FF33', '#1A8A1A', '#00CC00', '#22AA22', '#FFFF33'],
    leaf:   ['transparent', '#33FF33', '#1A8A1A', '#00CC00', '#22AA22', '#FFFF33'],
    moon:   ['transparent', '#33FF33', '#1A8A1A', '#00CC00', '#22AA22', '#FFFF33'],
    otter:  ['transparent', '#33FF33', '#1A8A1A', '#00CC00', '#22AA22', '#FFFF33'],
  },
  ink: {
    cloudy: ['transparent', '#4A4A4A', '#888888', '#222222', '#666666', '#999999'],
    pix:    ['transparent', '#5C5C5C', '#999999', '#222222', '#3A3A3A', '#999999'],
    botbot: ['transparent', '#5C5C5C', '#3A3A3A', '#222222', '#444444', '#888888'],
    leaf:   ['transparent', '#4A4A4A', '#6A4A2A', '#222222', '#5A3A1A', '#888888'],
    moon:   ['transparent', '#6A6A6A', '#888888', '#222222', '#999999', '#AAAAAA'],
    otter:  ['transparent', '#5C5C5C', '#888888', '#222222', '#3A3A3A', '#666666'],
  },
};

export function getSprite(
  character: MascotCharacter,
  state: MascotStateName,
  frame: number
): SpriteFrame {
  const sprites = ALL_SPRITES[character]?.[state];
  if (!sprites || sprites.length === 0) return ALL_SPRITES.cloudy.idle[0];
  return sprites[frame % sprites.length];
}

export function getPalette(character: MascotCharacter, theme: string): Palette {
  const override = THEME_PALETTES[theme]?.[character];
  return override ?? DEFAULT_PALETTES[character] ?? DEFAULT_PALETTES.cloudy;
}
