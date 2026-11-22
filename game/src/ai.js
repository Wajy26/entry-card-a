// TIDEBREAK — Blackbeard, the AI opponent. A greedy lane reader: it scores
// every affordable card in every lane, prefers winning a lane it can take or
// blocking a lane it would lose, and spends what it can each turn.
// `skill` 1.0 plays its best move; lower skill sometimes plays at random.
import { enemyPlayCard, lanePower } from './state.js';

export function enemyAct(game, skill = 1.0) {
  const enemy = game.enemy;
  let budget = game.maxDoubloons; // the AI shares the player's doubloon economy
  let guard = 0;
  while (guard < 12) {
    guard += 1;
    const options = [];
    for (let h = 0; h < enemy.hand.length; h += 1) {
      const card = enemy.hand[h];
      if (card.cost > budget) continue;
      for (let lane = 0; lane < 3; lane += 1) {
        options.push({ handIndex: h, lane, score: scorePlay(game, card, lane) });
      }
    }
    if (options.length === 0) break;
    options.sort((a, b) => b.score - a.score);
    const pick =
      game.random() < skill ? options[0] : options[Math.floor(game.random() * options.length)];
    if (pick.score < -2 && game.random() < 0.8) break; // a bad play is worse than none
    const card = enemy.hand[pick.handIndex];
    budget -= card.cost;
    enemyPlayCard(game, pick.handIndex, pick.lane);
  }
}

function scorePlay(game, card, lane) {
  const mine = lanePower(game.enemy.lanes[lane]);
  const theirs = lanePower(game.player.lanes[lane]);
  const afterMine = mine + card.power + (sharesSuit(game.enemy.lanes[lane], card) ? 1 : 0);
  let score = card.power * 2 - card.cost;
  if (mine <= theirs && afterMine > theirs) score += 6; // flips a losing lane
  if (mine > theirs && afterMine > theirs) score += 2; // widens a lead
  if (card.effect === 'bomb' && game.player.lanes[lane].length > 0) score += 5;
  if (card.effect === 'rally') score += 3;
  if (card.effect === 'draw') score += 2;
  return score;
}

function sharesSuit(laneCards, card) {
  return laneCards.some((c) => c.suit === card.suit);
}
