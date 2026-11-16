import { state } from './state.js';

export class HUD {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud-container';
    this.container.style.cssText = `
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      font-family: 'Courier New', monospace;
      color: #fff;
      user-select: none;
    `;
    document.body.appendChild(this.container);

    this.createElements();
  }

  createElements() {
    // Crosshair
    this.crosshair = document.createElement('div');
    this.crosshair.style.cssText = `
      position: absolute;
      top: 50%; left: 50%;
      width: 10px; height: 10px;
      transform: translate(-50%, -50%);
      pointer-events: none;
    `;
    this.crosshair.innerHTML = `
      <div style="position: absolute; top: 4px; left: -8px; width: 6px; height: 2px; background: rgba(0,255,200,0.8);"></div>
      <div style="position: absolute; top: 4px; left: 10px; width: 6px; height: 2px; background: rgba(0,255,200,0.8);"></div>
      <div style="position: absolute; top: -8px; left: 4px; width: 2px; height: 6px; background: rgba(0,255,200,0.8);"></div>
      <div style="position: absolute; top: 10px; left: 4px; width: 2px; height: 6px; background: rgba(0,255,200,0.8);"></div>
    `;
    this.container.appendChild(this.crosshair);

    // Top Bar (Timer, Scores, Round)
    this.topBar = document.createElement('div');
    this.topBar.style.cssText = `
      position: absolute;
      top: 15px; left: 50%;
      transform: translateX(-50%);
      background: rgba(10, 15, 25, 0.85);
      border: 1px solid #00ffc8;
      padding: 8px 20px;
      font-size: 16px;
      font-weight: bold;
      letter-spacing: 2px;
      text-align: center;
      border-radius: 4px;
    `;
    this.container.appendChild(this.topBar);

    // Bottom Left (Health & Armor)
    this.bottomLeft = document.createElement('div');
    this.bottomLeft.style.cssText = `
      position: absolute;
      bottom: 20px; left: 30px;
      background: rgba(10, 15, 25, 0.85);
      border-left: 4px solid #00ffc8;
      padding: 12px 20px;
      font-size: 18px;
    `;
    this.container.appendChild(this.bottomLeft);

    // Bottom Right (Ammo & Weapon & Money)
    this.bottomRight = document.createElement('div');
    this.bottomRight.style.cssText = `
      position: absolute;
      bottom: 20px; right: 30px;
      background: rgba(10, 15, 25, 0.85);
      border-right: 4px solid #00ffc8;
      padding: 12px 20px;
      text-align: right;
      font-size: 18px;
    `;
    this.container.appendChild(this.bottomRight);

    // Buy Menu Overlay (Hidden by default)
    this.buyMenu = document.createElement('div');
    this.buyMenu.style.cssText = `
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(10, 15, 25, 0.95);
      border: 2px solid #00ffc8;
      padding: 30px;
      width: 400px;
      display: none;
      pointer-events: auto;
      text-align: center;
      border-radius: 6px;
    `;
    this.buyMenu.innerHTML = `
      <h2 style="color: #00ffc8; margin-top: 0;">TACTICAL BUY MENU</h2>
      <div style="text-align: left; margin: 20px 0; font-size: 15px; line-height: 1.8;">
        [1] KR-12 Assault Rifle ($2900)<br>
        [2] Stingray-9 SMG ($1500)<br>
        [3] Deadeye-50 Sniper ($4750)<br>
        [4] P12 Heavy Pistol ($600)<br>
        [G] Tideburst HE Grenade ($300)<br>
      </div>
      <div style="font-size: 13px; color: #aaa;">Press B or Esc to close</div>
    `;
    this.container.appendChild(this.buyMenu);

    // Round / Match Overlays
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: absolute;
      top: 30%; left: 50%;
      transform: translate(-50%, -50%);
      font-size: 28px;
      font-weight: bold;
      color: #00ffc8;
      text-align: center;
      text-shadow: 0 0 10px rgba(0,255,200,0.6);
      display: none;
    `;
    this.container.appendChild(this.overlay);
  }

  update(player, roundManager) {
    // Top bar update
    const mins = Math.floor(roundManager.timer / 60);
    const secs = Math.floor(roundManager.timer % 60);
    const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    const roundStateStr = state.roundState.toUpperCase();
    this.topBar.innerHTML = `
      <span style="color: #00ffc8;">ROUND ${state.currentRound}</span> (${roundStateStr})<br>
      <span style="font-size: 22px;">${timeStr}</span><br>
      <span style="font-size: 14px; color: #aaa;">ATTACKERS ${state.teamScores.attackers} - ${state.teamScores.defenders} DEFENDERS</span>
    `;

    // Bottom Left update
    this.bottomLeft.innerHTML = `
      <div style="font-size: 12px; color: #00ffc8; letter-spacing: 1px;">HEALTH / ARMOR</div>
      <div style="font-size: 28px; font-weight: bold;">${Math.max(0, Math.round(state.playerHealth))} <span style="font-size:16px; color:#888;">HP</span> / ${state.playerArmor} <span style="font-size:16px; color:#888;">AP</span></div>
    `;

    // Bottom Right update
    const weapon = player.weapons[player.currentWeaponIndex];
    this.bottomRight.innerHTML = `
      <div style="font-size: 12px; color: #00ffc8; letter-spacing: 1px;">${weapon ? weapon.name.toUpperCase() : 'NONE'}</div>
      <div style="font-size: 28px; font-weight: bold;">${weapon ? weapon.ammo : 0} <span style="font-size:16px; color:#888;">/ ${weapon ? weapon.reserve : 0}</span></div>
      <div style="font-size: 14px; color: #ffd700; margin-top: 5px;">$${state.playerMoney}</div>
    `;

    // Buy menu visibility
    if (state.buyMenuOpen) {
      this.buyMenu.style.display = 'block';
    } else {
      this.buyMenu.style.display = 'none';
    }

    // Round / Match overlay
    if (state.roundState === 'ended' || state.matchOver) {
      this.overlay.style.display = 'block';
      this.overlay.innerHTML = `
        <div>${state.roundMessage || ''}</div>
        <div style="font-size: 16px; color: #fff; margin-top: 10px;">Next round starting soon...</div>
      `;
    } else {
      this.overlay.style.display = 'none';
    }
  }
}
