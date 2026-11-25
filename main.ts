// Midnight Ramen — the hand-in program (Node 22, standard library only).
//
// The game itself is game/: plain static files a desktop browser opens offline, with no build step
// and no network request. This program does one job only — it packs the entry the way the bounty's
// gate reads it: game/ and screenshots/ copied into /output, and /output/dossier.json written by the
// vendored make.fun library, which is the exact file the scorer rebuilds and compares byte for byte.
//
// Outside the grader's container MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Play it locally with `node serve.ts` and open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');

/** The gate's own caps (reference/gate.json), passed through so the dossier is the scorer's file. */
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

/** Fail loudly before the gate does: a missing game/ or a screenshot count outside 3..4 is fatal. */
function preflight() {
  if (!existsSync(join(gameDir, 'index.html'))) {
    throw new Error('game/index.html is missing: the entry has no page to open');
  }
  const shots = existsSync(shotsDir)
    ? readdirSync(shotsDir).filter((name) => !name.startsWith('.')).sort()
    : [];
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`screenshots/ holds ${shots.length} images; the gate wants 3 or 4`);
  }
  return shots;
}

/** Copy a directory into /output as a fresh tree, so a stale run can never leave stray files. */
function copyInto(source: string, target: string) {
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
}

function main() {
  const shots = preflight();
  mkdirSync(out, { recursive: true });
  copyInto(gameDir, join(out, 'game'));
  copyInto(shotsDir, join(out, 'screenshots'));

  writeFileSync(join(out, 'dossier.json'), buildDossier(out, CAPS));

  // The grader reads nothing from stdout, but a local run should say what it handed in.
  process.stdout.write(`packed game/ and ${shots.length} screenshots into ${out}\n`);
  process.stdout.write(`cover: ${shots[0]}\n`);
}

main();
