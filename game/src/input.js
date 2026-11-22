// TIDEBREAK — mouse and keyboard. Click a hand card, then a lane; click END
// TURN (or Space) to clash. Keys 1–7 pick a card, ←/→ pick a lane, Enter
// plays it, Enter starts the game, R sails again after a win or a loss.
import { VIEW_W, VIEW_H } from './render.js';

const HAND_Y = 612;
const HAND_H = 164;
const CARD_W = 118;
const LANE_X = [110, 475, 840];
const LANE_Y = 268;
const LANE_W = 330;
const LANE_H = 216;

export function createUI() {
  return {
    selectedCard: -1,
    hoverLane: -1,
    endTurnRect: { x: 1060, y: 556, w: 160, h: 44 },
    startRect: { x: 490, y: 610, w: 300, h: 56 },
    againRect: { x: 490, y: 480, w: 300, h: 56 },
  };
}

function toGameCoords(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * VIEW_W,
    y: ((clientY - rect.top) / rect.height) * VIEW_H,
  };
}

function handIndexAt(game, x, y) {
  if (y < HAND_Y || y > HAND_Y + HAND_H) return -1;
  const n = game.player.hand.length;
  const totalW = n * (CARD_W + 10) - 10;
  const startX = (VIEW_W - totalW) / 2;
  if (x < startX || x > startX + totalW) return -1;
  const i = Math.floor((x - startX) / (CARD_W + 10));
  return i < n ? i : -1;
}

function laneAt(x, y) {
  if (y < LANE_Y || y > LANE_Y + LANE_H) return -1;
  for (let lane = 0; lane < 3; lane += 1) {
    if (x >= LANE_X[lane] && x <= LANE_X[lane] + LANE_W) return lane;
  }
  return -1;
}

function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/** Wire canvas clicks and key presses to the game. `actions` is { start, play, endTurn, restart }. */
export function attachInput(canvas, game, ui, actions) {
  canvas.addEventListener('click', (event) => {
    const { x, y } = toGameCoords(canvas, event.clientX, event.clientY);
    if (game.phase === 'title') {
      if (inside(ui.startRect, x, y)) actions.start();
      return;
    }
    if (game.phase === 'win' || game.phase === 'loss') {
      if (inside(ui.againRect, x, y)) actions.restart();
      return;
    }
    if (inside(ui.endTurnRect, x, y)) {
      actions.endTurn();
      return;
    }
    const hand = handIndexAt(game, x, y);
    if (hand >= 0) {
      ui.selectedCard = ui.selectedCard === hand ? -1 : hand;
      return;
    }
    const lane = laneAt(x, y);
    if (lane >= 0 && ui.selectedCard >= 0) {
      actions.play(ui.selectedCard, lane);
      ui.selectedCard = -1;
    }
  });

  canvas.addEventListener('mousemove', (event) => {
    const { x, y } = toGameCoords(canvas, event.clientX, event.clientY);
    ui.hoverLane = laneAt(x, y);
  });

  window.addEventListener('keydown', (event) => {
    if (game.phase === 'title' && (event.key === 'Enter' || event.key === ' ')) {
      actions.start();
      return;
    }
    if ((game.phase === 'win' || game.phase === 'loss') && (event.key === 'r' || event.key === 'R' || event.key === 'Enter')) {
      actions.restart();
      return;
    }
    if (game.phase !== 'play') return;
    if (event.key >= '1' && event.key <= '7') {
      const i = Number(event.key) - 1;
      if (i < game.player.hand.length) ui.selectedCard = ui.selectedCard === i ? -1 : i;
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      ui.hoverLane = ui.hoverLane < 0 ? 1 : (ui.hoverLane + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
      return;
    }
    if (event.key === 'Enter' && ui.selectedCard >= 0 && ui.hoverLane >= 0) {
      actions.play(ui.selectedCard, ui.hoverLane);
      ui.selectedCard = -1;
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
      actions.endTurn();
    }
  });
}
