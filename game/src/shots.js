// TIDEBREAK — the screenshot scenes behind ?shot=title|battle|win|loss.
// Each scene plays the real rules forward from a fresh seeded game with a
// simple autopilot, so every frame is what a real game looks like and the
// same seed always gives the same frame.
import { createGame, startGame, playCard, endTurn } from './state.js';
import { enemyAct } from './ai.js';

/** Pick the best affordable card for the autopilot's side, or -1 to pass. */
function autopilotPick(game, side, skill) {
  const who = game[side];
  const foe = side === 'player' ? game.enemy : game.player;
  let best = null;
  for (let h = 0; h < who.hand.length; h += 1) {
    const card = who.hand[h];
    if (side === 'player' && card.cost > game.doubloons) continue;
    for (let lane = 0; lane < 3; lane += 1) {
      const mine = lanePowerOf(who.lanes[lane]);
      const theirs = lanePowerOf(foe.lanes[lane]);
      let score = card.power * 2 - card.cost;
      if (mine <= theirs && mine + card.power > theirs) score += 6;
      if (card.effect === 'bomb' && foe.lanes[lane].length > 0) score += 5;
      if (card.effect === 'rally') score += 3;
      if (card.effect === 'draw') score += 2;
      if (!best || score > best.score) best = { handIndex: h, lane, score };
    }
  }
  if (!best) return null;
  if (skill < 1 && game.random() > skill) return null; // a weak pilot passes up plays
  return best;
}

function lanePowerOf(cards) {
  let power = 0;
  const suits = {};
  for (const card of cards) {
    power += card.power;
    suits[card.suit] = (suits[card.suit] || 0) + 1;
  }
  for (const suit of Object.keys(suits)) if (suits[suit] >= 2) power += suits[suit];
  return power;
}

/** Play one full player turn with the autopilot, then end it. */
function autopilotTurn(game, playerSkill) {
  let guard = 0;
  while (guard < 10) {
    guard += 1;
    const pick = autopilotPick(game, 'player', playerSkill);
    if (!pick) break;
    if (!playCard(game, pick.handIndex, pick.lane)) break;
  }
  endTurn(game, (g) => enemyAct(g, 1.0));
}

/**
 * Set `game` to the named scene and return the phase to draw.
 * title: fresh game on the title screen.
 * battle: a mid-game table after several fought turns.
 * win: play until the player wins. loss: play until the player loses.
 */
export function stageShot(name, seed) {
  const game = createGame(seed);
  if (name !== 'battle' && name !== 'win' && name !== 'loss') {
    return game; // title screen, fresh game
  }
  startGame(game);
  if (name === 'battle') {
    // Five fought turns, then a sixth turn played out on the table but not
    // yet clashed, so the frame shows cards in the lanes mid-decision.
    for (let i = 0; i < 5 && game.phase === 'play'; i += 1) autopilotTurn(game, 1.0);
    let guard = 0;
    while (guard < 10) {
      guard += 1;
      const pick = autopilotPick(game, 'player', 1.0);
      if (!pick) break;
      if (!playCard(game, pick.handIndex, pick.lane)) break;
    }
    enemyAct(game, 1.0);
    return game;
  }
  const playerSkill = name === 'win' ? 1.0 : 0.0;
  const enemySkill = name === 'win' ? 0.0 : 1.0;
  let guard = 0;
  while (game.phase === 'play' && guard < 40) {
    guard += 1;
    let inner = 0;
    while (inner < 10) {
      inner += 1;
      const pick = autopilotPick(game, 'player', playerSkill);
      if (!pick) break;
      if (!playCard(game, pick.handIndex, pick.lane)) break;
    }
    endTurn(game, (g) => enemyAct(g, enemySkill));
  }
  return game;
}
