// TIDEBREAK — boot. Sizes the canvas to the window, runs the render loop,
// and wires the input actions to the rules. `?shot=title|battle|win|loss`
// stages a deterministic scene for screenshots instead of the title screen.
import { createGame, startGame, playCard, endTurn } from './state.js';
import { enemyAct } from './ai.js';
import { render, VIEW_W, VIEW_H } from './render.js';
import { createUI, attachInput } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '7');

let game = shot ? stageShot(shot, seed) : createGame(seed);
let ui = createUI();

function resize() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.width = Math.round(VIEW_W * scale);
  canvas.height = Math.round(VIEW_H * scale);
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
}

function announce() {
  const last = game.log[game.log.length - 1] || '';
  status.textContent =
    game.phase === 'title' ? 'Tidebreak. Press Enter to set sail.'
    : game.phase === 'win' ? 'Victory! Blackbeard surrenders.'
    : game.phase === 'loss' ? 'Defeat. Your ship goes down.'
    : `Turn ${game.turn}. You have ${game.doubloons} doubloons, hull ${game.player.hull}. ${last}`;
}

const actions = {
  start() {
    startGame(game);
    announce();
  },
  play(handIndex, lane) {
    if (playCard(game, handIndex, lane)) announce();
  },
  endTurn() {
    endTurn(game, (g) => enemyAct(g, 1.0));
    ui.selectedCard = -1;
    announce();
  },
  restart() {
    game = createGame(Math.floor(Math.random() * 1e9));
    ui = createUI();
    startGame(game);
    announce();
  },
};

attachInput(canvas, game, ui, actions);
resize();
window.addEventListener('resize', resize);
announce();

function frame() {
  ctx.setTransform(canvas.width / VIEW_W, 0, 0, canvas.height / VIEW_H, 0, 0);
  render(ctx, game, ui);
  requestAnimationFrame(frame);
}
frame();
