// TIDEBREAK — the rules. Pure game logic, no DOM: the same module runs in
// the browser and in Node, so headless play-tests drive the real game.
import { buildDeck } from './cards.js';

export const LANES = ['Port', 'Mid', 'Starboard'];
export const START_HULL = 20;
export const MAX_DOUBLOONS = 8;
export const HAND_LIMIT = 7;
export const MAX_TURNS = 30;

/** Small deterministic RNG (mulberry32) so shots and tests replay exactly. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh game. `seed` drives deck order and the AI's tie-breaks. */
export function createGame(seed = 1) {
  const random = mulberry32(seed);
  const game = {
    seed,
    random,
    turn: 1,
    phase: 'title', // title | play | win | loss
    doubloons: 1,
    maxDoubloons: 1,
    log: ['Welcome aboard, Captain. Break the tide!'],
    player: { hull: START_HULL, deck: buildDeck(random), hand: [], lanes: [[], [], []] },
    enemy: { hull: START_HULL, deck: buildDeck(random), hand: [], lanes: [[], [], []] },
  };
  for (let i = 0; i < 4; i += 1) drawCard(game, 'player');
  for (let i = 0; i < 4; i += 1) drawCard(game, 'enemy');
  return game;
}

export function drawCard(game, side) {
  const who = game[side];
  if (who.deck.length === 0 || who.hand.length >= HAND_LIMIT) return null;
  const card = who.deck.pop();
  who.hand.push(card);
  return card;
}

/** Power of one side in a lane, with the suit-synergy bonus (+1 per card when
 *  two or more cards in the lane share a suit). */
export function lanePower(cards) {
  let power = 0;
  const suits = {};
  for (const card of cards) {
    power += card.power;
    suits[card.suit] = (suits[card.suit] || 0) + 1;
  }
  for (const suit of Object.keys(suits)) {
    if (suits[suit] >= 2) power += suits[suit];
  }
  return power;
}

export function canPlay(game, handIndex, lane) {
  if (game.phase !== 'play') return false;
  const card = game.player.hand[handIndex];
  if (!card || lane < 0 || lane > 2) return false;
  return card.cost <= game.doubloons;
}

/** Play a hand card into a lane. Returns the played card, or null. */
export function playCard(game, handIndex, lane) {
  if (!canPlay(game, handIndex, lane)) return null;
  const card = game.player.hand.splice(handIndex, 1)[0];
  game.doubloons -= card.cost;
  game.player.lanes[lane].push(card);
  applyEffect(game, 'player', card, lane);
  game.log.push(`You played ${card.name} to ${LANES[lane]}.`);
  return card;
}

/** The enemy plays one card (used by the AI module). */
export function enemyPlayCard(game, handIndex, lane) {
  const card = game.enemy.hand.splice(handIndex, 1)[0];
  if (!card) return null;
  game.enemy.lanes[lane].push(card);
  applyEffect(game, 'enemy', card, lane);
  game.log.push(`Blackbeard played ${card.name} to ${LANES[lane]}.`);
  return card;
}

function applyEffect(game, side, card, lane) {
  const foe = side === 'player' ? 'enemy' : 'player';
  if (card.effect === 'draw') {
    for (let i = 0; i < card.effectN; i += 1) drawCard(game, side);
  } else if (card.effect === 'plunder' && side === 'player') {
    game.doubloons = Math.min(MAX_DOUBLOONS, game.doubloons + 1);
  } else if (card.effect === 'bomb') {
    const foes = game[foe].lanes[lane];
    if (foes.length > 0) {
      let weakest = 0;
      for (let i = 1; i < foes.length; i += 1) {
        if (foes[i].power < foes[weakest].power) weakest = i;
      }
      const sunk = foes.splice(weakest, 1)[0];
      game.log.push(`${card.name} sank the enemy ${sunk.name}!`);
    }
  } else if (card.effect === 'rally') {
    for (const ally of game[side].lanes[lane]) ally.power += 2;
  }
}

/** End the player's turn: the enemy acts, the lanes clash, a new turn starts. */
export function endTurn(game, enemyAct) {
  if (game.phase !== 'play') return;
  enemyAct(game);
  clash(game);
  if (game.phase !== 'play') return;
  game.turn += 1;
  if (game.turn > MAX_TURNS) {
    game.phase = game.player.hull >= game.enemy.hull ? 'win' : 'loss';
    game.log.push('The tide turns — most hull afloat wins!');
    return;
  }
  game.maxDoubloons = Math.min(MAX_DOUBLOONS, game.turn);
  game.doubloons = game.maxDoubloons;
  drawCard(game, 'player');
  drawCard(game, 'enemy');
  game.log.push(`— Turn ${game.turn}: ${game.doubloons} doubloons —`);
}

/** Resolve all three lanes: the stronger side deals the difference as hull damage. */
export function clash(game) {
  for (let lane = 0; lane < 3; lane += 1) {
    const mine = lanePower(game.player.lanes[lane]);
    const theirs = lanePower(game.enemy.lanes[lane]);
    if (mine > theirs) {
      game.enemy.hull -= mine - theirs;
      game.log.push(`${LANES[lane]} is yours! ${mine - theirs} damage to Blackbeard.`);
    } else if (theirs > mine) {
      game.player.hull -= theirs - mine;
      game.log.push(`${LANES[lane]} falls! You take ${theirs - mine} damage.`);
    } else if (mine > 0) {
      game.log.push(`${LANES[lane]} holds even — no damage.`);
    }
  }
  game.player.lanes = [[], [], []];
  game.enemy.lanes = [[], [], []];
  if (game.enemy.hull <= 0 && game.player.hull <= 0) {
    game.phase = game.player.hull >= game.enemy.hull ? 'win' : 'loss';
  } else if (game.enemy.hull <= 0) {
    game.phase = 'win';
  } else if (game.player.hull <= 0) {
    game.phase = 'loss';
  }
  if (game.phase === 'win') game.log.push('VICTORY! Blackbeard surrenders the tide!');
  if (game.phase === 'loss') game.log.push('DEFEAT — your ship goes down with the tide.');
}

export function startGame(game) {
  game.phase = 'play';
  game.log.push('Turn 1: play cards, then END TURN to clash.');
}
