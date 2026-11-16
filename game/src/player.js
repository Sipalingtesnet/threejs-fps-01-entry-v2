// First-person player controller and weapon integration for TIDEWATCH
import * as THREE from 'three';
import { WEAPON_DATA, WeaponSystem } from './weapons.js';
import { state } from './state.js';

export class PlayerController {
  constructor(camera, colliders) {
    this.camera = camera;
    this.colliders = colliders;

    // Position & Physics
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.radius = 0.4;
    this.height = 1.8;
    this.eyeHeight = 1.6;
    this.crouchEyeHeight = 1.0;
    this.currentEyeHeight = this.eyeHeight;

    // Movement stats
    this.walkSpeed = 5.0;
    this.sprintSpeed = 8.5;
    this.crouchSpeed = 2.5;
    this.jumpForce = 6.0;
    this.gravity = 18.0;

    // States
    this.isGrounded = false;
    this.isCrouching = false;
    this.isSprinting = false;
    this.alive = true;

    // Look angles
    this.pitch = 0;
    this.yaw = 0;
    this.mouseSensitivity = 0.002;

    // Head bob & footsteps
    this.bobTimer = 0;
    this.bobAmount = 0.05;
    this.footstepTimer = 0;
    this.footstepInterval = 0.4;

    // Weapons
    this.weaponSystem = new WeaponSystem(camera);
    this.weaponKeys = ['carbine', 'smg', 'sniper', 'pistol'];
    this.currentWeaponIndex = 0;
    this.weaponSystem.selectWeapon(this.weaponKeys[this.currentWeaponIndex]);

    // Expose array format expected by HUD
    this.weapons = [
      { id: 'carbine', name: WEAPON_DATA.carbine.name, ammo: 30, reserve: 90 },
      { id: 'smg', name: WEAPON_DATA.smg.name, ammo: 32, reserve: 96 },
      { id: 'sniper', name: WEAPON_DATA.sniper.name, ammo: 5, reserve: 15 },
      { id: 'pistol', name: WEAPON_DATA.pistol.name, ammo: 12, reserve: 36 }
    ];

    // Input state
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      crouch: false,
      jump: false,
      fire: false,
      ads: false
    };

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      this.handleKey(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.handleKey(e.code, false);
    });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === document.body && this.alive && state.roundState === 'live') {
        this.yaw -= e.movementX * this.mouseSensitivity;
        this.pitch -= e.movementY * this.mouseSensitivity;
        this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (document.pointerLockElement !== document.body && !window.__shotMode) {
        document.body.requestPointerLock();
        return;
      }
      if (e.button === 0 && this.alive && state.roundState === 'live') {
        this.input.fire = true;
      }
      if (e.button === 2) {
        this.input.ads = true;
        this.weaponSystem.isADS = true;
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.input.fire = false;
      }
      if (e.button === 2) {
        this.input.ads = false;
        this.weaponSystem.isADS = false;
      }
    });

    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handleKey(code, isDown) {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.forward = isDown;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.backward = isDown;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.input.left = isDown;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.input.right = isDown;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.input.sprint = isDown;
        break;
      case 'ControlLeft':
      case 'KeyC':
        this.input.crouch = isDown;
        break;
      case 'Space':
        if (isDown) this.input.jump = true;
        break;
      case 'KeyR':
        if (isDown) this.weaponSystem.reload();
        break;
      case 'KeyB':
        if (isDown && state.roundState === 'buy') {
          state.buyMenuOpen = !state.buyMenuOpen;
        }
        break;
      case 'Escape':
        if (isDown && state.buyMenuOpen) {
          state.buyMenuOpen = false;
        }
        break;
      case 'Digit1':
        if (isDown) this.switchWeapon(0);
        break;
      case 'Digit2':
        if (isDown) this.switchWeapon(1);
        break;
      case 'Digit3':
        if (isDown) this.switchWeapon(2);
        break;
      case 'Digit4':
        if (isDown) this.switchWeapon(3);
        break;
    }

    // Buy menu quick purchases (1-4, G when buy menu is open)
    if (isDown && state.buyMenuOpen && state.roundState === 'buy') {
      if (code === 'Digit1' && state.playerMoney >= 2900) {
        state.playerMoney -= 2900;
        this.switchWeapon(0);
        state.buyMenuOpen = false;
      } else if (code === 'Digit2' && state.playerMoney >= 1500) {
        state.playerMoney -= 1500;
        this.switchWeapon(1);
        state.buyMenuOpen = false;
      } else if (code === 'Digit3' && state.playerMoney >= 4750) {
        state.playerMoney -= 4750;
        this.switchWeapon(2);
        state.buyMenuOpen = false;
      } else if (code === 'Digit4' && state.playerMoney >= 600) {
        state.playerMoney -= 600;
        this.switchWeapon(3);
        state.buyMenuOpen = false;
      }
    }
  }

  switchWeapon(index) {
    if (index >= 0 && index < this.weaponKeys.length) {
      this.currentWeaponIndex = index;
      const key = this.weaponKeys[index];
      this.weaponSystem.selectWeapon(key);
    }
  }

  spawn(pos) {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
    this.pitch = 0;
    this.yaw = 0;
    this.alive = true;
    state.playerHealth = 100;
    state.health = 100;
  }

  update(dt, playFootstepCallback, hitscanCallback) {
    if (!this.alive) return;

    // Crouch state & speed
    this.isCrouching = this.input.crouch;
    const targetEyeHeight = this.isCrouching ? this.crouchEyeHeight : this.eyeHeight;
    this.currentEyeHeight += (targetEyeHeight - this.currentEyeHeight) * Math.min(1, dt * 15);

    this.isSprinting = this.input.sprint && !this.isCrouching && !this.input.backward;
    let speed = this.walkSpeed;
    if (this.isCrouching) speed = this.crouchSpeed;
    else if (this.isSprinting) speed = this.sprintSpeed;

    // Movement direction vector
    const moveDir = new THREE.Vector3();
    const forwardVec = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const rightVec = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    if (this.input.forward) moveDir.add(forwardVec);
    if (this.input.backward) moveDir.sub(forwardVec);
    if (this.input.right) moveDir.add(rightVec);
    if (this.input.left) moveDir.sub(rightVec);
    moveDir.normalize();

    // Horizontal velocity interpolation
    const targetVelX = moveDir.x * speed;
    const targetVelZ = moveDir.z * speed;
    const accel = this.isGrounded ? 12.0 : 4.0;
    this.velocity.x += (targetVelX - this.velocity.x) * Math.min(1, dt * accel);
    this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(1, dt * accel);

    // Gravity & Jump
    if (this.isGrounded) {
      if (this.input.jump) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        this.input.jump = false;
      } else {
        this.velocity.y = 0;
      }
    } else {
      this.velocity.y -= this.gravity * dt;
    }
    this.input.jump = false;

    // Collision resolution
    const deltaPos = this.velocity.clone().multiplyScalar(dt);
    this.resolveCollisions(deltaPos);

    // Weapon update & firing
    this.weaponSystem.update(dt, this);
    if (this.input.fire && state.roundState === 'live') {
      this.weaponSystem.fire(this, hitscanCallback);
      const curW = this.weaponKeys[this.currentWeaponIndex];
      if (!WEAPON_DATA[curW].auto) {
        this.input.fire = false; // require re-click for semi-auto/sniper
      }
    }

    // Sync weapon ammo to HUD structure
    const curWKey = this.weaponKeys[this.currentWeaponIndex];
    const wData = this.weaponSystem.inventory[curWKey];
    if (wData) {
      this.weapons[this.currentWeaponIndex].ammo = wData.mag;
      this.weapons[this.currentWeaponIndex].reserve = wData.reserve;
      state.ammoMag = wData.mag;
      state.ammoReserve = wData.reserve;
    }

    // Head bob & footsteps
    const hSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    let bobOffset = 0;
    if (this.isGrounded && hSpeed > 1.0) {
      this.bobTimer += dt * hSpeed * (this.isCrouching ? 1.2 : 2.0);
      bobOffset = Math.sin(this.bobTimer) * this.bobAmount * (this.isCrouching ? 0.5 : 1.0);

      this.footstepTimer += dt * hSpeed;
      if (this.footstepTimer >= this.footstepInterval) {
        this.footstepTimer = 0;
        if (playFootstepCallback) playFootstepCallback();
      }
    } else {
      this.bobTimer = 0;
    }

    // Update camera matrix & position
    this.camera.position.copy(this.position);
    this.camera.position.y += this.currentEyeHeight + bobOffset;

    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // Check player health death
    if (state.playerHealth <= 0 && this.alive) {
      this.alive = false;
      state.roundMessage = 'YOU DIED';
    }
  }

  resolveCollisions(delta) {
    this.position.x += delta.x;
    if (this.checkCollision()) {
      this.position.x -= delta.x;
      this.velocity.x = 0;
    }

    this.position.z += delta.z;
    if (this.checkCollision()) {
      this.position.z -= delta.z;
      this.velocity.z = 0;
    }

    this.position.y += delta.y;
    this.isGrounded = false;
    if (this.checkCollision()) {
      this.position.y -= delta.y;
      if (delta.y < 0) {
        this.isGrounded = true;
      }
      this.velocity.y = 0;
    }
  }

  checkCollision() {
    const playerBox = new THREE.Box3(
      new THREE.Vector3(
        this.position.x - this.radius,
        this.position.y,
        this.position.z - this.radius
      ),
      new THREE.Vector3(
        this.position.x + this.radius,
        this.position.y + this.height,
        this.position.z + this.radius
      )
    );

    for (let i = 0; i < this.colliders.length; i++) {
      if (playerBox.intersectsBox(this.colliders[i])) {
        return true;
      }
    }
    return false;
  }
}
