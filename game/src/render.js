// TIDEBREAK — the table. Every screen is drawn on one canvas: the title,
// the battle table, and the win / loss screens. Suits are colour + shape,
// so a card reads at thumbnail size.
import { SUITS } from './cards.js';
import { LANES, START_HULL, lanePower } from './state.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;
const CARD_W = 118;
const CARD_H = 164;
const LANE_X = [110, 475, 840];
const LANE_W = 330;
const LANE_Y = 268;
const LANE_H = 216;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hullBar(ctx, x, y, w, hull, label, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, x - 4, y - 4, w + 8, 34, 8);
  ctx.fill();
  ctx.fillStyle = '#20242e';
  ctx.fillRect(x, y, w, 26);
  const frac = Math.max(0, hull / START_HULL);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * frac, 26);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${label}  ${Math.max(0, hull)} / ${START_HULL} HULL`, x + w / 2, y + 14);
}

/** Draw one suit's glyph, centred at (cx, cy) with radius r. */
export function drawSuit(ctx, suit, cx, cy, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, r / 5);
  ctx.lineCap = 'round';
  if (suit === 'anchor') {
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.62, r * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.45);
    ctx.lineTo(cx, cy + r * 0.7);
    ctx.moveTo(cx - r * 0.55, cy - r * 0.2);
    ctx.lineTo(cx + r * 0.55, cy - r * 0.2);
    ctx.moveTo(cx - r * 0.7, cy + r * 0.35);
    ctx.quadraticCurveTo(cx - r * 0.7, cy + r * 0.85, cx, cy + r * 0.7);
    ctx.moveTo(cx + r * 0.7, cy + r * 0.35);
    ctx.quadraticCurveTo(cx + r * 0.7, cy + r * 0.85, cx, cy + r * 0.7);
    ctx.stroke();
  } else if (suit === 'wave') {
    ctx.beginPath();
    for (let i = -2; i <= 2; i += 1) {
      const x = cx + (i * r) / 2;
      const y = cy + Math.sin(i * 1.4) * r * 0.28 + (i === 0 ? 0 : r * 0.18);
      if (i === -2) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let i = -2; i <= 2; i += 1) {
      const x = cx + (i * r) / 2;
      const y = cy + r * 0.45 + Math.sin(i * 1.4 + 1) * r * 0.22;
      if (i === -2) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else if (suit === 'cannon') {
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.15, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.3, cy - r * 0.1);
    ctx.lineTo(cx + r * 0.9, cy - r * 0.55);
    ctx.lineWidth = r * 0.34;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + r * 0.95, cy - r * 0.6, r * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd76a';
    ctx.fill();
  } else {
    // compass: an eight-point star
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.38;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
  ctx.restore();
}

function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const suit = SUITS[card.suit];
  ctx.save();
  if (opts.selected) {
    ctx.shadowColor = '#ffd76a';
    ctx.shadowBlur = 22;
  }
  ctx.fillStyle = opts.afford === false ? '#5a5348' : '#f7ead0';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = opts.selected ? '#ffd76a' : '#3a2c1a';
  ctx.lineWidth = opts.selected ? 4 : 2;
  ctx.stroke();
  // suit band (name shifted right so the cost coin never covers it)
  ctx.fillStyle = suit.color;
  roundRect(ctx, x + 5, y + 5, w - 10, 26, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(suit.name.toUpperCase(), x + w / 2 + 10, y + 19);
  // suit glyph (scaled to the card size) and name, kept clear of each other
  const glyphR = h > 120 ? 26 : 15;
  drawSuit(ctx, card.suit, x + w / 2, y + h * 0.42, glyphR, suit.dark);
  // name
  ctx.fillStyle = '#241a10';
  ctx.font = 'bold 13px Georgia, serif';
  wrapText(ctx, card.name, x + w / 2, y + h * 0.70, w - 12, 15);
  // cost coin
  ctx.fillStyle = '#e8a13c';
  ctx.beginPath();
  ctx.arc(x + 17, y + 17, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a5a14';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#241a10';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(String(card.cost), x + 17, y + 18);
  // power
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.arc(x + w - 17, y + h - 17, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText(String(card.power), x + w - 17, y + h - 16);
  // effect line (full-size cards only — lane cards are too small for it)
  if (card.effect !== 'none' && h > 120) {
    ctx.fillStyle = '#5b4632';
    ctx.font = 'italic 11px Georgia, serif';
    const label =
      card.effect === 'draw' ? `Draw ${card.effectN}` :
      card.effect === 'bomb' ? 'Sinks weakest foe' :
      card.effect === 'rally' ? 'Crew +2 in lane' : '+1 doubloon';
    ctx.fillText(label, x + w / 2, y + h - 34);
  }
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  ctx.fillStyle = '#274b63';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 2;
  roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 7);
  ctx.stroke();
  drawSuit(ctx, 'anchor', x + w / 2, y + h / 2, 22, '#ffd76a');
}

function wrapText(ctx, text, cx, y, maxW, lineH) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineH) / 2;
  for (let i = 0; i < lines.length; i += 1) ctx.fillText(lines[i], cx, startY + i * lineH);
}

function drawOcean(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#0b2a4a');
  g.addColorStop(0.55, '#0e4a6b');
  g.addColorStop(1, '#082a44');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 3;
  for (let row = 0; row < 5; row += 1) {
    ctx.beginPath();
    for (let x = 0; x <= VIEW_W; x += 16) {
      const y = 60 + row * 170 + Math.sin(x / 90 + row * 2) * 10;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawTable(ctx, game, ui) {
  // wooden table
  ctx.fillStyle = '#6b4423';
  roundRect(ctx, 40, 210, VIEW_W - 80, 330, 18);
  ctx.fill();
  ctx.fillStyle = '#7d5230';
  roundRect(ctx, 48, 218, VIEW_W - 96, 314, 14);
  ctx.fill();
  // lanes
  for (let lane = 0; lane < 3; lane += 1) {
    const x = LANE_X[lane];
    const hot = ui.selectedCard >= 0 && ui.hoverLane === lane;
    ctx.fillStyle = hot ? 'rgba(255,215,106,0.28)' : 'rgba(0,0,0,0.22)';
    roundRect(ctx, x, LANE_Y, LANE_W, LANE_H, 12);
    ctx.fill();
    ctx.fillStyle = '#ffe9b8';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(LANES[lane].toUpperCase(), x + LANE_W / 2, LANE_Y - 12);
    // lane powers
    const mine = lanePower(game.player.lanes[lane]);
    const theirs = lanePower(game.enemy.lanes[lane]);
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillStyle = mine > theirs ? '#8dff9e' : mine < theirs ? '#ff9a8a' : '#ffe9b8';
    ctx.fillText(`You ${mine}  —  ${theirs} Foe`, x + LANE_W / 2, LANE_Y + LANE_H + 20);
    // enemy cards (top half of the lane), player cards (bottom half)
    game.enemy.lanes[lane].forEach((card, i) => {
      drawCardFace(ctx, card, x + 14 + i * 100, LANE_Y + 12, 92, 96, {});
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.restore();
    });
    game.player.lanes[lane].forEach((card, i) => {
      drawCardFace(ctx, card, x + 14 + i * 100, LANE_Y + 112, 92, 96, {});
    });
  }
}

function drawHands(ctx, game, ui) {
  // opponent: face-down hand + name + hull
  ctx.fillStyle = '#ffe9b8';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('☠  BLACKBEARD', 60, 48);
  hullBar(ctx, 330, 32, 420, game.enemy.hull, 'BLACKBEARD', '#c0392b');
  ctx.fillStyle = '#cfe6ff';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`Turn ${game.turn}  ·  ${game.enemy.hand.length} cards in hand  ·  ${game.enemy.deck.length} left in deck`, 790, 48);
  game.enemy.hand.forEach((_, i) => {
    drawCardBack(ctx, 60 + i * 34, 70, 30, 44);
  });
  // player hand
  const n = game.player.hand.length;
  const totalW = n * (CARD_W + 10) - 10;
  let x = (VIEW_W - totalW) / 2;
  game.player.hand.forEach((card, i) => {
    const y = ui.selectedCard === i ? 596 : 612;
    drawCardFace(ctx, card, x, y, CARD_W, CARD_H, {
      selected: ui.selectedCard === i,
      afford: card.cost <= game.doubloons,
    });
    x += CARD_W + 10;
  });
  // player hull + doubloons + end turn
  hullBar(ctx, 60, 556, 300, game.player.hull, 'YOU', '#2fb3a3');
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(420, 573, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#241a10';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(game.doubloons), 420, 574);
  ctx.fillStyle = '#ffe9b8';
  ctx.font = '15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('doubloons', 448, 578);
  // END TURN button
  const btn = ui.endTurnRect;
  ctx.fillStyle = '#e8a13c';
  roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#8a5a14';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#241a10';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('END TURN  ⏎', btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
  // log — last two lines, under the enemy hand
  ctx.fillStyle = '#d7ecff';
  ctx.font = 'italic 15px Georgia, serif';
  ctx.textAlign = 'left';
  const lines = game.log.slice(-2);
  lines.forEach((line, i) => ctx.fillText(line, 60, 152 + i * 22));
}

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(4,18,32,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // big flag
  ctx.fillStyle = '#1a1a22';
  roundRect(ctx, 340, 108, 600, 210, 16);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 92px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('TIDEBREAK', VIEW_W / 2, 210);
  ctx.fillStyle = '#ffe9b8';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('A pirate lane-battle card game', VIEW_W / 2, 262);
  drawSuit(ctx, 'anchor', VIEW_W / 2 - 330, 158, 34, '#e0533d');
  drawSuit(ctx, 'wave', VIEW_W / 2 + 330, 158, 34, '#2fb3a3');
  // how to play
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, 290, 360, 700, 210, 14);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '18px Georgia, serif';
  const rules = [
    'Play cards into the three lanes — Port, Mid, Starboard.',
    'Each card costs doubloons. Match suits in a lane for +1 power each.',
    'At the end of the turn the lanes clash: the stronger side',
    'deals the difference as hull damage. Sink Blackbeard to 0!',
    'Click a card, then a lane. Keys 1–7 pick a card, Enter plays,',
    'Space ends the turn. Effects: draw, sink, rally, plunder.',
  ];
  rules.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 392 + i * 26));
  // start prompt
  ctx.fillStyle = '#e8a13c';
  roundRect(ctx, 490, 610, 300, 56, 12);
  ctx.fill();
  ctx.fillStyle = '#241a10';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('SET SAIL  ⏎', VIEW_W / 2, 645);
  ctx.fillStyle = '#cfe6ff';
  ctx.font = '15px Georgia, serif';
  ctx.fillText('Click SET SAIL or press Enter — mouse and keyboard both play.', VIEW_W / 2, 700);
}

function drawEnd(ctx, game, won) {
  ctx.fillStyle = won ? 'rgba(6,60,30,0.72)' : 'rgba(60,8,8,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = won ? '#ffd76a' : '#ff9a8a';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(won ? 'VICTORY!' : 'DEFEAT', VIEW_W / 2, 300);
  ctx.fillStyle = '#fff';
  ctx.font = 'italic 28px Georgia, serif';
  ctx.fillText(
    won ? 'Blackbeard surrenders — the tide is yours, Captain!' : 'Your ship goes down with the tide…',
    VIEW_W / 2,
    360,
  );
  ctx.font = '20px Georgia, serif';
  ctx.fillText(
    `Final hull — You ${Math.max(0, game.player.hull)}  ·  Blackbeard ${Math.max(0, game.enemy.hull)}  ·  ${game.turn} turns`,
    VIEW_W / 2,
    420,
  );
  ctx.fillStyle = '#e8a13c';
  roundRect(ctx, 490, 480, 300, 56, 12);
  ctx.fill();
  ctx.fillStyle = '#241a10';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('SAIL AGAIN  (R)', VIEW_W / 2, 515);
}

/** Draw the whole game for the given UI state. */
export function render(ctx, game, ui) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawOcean(ctx);
  if (game.phase === 'title') {
    drawTitle(ctx, game);
    return;
  }
  drawTable(ctx, game, ui);
  drawHands(ctx, game, ui);
  if (game.phase === 'win') drawEnd(ctx, game, true);
  if (game.phase === 'loss') drawEnd(ctx, game, false);
}
