// Centralized game state store for TIDEWATCH
export const GAME_PHASE = {
  MENU: 'menu',
  BUY: 'buy',
  LIVE: 'live',
  ROUND_END: 'roundEnd',
  MATCH_END: 'matchEnd'
};

export const state = {
  // Unified state fields
  phase: GAME_PHASE.MENU,
  roundState: 'live', // unified with phase/roundState checks
  round: 1,
  currentRound: 1,
  maxRounds: 9,
  scoreCT: 0,
  scoreT: 0,
  teamScores: { CT: 0, T: 0 },
  playerTeam: 'CT', // 'CT' or 'T'
  money: 800,
  playerMoney: 800,
  health: 100,
  playerHealth: 100,
  maxHealth: 100,
  armor: 100,
  playerArmor: 100,
  ammoMag: 30,
  ammoReserve: 90,
  weaponName: 'KR-12',
  hasGrenade: true,
  timer: 115, // 15s buy + 100s live
  roundMessage: '',
  matchOver: false,
  winnerTeam: null,
  buyMenuOpen: false,
  bombState: 'idle', // 'idle', 'planted', 'defusing', 'exploded', 'defused'
  bombTimer: 40.0,
  bombSite: null, // 'A' or 'B'
  kills: 0,
  deaths: 0,
  hitmarkers: [],
  killFeed: [],

  // Required state helper methods called by bots/game logic
  addScore(team, amount = 1) {
    if (team === 'CT' || team === 1 || team === 'ct') {
      this.scoreCT += amount;
      this.teamScores.CT = this.scoreCT;
    } else {
      this.scoreT += amount;
      this.teamScores.T = this.scoreT;
    }
  },

  damagePlayer(amount) {
    this.health = Math.max(0, this.health - amount);
    this.playerHealth = this.health;
    if (this.health <= 0) {
      this.roundMessage = 'YOU DIED';
    }
  }
};

export function resetRoundState(isBuyPhase = true) {
  state.phase = isBuyPhase ? GAME_PHASE.BUY : GAME_PHASE.LIVE;
  state.roundState = isBuyPhase ? 'buy' : 'live';
  state.buyMenuOpen = isBuyPhase;
  state.timer = isBuyPhase ? 15 : 100;
  state.bombState = 'idle';
  state.bombTimer = 40.0;
  state.bombSite = null;
  state.health = 100;
  state.playerHealth = 100;
  state.armor = 100;
  state.playerArmor = 100;
}
