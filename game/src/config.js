// Midnight Ramen — layout and content constants.
// Every panel rectangle the renderer paints is also the rectangle the hit-tester reads, so a click
// always lands on the station it looks like it hits. Nothing here touches the DOM or the clock.

export const VIEW = { width: 1280, height: 720 };
export const HEADER_H = 84;

export const BOARD = { x: 20, y: 100, w: 380, h: 600 };
export const KITCHEN = { x: 416, y: 100, w: 468, h: 600 };
export const PLATE = { x: 900, y: 100, w: 360, h: 600 };

export const SHIFT_SECONDS = 150;
export const START_HEARTS = 3;
export const SEATS = 3;

/** Ingredient ids double as station order: the crate at index i is INGREDIENTS[i]. */
export const INGREDIENTS = [
  { id: 'noodles', name: 'Noodles', key: '1', tint: '#f4d79b' },
  { id: 'broth', name: 'Broth', key: '2', tint: '#d09250' },
  { id: 'egg', name: 'Egg', key: '3', tint: '#ffd45e' },
  { id: 'nori', name: 'Nori', key: '4', tint: '#2e4a3d' },
  { id: 'scallion', name: 'Scallion', key: '5', tint: '#86c46c' },
  { id: 'chashu', name: 'Chashu', key: '6', tint: '#c2664c' },
];

export const STATION = { x: 440, y: 300, w: 140, h: 112, gapX: 16, gapY: 12, cols: 3 };

export function stationRect(index) {
  const col = index % STATION.cols;
  const row = Math.floor(index / STATION.cols);
  return {
    x: STATION.x + col * (STATION.w + STATION.gapX),
    y: STATION.y + row * (STATION.h + STATION.gapY),
    w: STATION.w,
    h: STATION.h,
  };
}

export const TICKET = { x: 40, y: 170, w: 340, h: 150, gap: 18 };

export function ticketRect(seat) {
  return { x: TICKET.x, y: TICKET.y + seat * (TICKET.h + TICKET.gap), w: TICKET.w, h: TICKET.h };
}

export const BOWL = { x: 1080, y: 352, rx: 132, ry: 48 };
export const SERVE_BTN = { x: 958, y: 588, w: 244, h: 64 };
export const PLATE_C = { x: 1080, y: 430, rx: 156, ry: 92 };

/** The bowls the kitchen serves. Sequence order is the order the cook must build them in. */
export const RECIPES = [
  { name: 'Shoyu Classic', steps: ['broth', 'noodles', 'chashu', 'egg', 'nori', 'scallion'], price: 14 },
  { name: 'Spicy Miso', steps: ['broth', 'noodles', 'scallion', 'chashu', 'egg'], price: 13 },
  { name: 'Midnight Shio', steps: ['broth', 'noodles', 'egg', 'nori', 'scallion'], price: 12 },
  { name: 'Double Chashu', steps: ['broth', 'noodles', 'chashu', 'chashu', 'egg', 'nori'], price: 16 },
  { name: 'Herb Garden', steps: ['broth', 'noodles', 'scallion', 'nori', 'egg', 'scallion'], price: 12 },
  { name: "Chef's Special", steps: ['noodles', 'broth', 'egg', 'chashu', 'scallion', 'nori', 'egg'], price: 18 },
];

export const PATIENCE_START = 30;
export const PATIENCE_FLOOR = 19;
export const WRONG_PENALTY = 4;

/**
 * Seconds the pass is busy after each ingredient lands. The cook cannot stack the next crate until
 * the station is free again — this is what makes a bowl a six-second job rather than a six-click one,
 * and it is the only reason a busy night can outrun a good cook.
 */
export const PREP_TIME = 0.32;

export const COLORS = {
  ink: '#161311',
  wall: '#2b211d',
  wallTile: '#372a24',
  grout: '#241a17',
  wood: '#8a5a35',
  woodDark: '#5d3a22',
  woodLight: '#a97a4d',
  chalk: '#1f2a26',
  paper: '#f3e6c9',
  cream: '#f7ecd2',
  brass: '#d9a44c',
  red: '#c0392b',
  green: '#4f9d63',
};
