// Keyboard and mouse, wired straight onto the panels the renderer draws. A click is hit-tested
// against the same rectangles in config.js, so the hit a player sees is the hit they get.

import { INGREDIENTS, SERVE_BTN, stationRect } from './config.js';

export function bindInput(canvas, world, onChange) {
  const toLocal = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const inside = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

  const stationAt = (p) => {
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      if (inside(p, stationRect(i))) return i;
    }
    return -1;
  };

  canvas.addEventListener('mousemove', (event) => {
    const p = toLocal(event);
    const index = stationAt(p);
    if (world.hoverStation !== index) {
      world.hoverStation = index;
      onChange();
    }
  });

  canvas.addEventListener('mouseleave', () => {
    if (world.hoverStation !== -1) {
      world.hoverStation = -1;
      onChange();
    }
  });

  canvas.addEventListener('click', (event) => {
    const p = toLocal(event);
    if (world.phase === 'title' || world.phase === 'over') {
      world.start();
      onChange();
      return;
    }
    const index = stationAt(p);
    if (index !== -1) {
      world.addIngredient(INGREDIENTS[index].id);
      onChange();
      return;
    }
    if (inside(p, SERVE_BTN)) {
      world.serve();
      onChange();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (world.phase === 'title' || world.phase === 'over') {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        world.start();
        onChange();
      }
      return;
    }
    const hit = INGREDIENTS.find((i) => i.key === event.key);
    if (hit) {
      world.addIngredient(hit.id);
      onChange();
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      world.serve();
      onChange();
      return;
    }
    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Escape') {
      event.preventDefault();
      world.clearBowl();
      onChange();
    }
  });
}
