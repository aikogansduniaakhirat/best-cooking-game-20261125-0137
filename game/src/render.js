// Everything the player sees: the kitchen wall and counter, the order board with its tickets, the
// ingredient crates, the pass where the bowl is built, and the shift clock. Draw-only — it reads the
// world and never changes it, so the same state always paints the same frame.

import {
  BOARD,
  BOWL,
  COLORS,
  HEADER_H,
  INGREDIENTS,
  KITCHEN,
  PLATE,
  PLATE_C,
  SEATS,
  SERVE_BTN,
  SHIFT_SECONDS,
  VIEW,
  stationRect,
  ticketRect,
} from './config.js';
import { drawBowl, drawIcon } from './food.js';

const TAU = Math.PI * 2;

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = '600', font = 'Inter, system-ui, sans-serif') {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

/* ------------------------------------------------------------- backdrop */

function drawWall(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  g.addColorStop(0, '#241a17');
  g.addColorStop(0.55, '#2b211d');
  g.addColorStop(1, '#1b1310');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // subway tile band behind the pass
  const tile = 46;
  for (let row = 0; row < 4; row += 1) {
    for (let col = -1; col < 30; col += 1) {
      const x = col * tile + (row % 2 ? tile / 2 : 0);
      const y = HEADER_H + row * 26;
      ctx.fillStyle = row % 2 ? 'rgba(255,236,214,0.045)' : 'rgba(255,236,214,0.03)';
      ctx.fillRect(x + 1, y + 1, tile - 2, 24);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  for (let row = 0; row <= 4; row += 1) {
    ctx.beginPath();
    ctx.moveTo(0, HEADER_H + row * 26);
    ctx.lineTo(VIEW.width, HEADER_H + row * 26);
    ctx.stroke();
  }

  // warm lamp pools
  for (const cx of [210, 650, 1080]) {
    const lamp = ctx.createRadialGradient(cx, 130, 10, cx, 130, 320);
    lamp.addColorStop(0, 'rgba(255,196,110,0.16)');
    lamp.addColorStop(1, 'rgba(255,196,110,0)');
    ctx.fillStyle = lamp;
    ctx.fillRect(cx - 320, 0, 640, 520);
  }
}

function drawCounter(ctx) {
  const y = 660;
  const g = ctx.createLinearGradient(0, y, 0, VIEW.height);
  g.addColorStop(0, '#8a5a35');
  g.addColorStop(1, '#4d2f1c');
  ctx.fillStyle = g;
  ctx.fillRect(0, y, VIEW.width, VIEW.height - y);
  ctx.fillStyle = 'rgba(255,220,180,0.22)';
  ctx.fillRect(0, y, VIEW.width, 3);
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 1;
  for (let x = 0; x < VIEW.width; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, y + 3);
    ctx.lineTo(x + 18, VIEW.height);
    ctx.stroke();
  }
}

/* ---------------------------------------------------------------- header */

function drawHeader(ctx, world) {
  ctx.fillStyle = 'rgba(14,10,8,0.86)';
  ctx.fillRect(0, 0, VIEW.width, HEADER_H);
  ctx.fillStyle = COLORS.brass;
  ctx.fillRect(0, HEADER_H - 3, VIEW.width, 3);

  text(ctx, 'MIDNIGHT RAMEN', 24, 44, 26, '#f3e6c9', 'left', '800', 'Georgia, serif');
  text(ctx, 'service counter · shift 3', 24, 66, 13, 'rgba(243,230,201,0.55)', 'left', '500');

  // shift clock
  const left = world.clockLeft;
  const ratio = Math.max(0, Math.min(1, left / SHIFT_SECONDS));
  const barW = 300;
  const barX = VIEW.width / 2 - barW / 2;
  roundRect(ctx, barX, 28, barW, 14, 7);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fill();
  roundRect(ctx, barX, 28, Math.max(6, barW * ratio), 14, 7);
  ctx.fillStyle = ratio < 0.2 ? '#d0553f' : '#d9a44c';
  ctx.fill();
  const mm = Math.floor(left / 60);
  const ss = Math.floor(left % 60);
  text(ctx, `${mm}:${String(ss).padStart(2, '0')} left in the shift`, VIEW.width / 2, 66, 13, 'rgba(243,230,201,0.75)', 'center', '600');

  // hearts
  for (let i = 0; i < 3; i += 1) {
    const filled = i < world.hearts;
    const cx = VIEW.width - 250 + i * 30;
    ctx.save();
    ctx.translate(cx, 40);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(-11, -4, -6, -13, 0, -7);
    ctx.bezierCurveTo(6, -13, 11, -4, 0, 6);
    ctx.closePath();
    ctx.fillStyle = filled ? '#d0553f' : 'rgba(255,255,255,0.14)';
    ctx.fill();
    ctx.restore();
  }

  text(ctx, `$ ${world.score}`, VIEW.width - 24, 48, 30, '#ffd98a', 'right', '800', 'Georgia, serif');
  text(ctx, `${world.served} served · ${world.burned} walked out`, VIEW.width - 24, 68, 12, 'rgba(243,230,201,0.6)', 'right', '500');
}

/* ----------------------------------------------------------------- board */

function drawBoard(ctx, world) {
  const b = BOARD;
  // dark wooden board
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
  g.addColorStop(0, '#33241c');
  g.addColorStop(1, '#241812');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(217,164,76,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  text(ctx, 'ORDER BOARD', b.x + 18, b.y + 34, 17, COLORS.brass, 'left', '800', 'Georgia, serif');
  text(ctx, 'tickets in the order they were called', b.x + 18, b.y + 54, 11, 'rgba(243,230,201,0.5)', 'left', '500');

  for (let seat = 0; seat < SEATS; seat += 1) {
    const ticket = world.seats[seat];
    const r = ticketRect(seat);
    const p = ticket ? ticket.remaining / ticket.patience : 1;
    const urgent = ticket && p < 0.3;

    // paper
    roundRect(ctx, r.x, r.y, r.w, r.h, 6);
    ctx.fillStyle = ticket ? '#f6ecd4' : '#3a2c23';
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = '#8a6a44';
    ctx.lineWidth = 1;
    for (let ly = r.y + 12; ly < r.y + r.h - 8; ly += 9) {
      ctx.beginPath();
      ctx.moveTo(r.x + 8, ly);
      ctx.lineTo(r.x + r.w - 8, ly);
      ctx.stroke();
    }
    ctx.restore();

    if (!ticket) continue;

    // torn top edge
    ctx.fillStyle = '#f6ecd4';
    for (let i = 0; i < 14; i += 1) {
      ctx.beginPath();
      ctx.arc(r.x + 12 + i * 24, r.y, 5, 0, TAU);
      ctx.fill();
    }

    text(ctx, `SEAT ${seat + 1}`, r.x + 14, r.y + 26, 11, '#8a6a44', 'left', '800');
    text(ctx, ticket.recipe.name, r.x + 14, r.y + 48, 17, '#2a1d14', 'left', '800', 'Georgia, serif');
    text(ctx, `$${ticket.recipe.price}`, r.x + r.w - 14, r.y + 48, 15, '#8a6a44', 'right', '700');

    // the sequence, as small icons with arrows
    const steps = ticket.recipe.steps;
    const shown = Math.min(steps.length, 7);
    const slotW = 30;
    const startX = r.x + 16;
    for (let i = 0; i < shown; i += 1) {
      const cx = startX + i * slotW;
      const cy = r.y + 78;
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0, TAU);
      ctx.fillStyle = 'rgba(42,29,20,0.08)';
      ctx.fill();
      drawIcon(ctx, steps[i], cx, cy, 30);
      if (i < shown - 1) {
        text(ctx, '›', cx + 15, cy + 5, 14, 'rgba(42,29,20,0.35)', 'center', '700');
      }
    }

    // patience bar
    const barY = r.y + r.h - 26;
    const barW = r.w - 28;
    roundRect(ctx, r.x + 14, barY, barW, 9, 4.5);
    ctx.fillStyle = 'rgba(42,29,20,0.13)';
    ctx.fill();
    roundRect(ctx, r.x + 14, barY, Math.max(4, barW * Math.max(0, p)), 9, 4.5);
    ctx.fillStyle = urgent ? '#c0392b' : p < 0.6 ? '#d9942f' : '#4f9d63';
    ctx.fill();

    if (urgent) {
      const pulse = 0.5 + 0.5 * Math.sin(world.time * 9);
      ctx.save();
      ctx.globalAlpha = 0.5 + pulse * 0.5;
      text(ctx, 'waiting…', r.x + r.w - 14, r.y + 26, 11, '#c0392b', 'right', '800');
      ctx.restore();
    }
  }
}

/* --------------------------------------------------------------- kitchen */

function drawKitchen(ctx, world) {
  const k = KITCHEN;
  roundRect(ctx, k.x, k.y, k.w, k.h, 12);
  ctx.fillStyle = 'rgba(255,238,214,0.035)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(217,164,76,0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();

  text(ctx, 'PREP COUNTER', k.x + 18, k.y + 32, 15, COLORS.brass, 'left', '800', 'Georgia, serif');
  text(ctx, 'click a crate, or press its number', k.x + 18, k.y + 52, 11, 'rgba(243,230,201,0.45)', 'left', '500');

  // chopping block under the crates
  roundRect(ctx, k.x + 16, k.y + 178, k.w - 32, 232, 10);
  ctx.fillStyle = 'rgba(20,14,11,0.55)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const want = world.expected();
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    const ing = INGREDIENTS[i];
    const r = stationRect(i);
    const isNext = want === ing.id;
    const hover = world.hoverStation === i;

    roundRect(ctx, r.x, r.y, r.w, r.h, 9);
    const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    g.addColorStop(0, isNext ? 'rgba(217,164,76,0.28)' : 'rgba(255,240,220,0.07)');
    g.addColorStop(1, isNext ? 'rgba(217,164,76,0.1)' : 'rgba(255,240,220,0.02)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = isNext ? 'rgba(255,214,140,0.9)' : hover ? 'rgba(255,240,220,0.4)' : 'rgba(255,240,220,0.14)';
    ctx.lineWidth = isNext ? 2.5 : 1.5;
    ctx.stroke();

    drawIcon(ctx, ing.id, r.x + r.w / 2, r.y + 44, 62, isNext ? 1 : 0.86);
    text(ctx, ing.name, r.x + r.w / 2, r.y + r.h - 14, 12, isNext ? '#ffd98a' : 'rgba(243,230,201,0.72)', 'center', '700');

    // the crate that is being plated right now fills a ring, so the pass never feels unresponsive
    if (isNext && world.prepLeft > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + 44, 33, -Math.PI / 2, -Math.PI / 2 + TAU * world.prepProgress);
      ctx.strokeStyle = 'rgba(255,214,140,0.9)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }

    // the key hint
    roundRect(ctx, r.x + 6, r.y + 6, 18, 18, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
    text(ctx, ing.key, r.x + 15, r.y + 19, 11, 'rgba(243,230,201,0.8)', 'center', '800');
  }

  // the pot on the stove
  const potX = k.x + k.w / 2;
  const potY = k.y + 470;
  ctx.save();
  ctx.fillStyle = '#20262e';
  roundRect(ctx, potX - 118, potY - 18, 236, 76, 14);
  ctx.fill();
  ctx.fillStyle = '#2c3440';
  ctx.beginPath();
  ctx.ellipse(potX, potY - 18, 118, 26, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#8d5a2b';
  ctx.beginPath();
  ctx.ellipse(potX, potY - 16, 104, 20, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  text(ctx, 'broth at a simmer', potX, potY + 78, 11, 'rgba(243,230,201,0.45)', 'center', '500');
}

/* ------------------------------------------------------------------ pass */

function drawPass(ctx, world) {
  const p = PLATE;
  roundRect(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fillStyle = 'rgba(255,238,214,0.035)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(217,164,76,0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();

  text(ctx, 'THE PASS', p.x + 18, p.y + 32, 15, COLORS.brass, 'left', '800', 'Georgia, serif');
  text(ctx, 'build it, then serve', p.x + 18, p.y + 52, 11, 'rgba(243,230,201,0.45)', 'left', '500');

  // the plate the bowl sits on
  ctx.save();
  const pg = ctx.createRadialGradient(PLATE_C.x, PLATE_C.y, 20, PLATE_C.x, PLATE_C.y, 190);
  pg.addColorStop(0, 'rgba(240,232,214,0.16)');
  pg.addColorStop(1, 'rgba(240,232,214,0.04)');
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.ellipse(PLATE_C.x, PLATE_C.y, PLATE_C.rx, PLATE_C.ry, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(240,232,214,0.28)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  drawBowl(ctx, world.bowl, BOWL.x, BOWL.y, 1, world.time, true);

  // the current bowl's stack, under the pass
  const target = world.target();
  const want = target ? target.recipe.steps : [];
  const startX = p.x + 28;
  for (let i = 0; i < Math.min(want.length, 8); i += 1) {
    const cx = startX + i * 40;
    const cy = p.y + 540;
    const filled = i < world.bowl.length;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, TAU);
    ctx.fillStyle = filled ? 'rgba(217,164,76,0.28)' : 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = filled ? 'rgba(255,214,140,0.85)' : 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawIcon(ctx, want[i], cx, cy, 32, filled ? 1 : 0.32);
  }

  // serve button
  const ready = world.complete();
  const b = SERVE_BTN;
  roundRect(ctx, b.x, b.y, b.w, b.h, 10);
  const bg = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
  bg.addColorStop(0, ready ? '#5cb073' : 'rgba(255,255,255,0.06)');
  bg.addColorStop(1, ready ? '#3d8a55' : 'rgba(255,255,255,0.03)');
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = ready ? 'rgba(180,255,200,0.7)' : 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, ready ? 'SERVE  (space)' : 'SERVE', b.x + b.w / 2, b.y + 40, 19, ready ? '#f2fff5' : 'rgba(243,230,201,0.35)', 'center', '800');

  text(ctx, 'backspace clears the bowl', p.x + p.w / 2, p.y + 592, 10, 'rgba(243,230,201,0.3)', 'center', '500');
}

/* --------------------------------------------------------------- screens */

function drawTitle(ctx, world) {
  drawWall(ctx);
  drawCounter(ctx);
  ctx.fillStyle = 'rgba(12,8,6,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  text(ctx, 'MIDNIGHT RAMEN', VIEW.width / 2, 218, 76, '#f3e6c9', 'center', '800', 'Georgia, serif');
  text(ctx, 'a one-cook noodle counter, open until the last train', VIEW.width / 2, 258, 19, 'rgba(243,230,201,0.65)', 'center', '500');

  drawBowl(ctx, ['broth', 'noodles', 'chashu', 'egg', 'nori', 'scallion'], VIEW.width / 2, 380, 1.5, 2.4, true);

  const lines = [
    'Click an ingredient crate — or press 1 to 6 — to add it to the bowl.',
    'Build each ticket in the order printed on it, then press SPACE to serve.',
    'A wrong crate costs the customer patience. Three walkouts end the shift.',
  ];
  lines.forEach((line, i) => {
    text(ctx, line, VIEW.width / 2, 500 + i * 26, 15, 'rgba(243,230,201,0.75)', 'center', '500');
  });

  const pulse = 0.55 + 0.45 * Math.sin(world.time * 3);
  ctx.save();
  ctx.globalAlpha = pulse;
  text(ctx, 'CLICK TO OPEN THE SHOP', VIEW.width / 2, 636, 22, '#ffd98a', 'center', '800');
  ctx.restore();
}

function drawOver(ctx, world) {
  ctx.fillStyle = 'rgba(10,6,4,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  const panel = { x: VIEW.width / 2 - 300, y: 180, w: 600, h: 340 };
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 14);
  ctx.fillStyle = 'rgba(38,27,21,0.96)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(217,164,76,0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();

  text(ctx, world.hearts <= 0 ? 'THE SHOP EMPTIED OUT' : 'CLOSING TIME', VIEW.width / 2, panel.y + 62, 34, '#f3e6c9', 'center', '800', 'Georgia, serif');
  text(ctx, `$${world.score} on the night`, VIEW.width / 2, panel.y + 122, 44, '#ffd98a', 'center', '800', 'Georgia, serif');

  const stats = [
    ['bowls served', String(world.served)],
    ['customers lost', String(world.burned)],
    ['tips earned', `$${world.tips}`],
  ];
  stats.forEach(([label, value], i) => {
    const x = panel.x + 110 + i * 190;
    text(ctx, value, x, panel.y + 190, 26, '#f3e6c9', 'center', '700');
    text(ctx, label, x, panel.y + 212, 12, 'rgba(243,230,201,0.55)', 'center', '500');
  });

  const pulse = 0.55 + 0.45 * Math.sin(world.time * 3);
  ctx.save();
  ctx.globalAlpha = pulse;
  text(ctx, 'CLICK OR PRESS SPACE TO OPEN AGAIN', VIEW.width / 2, panel.y + 292, 17, '#ffd98a', 'center', '800');
  ctx.restore();
}

/** Paint one frame. `screen` is what the shot harness forces; live play passes world.phase. */
export function render(ctx, world, screen) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  const which = screen || world.phase;

  if (which === SCREEN_TITLE) {
    drawTitle(ctx, world);
    return;
  }

  drawWall(ctx);
  drawCounter(ctx);
  drawHeader(ctx, world);
  drawBoard(ctx, world);
  drawKitchen(ctx, world);
  drawPass(ctx, world);

  if (world.flash > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.22, world.flash * 0.5);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.restore();
  }

  if (which === SCREEN_OVER) drawOver(ctx, world);
}
