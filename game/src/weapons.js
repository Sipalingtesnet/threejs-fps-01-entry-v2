// Weapons and ballistics for TIDEWATCH
import * as THREE from 'three';

export const WEAPON_DATA = {
  carbine: {
    id: 'carbine',
    name: 'KR-12 Carbine',
    price: 2900,
    damage: 32,
    headshotMult: 2.5,
    fireRate: 0.1, // 600 RPM
    magSize: 30,
    reserveMax: 90,
    reloadTime: 2.2,
    spreadBase: 0.015,
    spreadMax: 0.08,
    spreadRecoil: 0.02,
    auto: true
  },
  smg: {
    id: 'smg',
    name: 'Stingray-9 SMG',
    price: 1500,
    damage: 24,
    headshotMult: 2.5,
    fireRate: 0.075, // 800 RPM
    magSize: 32,
    reserveMax: 96,
    reloadTime: 1.8,
    spreadBase: 0.02,
    spreadMax: 0.1,
    spreadRecoil: 0.015,
    auto: true
  },
  sniper: {
    id: 'sniper',
    name: 'Deadeye-50 Sniper',
    price: 4750,
    damage: 115,
    headshotMult: 2.5,
    fireRate: 1.2, // Bolt action
    magSize: 5,
    reserveMax: 15,
    reloadTime: 3.2,
    spreadBase: 0.001,
    spreadMax: 0.2,
    spreadRecoil: 0.15,
    auto: false,
    hasScope: true
  },
  pistol: {
    id: 'pistol',
    name: 'P12 Pistol',
    price: 0,
    damage: 28,
    headshotMult: 2.5,
    fireRate: 0.2,
    magSize: 12,
    reserveMax: 36,
    reloadTime: 1.5,
    spreadBase: 0.025,
    spreadMax: 0.09,
    spreadRecoil: 0.025,
    auto: false
  }
};

export class WeaponSystem {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    this.currentKey = 'carbine';
    this.inventory = {
      carbine: { mag: 30, reserve: 90 },
      smg: { mag: 32, reserve: 96 },
      sniper: { mag: 5, reserve: 15 },
      pistol: { mag: 12, reserve: 36 }
    };

    this.ammoInMag = 30;
    this.ammoReserve = 90;
    this.reloadTimer = 0;
    this.fireTimer = 0;
    this.currentSpread = 0.015;
    this.isADS = false;

    // Grenades
    this.grenades = 1;
    this.activeGrenades = [];
  }

  selectWeapon(key) {
    if (!WEAPON_DATA[key]) return;
    this.currentKey = key;
    const inv = this.inventory[key];
    this.ammoInMag = inv.mag;
    this.ammoReserve = inv.reserve;
    this.reloadTimer = 0;
    this.fireTimer = 0;
    this.isADS = false;
  }

  refillReserves() {
    for (const k in this.inventory) {
      this.inventory[k].mag = WEAPON_DATA[k].magSize;
      this.inventory[k].reserve = WEAPON_DATA[k].reserveMax;
    }
    this.selectWeapon(this.currentKey);
    this.grenades = 1;
  }

  reload() {
    if (this.reloadTimer > 0) return;
    const wData = WEAPON_DATA[this.currentKey];
    if (this.ammoInMag >= wData.magSize || this.ammoReserve <= 0) return;
    this.reloadTimer = wData.reloadTime;
  }

  update(dt, player, shootCallback, hitscanCallback) {
    // Fire timer
    if (this.fireTimer > 0) this.fireTimer -= dt;

    // Reload timer
    if (this.reloadTimer > 0) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const wData = WEAPON_DATA[this.currentKey];
        const needed = wData.magSize - this.ammoInMag;
        const take = Math.min(needed, this.ammoReserve);
        this.ammoInMag += take;
        this.ammoReserve -= take;
        this.inventory[this.currentKey].mag = this.ammoInMag;
        this.inventory[this.currentKey].reserve = this.ammoReserve;
      }
    }

    // Spread decay
    const wData = WEAPON_DATA[this.currentKey];
    const targetSpread = (player.isCrouching ? 0.7 : 1.0) * (this.isADS ? 0.2 : wData.spreadBase);
    this.currentSpread += (targetSpread - this.currentSpread) * Math.min(1, dt * 10);

    // ADS toggle (Right click)
    // Handled via external mouse event in main or hud
  }

  fire(player, hitscanCallback, soundCallback) {
    if (this.reloadTimer > 0 || this.fireTimer > 0) return false;
    if (this.ammoInMag <= 0) {
      this.reload();
      return false;
    }

    const wData = WEAPON_DATA[this.currentKey];
    this.ammoInMag--;
    this.inventory[this.currentKey].mag = this.ammoInMag;
    this.fireTimer = wData.fireRate;

    // Increase spread & recoil
    this.currentSpread = Math.min(wData.spreadMax, this.currentSpread + wData.spreadRecoil);
    player.pitch += (Math.random() - 0.5) * wData.spreadRecoil * 0.5;
    player.yaw += (Math.random() - 0.5) * wData.spreadRecoil * 0.3;

    if (soundCallback) soundCallback(this.currentKey);

    // Perform hitscan raycast
    const raycaster = new THREE.Raycaster();
    const spreadX = (Math.random() - 0.5) * this.currentSpread;
    const spreadY = (Math.random() - 0.5) * this.currentSpread;
    
    // Center of screen ray + spread
    const dir = new THREE.Vector3(spreadX, spreadY, -1).applyQuaternion(this.camera.quaternion).normalize();
    raycaster.set(this.camera.position, dir);
    raycaster.far = 250;

    if (hitscanCallback) {
      hitscanCallback(raycaster, wData);
    }

    return true;
  }
}
