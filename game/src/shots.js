// The three scenes behind ?shot=start|play|end. Each one plays the real rules forward from a fresh
// world with a simple cook's autopilot (read the tickets, follow the shortest one, serve when it is
// done), so every screenshot is a frame a real shift really reaches with that seed.

import { PHASE_OVER, PHASE_SHIFT, World } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { RECIPES } from './config.js';

const STEP = 1 / 60;

/** Which ticket the cook works on: the one closest to walking out. */
function pickSeat(world) {
  let pick = null;
  for (const ticket of world.seats) {
    if (!ticket) continue;
    if (!pick || ticket.remaining < pick.remaining) pick = ticket;
  }
  return pick;
}

/**
 * Put `world` into the named scene and hand back the screen to draw and the frame's clock.
 * `start` shows the title over a slowly warming shop; `play` is a shift in full swing with a bowl
 * half built; `end` is the same shift played until the customers win.
 */
export function stageShot(name, world, seed) {
  world.seed = seed;
  world.start();

  if (name === 'start') {
    world.phase = 'title';
    world.time = 2.4;
    return { screen: SCREEN_TITLE, world };
  }

  // Play the shift with the autopilot. `stopAfter` lets a scene freeze mid-service.
  const stopAfter = name === 'play' ? 58 : name === 'ready' ? 46 : 100000;
  let guard = 0;
  while (world.phase === PHASE_SHIFT && world.time < stopAfter && guard < 20000) {
    guard += 1;
    const ticket = pickSeat(world);
    if (ticket) {
      const want = ticket.recipe.steps;
      if (world.bowl.length === 0 || world.target() !== ticket) {
        // switching bowls: scrap what is in the pass and start the urgent one
        let prefixOk = world.bowl.length <= want.length && world.bowl.every((s, i) => s === want[i]);
        if (!prefixOk) world.clearBowl();
      }
      const next = want[world.bowl.length];
      if (next !== undefined && world.expected() === next && world.prepLeft <= 0) {
        world.addIngredient(next);
      }
      if (world.complete()) world.serve();
    }
    world.step(STEP);
  }

  if (name === 'play') {
    // Leave a dish mid-assembly: most of a bowl in the pass and a fresh ticket on the board.
    const ticket = pickSeat(world);
    if (ticket) {
      const want = ticket.recipe.steps;
      world.clearBowl();
      let guard3 = 0;
      while (world.bowl.length < Math.min(4, want.length) && guard3 < 600) {
        guard3 += 1;
        world.addIngredient(want[world.bowl.length]);
        world.step(STEP);
      }
    }
    return { screen: SCREEN_PLAY, world };
  }

  if (name === 'ready') {
    // A finished bowl on the pass with SERVE lit: the frame a cook serves from.
    const ticket = pickSeat(world);
    if (ticket) {
      const want = ticket.recipe.steps;
      world.clearBowl();
      let guard2 = 0;
      while (world.bowl.length < want.length && guard2 < 600) {
        guard2 += 1;
        if (world.expected() === want[world.bowl.length]) world.addIngredient(want[world.bowl.length]);
        world.step(STEP);
      }
    }
    return { screen: SCREEN_PLAY, world };
  }

  return { screen: world.phase === PHASE_OVER ? SCREEN_OVER : SCREEN_PLAY, world };
}

/** A recipe name for the dossier: the busiest bowl on the board, used to caption a screenshot. */
export function busiestRecipe(world) {
  let best = RECIPES[0];
  for (const ticket of world.seats) {
    if (ticket && ticket.recipe.steps.length > best.steps.length) best = ticket.recipe;
  }
  return best;
}
