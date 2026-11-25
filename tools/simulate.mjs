// A model cook, used only to tune the rules. It reads the pass the way a player does: the game shows
// which crate the current bowl wants next, so the cook presses that key, and serves when the bowl is
// done. Its reaction time is the parameter under test — a good human sits near 0.35s a press.

import { World } from '../game/src/world.js';

const STEP = 1 / 60;

export function simulate(reaction, seed = 3, strategy = 'hint') {
  const world = new World(seed);
  world.start();
  let guard = 0;
  let cool = 0;
  let wasted = 0;

  while (world.phase === 'shift' && guard < 120000) {
    cool -= STEP;
    if (cool <= 0) {
      if (world.complete()) {
        world.serve();
      } else {
        const want = world.expected();
        if (want !== null) {
          const before = world.bowl.length;
          const got = world.addIngredient(want);
          if (!got || world.bowl.length === before) wasted += 1;
        }
      }
      cool = reaction;
    }
    world.step(STEP);
    guard += 1;
  }

  return {
    served: world.served,
    burned: world.burned,
    hearts: world.hearts,
    score: world.score,
    ended: world.phase === 'over',
    survived: Math.round(world.time),
    wasted,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const reaction of [0.10, 0.20, 0.28, 0.34, 0.40, 0.55, 0.80]) {
    const runs = [3, 11, 29, 47, 61].map((s) => simulate(reaction, s));
    const mean = (k) => Math.round(runs.reduce((a, r) => a + r[k], 0) / runs.length);
    console.log(
      `reaction ${reaction.toFixed(2)}s -> served ${mean('served')}, burned ${mean('burned')}, ` +
        `score ${mean('score')}, survived ${mean('survived')}s, ` +
        `hearts ${runs.map((r) => r.hearts).join('/')}`,
    );
  }
}
