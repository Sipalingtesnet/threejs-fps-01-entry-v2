import { state } from './state.js';

export class RoundManager {
  constructor() {
    this.roundTime = 100; // seconds
    this.buyTime = 15;    // seconds
    this.timer = this.buyTime;
    this.maxScore = 5;
  }

  init() {
    state.roundState = 'buy';
    this.timer = this.buyTime;
    state.currentRound = 1;
    state.playerMoney = 800; // starting pistol round money
    state.teamScores = { attackers: 0, defenders: 0 };
  }

  update(dt, botManager) {
    this.timer -= dt;

    if (state.roundState === 'buy') {
      if (this.timer <= 0) {
        state.roundState = 'live';
        this.timer = this.roundTime;
      }
    } else if (state.roundState === 'live') {
      // Check bomb timer
      if (state.bombState === 'planted') {
        state.bombTimer -= dt;
        if (state.bombTimer <= 0) {
          // Attackers win by detonation
          this.endRound('attackers', 'Bomb Detonated');
        }
      }

      if (this.timer <= 0) {
        // Time out -> defenders win unplanted
        this.endRound('defenders', 'Time Expired - Defenders Win');
      }

      // Check elimination of teams
      let enemiesAlive = 0;
      let friendlyAlive = 0;
      for (const bot of botManager.bots) {
        if (bot.alive) {
          if (bot.team === 'enemy') enemiesAlive++;
          else friendlyAlive++;
        }
      }

      if (enemiesAlive === 0 && state.bombState !== 'planted') {
        this.endRound('attackers', 'All Enemies Eliminated');
      } else if (friendlyAlive === 0 && state.playerHealth <= 0 && state.bombState !== 'planted') {
        this.endRound('defenders', 'All Friendlies Eliminated');
      }

      if (state.bombState === 'defused') {
        this.endRound('defenders', 'Bomb Defused');
      }

    } else if (state.roundState === 'ended') {
      // Waiting for next round transition
      if (this.timer <= 0) {
        this.startNextRound(botManager);
      }
    }
  }

  endRound(winnerTeam, reason) {
    state.roundState = 'ended';
    state.winnerTeam = winnerTeam;
    state.roundMessage = reason;
    this.timer = 5.0; // 5 seconds inter-round

    this.updateEconomy(winnerTeam);
    state.teamScores[winnerTeam]++;

    // Check match win
    if (state.teamScores[winnerTeam] >= this.maxScore) {
      state.matchOver = true;
      state.roundMessage = `MATCH OVER: ${winnerTeam.toUpperCase()} WINS!`;
    }
  }

  updateEconomy(winnerTeam) {
    if (winnerTeam === 'attackers') {
      state.playerMoney += 3250; // Win bonus
    } else {
      state.playerMoney += 3250;
    }
    // Cap money at 16000
    if (state.playerMoney > 16000) state.playerMoney = 16000;
  }

  startNextRound(botManager) {
    if (state.matchOver) return;

    state.currentRound++;
    state.roundState = 'buy';
    this.timer = this.buyTime;
    state.bombState = 'unplanted';
    state.bombTimer = 45.0;

    botManager.reset();
  }
}
