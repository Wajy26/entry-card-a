// TIDEBREAK — the cards. Every card has a name, a doubloon cost, a power
// value, one of four pirate suits, and an optional on-play effect.
// Suits are told apart by colour AND by shape (drawn in render.js):
//   anchor — deep red, drawn anchor; wave — teal, drawn wave;
//   cannon — amber, drawn cannonball; compass — violet, drawn compass star.
export const SUITS = {
  anchor: { name: 'Anchor', color: '#e0533d', dark: '#8f2a1c' },
  wave: { name: 'Wave', color: '#2fb3a3', dark: '#14685e' },
  cannon: { name: 'Cannon', color: '#e8a13c', dark: '#8a5a14' },
  compass: { name: 'Compass', color: '#9b7ede', dark: '#4d3485' },
};

// effect: 'none' | 'draw' (draw N) | 'bomb' (sink weakest enemy card in the lane)
//        | 'rally' (own cards in the lane +2 power) | 'plunder' (+1 doubloon now)
export const CARD_TYPES = [
  { id: 'cabin-boy', name: 'Cabin Boy', cost: 1, power: 1, suit: 'anchor', effect: 'none', copies: 3 },
  { id: 'deckhand', name: 'Deckhand', cost: 1, power: 2, suit: 'anchor', effect: 'none', copies: 3 },
  { id: 'swabbie', name: 'Swabbie', cost: 2, power: 3, suit: 'wave', effect: 'none', copies: 3 },
  { id: 'lookout', name: 'Lookout', cost: 2, power: 2, suit: 'compass', effect: 'draw', effectN: 1, copies: 2 },
  { id: 'gunner', name: 'Gunner', cost: 2, power: 3, suit: 'cannon', effect: 'none', copies: 3 },
  { id: 'powder-keg', name: 'Powder Keg', cost: 3, power: 0, suit: 'cannon', effect: 'bomb', copies: 2 },
  { id: 'boatswain', name: 'Boatswain', cost: 3, power: 4, suit: 'anchor', effect: 'none', copies: 2 },
  { id: 'duelist', name: 'Cutlass Duelist', cost: 3, power: 4, suit: 'wave', effect: 'none', copies: 2 },
  { id: 'plunderer', name: 'Plunderer', cost: 3, power: 3, suit: 'compass', effect: 'plunder', copies: 2 },
  { id: 'mermaid', name: "Mermaid's Call", cost: 2, power: 1, suit: 'wave', effect: 'draw', effectN: 2, copies: 2 },
  { id: 'first-mate', name: 'First Mate', cost: 4, power: 5, suit: 'compass', effect: 'none', copies: 2 },
  { id: 'stormcaller', name: 'Stormcaller', cost: 4, power: 4, suit: 'wave', effect: 'rally', copies: 1 },
  { id: 'ghost-ship', name: 'Ghost Ship', cost: 5, power: 6, suit: 'anchor', effect: 'none', copies: 1 },
  { id: 'kraken', name: 'Kraken', cost: 6, power: 8, suit: 'wave', effect: 'none', copies: 1 },
];

/** Build a fresh 30-card deck (shuffled copies of the card types). */
export function buildDeck(random) {
  const deck = [];
  for (const type of CARD_TYPES) {
    for (let i = 0; i < type.copies; i += 1) deck.push({ ...type, uid: `${type.id}-${i}` });
  }
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Human-readable one-liner for a card, used in the log and tooltips. */
export function describeCard(card) {
  const effect =
    card.effect === 'draw' ? ` · Draw ${card.effectN}` :
    card.effect === 'bomb' ? ' · Sinks weakest foe' :
    card.effect === 'rally' ? ' · Crew +2 in lane' :
    card.effect === 'plunder' ? ' · +1 doubloon' : '';
  return `${card.name} — ${card.cost} doubloons, ${card.power} power, ${SUITS[card.suit].name}${effect}`;
}
