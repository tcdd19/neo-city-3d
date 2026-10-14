import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SoundEffects } from './audio.js';
import {
  setMaxAnisotropy,
  createCityEnvironmentMap,
  createVolumetricCloud,
  createAsphaltTexture,
  createSidewalkTexture,
  createTreeMesh,
  createParkPlot,
  createBuildingPlot,
  createTowerBloxxFloor,
  createTowerBloxxRoof,
  createStreetLamp
} from './cityBuilder.js';
import {
  createVehicleMesh,
  updateVehicle,
  createPedestrianMesh,
  updatePedestrian
} from './entities.js';

const sfx = new SoundEffects();
const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth <= 900;

function vibrateDevice(pattern) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (_) {}
  }
}

// --- Scene, Camera, Renderer ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6ec6ff);
scene.fog = new THREE.FogExp2(0x6ec6ff, 0.004);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 360);
camera.position.set(isMobileDevice ? 62 : 52, isMobileDevice ? 48 : 42, isMobileDevice ? 72 : 62);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

// Enable maximum anisotropic filtering & Sky/City Environment Reflections
setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());
scene.environment = createCityEnvironmentMap(renderer, '#3a86ff', '#d0efff', '#1e293b');

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.rotateSpeed = isMobileDevice ? 0.75 : 0.9;
controls.zoomSpeed = isMobileDevice ? 1.15 : 1.0;
controls.panSpeed = isMobileDevice ? 0.85 : 0.9;
controls.maxPolarAngle = Math.PI / 2 - 0.03;
controls.minDistance = 8;
controls.maxDistance = 165;
controls.target.set(0, 4, 0);
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN
};

// --- Lights ---
const hemiLight = new THREE.HemisphereLight(0xdff4ff, 0x3b4d3b, 0.92);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff6e5, 1.55);
sunLight.position.set(55, 78, 45);
sunLight.castShadow = true;
const shadowRes = isMobileDevice ? 1536 : 2048;
sunLight.shadow.mapSize.width = shadowRes;
sunLight.shadow.mapSize.height = shadowRes;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 210;
const d = 62;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

// --- City Layout Constants ---
const PLOT_COORDS = [-34, -17, 0, 17, 34]; // 5x5 city blocks
const ROAD_COORDS = [-25.5, -8.5, 8.5, 25.5]; // 4 avenues + 4 streets
const PLOT_SIZE = 12.2;

const plots = [];
const allTrees = [];
const streetLamps = [];
const vehicles = [];
const pedestrians = [];

// --- Build Base Terrain & Road Network ---
function buildCityInfrastructure() {
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(380, 380),
    new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.18, metalness: 0.35 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.5;
  scene.add(water);

  const sidewalkTex = createSidewalkTexture();
  sidewalkTex.repeat.set(16, 16);
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(102, 0.8, 102),
    new THREE.MeshStandardMaterial({
      map: sidewalkTex,
      color: 0x90a4ae,
      roughness: 0.82
    })
  );
  ground.position.y = -0.4;
  ground.receiveShadow = true;
  scene.add(ground);
  window.__cityGroundMat = ground.material;

  const asphaltTex = createAsphaltTexture();
  const roadMat = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughness: 0.7,
    bumpMap: asphaltTex,
    bumpScale: 0.02
  });
  window.__cityRoadMat = roadMat;

  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });
  const crossMat = new THREE.MeshBasicMaterial({ color: 0xeceff1 });

  ROAD_COORDS.forEach((rc) => {
    const roadZ = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 94), roadMat);
    roadZ.rotation.x = -Math.PI / 2;
    roadZ.position.set(rc, 0.02, 0);
    roadZ.receiveShadow = true;
    scene.add(roadZ);

    const roadX = new THREE.Mesh(new THREE.PlaneGeometry(94, 4.5), roadMat);
    roadX.rotation.x = -Math.PI / 2;
    roadX.position.set(0, 0.025, rc);
    roadX.receiveShadow = true;
    scene.add(roadX);

    for (let p = -42; p <= 42; p += 5) {
      if (ROAD_COORDS.some((r) => Math.abs(p - r) < 3.2)) continue;
      const dashZ = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 2.2), lineMat);
      dashZ.rotation.x = -Math.PI / 2;
      dashZ.position.set(rc, 0.04, p);
      scene.add(dashZ);

      const dashX = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.14), lineMat);
      dashX.rotation.x = -Math.PI / 2;
      dashX.position.set(p, 0.04, rc);
      scene.add(dashX);
    }
  });

  ROAD_COORDS.forEach((rx) => {
    ROAD_COORDS.forEach((rz) => {
      for (let s = -1.5; s <= 1.5; s += 0.6) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 1.3), crossMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(rx + s, 0.045, rz + 2.8);
        scene.add(stripe);
      }

      const lamp = createStreetLamp();
      lamp.position.set(rx + 2.9, 0, rz + 2.9);
      lamp.rotation.y = -Math.PI * 0.75;
      scene.add(lamp);
      streetLamps.push(lamp);
    });
  });

  const treeTypes = ['oak', 'pine', 'cherry'];
  for (let p = -42; p <= 42; p += 7) {
    [[-45, p], [45, p], [p, -45], [p, 45]].forEach(([tx, tz], i) => {
      const tr = createTreeMesh(treeTypes[(Math.abs(p) + i) % 3]);
      tr.position.set(tx, 0, tz);
      scene.add(tr);
      allTrees.push(tr);
    });
  }

  PLOT_COORDS.forEach((px, rIdx) => {
    PLOT_COORDS.forEach((pz, cIdx) => {
      const selectorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(PLOT_SIZE, 0.2, PLOT_SIZE),
        new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.9 })
      );
      selectorMesh.position.set(px, 0.1, pz);
      selectorMesh.receiveShadow = true;

      const plotObj = {
        row: rIdx,
        col: cIdx,
        x: px,
        z: pz,
        baseMesh: selectorMesh,
        contentGroup: null
      };
      selectorMesh.userData.plotRef = plotObj;
      scene.add(selectorMesh);
      plots.push(plotObj);

      if (rIdx === 2 && cIdx === 2) {
        populatePlot(plotObj, 'park', false);
      } else if ((rIdx === 1 || rIdx === 3) && (cIdx === 1 || cIdx === 3)) {
        populatePlot(plotObj, 'skyscraper', false);
      } else if ((rIdx + cIdx) % 3 === 0) {
        populatePlot(plotObj, 'shop', false);
      } else if ((rIdx === 0 && cIdx === 2) || (rIdx === 4 && cIdx === 2)) {
        populatePlot(plotObj, 'park', false);
      } else {
        populatePlot(plotObj, 'residential', false);
      }
    });
  });
}

function populatePlot(plotObj, type, playSound = true) {
  if (plotObj.contentGroup) {
    scene.remove(plotObj.contentGroup);
    plotObj.contentGroup = null;
  }

  if (type === 'empty') {
    if (playSound) {
      sfx.playDemolish();
      vibrateDevice(30);
    }
    updateHUDStats();
    return;
  }

  let group;
  if (type === 'park') {
    group = createParkPlot(PLOT_SIZE);
  } else {
    group = createBuildingPlot(type, PLOT_SIZE);
  }

  group.position.set(plotObj.x, 0, plotObj.z);
  group.userData.plotRef = plotObj;

  group.scale.set(0.01, 0.01, 0.01);
  group.userData.targetScale = 1;

  scene.add(group);
  plotObj.contentGroup = group;

  if (playSound) {
    sfx.playBuild();
    vibrateDevice(25);
  }
  applyLightingToNewPlot(group);
  updateHUDStats();
}

// --- Spawn & Manage Vehicles & Pedestrians ---
function syncVehiclesCount(targetCount) {
  while (vehicles.length < targetCount) {
    const car = createVehicleMesh(ROAD_COORDS);
    car.userData.beamMat.opacity = isNightLightActive() ? 0.26 : 0.0;
    scene.add(car);
    vehicles.push(car);
  }
  while (vehicles.length > targetCount) {
    const old = vehicles.pop();
    scene.remove(old);
  }
  document.getElementById('stat-cars').textContent = vehicles.length;
}

function syncPedestriansCount(targetCount) {
  const showUmbrella = currentWeather === 'rain' || currentWeather === 'snow';
  while (pedestrians.length < targetCount) {
    const ped = createPedestrianMesh(ROAD_COORDS);
    ped.userData.umbrella.visible = showUmbrella;
    scene.add(ped);
    pedestrians.push(ped);
  }
  while (pedestrians.length > targetCount) {
    const old = pedestrians.pop();
    scene.remove(old);
  }
  document.getElementById('stat-peds').textContent = pedestrians.length;
}

// --- Volumetric Clouds & Weather System ---
let currentWeather = 'sunny';
const cloudsGroup = new THREE.Group();
scene.add(cloudsGroup);

function buildClouds() {
  for (let i = 0; i < 16; i++) {
    const cg = createVolumetricCloud();
    const scale = 0.85 + Math.random() * 0.7;
    cg.scale.setScalar(scale);
    cg.position.set(
      (Math.random() - 0.5) * 160,
      38 + Math.random() * 14,
      (Math.random() - 0.5) * 150
    );
    cloudsGroup.add(cg);
  }
}

// Rain Particle System
const RAIN_COUNT = 2200;
const rainGeo = new THREE.BufferGeometry();
const rainPositions = new Float32Array(RAIN_COUNT * 3);
for (let i = 0; i < RAIN_COUNT; i++) {
  rainPositions[i * 3] = (Math.random() - 0.5) * 120;
  rainPositions[i * 3 + 1] = Math.random() * 55;
  rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 120;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
const rainParticles = new THREE.Points(
  rainGeo,
  new THREE.PointsMaterial({ color: 0x90caf9, size: 0.35, transparent: true, opacity: 0.75 })
);
rainParticles.visible = false;
scene.add(rainParticles);

// Snow Particle System
const SNOW_COUNT = 1800;
const snowGeo = new THREE.BufferGeometry();
const snowPositions = new Float32Array(SNOW_COUNT * 3);
for (let i = 0; i < SNOW_COUNT; i++) {
  snowPositions[i * 3] = (Math.random() - 0.5) * 120;
  snowPositions[i * 3 + 1] = Math.random() * 55;
  snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 120;
}
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
const snowParticles = new THREE.Points(
  snowGeo,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.55, transparent: true, opacity: 0.9 })
);
snowParticles.visible = false;
scene.add(snowParticles);

function isNightLightActive() {
  return currentWeather === 'night' || currentWeather === 'sunset' || currentWeather === 'rain';
}

function applyLightingToNewPlot(group) {
  const emissiveVal = currentWeather === 'night' ? 1.4 : isNightLightActive() ? 0.82 : 0.22;
  if (group.userData.emissiveMeshes) {
    group.userData.emissiveMeshes.forEach((m) => {
      m.emissiveIntensity = emissiveVal;
    });
  }
}

function setWeather(mode) {
  currentWeather = mode;
  rainParticles.visible = mode === 'rain';
  snowParticles.visible = mode === 'snow';

  const configs = {
    sunny: {
      sky: 0x6ec6ff,
      fogColor: 0x6ec6ff,
      fogDensity: 0.0038,
      sunColor: 0xfff6e5,
      sunInt: 1.55,
      hemiInt: 0.9,
      sunPos: [55, 78, 45],
      groundColor: 0x90a4ae,
      cloudColor: 0xffffff,
      cloudEmissive: 0xdbeafe
    },
    sunset: {
      sky: 0xff7b54,
      fogColor: 0xff9770,
      fogDensity: 0.0055,
      sunColor: 0xff8c42,
      sunInt: 1.35,
      hemiInt: 0.68,
      sunPos: [-68, 26, 40],
      groundColor: 0x8d6e63,
      cloudColor: 0xffd1b3,
      cloudEmissive: 0xff7b54
    },
    night: {
      sky: 0x070d19,
      fogColor: 0x070d19,
      fogDensity: 0.006,
      sunColor: 0x5c7cfa,
      sunInt: 0.35,
      hemiInt: 0.32,
      sunPos: [-40, 60, -40],
      groundColor: 0x37474f,
      cloudColor: 0x1e293b,
      cloudEmissive: 0x0f172a
    },
    rain: {
      sky: 0x263238,
      fogColor: 0x263238,
      fogDensity: 0.0088,
      sunColor: 0x90a4ae,
      sunInt: 0.52,
      hemiInt: 0.45,
      sunPos: [20, 65, 20],
      groundColor: 0x455a64,
      cloudColor: 0x607d8b,
      cloudEmissive: 0x263238
    },
    snow: {
      sky: 0xcfd8dc,
      fogColor: 0xcfd8dc,
      fogDensity: 0.0085,
      sunColor: 0xffffff,
      sunInt: 0.98,
      hemiInt: 0.88,
      sunPos: [40, 65, 30],
      groundColor: 0xeceff1,
      cloudColor: 0xffffff,
      cloudEmissive: 0xe2e8f0
    },
    fog: {
      sky: 0xb0bec5,
      fogColor: 0xb0bec5,
      fogDensity: 0.0165,
      sunColor: 0xeceff1,
      sunInt: 0.68,
      hemiInt: 0.72,
      sunPos: [30, 50, 30],
      groundColor: 0x78909c,
      cloudColor: 0xe2e8f0,
      cloudEmissive: 0x94a3b8
    }
  };

  const cfg = configs[mode] || configs.sunny;
  scene.background.setHex(cfg.sky);
  scene.fog.color.setHex(cfg.fogColor);
  scene.fog.density = cfg.fogDensity;
  sunLight.color.setHex(cfg.sunColor);
  sunLight.intensity = cfg.sunInt;
  sunLight.position.set(...cfg.sunPos);
  hemiLight.intensity = cfg.hemiInt;

  // Tint Volumetric Clouds for current time/weather
  cloudsGroup.children.forEach((cg) => {
    if (cg.userData.coreMat) {
      cg.userData.coreMat.color.setHex(cfg.cloudColor);
      cg.userData.coreMat.emissive.setHex(cfg.cloudEmissive);
    }
    if (cg.userData.spriteMat) {
      cg.userData.spriteMat.color.setHex(cfg.cloudColor);
    }
  });

  if (window.__cityGroundMat) {
    window.__cityGroundMat.color.setHex(cfg.groundColor);
    window.__cityGroundMat.roughness = mode === 'rain' ? 0.2 : 0.85;
  }
  if (window.__cityRoadMat) {
    window.__cityRoadMat.roughness = mode === 'rain' ? 0.18 : 0.7;
  }

  const nightGlow = mode === 'night' ? 1.4 : isNightLightActive() ? 0.82 : 0.22;
  plots.forEach((p) => {
    if (p.contentGroup && p.contentGroup.userData.emissiveMeshes) {
      p.contentGroup.userData.emissiveMeshes.forEach((m) => {
        m.emissiveIntensity = nightGlow;
      });
    }
  });

  streetLamps.forEach((l) => {
    l.userData.bulbMat.emissiveIntensity = isNightLightActive() ? 1.65 : 0.15;
  });

  vehicles.forEach((v) => {
    v.userData.beamMat.opacity = isNightLightActive() || mode === 'fog' ? 0.26 : 0.0;
  });

  const umbrellaActive = mode === 'rain' || mode === 'snow';
  pedestrians.forEach((ped) => {
    ped.userData.umbrella.visible = umbrellaActive;
  });
}

// --- 3D Tower Bloxx Crane Mini-Game ---
const bloxxState = {
  active: false,
  targetPlot: null,
  towerGroup: null,
  craneGroup: null,
  swingBlock: null,
  floors: [],
  targetFloors: 8,
  combo: 1,
  scorePop: 0,
  swingTime: 0,
  dropping: false,
  dropVelY: 0,
  wobblePhase: 0
};

function startTowerBloxxOnPlot(plotObj) {
  if (!plotObj) {
    plotObj = plots.find((p) => p.row === 2 && p.col === 1) || plots[7];
  }

  bloxxState.active = true;
  bloxxState.targetPlot = plotObj;
  bloxxState.floors = [];
  bloxxState.combo = 1;
  bloxxState.scorePop = 0;
  bloxxState.dropping = false;
  bloxxState.targetFloors = 8;

  if (plotObj.contentGroup) {
    scene.remove(plotObj.contentGroup);
  }

  const towerGroup = new THREE.Group();
  towerGroup.position.set(plotObj.x, 0, plotObj.z);

  const basePad = new THREE.Mesh(
    new THREE.BoxGeometry(PLOT_SIZE - 0.4, 0.4, PLOT_SIZE - 0.4),
    new THREE.MeshStandardMaterial({ map: createSidewalkTexture(), roughness: 0.8 })
  );
  basePad.position.y = 0.2;
  basePad.receiveShadow = true;
  towerGroup.add(basePad);

  const trees = [];
  [[-4.2, -4.2], [4.2, -4.2], [-4.2, 4.2], [4.2, 4.2]].forEach(([tx, tz], idx) => {
    const tr = createTreeMesh(idx % 2 === 0 ? 'oak' : 'cherry');
    tr.position.set(tx, 0.3, tz);
    tr.scale.setScalar(0.8);
    towerGroup.add(tr);
    trees.push(tr);
  });

  const stackedContainer = new THREE.Group();
  stackedContainer.position.y = 0.4;
  towerGroup.add(stackedContainer);

  towerGroup.userData = {
    entityType: 'building',
    subType: 'tower-bloxx',
    title: '🏗️ 3D 摩天大楼 (自定义吊装)',
    desc: '由玩家亲手通过 3D 吊钩叠建而成的摩天大楼！',
    population: 40,
    treesCount: 4,
    trees,
    emissiveMeshes: [],
    stackedContainer,
    plotRef: plotObj
  };

  scene.add(towerGroup);
  plotObj.contentGroup = towerGroup;
  bloxxState.towerGroup = towerGroup;

  if (bloxxState.craneGroup) scene.remove(bloxxState.craneGroup);
  const craneGroup = new THREE.Group();
  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 })
  );
  cable.position.y = 6;
  const hookClamp = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.4, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xffc300, roughness: 0.3 })
  );
  hookClamp.position.y = 0;
  craneGroup.add(cable, hookClamp);
  scene.add(craneGroup);
  bloxxState.craneGroup = craneGroup;

  const firstFloor = createTowerBloxxFloor(0);
  firstFloor.position.set(0, 1.1, 0);
  stackedContainer.add(firstFloor);
  towerGroup.userData.emissiveMeshes.push(firstFloor.userData.emissiveMat);
  bloxxState.floors.push(firstFloor);
  bloxxState.scorePop = 35;

  spawnNextSwingBlock();
  updateBloxxHUD();
  document.getElementById('bloxx-hud').classList.remove('hidden');

  cameraMode = 'orbit';
  updateCameraButtonsUI();
  controls.target.set(plotObj.x, 6, plotObj.z);
  camera.position.set(plotObj.x + 18, 16, plotObj.z + 22);
}

function spawnNextSwingBlock() {
  if (bloxxState.swingBlock) {
    scene.remove(bloxxState.swingBlock);
  }
  const nextFloor = createTowerBloxxFloor(bloxxState.floors.length);
  scene.add(nextFloor);
  bloxxState.swingBlock = nextFloor;
  bloxxState.dropping = false;
  bloxxState.dropVelY = 0;
}

function dropActiveBloxxFloor() {
  if (!bloxxState.active || bloxxState.dropping || !bloxxState.swingBlock) return;
  bloxxState.dropping = true;
  bloxxState.dropVelY = -18;
  vibrateDevice(15);
}

function showBloxxFeedback(text, color = '#00e5ff') {
  const el = document.getElementById('bloxx-feedback');
  el.textContent = text;
  el.style.color = color;
  el.style.transform = 'scale(1.2)';
  setTimeout(() => {
    el.style.transform = 'scale(1.0)';
  }, 160);
}

function finishTowerBloxx() {
  if (!bloxxState.active) return;

  const stackedContainer = bloxxState.towerGroup.userData.stackedContainer;
  const topFloor = bloxxState.floors[bloxxState.floors.length - 1];
  const roof = createTowerBloxxRoof();
  roof.position.set(topFloor.position.x, topFloor.position.y + 1.1, topFloor.position.z);
  stackedContainer.add(roof);

  if (bloxxState.swingBlock) {
    scene.remove(bloxxState.swingBlock);
    bloxxState.swingBlock = null;
  }
  if (bloxxState.craneGroup) {
    scene.remove(bloxxState.craneGroup);
    bloxxState.craneGroup = null;
  }

  bloxxState.towerGroup.userData.population = bloxxState.scorePop;
  bloxxState.towerGroup.userData.desc = `共 ${bloxxState.floors.length} 层摩天塔楼 · 入住 ${bloxxState.scorePop} 人 · 配有经典红尖顶与金旗`;
  bloxxState.active = false;
  document.getElementById('bloxx-hud').classList.add('hidden');
  sfx.playBuild();
  vibrateDevice([40, 60, 80]);
  updateHUDStats();
}

function updateBloxxHUD() {
  document.getElementById('bloxx-floor').textContent = bloxxState.floors.length;
  document.getElementById('bloxx-target').textContent = bloxxState.targetFloors;
  document.getElementById('bloxx-combo').textContent = `x${bloxxState.combo}`;
  document.getElementById('bloxx-score').textContent = bloxxState.scorePop;
}

function updateTowerBloxx(dt) {
  if (!bloxxState.active || !bloxxState.towerGroup) return;

  const plotX = bloxxState.targetPlot.x;
  const plotZ = bloxxState.targetPlot.z;
  const currentTopY = bloxxState.floors.length * 2.2 + 0.4;
  const craneHeight = currentTopY + 5.8;

  bloxxState.swingTime += dt * (2.1 + bloxxState.floors.length * 0.08);
  const swingRadius = 3.2;
  const swingX = Math.sin(bloxxState.swingTime) * swingRadius;
  const swingZ = Math.cos(bloxxState.swingTime * 0.7) * (swingRadius * 0.45);

  if (bloxxState.craneGroup) {
    bloxxState.craneGroup.position.set(plotX + swingX, craneHeight + 1.2, plotZ + swingZ);
  }

  bloxxState.wobblePhase += dt * 2.5;
  const stackedContainer = bloxxState.towerGroup.userData.stackedContainer;
  if (stackedContainer && bloxxState.floors.length > 3) {
    stackedContainer.rotation.z = Math.sin(bloxxState.wobblePhase) * 0.012;
  }

  if (!bloxxState.swingBlock) return;

  if (!bloxxState.dropping) {
    bloxxState.swingBlock.position.set(plotX + swingX, craneHeight, plotZ + swingZ);
    bloxxState.swingBlock.rotation.z = -swingX * 0.05;
  } else {
    bloxxState.dropVelY -= 28 * dt;
    bloxxState.swingBlock.position.y += bloxxState.dropVelY * dt;

    const targetLandingY = currentTopY + 1.1;
    if (bloxxState.swingBlock.position.y <= targetLandingY) {
      const prevFloor = bloxxState.floors[bloxxState.floors.length - 1];
      const localX = bloxxState.swingBlock.position.x - plotX;
      const localZ = bloxxState.swingBlock.position.z - plotZ;
      const dist = Math.hypot(localX - prevFloor.position.x, localZ - prevFloor.position.z);

      if (dist < 2.65) {
        const isPerfect = dist < 0.55;
        if (isPerfect) {
          bloxxState.combo += 1;
          showBloxxFeedback(`✨ PERFECT 完美对齐! x${bloxxState.combo}`, '#ffc400');
          vibrateDevice([30, 40, 60]);
        } else {
          bloxxState.combo = 1;
          showBloxxFeedback('👍 GOOD 稳固叠层!', '#00e5ff');
          vibrateDevice(30);
        }

        sfx.playDrop(bloxxState.combo, isPerfect);

        scene.remove(bloxxState.swingBlock);
        const landed = bloxxState.swingBlock;
        landed.rotation.set(0, 0, 0);
        landed.position.set(
          isPerfect ? prevFloor.position.x : localX * 0.65 + prevFloor.position.x * 0.35,
          bloxxState.floors.length * 2.2 + 1.1,
          isPerfect ? prevFloor.position.z : localZ * 0.65 + prevFloor.position.z * 0.35
        );
        stackedContainer.add(landed);
        bloxxState.towerGroup.userData.emissiveMeshes.push(landed.userData.emissiveMat);
        bloxxState.floors.push(landed);
        bloxxState.swingBlock = null;
        bloxxState.scorePop += 35 * bloxxState.combo;

        updateBloxxHUD();
        controls.target.set(plotX, currentTopY * 0.65 + 4, plotZ);
        camera.position.y = Math.max(camera.position.y, currentTopY + 12);

        if (bloxxState.floors.length >= bloxxState.targetFloors) {
          showBloxxFeedback('🎉 摩天大楼封顶大吉！', '#00e676');
          setTimeout(() => finishTowerBloxx(), 650);
        } else {
          spawnNextSwingBlock();
        }
      } else {
        sfx.playMiss();
        vibrateDevice([80, 50, 80]);
        bloxxState.combo = 1;
        showBloxxFeedback('💥 偏离中心，重新吊装！', '#ff5252');
        updateBloxxHUD();
        spawnNextSwingBlock();
      }
    }
  }
}

// --- HUD Stats & Inspector ---
function updateHUDStats() {
  let pop = 0;
  let bCount = 0;
  let treeTotal = allTrees.length;

  plots.forEach((p) => {
    if (p.contentGroup) {
      const ud = p.contentGroup.userData;
      pop += ud.population || 0;
      if (ud.entityType === 'building') bCount++;
      treeTotal += ud.treesCount || 0;
    }
  });

  document.getElementById('stat-pop').textContent = pop.toLocaleString();
  document.getElementById('stat-buildings').textContent = bCount;
  document.getElementById('stat-trees').textContent = treeTotal;
}

// --- Raycasting & User Interaction ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let activeTool = 'inspect';
let cameraMode = 'orbit';
let followedEntity = null;
let pointerDownPos = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('pointerup', (e) => {
  const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (moveDist > 9) return;

  if (bloxxState.active) {
    dropActiveBloxxFloor();
    return;
  }

  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);
  if (!intersects.length) return;

  let hitObj = intersects[0].object;
  let foundEntity = null;
  let foundPlot = null;

  while (hitObj) {
    if (hitObj.userData && hitObj.userData.entityType) foundEntity = hitObj;
    if (hitObj.userData && hitObj.userData.plotRef) foundPlot = hitObj.userData.plotRef;
    hitObj = hitObj.parent;
  }

  if (activeTool === 'inspect') {
    if (foundEntity) {
      openInspector(foundEntity);
    }
  } else if (activeTool === 'tower-bloxx' && foundPlot) {
    startTowerBloxxOnPlot(foundPlot);
  } else if (activeTool === 'build-skyscraper' && foundPlot) {
    populatePlot(foundPlot, 'skyscraper', true);
  } else if (activeTool === 'build-residential' && foundPlot) {
    populatePlot(foundPlot, 'residential', true);
  } else if (activeTool === 'build-shop' && foundPlot) {
    populatePlot(foundPlot, 'shop', true);
  } else if (activeTool === 'build-park' && foundPlot) {
    populatePlot(foundPlot, 'park', true);
  } else if (activeTool === 'demolish' && foundPlot) {
    populatePlot(foundPlot, 'empty', true);
  }
});

function openInspector(entity) {
  const ud = entity.userData;
  document.getElementById('insp-title').textContent = ud.title || '城市设施';
  document.getElementById('insp-desc').textContent = ud.desc || '';
  document.getElementById('inspector-card').classList.remove('hidden');

  const craneBtn = document.getElementById('insp-crane');
  if (ud.plotRef) {
    craneBtn.classList.remove('hidden');
    craneBtn.onclick = () => {
      document.getElementById('inspector-card').classList.add('hidden');
      startTowerBloxxOnPlot(ud.plotRef);
    };
  } else {
    craneBtn.classList.add('hidden');
  }

  document.getElementById('insp-follow').onclick = () => {
    if (ud.entityType === 'vehicle') {
      followedEntity = entity;
      cameraMode = 'car';
      updateCameraButtonsUI();
    } else if (ud.entityType === 'pedestrian') {
      followedEntity = entity;
      cameraMode = 'ped';
      updateCameraButtonsUI();
    } else {
      cameraMode = 'orbit';
      controls.target.copy(entity.position);
      camera.position.set(entity.position.x + 18, 18, entity.position.z + 18);
      updateCameraButtonsUI();
    }
  };
}

// --- UI Bindings & Mobile Drawer ---
const rightPanel = document.getElementById('right-panel');
const mobileDrawerBtn = document.getElementById('btn-mobile-drawer');
if (mobileDrawerBtn) {
  mobileDrawerBtn.addEventListener('click', () => {
    const isOpen = rightPanel.classList.toggle('mobile-open');
    mobileDrawerBtn.classList.toggle('active', isOpen);
    sfx.playTone(500, 0.06);
  });
}

document.getElementById('insp-close').onclick = () => {
  document.getElementById('inspector-card').classList.add('hidden');
};

document.querySelectorAll('#weather-buttons .weather-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#weather-buttons .weather-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    setWeather(btn.dataset.weather);
    sfx.playTone(520, 0.08);
  });
});

function updateCameraButtonsUI() {
  document.querySelectorAll('#camera-buttons .cam-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.cam === cameraMode);
  });
}

document.querySelectorAll('#camera-buttons .cam-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    cameraMode = btn.dataset.cam;
    updateCameraButtonsUI();
    if (cameraMode === 'car' && vehicles.length) {
      followedEntity = vehicles[Math.floor(Math.random() * vehicles.length)];
    } else if (cameraMode === 'ped' && pedestrians.length) {
      followedEntity = pedestrians[Math.floor(Math.random() * pedestrians.length)];
    } else if (cameraMode === 'orbit') {
      controls.target.set(0, 4, 0);
      camera.position.set(52, 42, 62);
    }
    sfx.playTone(440, 0.08);
  });
});

document.querySelectorAll('#bottom-dock .dock-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#bottom-dock .dock-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeTool = btn.dataset.tool;
    sfx.playTone(480, 0.08);

    if (activeTool === 'tower-bloxx') {
      startTowerBloxxOnPlot(plots[12]);
    }
  });
});

document.getElementById('btn-drop-block').onclick = () => dropActiveBloxxFloor();
document.getElementById('btn-finish-bloxx').onclick = () => finishTowerBloxx();

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && bloxxState.active) {
    e.preventDefault();
    dropActiveBloxxFloor();
  }
});

let simSpeed = 1.0;
document.getElementById('slider-cars').addEventListener('input', (e) => {
  const val = parseInt(e.target.value, 10);
  document.getElementById('val-cars').textContent = val;
  syncVehiclesCount(val);
});

document.getElementById('slider-peds').addEventListener('input', (e) => {
  const val = parseInt(e.target.value, 10);
  document.getElementById('val-peds').textContent = val;
  syncPedestriansCount(val);
});

document.getElementById('slider-speed').addEventListener('input', (e) => {
  simSpeed = parseFloat(e.target.value);
  document.getElementById('val-speed').textContent = `${simSpeed.toFixed(1)}x`;
});

document.getElementById('btn-audio').onclick = (e) => {
  const on = sfx.toggle();
  e.currentTarget.textContent = on ? '🔊' : '🔇';
};

document.getElementById('btn-help').onclick = () => {
  document.getElementById('help-modal').classList.remove('hidden');
};
document.getElementById('close-help').onclick = () => {
  document.getElementById('help-modal').classList.add('hidden');
};

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Initialize World ---
buildCityInfrastructure();
buildClouds();
syncVehiclesCount(18);
syncPedestriansCount(36);
setWeather('sunny');

// --- Main Animation Loop ---
const clock = new THREE.Clock();
let droneAngle = 0;
let lightningTimer = 5;

function animate() {
  requestAnimationFrame(animate);
  const rawDt = Math.min(clock.getDelta(), 0.05);
  const dt = rawDt * simSpeed;
  const elapsed = clock.elapsedTime;

  const windStrength = currentWeather === 'rain' ? 0.14 : 0.045;
  plots.forEach((p) => {
    const cg = p.contentGroup;
    if (!cg) return;
    if (cg.scale.x < 0.999) {
      cg.scale.lerp(new THREE.Vector3(1, 1, 1), 0.16);
    }
    if (cg.userData.fountainSpout) {
      cg.userData.fountainSpout.scale.y = 0.85 + Math.sin(elapsed * 5) * 0.22;
      cg.userData.fountainSpout.rotation.y += dt * 2.5;
    }
    if (cg.userData.trees) {
      cg.userData.trees.forEach((t) => {
        if (t.userData.foliage) {
          t.userData.foliage.rotation.z = Math.sin(elapsed * 2.2 + t.userData.swayPhase) * windStrength;
        }
      });
    }
  });

  allTrees.forEach((t) => {
    if (t.userData.foliage) {
      t.userData.foliage.rotation.z = Math.sin(elapsed * 2.0 + t.userData.swayPhase) * windStrength;
    }
  });

  // Drift & gently billow volumetric clouds
  cloudsGroup.children.forEach((c) => {
    c.position.x += c.userData.speed * dt;
    c.position.y += Math.sin(elapsed * 0.8 + c.userData.bobPhase) * 0.004;
    if (c.position.x > 85) c.position.x = -85;
  });

  if (currentWeather === 'rain') {
    const pos = rainGeo.attributes.position.array;
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3 + 1] -= 38 * rawDt;
      pos[i * 3] -= 4 * rawDt;
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 1] = 52;
        pos[i * 3] = (Math.random() - 0.5) * 120;
      }
    }
    rainGeo.attributes.position.needsUpdate = true;

    lightningTimer -= rawDt;
    if (lightningTimer <= 0) {
      sunLight.intensity = 3.8;
      sfx.playThunder();
      setTimeout(() => {
        if (currentWeather === 'rain') sunLight.intensity = 0.52;
      }, 110);
      lightningTimer = 6 + Math.random() * 8;
    }
  }

  if (currentWeather === 'snow') {
    const pos = snowGeo.attributes.position.array;
    for (let i = 0; i < SNOW_COUNT; i++) {
      pos[i * 3 + 1] -= 7.5 * rawDt;
      pos[i * 3] += Math.sin(elapsed + i) * 0.04;
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 1] = 52;
      }
    }
    snowGeo.attributes.position.needsUpdate = true;
  }

  vehicles.forEach((car) => updateVehicle(car, dt, ROAD_COORDS));
  pedestrians.forEach((ped) => updatePedestrian(ped, dt));

  updateTowerBloxx(rawDt);

  if (cameraMode === 'drone') {
    droneAngle += rawDt * 0.22;
    camera.position.set(Math.cos(droneAngle) * 62, 34 + Math.sin(droneAngle * 2) * 6, Math.sin(droneAngle) * 62);
    controls.target.set(0, 6, 0);
    controls.update();
  } else if (cameraMode === 'car' && followedEntity) {
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(followedEntity.quaternion);
    const camPos = followedEntity.position.clone().sub(forward.clone().multiplyScalar(5.5)).add(new THREE.Vector3(0, 2.6, 0));
    camera.position.lerp(camPos, 0.12);
    controls.target.lerp(followedEntity.position.clone().add(forward.multiplyScalar(6)), 0.18);
    controls.update();
  } else if (cameraMode === 'ped' && followedEntity) {
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(followedEntity.quaternion);
    const camPos = followedEntity.position.clone().sub(forward.clone().multiplyScalar(2.8)).add(new THREE.Vector3(0, 1.65, 0));
    camera.position.lerp(camPos, 0.14);
    controls.target.lerp(followedEntity.position.clone().add(forward.multiplyScalar(4)).add(new THREE.Vector3(0, 0.9, 0)), 0.18);
    controls.update();
  } else {
    controls.update();
  }

  renderer.render(scene, camera);
}

animate();
