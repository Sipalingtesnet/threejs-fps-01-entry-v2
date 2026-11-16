import * as THREE from 'three';
import { palette } from './palette.js';
import { state } from './state.js';
import { MapBuilder } from './map.js';
import { PlayerController } from './player.js';
import { BotManager } from './bots.js';
import { RoundManager } from './rounds.js';
import { HUD } from './hud.js';
import { audio } from './audio.js';

class Game {
  constructor() {
    this.container = document.createElement('div');
    document.body.appendChild(this.container);
    this.container.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; overflow:hidden; background:#000;';

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(palette.skyNight);
    this.scene.fog = new THREE.FogExp2(palette.fogNight, 0.015);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(palette.ambientNight, 0.8);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(palette.moonlight, 1.2);
    dirLight.position.set(40, 80, -30);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Build map first to obtain colliders and waypoints
    this.mapBuilder = new MapBuilder(this.scene);
    const mapData = this.mapBuilder.build();

    // Systems
    this.player = new PlayerController(this.camera, mapData.colliders);
    this.botManager = new BotManager(this.scene);
    this.roundManager = new RoundManager();
    this.hud = new HUD();

    this.botManager.init(mapData);

    this.clock = new THREE.Clock();
    this.fixedDelta = 1 / 60;
    this.accumulator = 0;
    this.frameCount = 0;

    this.init();
  }

  init() {
    this.roundManager.init();
    this.player.spawn(new THREE.Vector3(-25, 0, 0));

    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Audio init on click
    window.addEventListener('pointerdown', () => {
      audio.init();
      if (!state.matchOver && state.roundState === 'live') {
        audio.playGunshot();
      }
    }, { once: true });

    // Deterministic ?shot= mode handling
    const urlParams = new URLSearchParams(window.location.search);
    const shotMode = urlParams.get('shot');
    if (shotMode) {
      window.__shotMode = true;
      this.applyShotMode(shotMode);
    }
  }

  applyShotMode(mode) {
    if (mode === 'start') {
      state.roundState = 'buy';
      state.buyMenuOpen = false;
    } else if (mode === 'play') {
      state.roundState = 'live';
      state.playerHealth = 100;
    } else if (mode === 'buy') {
      state.roundState = 'buy';
      state.buyMenuOpen = true;
    } else if (mode === 'end') {
      state.roundState = 'ended';
      state.winnerTeam = 'attackers';
      state.roundMessage = 'Bomb Detonated - Attackers Win';
    }
  }

  run() {
    const loop = () => {
      requestAnimationFrame(loop);

      const dt = Math.min(this.clock.getDelta(), 0.1);
      this.accumulator += dt;

      while (this.accumulator >= this.fixedDelta) {
        this.fixedUpdate(this.fixedDelta);
        this.accumulator -= this.fixedDelta;
      }

      this.render();

      // Render 2 frames then set shotReady for Playwright test / screenshots
      this.frameCount++;
      if (this.frameCount >= 2) {
        window.__shotReady = true;
      }
    };

    loop();
  }

  fixedUpdate(dt) {
    const hitscanCallback = (raycaster, wData) => {
      // Check hits against bots
      for (const bot of this.botManager.bots) {
        if (!bot.alive) continue;
        const intersects = raycaster.intersectObject(bot.meshGroup, true);
        if (intersects.length > 0) {
          const hit = intersects[0];
          const isHeadshot = hit.point.y > bot.meshGroup.position.y + 1.4;
          const dmg = wData.damage * (isHeadshot ? wData.headshotMult : 1.0);
          bot.takeDamage(dmg);
          break;
        }
      }
    };

    this.player.update(dt, () => audio.playFootstep(), hitscanCallback);
    this.botManager.update(dt, this.player);
    this.roundManager.update(dt, this.botManager);
    this.hud.update(this.player, this.roundManager);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.run();
});
