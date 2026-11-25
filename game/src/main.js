// The page's entry point: size the canvas, build the world, and either run the live shift or freeze
// one screenshot scene when the URL asks for ?shot=start|play|end. Nothing here touches the network.

import { VIEW } from './config.js';
import { World } from './world.js';
import { render } from './render.js';
import { bindInput } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? 1) || 1;

function fit() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
}

const world = new World(seed);
world.hoverStation = -1;
let dirty = true;

// A read-only handle for the game's own test: ?debug=1 exposes the live world so a headless run can
// assert on the shift it actually plays (bowl, score, hearts) instead of guessing from pixels.
if (params.get('debug') === '1') {
  Object.defineProperty(window, '__ramen', { value: world, configurable: true });
}

fit();
window.addEventListener('resize', () => {
  fit();
  dirty = true;
});

if (shot) {
  // A screenshot scene: one deterministic frame, no animation loop, no input.
  const staged = stageShot(shot, world, seed);
  render(ctx, staged.world, staged.screen);
  document.body.dataset.shot = shot;
  document.title = `Midnight Ramen — ${shot}`;
} else {
  bindInput(canvas, world, () => {
    dirty = true;
  });

  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const before = world.phase;
    world.step(dt);
    if (before !== world.phase) dirty = true;
    if (dirty || world.phase === 'shift') render(ctx, world, null);
    dirty = false;
    requestAnimationFrame(frame);
  };
  render(ctx, world, null);
  requestAnimationFrame(frame);
}
