// Vector food art: the ingredient crates' icons, the layers inside a bowl, and the bowl itself.
// Everything is drawn with paths so the game ships no image files and looks the same at any size.

const TAU = Math.PI * 2;

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
}

/* ---------------------------------------------------------------- icons */

function iconNoodles(ctx, s) {
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i += 1) {
    const off = -s * 0.3 + i * s * 0.12;
    ctx.beginPath();
    ctx.moveTo(-s * 0.34, off + s * 0.05);
    ctx.bezierCurveTo(-s * 0.1, off - s * 0.16, s * 0.06, off + s * 0.22, s * 0.34, off - s * 0.04);
    ctx.strokeStyle = i % 2 ? '#f7e2b4' : '#e6c67f';
    ctx.lineWidth = Math.max(1.6, s * 0.055);
    ctx.stroke();
  }
  ctx.fillStyle = '#2f4a3c';
  rr(ctx, -s * 0.16, -s * 0.06, s * 0.32, s * 0.14, s * 0.03);
  ctx.fill();
}

function iconBroth(ctx, s) {
  ctx.fillStyle = '#8d5a2b';
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, -s * 0.1);
  ctx.quadraticCurveTo(-s * 0.26, s * 0.3, 0, s * 0.3);
  ctx.quadraticCurveTo(s * 0.26, s * 0.3, s * 0.3, -s * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d09250';
  ellipse(ctx, 0, -s * 0.1, s * 0.3, s * 0.09);
  ctx.fill();
  ctx.fillStyle = '#e8b673';
  ellipse(ctx, -s * 0.08, -s * 0.11, s * 0.09, s * 0.028);
  ctx.fill();
  ctx.strokeStyle = '#c7cdd4';
  ctx.lineWidth = Math.max(1.2, s * 0.035);
  ctx.beginPath();
  ctx.moveTo(s * 0.16, -s * 0.2);
  ctx.lineTo(s * 0.3, -s * 0.42);
  ctx.stroke();
}

function iconEgg(ctx, s) {
  ctx.fillStyle = '#fdf6e6';
  ellipse(ctx, 0, 0, s * 0.32, s * 0.26);
  ctx.fill();
  ctx.strokeStyle = '#e9dcc0';
  ctx.lineWidth = Math.max(1, s * 0.02);
  ctx.stroke();
  ctx.fillStyle = '#f2a33c';
  ellipse(ctx, s * 0.02, s * 0.01, s * 0.15, s * 0.13);
  ctx.fill();
  ctx.fillStyle = '#ffc766';
  ellipse(ctx, -s * 0.03, -s * 0.03, s * 0.07, s * 0.055);
  ctx.fill();
}

function iconNori(ctx, s) {
  ctx.save();
  ctx.rotate(-0.12);
  ctx.fillStyle = '#22392f';
  rr(ctx, -s * 0.3, -s * 0.26, s * 0.6, s * 0.52, s * 0.02);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,170,140,0.35)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.3 + (i * s * 0.6) / 4, -s * 0.26);
    ctx.lineTo(-s * 0.3 + (i * s * 0.6) / 4, s * 0.26);
    ctx.stroke();
  }
  ctx.restore();
}

function iconScallion(ctx, s) {
  const spots = [
    [-0.16, -0.1, 0.11],
    [0.12, -0.02, 0.13],
    [-0.02, 0.14, 0.1],
    [0.18, 0.16, 0.08],
  ];
  for (const [dx, dy, r] of spots) {
    ctx.beginPath();
    ctx.arc(dx * s, dy * s, r * s, 0, TAU);
    ctx.fillStyle = '#5f9a4b';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dx * s, dy * s, r * s * 0.6, 0, TAU);
    ctx.fillStyle = '#a8d78d';
    ctx.fill();
  }
}

function iconChashu(ctx, s) {
  ctx.fillStyle = '#b96a52';
  ellipse(ctx, 0, 0, s * 0.3, s * 0.28);
  ctx.fill();
  ctx.strokeStyle = '#8d4636';
  ctx.lineWidth = Math.max(1, s * 0.025);
  ctx.stroke();
  ctx.strokeStyle = '#e8c7a6';
  ctx.lineWidth = Math.max(1.4, s * 0.035);
  ctx.beginPath();
  for (let a = 0; a < 3.1; a += 0.12) {
    const r = s * 0.05 + a * s * 0.075;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (a === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

const ICONS = {
  noodles: iconNoodles,
  broth: iconBroth,
  egg: iconEgg,
  nori: iconNori,
  scallion: iconScallion,
  chashu: iconChashu,
};

/** Draw one ingredient's icon centred at (cx, cy) inside a box `size` across. */
export function drawIcon(ctx, id, cx, cy, size, alpha = 1) {
  const fn = ICONS[id] || iconEgg;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  fn(ctx, size);
  ctx.restore();
}

/* ---------------------------------------------------------- bowl layers */

/** Where each layer sits inside the rim, in rim-relative units, with its own rotation. */
const SPOTS = [
  [-0.34, 0.16, -0.25],
  [0.3, 0.1, 0.3],
  [0.02, -0.16, 0.05],
  [-0.06, 0.3, -0.12],
  [0.42, -0.04, 0.42],
  [0.16, 0.24, -0.3],
  [-0.48, -0.02, 0.18],
];

function layerNoodles(ctx, s) {
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i += 1) {
    const off = -s * 0.16 + i * s * 0.05;
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, off);
    ctx.bezierCurveTo(-s * 0.14, off - s * 0.11, s * 0.1, off + s * 0.13, s * 0.4, off - s * 0.05);
    ctx.strokeStyle = i % 2 ? '#f6e3b6' : '#dfc07c';
    ctx.lineWidth = Math.max(1.8, s * 0.045);
    ctx.stroke();
  }
}

function layerEgg(ctx, s) {
  ctx.fillStyle = '#fdf7e8';
  ellipse(ctx, 0, 0, s * 0.24, s * 0.19);
  ctx.fill();
  ctx.fillStyle = '#f0a63c';
  ellipse(ctx, s * 0.01, 0, s * 0.11, s * 0.1);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,205,120,0.85)';
  ellipse(ctx, -s * 0.02, -s * 0.02, s * 0.045, s * 0.035);
  ctx.fill();
}

function layerChashu(ctx, s) {
  ctx.fillStyle = '#b96a52';
  ellipse(ctx, 0, 0, s * 0.26, s * 0.17);
  ctx.fill();
  ctx.strokeStyle = '#e3c3a3';
  ctx.lineWidth = Math.max(1.2, s * 0.03);
  ctx.beginPath();
  for (let a = 0; a < 3; a += 0.14) {
    const r = s * 0.03 + a * s * 0.07;
    const px = Math.cos(a) * r * 1.3;
    const py = Math.sin(a) * r * 0.8;
    if (a === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function layerNori(ctx, s) {
  ctx.save();
  ctx.rotate(-0.18);
  ctx.fillStyle = '#20362c';
  rr(ctx, -s * 0.2, -s * 0.2, s * 0.4, s * 0.4, s * 0.02);
  ctx.fill();
  ctx.strokeStyle = 'rgba(140,190,160,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-s * 0.2, -s * 0.06);
  ctx.lineTo(s * 0.2, -s * 0.06);
  ctx.stroke();
  ctx.restore();
}

function layerScallion(ctx, s) {
  const rings = [
    [-0.1, -0.04],
    [0.08, 0.05],
    [0.0, -0.1],
    [0.16, -0.05],
    [-0.16, 0.06],
  ];
  for (const [dx, dy] of rings) {
    ctx.beginPath();
    ctx.arc(dx * s, dy * s, s * 0.05, 0, TAU);
    ctx.fillStyle = '#7cb85f';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dx * s, dy * s, s * 0.026, 0, TAU);
    ctx.fillStyle = '#c6e8ad';
    ctx.fill();
  }
}

const LAYERS = {
  noodles: layerNoodles,
  egg: layerEgg,
  chashu: layerChashu,
  nori: layerNori,
  scallion: layerScallion,
};

/**
 * Draw the bowl at (cx, cy) — cy is the rim's centre — with the given ingredient ids already in it.
 * `t` drives the steam so a still frame is reproducible: pass a fixed number for a screenshot.
 */
export function drawBowl(ctx, layers, cx, cy, scale, t, steam = true) {
  const rx = 132 * scale;
  const ry = 48 * scale;
  const depth = 96 * scale;
  const hasBroth = layers.includes('broth');

  // shadow under the bowl on the plate
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#000';
  ellipse(ctx, cx, cy + depth * 0.55, rx * 1.02, ry * 0.85);
  ctx.fill();
  ctx.restore();

  // body
  const body = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy + depth);
  body.addColorStop(0, '#2c3f57');
  body.addColorStop(0.45, '#3d5573');
  body.addColorStop(1, '#22303f');
  ctx.beginPath();
  ctx.moveTo(cx - rx, cy);
  ctx.bezierCurveTo(cx - rx * 0.98, cy + depth * 0.9, cx - rx * 0.55, cy + depth, cx, cy + depth);
  ctx.bezierCurveTo(cx + rx * 0.55, cy + depth, cx + rx * 0.98, cy + depth * 0.9, cx + rx, cy);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();

  // cream band with a wave motif
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - rx, cy);
  ctx.bezierCurveTo(cx - rx * 0.98, cy + depth * 0.9, cx - rx * 0.55, cy + depth, cx, cy + depth);
  ctx.bezierCurveTo(cx + rx * 0.55, cy + depth, cx + rx * 0.98, cy + depth * 0.9, cx + rx, cy);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = 'rgba(240,226,196,0.92)';
  ctx.fillRect(cx - rx, cy + depth * 0.42, rx * 2, depth * 0.16);
  ctx.strokeStyle = 'rgba(60,80,100,0.55)';
  ctx.lineWidth = 1.6 * scale;
  ctx.beginPath();
  for (let i = 0; i <= 40; i += 1) {
    const px = cx - rx + (i * rx * 2) / 40;
    const py = cy + depth * 0.5 + Math.sin(i * 0.55) * 4 * scale;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();

  // inner well
  ellipse(ctx, cx, cy, rx * 0.94, ry * 0.94);
  ctx.fillStyle = hasBroth ? '#c98a44' : '#1a242e';
  ctx.fill();

  // layers, clipped to the well so nothing spills over the rim
  ctx.save();
  ellipse(ctx, cx, cy, rx * 0.94, ry * 0.94);
  ctx.clip();
  if (hasBroth) {
    const broth = ctx.createRadialGradient(cx - rx * 0.2, cy - ry * 0.3, 4, cx, cy, rx);
    broth.addColorStop(0, '#e2ac63');
    broth.addColorStop(1, '#a86e33');
    ctx.fillStyle = broth;
    ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
    ctx.strokeStyle = 'rgba(255,220,160,0.35)';
    ctx.lineWidth = 1.4 * scale;
    for (let i = 0; i < 3; i += 1) {
      ellipse(ctx, cx - rx * 0.1 + i * rx * 0.3, cy + (i - 1) * ry * 0.25, rx * 0.5, ry * 0.18);
      ctx.stroke();
    }
  }
  let spot = 0;
  for (const id of layers) {
    if (id === 'broth') continue;
    const [sx, sy, rot] = SPOTS[spot % SPOTS.length];
    const fn = LAYERS[id];
    if (fn) {
      ctx.save();
      ctx.translate(cx + sx * rx, cy + sy * ry);
      ctx.rotate(rot);
      fn(ctx, 120 * scale);
      ctx.restore();
    }
    spot += 1;
  }
  ctx.restore();

  // rim
  ellipse(ctx, cx, cy, rx, ry);
  ctx.strokeStyle = 'rgba(226,238,247,0.55)';
  ctx.lineWidth = 3 * scale;
  ctx.stroke();
  ellipse(ctx, cx, cy, rx * 0.99, ry * 0.99);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1.2 * scale;
  ctx.stroke();

  if (steam && layers.length > 0) drawSteam(ctx, cx, cy - ry * 0.5, scale, t);
}

/** Two slow wisps, positioned by the clock so they never jitter between frames. */
function drawSteam(ctx, cx, cy, scale, t) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i += 1) {
    const phase = (t * 0.32 + i * 0.33) % 1;
    const rise = 26 + phase * 84;
    const alpha = 0.2 * (1 - phase) * (i === 1 ? 0.8 : 1);
    ctx.strokeStyle = `rgba(255,247,230,${alpha.toFixed(3)})`;
    ctx.lineWidth = (7 - phase * 4) * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const sway = Math.sin(phase * 5 + i) * 14 * scale;
    ctx.moveTo(cx - 40 * scale + i * 34 * scale, cy - rise * 0.2 * scale);
    ctx.bezierCurveTo(
      cx - 30 * scale + i * 30 * scale + sway,
      cy - rise * 0.5 * scale,
      cx - 50 * scale + i * 30 * scale - sway,
      cy - rise * 0.9 * scale,
      cx - 34 * scale + i * 30 * scale + sway * 0.6,
      cy - rise * scale,
    );
    ctx.stroke();
  }
  ctx.restore();
}
