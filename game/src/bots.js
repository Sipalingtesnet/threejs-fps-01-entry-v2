import * as THREE from 'three';
import { palette } from './palette.js';
import { state } from './state.js';

export class BotManager {
  constructor(scene) {
    this.scene = scene;
    this.bots = [];
    this.mapData = null;
  }

  init(mapData) {
    this.mapData = mapData;
    // Spawn 4 enemy bots (attackers/defenders) and 2 friendly bots
    const botConfigs = [
      { id: 'e1', team: 'enemy', role: 'attacker', pos: new THREE.Vector3(-15, 0, -35) },
      { id: 'e2', team: 'enemy', role: 'attacker', pos: new THREE.Vector3(-12, 0, -38) },
      { id: 'e3', team: 'enemy', role: 'defender', pos: new THREE.Vector3(15, 0, 25) },
      { id: 'e4', team: 'enemy', role: 'defender', pos: new THREE.Vector3(20, 0, 30) },
      { id: 'f1', team: 'friendly', role: 'escort', pos: new THREE.Vector3(0, 0, 5) },
      { id: 'f2', team: 'friendly', role: 'escort', pos: new THREE.Vector3(3, 0, 7) }
    ];

    for (const cfg of botConfigs) {
      const bot = new Bot(this.scene, cfg, this.mapData);
      this.bots.push(bot);
    }
  }

  update(dt, player) {
    for (const bot of this.bots) {
      bot.update(dt, player, this.bots);
    }
  }

  reset() {
    for (const bot of this.bots) {
      bot.reset();
    }
  }
}

class Bot {
  constructor(scene, config, mapData) {
    this.scene = scene;
    this.id = config.id;
    this.team = config.team; // 'enemy' or 'friendly'
    this.role = config.role; // 'attacker', 'defender', 'escort'
    this.spawnPos = config.pos.clone();
    this.mapData = mapData;
    
    this.maxHealth = 100;
    this.health = 100;
    this.alive = true;

    this.state = 'patrol'; // patrol, hold, chase, engage, plant, defuse
    this.targetPos = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.speed = 4.8;
    this.rotationY = 0;

    // Mesh setup
    this.meshGroup = new THREE.Group();
    this.meshGroup.position.copy(this.spawnPos);
    this.scene.add(this.meshGroup);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.team === 'enemy' ? palette.enemyRed : palette.friendlyBlue,
      roughness: 0.5,
      metalness: 0.3
    });
    const headMat = new THREE.MeshStandardMaterial({ color: palette.metalDark, roughness: 0.3 });

    const bodyGeo = new THREE.CapsuleGeometry(0.4, 1.0, 4, 8);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.9;
    bodyMesh.castShadow = true;
    this.meshGroup.add(bodyMesh);

    const headGeo = new THREE.SphereGeometry(0.22, 8, 8);
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 1.6;
    headMesh.castShadow = true;
    this.meshGroup.add(headMesh);

    this.currentWaypointIndex = 0;
    this.waypoints = (this.mapData && this.mapData.waypoints) ? this.mapData.waypoints : [];
    this.findNearestWaypoint();

    this.reactionTimer = 0;
    this.burstTimer = 0;
    this.burstCount = 0;
    this.targetEntity = null;
    this.actionProgress = 0;
  }

  findNearestWaypoint() {
    if (!this.waypoints || this.waypoints.length === 0) return;
    let minDist = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < this.waypoints.length; i++) {
      if (!this.waypoints[i] || !this.waypoints[i].pos) continue;
      const dist = this.waypoints[i].pos.distanceTo(this.meshGroup.position);
      if (dist < minDist) {
        minDist = dist;
        bestIdx = i;
      }
    }
    this.currentWaypointIndex = bestIdx;
    if (this.waypoints[this.currentWaypointIndex] && this.waypoints[this.currentWaypointIndex].pos) {
      this.targetPos.copy(this.waypoints[this.currentWaypointIndex].pos);
    }
  }

  reset() {
    this.health = this.maxHealth;
    this.alive = true;
    this.meshGroup.position.copy(this.spawnPos);
    this.meshGroup.visible = true;
    this.state = 'patrol';
    this.findNearestWaypoint();
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  die() {
    this.alive = false;
    this.meshGroup.visible = false;
    state.addScore(this.team === 'enemy' ? 1 : -1, 1);
  }

  update(dt, player, allBots) {
    if (!this.alive) return;
    if (state.roundState !== 'live') return;

    const target = this.senseTarget(player, allBots);

    if (target) {
      this.targetEntity = target;
      if (this.state !== 'engage' && this.state !== 'chase') {
        this.reactionTimer = 0.25 + Math.random() * 0.2;
        this.state = 'chase';
      }
    } else {
      if (this.state === 'engage' || this.state === 'chase') {
        this.state = 'patrol';
      }
    }

    switch (this.state) {
      case 'patrol':
        this.updatePatrol(dt);
        break;
      case 'hold':
        this.updateHold(dt);
        break;
      case 'chase':
        this.updateChase(dt);
        break;
      case 'engage':
        this.updateEngage(dt);
        break;
      case 'plant':
        this.updatePlant(dt);
        break;
      case 'defuse':
        this.updateDefuse(dt);
        break;
    }
  }

  senseTarget(player, allBots) {
    if (player && player.alive) {
      const dist = this.meshGroup.position.distanceTo(player.camera.position);
      if (dist < 25) {
        const toPlayer = new THREE.Vector3().subVectors(player.camera.position, this.meshGroup.position).normalize();
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
        const dot = forward.dot(toPlayer);
        if (dot > 0.25 || dist < 7) {
          return { pos: player.camera.position, isPlayer: true };
        }
      }
    }

    for (const bot of allBots) {
      if (!bot.alive || bot.team === this.team) continue;
      const dist = this.meshGroup.position.distanceTo(bot.meshGroup.position);
      if (dist < 22) {
        return { pos: bot.meshGroup.position, isPlayer: false, botRef: bot };
      }
    }

    return null;
  }

  updatePatrol(dt) {
    if (!this.waypoints || this.waypoints.length === 0) return;

    const wp = this.waypoints[this.currentWaypointIndex];
    if (!wp || !wp.pos) return;
    const dist = this.meshGroup.position.distanceTo(wp.pos);

    if (dist < 2.0) {
      const nextIdxs = wp.neighbors || [];
      if (nextIdxs.length > 0) {
        this.currentWaypointIndex = nextIdxs[Math.floor(Math.random() * nextIdxs.length)];
      } else {
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
      }
      if (this.waypoints[this.currentWaypointIndex] && this.waypoints[this.currentWaypointIndex].pos) {
        this.targetPos.copy(this.waypoints[this.currentWaypointIndex].pos);
      }
    }

    this.moveTowards(this.targetPos, dt, this.speed * 0.75);

    if (this.team === 'enemy' && this.role === 'attacker' && state.bombState === 'unplanted') {
      const sitePos = new THREE.Vector3(35, 0, -35);
      if (this.meshGroup.position.distanceTo(sitePos) < 5) {
        this.state = 'plant';
        this.actionProgress = 0;
      }
    }
  }

  updateHold(dt) {
    if (this.targetEntity) {
      this.state = 'engage';
    }
  }

  updateChase(dt) {
    if (!this.targetEntity) {
      this.state = 'patrol';
      return;
    }

    this.reactionTimer -= dt;
    if (this.reactionTimer <= 0) {
      this.state = 'engage';
    }

    this.moveTowards(this.targetEntity.pos, dt, this.speed);
  }

  updateEngage(dt) {
    if (!this.targetEntity) {
      this.state = 'patrol';
      return;
    }

    const dist = this.meshGroup.position.distanceTo(this.targetEntity.pos);

    const dir = new THREE.Vector3().subVectors(this.targetEntity.pos, this.meshGroup.position);
    this.rotationY = Math.atan2(dir.x, dir.z);
    this.meshGroup.rotation.y = this.rotationY;

    if (dist > 16) {
      this.state = 'chase';
      return;
    }

    this.burstTimer += dt;
    if (this.burstTimer > 0.12) {
      this.burstTimer = 0;
      this.burstCount++;
      
      if (this.targetEntity.isPlayer) {
        if (Math.random() < 0.4) {
          state.damagePlayer(10);
        }
      } else if (this.targetEntity.botRef) {
        if (Math.random() < 0.4) {
          this.targetEntity.botRef.takeDamage(15);
        }
      }

      if (this.burstCount > 5) {
        this.burstTimer = 0.5;
        this.burstCount = 0;
      }
    }
  }

  updatePlant(dt) {
    this.actionProgress += dt;
    if (this.actionProgress >= 3.0) {
      state.bombState = 'planted';
      state.bombTimer = 45.0;
      this.state = 'hold';
    }
  }

  updateDefuse(dt) {
    this.actionProgress += dt;
    if (this.actionProgress >= 5.0) {
      state.bombState = 'defused';
      state.roundState = 'ended';
      state.winnerTeam = 'defenders';
      this.state = 'hold';
    }
  }

  moveTowards(target, dt, spd) {
    if (!target) return;
    const dir = new THREE.Vector3().subVectors(target, this.meshGroup.position);
    dir.y = 0;
    const dist = dir.length();
    if (dist < 0.1) return;

    dir.normalize();
    this.rotationY = Math.atan2(dir.x, dir.z);
    this.meshGroup.rotation.y = this.rotationY;

    const step = Math.min(dist, spd * dt);
    this.meshGroup.position.addScaledVector(dir, step);
  }
}
