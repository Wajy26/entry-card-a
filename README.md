[![make.fun](https://make.fun/badge.svg)](https://make.fun/c/best-card-game-20261122-1826)

# TIDEBREAK — a pirate lane-battle card game

Entry for make.fun's [best-card-game-20261122-1826](https://make.fun/c/best-card-game-20261122-1826)
("Make the best card game"). A complete, original card game that plays
offline in a desktop browser from static files — no network, no build step.

## The game

You are a pirate captain facing **Blackbeard** across three lanes — Port,
Mid, Starboard. Each turn you gain doubloons, draw a card, and play cards
into the lanes. When you end the turn the lanes clash: the stronger side
deals the difference as hull damage. Sink Blackbeard's hull to 0 to win;
if your hull hits 0, you go down with the tide.

- **14 original card types** across four suits — Anchor, Wave, Cannon,
  Compass — told apart by colour *and* shape.
- **Suit synergy:** two or more cards of the same suit in a lane each gain
  +1 power.
- **Effects:** draw extra cards, sink the weakest enemy card (Powder Keg),
  rally a lane's crew (+2), plunder an extra doubloon.
- **A readable AI opponent** that weighs every card in every lane, flips
  losing lanes, and blocks yours.
- Title screen, live battle table, win and loss screens; mouse and
  keyboard play (keys 1–7 pick a card, arrows pick a lane, Enter plays,
  Space ends the turn, R sails again).

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` from any static server — `game/` is plain files
and loads nothing over the network.

## Hand-in

`main.ts` copies `game/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots under `screenshots/` are real renders of this game's own code
(title, mid-game table, win, loss).

## License

MIT — see [LICENSE](LICENSE).
