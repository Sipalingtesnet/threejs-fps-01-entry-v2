// Tidewatch Harbour map implementation for TIDEWATCH
import * as THREE from 'three';
import { palette, shade } from './palette.js';

export class MapBuilder {
  constructor(scene) {
    this.scene = scene;
    this.mapData = null;
  }

  build() {
    this.mapData = createMap(this.scene);
    return this.mapData;
  }
}

export function createMap(scene) {
  const colliders = [];
  const shootables = [];
  const waypoints = [];
  const spawnPoints = { CT: [], T: [] };
  let siteAObject = null;
  let siteBObject = null;

  // Materials
  const groundMat = new THREE.MeshStandardMaterial({
    color: shade('surface'),
    roughness: 0.8,
    metalness: 0.2
  });

  const wallMat = new THREE.MeshStandardMaterial({
    color: shade('hairline'),
    roughness: 0.7,
    metalness: 0.3
  });

  const containerRustMat = new THREE.MeshStandardMaterial({
    color: shade('rust'),
    roughness: 0.6,
    metalness: 0.4
  });

  const containerBlueMat = new THREE.MeshStandardMaterial({
    color: shade('blue'),
    roughness: 0.6,
    metalness: 0.4
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: '#5c4033',
    roughness: 0.9
  });

  const waterMat = new THREE.MeshStandardMaterial({
    color: shade('teal'),
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.85
  });

  // Helper to add box collider + mesh
  function addBox(x, y, z, w, h, d, material, isShootable = true) {
    const geom = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geom, material);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const box3 = new THREE.Box3().setFromObject(mesh);
    colliders.push(box3);
    if (isShootable) shootables.push(mesh);
    return mesh;
  }

  // 1. Ground / Quay / Water
  // Main harbour ground
  addBox(0, -0.5, 0, 120, 0.5, 120, groundMat, false);
  // Water basin along the west side
  const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(40, 120), waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.set(-50, -0.2, 0);
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);

  // Quay edge wall separating water from harbour
  addBox(-30, 0, 0, 2, 2, 120, wallMat, true);

  // Perimeter boundary walls
  addBox(0, 0, -60, 120, 6, 2, wallMat, true); // North wall
  addBox(0, 0, 60, 120, 6, 2, wallMat, true);  // South wall
  addBox(60, 0, 0, 2, 6, 120, wallMat, true);  // East wall

  // 2. Bomb Sites & Key Areas
  // Site A: Crane Deck (North-East corner)
  const siteAGeom = new THREE.BoxGeometry(12, 0.1, 12);
  const siteAMat = new THREE.MeshBasicMaterial({ color: shade('red'), wireframe: true });
  siteAObject = new THREE.Mesh(siteAGeom, siteAMat);
  siteAObject.position.set(35, 0.05, -35);
  scene.add(siteAObject);
  siteAObject.userData = { site: 'A' };

  // Site B: Warehouse (South-East corner)
  const siteBGeom = new THREE.BoxGeometry(12, 0.1, 12);
  const siteBMat = new THREE.MeshBasicMaterial({ color: shade('red'), wireframe: true });
  siteBObject = new THREE.Mesh(siteBGeom, siteBMat);
  siteBObject.position.set(35, 0.05, 35);
  scene.add(siteBObject);
  siteBObject.userData = { site: 'B' };

  // 3. Shipping Containers & Cover (Mid, A, B lanes)
  // Mid container stack (Center)
  addBox(0, 0, 0, 6, 3.5, 12, containerRustMat, true);
  addBox(8, 0, 4, 12, 3.5, 5.5, containerBlueMat, true);
  addBox(-8, 0, -4, 12, 3.5, 5.5, containerRustMat, true);

  // Warehouse building structure for Site B
  addBox(35, 0, 35, 18, 5, 18, wallMat, true);
  // Warehouse interior cutouts / pillars
  addBox(28, 0, 30, 2, 5, 2, wallMat, true);
  addBox(42, 0, 30, 2, 5, 2, wallMat, true);

  // Crane Deck structure for Site A
  addBox(35, 0, -35, 16, 4, 16, containerBlueMat, true);
  addBox(35, 4, -35, 18, 1, 18, wallMat, true); // Crane roof

  // Alley / Cover crates
  addBox(-20, 0, -25, 4, 2, 8, woodMat, true);
  addBox(-20, 0, 25, 4, 2, 8, woodMat, true);
  addBox(15, 0, -20, 6, 2, 4, woodMat, true);
  addBox(15, 0, 20, 6, 2, 4, woodMat, true);

  // 4. Spawn Points
  // CT Spawn (West / Quay side)
  spawnPoints.CT = [
    new THREE.Vector3(-25, 0, -10),
    new THREE.Vector3(-25, 0, 0),
    new THREE.Vector3(-25, 0, 10),
    new THREE.Vector3(-20, 0, -5),
    new THREE.Vector3(-20, 0, 5)
  ];

  // T Spawn (East / Back alley side)
  spawnPoints.T = [
    new THREE.Vector3(50, 0, -40),
    new THREE.Vector3(50, 0, -30),
    new THREE.Vector3(50, 0, 0),
    new THREE.Vector3(50, 0, 30),
    new THREE.Vector3(50, 0, 40)
  ];

  // 5. Waypoint Graph for Bots
  waypoints.push(
    { id: 0, pos: new THREE.Vector3(-20, 0, 0), neighbors: [1, 2], site: null },
    { id: 1, pos: new THREE.Vector3(-10, 0, -20), neighbors: [0, 3, 5], site: null },
    { id: 2, pos: new THREE.Vector3(-10, 0, 20), neighbors: [0, 4, 6], site: null },
    { id: 3, pos: new THREE.Vector3(10, 0, -25), neighbors: [1, 7], site: null },
    { id: 4, pos: new THREE.Vector3(10, 0, 25), neighbors: [2, 8], site: null },
    { id: 5, pos: new THREE.Vector3(25, 0, -30), neighbors: [1, 7], site: 'A' },
    { id: 6, pos: new THREE.Vector3(25, 0, 30), neighbors: [2, 8], site: 'B' },
    { id: 7, pos: new THREE.Vector3(35, 0, -35), neighbors: [3, 5], site: 'A' }, // Site A holding node
    { id: 8, pos: new THREE.Vector3(35, 0, 35), neighbors: [4, 6], site: 'B' }  // Site B holding node
  );

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0x304060, 0x10151a, 0.8);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xcceeff, 1.2);
  dirLight.position.set(40, 60, -30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 10;
  dirLight.shadow.camera.far = 150;
  const d = 60;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  scene.add(dirLight);

  // Sodium amber lamps
  const lampPos = [
    new THREE.Vector3(-15, 6, -30),
    new THREE.Vector3(-15, 6, 30),
    new THREE.Vector3(25, 6, -10),
    new THREE.Vector3(25, 6, 10)
  ];
  lampPos.forEach(pos => {
    const pLight = new THREE.PointLight(palette.amber || 0xffaa00, 2, 35);
    pLight.position.copy(pos);
    scene.add(pLight);
  });

  return {
    colliders,
    shootables,
    spawnPoints,
    waypoints,
    siteA: siteAObject,
    siteB: siteBObject
  };
}
