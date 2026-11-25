// The rules of the shift: customers arrive with tickets, the cook builds each bowl in the ticket's
// order, and a bowl only leaves the pass when it is served to the customer who asked for it.
// Pure state and arithmetic — no drawing, no DOM — so a headless run can play it forward.

import {
  INGREDIENTS,
  PATIENCE_FLOOR,
  PATIENCE_RAMP_END,
  PATIENCE_START,
  PREP_TIME,
  RECIPES,
  SEATS,
  SHIFT_SECONDS,
  START_HEARTS,
  WRONG_PENALTY,
} from './config.js';

export const EVENT_SERVED = 1;
export const EVENT_BURNED = 2;
export const EVENT_WRONG = 3;
export const EVENT_SHIFT_OVER = 4;

export const PHASE_TITLE = 'title';
export const PHASE_SHIFT = 'shift';
export const PHASE_OVER = 'over';

let nextTicketId = 1;

/** A deterministic 32-bit generator: the same seed replays the same shift, frame for frame. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The night's difficulty multiplier: forgiving at opening, tight by closing time. */
function rampFor(at) {
  const progress = Math.min(1, Math.max(0, at / SHIFT_SECONDS));
  return 1 - (1 - PATIENCE_RAMP_END) * progress;
}

/** How long a customer waits: a recipe's step count sets the base, the ramp tightens it. */
function patienceFor(recipe, rand, at) {
  const base = PATIENCE_START - recipe.steps.length * 1.4;
  return Math.max(PATIENCE_FLOOR, (base + rand() * 4 - 2) * rampFor(at));
}

/** A ticket: the recipe plus the clock it must be served before, and what a fast serve pays. */
function makeTicket(recipe, rand, at) {
  const patience = patienceFor(recipe, rand, at);
  return {
    id: nextTicketId++,
    recipe,
    patience,
    remaining: patience,
    bornAt: at,
    seat: -1,
  };
}

export class World {
  constructor(seed = 1) {
    this.seed = seed;
    this.rand = mulberry32(seed);
    this.phase = PHASE_TITLE;
    this.reset();
  }

  reset() {
    this.rand = mulberry32(this.seed);
    this.phase = PHASE_TITLE;
    this.time = 0;
    this.score = 0;
    this.hearts = START_HEARTS;
    this.served = 0;
    this.burned = 0;
    this.bowl = [];
    this.bowlStartedAt = 0;
    this.lastEvent = 0;
    this.flash = 0;
    this.prepLeft = 0;
    this.platedAt = 0;
    this.seats = new Array(SEATS).fill(null);
    this.best = 0;
    this.streak = 0;
    this.tips = 0;
  }

  start() {
    this.reset();
    this.phase = PHASE_SHIFT;
    for (let seat = 0; seat < SEATS; seat += 1) {
      this.seats[seat] = makeTicket(this.pickRecipe(), this.rand, 0);
      this.seats[seat].seat = seat;
    }
  }

  /** Early on the easy bowls come up; a third of the way in the kitchen starts reaching. */
  pickRecipe() {
    const progress = Math.min(1, this.time / SHIFT_SECONDS);
    const easy = RECIPES.filter((r) => r.steps.length <= 5);
    const pool = progress < 0.34 && this.rand() < 0.75 ? easy : RECIPES;
    return pool[Math.floor(this.rand() * pool.length) % pool.length];
  }

  /** The first step the current bowl still needs, or null when the bowl is complete. */
  expected() {
    const target = this.target();
    if (!target) return null;
    const want = target.recipe.steps;
    if (this.bowl.length >= want.length) return null;
    return want[this.bowl.length];
  }

  /** The ticket the bowl is being built for: the one whose next step matches what is in the bowl. */
  target() {
    let best = null;
    for (const ticket of this.seats) {
      if (!ticket) continue;
      const want = ticket.recipe.steps;
      let ok = this.bowl.length <= want.length;
      for (let i = 0; ok && i < this.bowl.length; i += 1) if (want[i] !== this.bowl[i]) ok = false;
      if (!ok) continue;
      if (!best || ticket.remaining < best.remaining) best = ticket;
    }
    return best;
  }

  /** True when every seat's order is complete and the bowl matches one of them exactly. */
  complete() {
    return this.seats.some(
      (t) => t && t.recipe.steps.length === this.bowl.length && t.recipe.steps.every((s, i) => s === this.bowl[i]),
    );
  }

  addIngredient(id) {
    if (this.phase !== PHASE_SHIFT) return 0;
    // The pass is busy: a crate clicked mid-prep is dropped, so timing matters as much as order.
    if (this.prepLeft > 0) return 0;
    if (this.bowl.length === 0) this.bowlStartedAt = this.time;
    const want = this.expected();
    if (want !== null && want === id) {
      this.bowl.push(id);
      this.prepLeft = PREP_TIME;
      return 0;
    }
    // A wrong crate: the bowl survives, but the customer watching loses a little patience.
    const target = this.target();
    if (target) target.remaining = Math.max(0.6, target.remaining - WRONG_PENALTY);
    this.prepLeft = PREP_TIME;
    this.flash = 0.45;
    return EVENT_WRONG;
  }

  /** 0..1 — how much of the current prep is done, for the station's progress ring. */
  get prepProgress() {
    return PREP_TIME > 0 ? 1 - Math.max(0, this.prepLeft) / PREP_TIME : 1;
  }

  clearBowl() {
    this.bowl = [];
  }

  serve() {
    if (this.phase !== PHASE_SHIFT || this.bowl.length === 0) return 0;
    const seatIndex = this.seats.findIndex(
      (t) => t && t.recipe.steps.length === this.bowl.length && t.recipe.steps.every((s, i) => s === this.bowl[i]),
    );
    if (seatIndex === -1) {
      // Nothing on the board wants this bowl: it goes in the bin, and the streak with it.
      this.bowl = [];
      this.streak = 0;
      this.flash = 0.45;
      return EVENT_WRONG;
    }
    const ticket = this.seats[seatIndex];
    const speed = ticket.remaining / ticket.patience;
    const tip = Math.round(ticket.recipe.price * (0.35 + speed * 0.9));
    const bonus = this.streak >= 3 ? 5 : 0;
    this.tips += tip;
    this.score += ticket.recipe.price + tip + bonus;
    this.served += 1;
    this.streak += 1;
    this.bowl = [];
    this.bowlStartedAt = this.time;
    this.seats[seatIndex] = makeTicket(this.pickRecipe(), this.rand, this.time);
    this.seats[seatIndex].seat = seatIndex;
    this.flash = 0.3;
    return EVENT_SERVED;
  }

  /** Advance the shift by `dt` seconds. `held` is unused by the rules but keeps the signature stable. */
  step(dt) {
    if (this.phase === PHASE_TITLE) {
      this.time += dt;
      return 0;
    }
    if (this.phase !== PHASE_SHIFT) return 0;

    this.time += dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt);
    if (this.prepLeft > 0) this.prepLeft = Math.max(0, this.prepLeft - dt);
    let events = 0;

    for (let seat = 0; seat < this.seats.length; seat += 1) {
      const ticket = this.seats[seat];
      if (!ticket) continue;
      ticket.remaining -= dt;
      if (ticket.remaining > 0) continue;

      // The customer gives up: a heart goes, and someone else sits down in their place.
      this.hearts -= 1;
      this.burned += 1;
      this.streak = 0;
      events |= EVENT_BURNED;
      this.seats[seat] = makeTicket(this.pickRecipe(), this.rand, this.time);
      this.seats[seat].seat = seat;
      if (this.hearts <= 0) {
        this.hearts = 0;
        this.phase = PHASE_OVER;
        this.best = Math.max(this.best, this.score);
        return events | EVENT_SHIFT_OVER;
      }
    }

    if (this.time >= SHIFT_SECONDS) {
      this.phase = PHASE_OVER;
      this.best = Math.max(this.best, this.score);
      return events | EVENT_SHIFT_OVER;
    }
    return events;
  }

  get clockLeft() {
    return Math.max(0, SHIFT_SECONDS - this.time);
  }

  /** The ingredient list a seat wants, for the renderer. */
  static ingredient(id) {
    return INGREDIENTS.find((i) => i.id === id) || INGREDIENTS[0];
  }
}
