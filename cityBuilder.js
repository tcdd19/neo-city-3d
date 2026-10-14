import * as THREE from 'three';

let maxAnisotropy = 8;
export function setMaxAnisotropy(val) {
  maxAnisotropy = val || 8;
}

function configureTexture(tex, repeatX = 1, repeatY = 1, isColor = true) {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.needsUpdate = true;
  return tex;
}

// Generate Procedural Sky & City Environment Map for Realistic Glass & Car Reflections
export function createCityEnvironmentMap(renderer, skyTopHex = '#3a86ff', skyHorizonHex = '#bce0fd', groundHex = '#1e293b') {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, skyTopHex);
  grad.addColorStop(0.48, skyHorizonHex);
  grad.addColorStop(0.52, groundHex);
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Add bright sun/cloud reflection highlights in sky band
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.beginPath();
  ctx.arc(140, 64, 28, 0, Math.PI * 2);
  ctx.fill();

  const envTex = new THREE.CanvasTexture(canvas);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  envTex.colorSpace = THREE.SRGBColorSpace;

  const envMap = pmrem.fromEquirectangular(envTex).texture;
  envTex.dispose();
  pmrem.dispose();
  return envMap;
}

// High-Definition Curtain Wall Glass & Architectural Facade Material
export function createPBRFacadeMaterial({
  wallColor = '#1e293b',
  wallAccent = '#0f172a',
  frameColor = '#475569',
  glassUnlit = '#0c192c',
  litColors = ['#fff3b0', '#ffd166', '#a8f9ff', '#ffffff'],
  cols = 8,
  rows = 16,
  litChance = 0.55,
  isCurtainWall = true
}) {
  const width = 1024;
  const height = 1024;

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d');

  const emiCanvas = document.createElement('canvas');
  emiCanvas.width = width;
  emiCanvas.height = height;
  const eCtx = emiCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d');

  dCtx.fillStyle = wallColor;
  dCtx.fillRect(0, 0, width, height);

  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, width, height);

  rCtx.fillStyle = isCurtainWall ? '#383838' : '#b8b8b8';
  rCtx.fillRect(0, 0, width, height);

  const cellW = width / cols;
  const cellH = height / rows;

  for (let r = 0; r < rows; r++) {
    const y0 = r * cellH;
    dCtx.fillStyle = wallAccent;
    dCtx.fillRect(0, y0, width, cellH * 0.14);

    for (let c = 0; c < cols; c++) {
      const x0 = c * cellW;
      const padX = isCurtainWall ? cellW * 0.07 : cellW * 0.15;
      const padY = isCurtainWall ? cellH * 0.12 : cellH * 0.18;

      const wx = x0 + padX;
      const wy = y0 + padY;
      const ww = cellW - padX * 2;
      const wh = cellH - padY * 1.8;

      // Metallic Mullion Frame
      dCtx.fillStyle = frameColor;
      dCtx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
      rCtx.fillStyle = '#606060';
      rCtx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);

      // Mirror-smooth glass roughness
      rCtx.fillStyle = '#0d0d0d';
      rCtx.fillRect(wx, wy, ww, wh);

      const isLit = Math.random() < litChance;
      if (isLit) {
        const picked = litColors[Math.floor(Math.random() * litColors.length)];
        const grad = dCtx.createLinearGradient(wx, wy, wx, wy + wh);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, picked);
        grad.addColorStop(1, '#334155');
        dCtx.fillStyle = grad;
        dCtx.fillRect(wx, wy, ww, wh);

        const eGrad = eCtx.createLinearGradient(wx, wy, wx, wy + wh);
        eGrad.addColorStop(0, picked);
        eGrad.addColorStop(0.8, picked);
        eGrad.addColorStop(1, '#1e293b');
        eCtx.fillStyle = eGrad;
        eCtx.fillRect(wx + 2, wy + 2, ww - 4, wh - 4);

        // Interior room blinds / furniture depth lines
        if (Math.random() < 0.4) {
          const blindH = wh * (0.25 + Math.random() * 0.35);
          dCtx.fillStyle = 'rgba(15, 23, 42, 0.5)';
          dCtx.fillRect(wx, wy, ww, blindH);
          eCtx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          eCtx.fillRect(wx, wy, ww, blindH);
        }
      } else {
        const darkGrad = dCtx.createLinearGradient(wx, wy, wx + ww, wy + wh);
        darkGrad.addColorStop(0, '#2b4c6f');
        darkGrad.addColorStop(0.45, glassUnlit);
        darkGrad.addColorStop(1, '#091322');
        dCtx.fillStyle = darkGrad;
        dCtx.fillRect(wx, wy, ww, wh);
      }
    }
  }

  const diffTex = configureTexture(new THREE.CanvasTexture(diffCanvas), 1, 1, true);
  const emiTex = configureTexture(new THREE.CanvasTexture(emiCanvas), 1, 1, true);
  const roughTex = configureTexture(new THREE.CanvasTexture(roughCanvas), 1, 1, false);

  return new THREE.MeshStandardMaterial({
    map: diffTex,
    emissiveMap: emiTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.25,
    roughnessMap: roughTex,
    roughness: isCurtainWall ? 0.35 : 0.7,
    metalness: isCurtainWall ? 0.65 : 0.2,
    envMapIntensity: isCurtainWall ? 1.35 : 0.8
  });
}

// Soft Volumetric Cloud Sprite Texture (Fluffy Cumulus Puff with Sunlit Top & Shaded Base)
let CLOUD_PUFF_TEXTURE = null;
function getCloudPuffTexture() {
  if (CLOUD_PUFF_TEXTURE) return CLOUD_PUFF_TEXTURE;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(128, 118, 12, 128, 128, 120);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
  grad.addColorStop(0.45, 'rgba(250, 253, 255, 0.82)');
  grad.addColorStop(0.75, 'rgba(225, 238, 250, 0.35)');
  grad.addColorStop(1, 'rgba(225, 238, 250, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  CLOUD_PUFF_TEXTURE = new THREE.CanvasTexture(canvas);
  CLOUD_PUFF_TEXTURE.colorSpace = THREE.SRGBColorSpace;
  return CLOUD_PUFF_TEXTURE;
}

// Build Volumetric 3D Cumulus Cloud Cluster (Smooth Subsurface-Lit Spheres + Soft Feathered Billboards)
export function createVolumetricCloud() {
  const cloud = new THREE.Group();

  // Smooth high-segment cloud core material (no ugly low-poly facets!)
  const coreMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    emissive: 0xdbeafe,
    emissiveIntensity: 0.32,
    transparent: true,
    opacity: 0.94
  });

  // Soft outer halo sprite material for fluffy edges
  const spriteMat = new THREE.SpriteMaterial({
    map: getCloudPuffTexture(),
    color: 0xffffff,
    transparent: true,
    opacity: 0.78,
    depthWrite: false
  });

  // Volumetric cumulus layout: flat bottom, billowing dome top
  const puffs = [
    { x: 0, y: 1.1, z: 0, rx: 3.4, ry: 2.3, rz: 2.8 },
    { x: -2.4, y: 0.6, z: 0.4, rx: 2.6, ry: 1.8, rz: 2.2 },
    { x: 2.5, y: 0.7, z: -0.3, rx: 2.7, ry: 1.9, rz: 2.3 },
    { x: -1.1, y: 1.6, z: -0.6, rx: 2.4, ry: 2.1, rz: 2.1 },
    { x: 1.3, y: 1.5, z: 0.6, rx: 2.3, ry: 2.0, rz: 2.0 },
    { x: -4.1, y: 0.2, z: 0, rx: 1.9, ry: 1.3, rz: 1.7 },
    { x: 4.2, y: 0.25, z: 0.2, rx: 2.0, ry: 1.35, rz: 1.8 }
  ];

  const sphereGeo = new THREE.SphereGeometry(1, 24, 18);
  const coreMeshes = [];
  const haloSprites = [];

  puffs.forEach((p) => {
    const mesh = new THREE.Mesh(sphereGeo, coreMat);
    mesh.position.set(p.x, p.y, p.z);
    mesh.scale.set(p.rx, p.ry, p.rz);
    cloud.add(mesh);
    coreMeshes.push(mesh);

    // Add soft feathered volumetric billboard around each puff
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(p.x, p.y + 0.15, p.z);
    sprite.scale.set(p.rx * 3.1, p.ry * 2.9, 1);
    cloud.add(sprite);
    haloSprites.push(sprite);
  });

  cloud.userData = {
    speed: 1.1 + Math.random() * 1.4,
    bobPhase: Math.random() * Math.PI * 2,
    coreMat,
    spriteMat
  };
  return cloud;
}

export function createAsphaltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#232933';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 18000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 28 + Math.floor(Math.random() * 26);
    ctx.fillStyle = `rgb(${v},${v + 3},${v + 8})`;
    ctx.fillRect(x, y, 2, 2);
  }
  return configureTexture(new THREE.CanvasTexture(canvas), 6, 6, true);
}

export function createSidewalkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6c7a89';
  ctx.fillRect(0, 0, 512, 512);

  const tile = 64;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const shade = 104 + Math.floor(Math.random() * 14);
      ctx.fillStyle = `rgb(${shade},${shade + 6},${shade + 12})`;
      ctx.fillRect(c * tile + 2, r * tile + 2, tile - 4, tile - 4);
    }
  }
  return configureTexture(new THREE.CanvasTexture(canvas), 2, 2, true);
}

export function createGrassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2e6f32';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 14000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? '#388e3c' : '#255d29';
    ctx.fillRect(x, y, 2, 4);
  }
  return configureTexture(new THREE.CanvasTexture(canvas), 2, 2, true);
}

let SHARED_MATERIALS = null;
function getSharedMaterials() {
  if (SHARED_MATERIALS) return SHARED_MATERIALS;
  SHARED_MATERIALS = {
    skyscraperCyan: createPBRFacadeMaterial({
      wallColor: '#16283e',
      wallAccent: '#0d1b2a',
      frameColor: '#486581',
      glassUnlit: '#0b1d33',
      litColors: ['#a8f9ff', '#e0fbfc', '#ffd166', '#90e0ef'],
      cols: 8,
      rows: 16,
      litChance: 0.62,
      isCurtainWall: true
    }),
    skyscraperGold: createPBRFacadeMaterial({
      wallColor: '#252934',
      wallAccent: '#171a21',
      frameColor: '#7c6f5a',
      glassUnlit: '#141822',
      litColors: ['#ffe082', '#fff8e1', '#ffca28', '#b3e5fc'],
      cols: 8,
      rows: 16,
      litChance: 0.58,
      isCurtainWall: true
    }),
    residentialNokia: createPBRFacadeMaterial({
      wallColor: '#0096c7',
      wallAccent: '#0077b6',
      frameColor: '#e0fbfc',
      glassUnlit: '#022c43',
      litColors: ['#b7efc5', '#90e0ef', '#ffd166', '#fff3b0'],
      cols: 6,
      rows: 10,
      litChance: 0.68,
      isCurtainWall: false
    }),
    residentialNordic: createPBRFacadeMaterial({
      wallColor: '#e2d4c4',
      wallAccent: '#c8b6a6',
      frameColor: '#3d405b',
      glassUnlit: '#1d2d44',
      litColors: ['#ffe599', '#ffd166', '#fff8e1'],
      cols: 6,
      rows: 10,
      litChance: 0.65,
      isCurtainWall: false
    }),
    commercialNeon: createPBRFacadeMaterial({
      wallColor: '#1d1836',
      wallAccent: '#110e20',
      frameColor: '#5a189a',
      glassUnlit: '#10002b',
      litColors: ['#ff4d94', '#00f5d4', '#fee440', '#9b5de5'],
      cols: 6,
      rows: 8,
      litChance: 0.78,
      isCurtainWall: true
    }),
    sidewalkMat: new THREE.MeshStandardMaterial({
      map: createSidewalkTexture(),
      roughness: 0.82
    }),
    grassMat: new THREE.MeshStandardMaterial({
      map: createGrassTexture(),
      roughness: 0.88
    }),
    concreteMat: new THREE.MeshStandardMaterial({
      color: 0xdcdde1,
      roughness: 0.72,
      metalness: 0.1
    }),
    darkMetalMat: new THREE.MeshStandardMaterial({
      color: 0x2f3640,
      roughness: 0.32,
      metalness: 0.78
    }),
    glassBalconyMat: new THREE.MeshStandardMaterial({
      color: 0x90e0ef,
      transparent: true,
      opacity: 0.58,
      roughness: 0.1,
      metalness: 0.8
    }),
    terracottaRoofMat: new THREE.MeshStandardMaterial({
      color: 0xc0392b,
      roughness: 0.55,
      metalness: 0.15
    }),
    lobbyGlowMat: new THREE.MeshStandardMaterial({
      color: 0xfff3b0,
      emissive: 0xffd166,
      emissiveIntensity: 0.9,
      roughness: 0.2
    })
  };
  return SHARED_MATERIALS;
}

export function createTreeMesh(type = 'oak') {
  const group = new THREE.Group();
  group.userData.isTree = true;
  group.userData.swayPhase = Math.random() * Math.PI * 2;

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.92 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.26, 1.6, 10), trunkMat);
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  group.add(trunk);

  const foliageGroup = new THREE.Group();
  foliageGroup.position.y = 1.4;

  if (type === 'pine') {
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.75 });
    for (let i = 0; i < 4; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.22 - i * 0.24, 1.35 - i * 0.15, 12),
        pineMat
      );
      cone.position.y = i * 0.7 + 0.4;
      cone.castShadow = true;
      cone.receiveShadow = true;
      foliageGroup.add(cone);
    }
  } else if (type === 'cherry') {
    const cherryMat = new THREE.MeshStandardMaterial({ color: 0xff85a1, roughness: 0.6 });
    const puffs = [
      [0, 0.75, 0, 1.05],
      [0.58, 0.52, 0.4, 0.78],
      [-0.58, 0.55, -0.35, 0.82],
      [0.32, 1.18, -0.3, 0.72],
      [-0.25, 1.1, 0.38, 0.68]
    ];
    puffs.forEach(([x, y, z, r]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), cherryMat);
      m.scale.set(1, 0.82, 1);
      m.position.set(x, y, z);
      m.castShadow = true;
      foliageGroup.add(m);
    });
  } else {
    const colors = [0x388e3c, 0x43a047, 0x2e7d32];
    const oakMat = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      roughness: 0.68
    });
    const puffs = [
      [0, 0.78, 0, 1.12],
      [0.62, 0.52, 0.4, 0.8],
      [-0.58, 0.6, -0.4, 0.84],
      [-0.3, 1.18, 0.35, 0.75],
      [0.35, 1.1, -0.32, 0.7]
    ];
    puffs.forEach(([x, y, z, r]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), oakMat);
      m.scale.set(1, 0.84, 1);
      m.position.set(x, y, z);
      m.castShadow = true;
      foliageGroup.add(m);
    });
  }

  group.add(foliageGroup);
  group.userData.foliage = foliageGroup;
  return group;
}

export function createBushMesh() {
  const bush = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.78 });
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.42 - i * 0.05, 12, 10), mat);
    s.scale.set(1, 0.8, 1);
    s.position.set((i - 1) * 0.35, 0.28, (i % 2) * 0.18);
    s.castShadow = true;
    bush.add(s);
  }
  const flowerColors = [0xffeb3b, 0xff5252, 0xe040fb];
  const flowerMat = new THREE.MeshStandardMaterial({
    color: flowerColors[Math.floor(Math.random() * flowerColors.length)]
  });
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), flowerMat);
    f.position.set((Math.random() - 0.5) * 0.7, 0.52, (Math.random() - 0.5) * 0.4);
    bush.add(f);
  }
  return bush;
}

export function createParkPlot(plotSize = 12) {
  const mats = getSharedMaterials();
  const group = new THREE.Group();
  group.userData = {
    entityType: 'park',
    title: '🌳 城市生态花园广场',
    desc: '包含樱花林、松柏、景观步道、木质休闲长椅与多层中央音乐喷泉。',
    population: 0,
    treesCount: 9
  };

  const grass = new THREE.Mesh(
    new THREE.BoxGeometry(plotSize - 0.5, 0.35, plotSize - 0.5),
    mats.grassMat
  );
  grass.position.y = 0.175;
  grass.receiveShadow = true;
  group.add(grass);

  const path1 = new THREE.Mesh(new THREE.BoxGeometry(plotSize - 0.9, 0.38, 1.9), mats.sidewalkMat);
  path1.position.y = 0.19;
  path1.receiveShadow = true;
  const path2 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.38, plotSize - 0.9), mats.sidewalkMat);
  path2.position.y = 0.19;
  path2.receiveShadow = true;
  group.add(path1, path2);

  // Multi-tiered Central Fountain
  const fountainRim = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.4, 0.65, 28),
    mats.concreteMat
  );
  fountainRim.position.y = 0.5;
  fountainRim.castShadow = true;
  group.add(fountainRim);

  const midTier = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.15, 0.9, 20),
    mats.concreteMat
  );
  midTier.position.y = 0.95;
  group.add(midTier);

  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(1.95, 1.95, 0.58, 28),
    new THREE.MeshStandardMaterial({
      color: 0x00bcd4,
      emissive: 0x006064,
      emissiveIntensity: 0.4,
      roughness: 0.08,
      metalness: 0.5
    })
  );
  water.position.y = 0.6;
  group.add(water);

  const spout = new THREE.Mesh(
    new THREE.ConeGeometry(0.65, 1.9, 20),
    new THREE.MeshStandardMaterial({
      color: 0x80deea,
      transparent: true,
      opacity: 0.78,
      emissive: 0x00acc1,
      emissiveIntensity: 0.5
    })
  );
  spout.position.y = 1.65;
  group.add(spout);
  group.userData.fountainSpout = spout;

  const treeTypes = ['oak', 'cherry', 'pine', 'oak'];
  const offsets = [
    [-3.6, -3.6],
    [3.6, -3.6],
    [-3.6, 3.6],
    [3.6, 3.6],
    [-4.2, 0],
    [4.2, 0],
    [0, -4.2],
    [0, 4.2]
  ];
  const trees = [];
  offsets.forEach(([x, z], idx) => {
    if (Math.abs(x) < 1.2 || Math.abs(z) < 1.2) {
      const b = createBushMesh();
      b.position.set(x > 0 ? 2.5 : -2.5, 0.35, z > 0 ? 2.5 : -2.5);
      group.add(b);
    } else {
      const t = createTreeMesh(treeTypes[idx % treeTypes.length]);
      t.position.set(x, 0.3, z);
      t.scale.setScalar(0.85 + Math.random() * 0.3);
      group.add(t);
      trees.push(t);
    }
  });

  group.userData.trees = trees;
  return group;
}

// Helper: Add 3D Horizontal Architectural Ledges & Vertical Mullion Ribs onto a Building Tier
function addArchitectural3DDetail(parentGroup, width, height, depth, baseY, ledgeMat, ribMat, floorStep = 2.4) {
  // Protruding 3D horizontal floor slab ledges
  for (let y = floorStep; y <= height; y += floorStep) {
    const ledge = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.28, 0.16, depth + 0.28),
      ledgeMat
    );
    ledge.position.y = baseY + y;
    ledge.castShadow = true;
    parentGroup.add(ledge);
  }

  // Vertical structural columns on corners and mid-faces
  const colPositions = [
    [-width / 2, -depth / 2],
    [width / 2, -depth / 2],
    [-width / 2, depth / 2],
    [width / 2, depth / 2],
    [0, -depth / 2],
    [0, depth / 2],
    [-width / 2, 0],
    [width / 2, 0]
  ];
  colPositions.forEach(([cx, cz]) => {
    const col = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, height, 0.32),
      ribMat
    );
    col.position.set(cx, baseY + height / 2, cz);
    col.castShadow = true;
    parentGroup.add(col);
  });
}

// Helper: Add 3D Extruded Balconies on Residential Faces
function addResidential3DBalconies(parentGroup, width, height, depth, baseY, slabMat, glassMat) {
  const numFloors = Math.floor(height / 2.2);
  for (let f = 1; f < numFloors; f++) {
    const fy = baseY + f * 2.2;
    [-1.1, 1.1].forEach((bx) => {
      if (Math.abs(bx) + 0.8 > width / 2) return;
      // Front & Back 3D balconies
      [1, -1].forEach((dirZ) => {
        const bz = dirZ * (depth / 2 + 0.32);
        const slab = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.14, 0.68), slabMat);
        slab.position.set(bx, fy, bz);
        slab.castShadow = true;
        parentGroup.add(slab);

        const rail = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.42, 0.06), glassMat);
        rail.position.set(bx, fy + 0.28, bz + dirZ * 0.3);
        parentGroup.add(rail);
      });
    });
  }
}

export function createBuildingPlot(style = 'skyscraper', plotSize = 12) {
  const mats = getSharedMaterials();
  const group = new THREE.Group();

  // High-res stone tiled plaza base with curb
  const basePad = new THREE.Mesh(
    new THREE.BoxGeometry(plotSize - 0.4, 0.36, plotSize - 0.4),
    mats.sidewalkMat
  );
  basePad.position.y = 0.18;
  basePad.receiveShadow = true;
  group.add(basePad);

  const emissiveMeshes = [];
  const trees = [];

  if (style === 'skyscraper') {
    const variant = Math.floor(Math.random() * 2); // 0: Setback Terraced Tower, 1: Twin-Core Skybridge Tower
    const baseMat = Math.random() > 0.45 ? mats.skyscraperCyan : mats.skyscraperGold;
    const mat = baseMat.clone();
    emissiveMeshes.push(mat);

    // 1. Recessed Glowing Glass Lobby Colonnade (挑空柱廊大堂)
    const lobbyCore = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.6, 6.2), mats.lobbyGlowMat);
    lobbyCore.position.y = 1.65;
    group.add(lobbyCore);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.32, 7.6), mats.darkMetalMat);
    canopy.position.y = 2.95;
    canopy.castShadow = true;
    group.add(canopy);

    // Entrance Canopy overhang
    const entranceAwning = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 1.8), mats.darkMetalMat);
    entranceAwning.position.set(0, 2.4, 4.1);
    entranceAwning.castShadow = true;
    group.add(entranceAwning);

    let totalHeight = 22;

    if (variant === 0) {
      // Multi-Tier Setback Skyscraper with 3D Floor Ledges & Sky-Garden Terraces
      const h1 = 12 + Math.floor(Math.random() * 4);
      const h2 = 8 + Math.floor(Math.random() * 4);
      const h3 = 5 + Math.floor(Math.random() * 3);
      totalHeight = 3.0 + h1 + h2 + h3;

      // Tier 1
      const t1 = new THREE.Mesh(new THREE.BoxGeometry(7.0, h1, 7.0), mat);
      t1.position.y = 3.0 + h1 / 2;
      t1.castShadow = true;
      t1.receiveShadow = true;
      group.add(t1);
      addArchitectural3DDetail(group, 7.0, h1, 7.0, 3.0, mats.concreteMat, mats.darkMetalMat, 2.4);

      // Tier 2 (Setback)
      const y2 = 3.0 + h1;
      const t2 = new THREE.Mesh(new THREE.BoxGeometry(5.4, h2, 5.4), mat);
      t2.position.y = y2 + h2 / 2;
      t2.castShadow = true;
      t2.receiveShadow = true;
      group.add(t2);
      addArchitectural3DDetail(group, 5.4, h2, 5.4, y2, mats.concreteMat, mats.darkMetalMat, 2.4);

      // Tier 3 (Penthouse Crown)
      const y3 = y2 + h2;
      const t3 = new THREE.Mesh(new THREE.BoxGeometry(3.8, h3, 3.8), mat);
      t3.position.y = y3 + h3 / 2;
      t3.castShadow = true;
      group.add(t3);
      addArchitectural3DDetail(group, 3.8, h3, 3.8, y3, mats.concreteMat, mats.darkMetalMat, 2.4);
    } else {
      // Twin-Core Financial Tower with High-Altitude Glass Skybridge!
      const h = 20 + Math.floor(Math.random() * 8);
      totalHeight = 3.0 + h;

      [-2.1, 2.1].forEach((tx) => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(3.1, h, 6.4), mat);
        wing.position.set(tx, 3.0 + h / 2, 0);
        wing.castShadow = true;
        wing.receiveShadow = true;
        group.add(wing);

        // Horizontal louvers on each wing
        for (let y = 2.5; y <= h; y += 2.5) {
          const ledge = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.15, 6.6), mats.darkMetalMat);
          ledge.position.set(tx, 3.0 + y, 0);
          group.add(ledge);
        }
      });

      // Skybridge connecting the twin towers
      const bridgeY = 3.0 + h * 0.62;
      const skybridge = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 3.6), mats.glassBalconyMat);
      skybridge.position.set(0, bridgeY, 0);
      skybridge.castShadow = true;
      group.add(skybridge);

      const bridgeFrameTop = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.25, 3.8), mats.darkMetalMat);
      bridgeFrameTop.position.set(0, bridgeY + 1.25, 0);
      const bridgeFrameBot = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.25, 3.8), mats.darkMetalMat);
      bridgeFrameBot.position.set(0, bridgeY - 1.25, 0);
      group.add(bridgeFrameTop, bridgeFrameBot);
    }

    // Rooftop Helipad + HVAC Units + Communication Spire
    const helipad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.6, 0.25, 24),
      mats.darkMetalMat
    );
    helipad.position.y = totalHeight + 0.15;
    group.add(helipad);

    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.22, 4.8, 12),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.9, roughness: 0.15 })
    );
    spire.position.set(0, totalHeight + 2.4, 0);
    group.add(spire);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xff1744, emissive: 0xff1744, emissiveIntensity: 2.0 })
    );
    beacon.position.set(0, totalHeight + 4.9, 0);
    group.add(beacon);

    [[-4.4, -4.4], [4.4, 4.4], [-4.4, 4.4]].forEach(([tx, tz], i) => {
      const tr = createTreeMesh(i % 2 === 0 ? 'oak' : 'pine');
      tr.position.set(tx, 0.3, tz);
      tr.scale.setScalar(0.8);
      group.add(tr);
      trees.push(tr);
    });

    const pop = Math.round(totalHeight * 15);
    group.userData = {
      entityType: 'building',
      subType: 'skyscraper',
      title: variant === 0 ? '🏙️ 退台式 3D 玻璃幕墙摩天大厦' : '🏙️ 双子连廊金融中心大厦',
      desc: `楼高 ${totalHeight} 米 · 3D 挑檐立柱、底层透光柱廊与高空玻璃天桥 · 容纳 ${pop} 人`,
      population: pop,
      treesCount: trees.length,
      trees,
      emissiveMeshes
    };
  } else if (style === 'residential') {
    const height = 11 + Math.floor(Math.random() * 5);
    const isNokiaStyle = Math.random() > 0.4;
    const mat = (isNokiaStyle ? mats.residentialNokia : mats.residentialNordic).clone();
    emissiveMeshes.push(mat);

    // Ground Floor Stone Podium + Porch
    const podium = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.8, 7.8), mats.concreteMat);
    podium.position.set(-1.5, 1.1, 0);
    podium.castShadow = true;
    group.add(podium);

    // Main Apartment Wing A
    const wingA = new THREE.Mesh(new THREE.BoxGeometry(4.5, height, 7.5), mat);
    wingA.position.set(-1.5, height / 2 + 0.36, 0);
    wingA.castShadow = true;
    wingA.receiveShadow = true;
    group.add(wingA);

    // Add real 3D protruding balconies with glass railings!
    addResidential3DBalconies(group, 4.5, height, 7.5, 0.36, mats.concreteMat, mats.glassBalconyMat);
    addArchitectural3DDetail(group, 4.5, height, 7.5, 0.36, mats.concreteMat, mats.concreteMat, 2.2);

    // Wing B (Stepped Garden Villa Wing)
    const hB = height * 0.76;
    const wingB = new THREE.Mesh(new THREE.BoxGeometry(4.0, hB, 4.6), mat);
    wingB.position.set(2.1, hB / 2 + 0.36, 1.3);
    wingB.castShadow = true;
    wingB.receiveShadow = true;
    group.add(wingB);

    // Pitched 3D Roofs & Classic Nokia Gold Trim
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xffc300, roughness: 0.3, metalness: 0.25 });
    const corniceA = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.45, 7.9), trimMat);
    corniceA.position.set(-1.5, height + 0.55, 0);
    group.add(corniceA);

    // Pitched Gables / Penthouse Roof on Wing A & Wing B
    const pitchedRoofA = new THREE.Mesh(
      new THREE.ConeGeometry(3.6, 2.1, 4),
      mats.terracottaRoofMat
    );
    pitchedRoofA.rotation.y = Math.PI / 4;
    pitchedRoofA.scale.set(1.0, 1.0, 1.55);
    pitchedRoofA.position.set(-1.5, height + 1.75, 0);
    pitchedRoofA.castShadow = true;
    group.add(pitchedRoofA);

    // Rooftop Solar Panel & Chimney
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.6, 0.55), mats.concreteMat);
    chimney.position.set(-2.4, height + 1.5, -2.0);
    group.add(chimney);

    // Rooftop Garden on Wing B
    const roofGardenGrass = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.25, 4.4), mats.grassMat);
    roofGardenGrass.position.set(2.1, hB + 0.48, 1.3);
    group.add(roofGardenGrass);

    // Courtyard Cherry & Pine Trees + Bushes
    const t1 = createTreeMesh('cherry');
    t1.position.set(2.6, 0.3, -2.9);
    t1.scale.setScalar(0.9);
    const t2 = createTreeMesh('pine');
    t2.position.set(4.2, 0.3, -1.2);
    t2.scale.setScalar(0.8);
    const b1 = createBushMesh();
    b1.position.set(1.4, 0.35, -3.8);
    group.add(t1, t2, b1);
    trees.push(t1, t2);

    const pop = Math.round(height * 12);
    group.userData = {
      entityType: 'building',
      subType: 'residential',
      title: '🏘️ 北欧坡顶 3D 阳台花园洋房',
      desc: `真 3D 凸出式玻璃阳台、红瓦坡屋顶、空中花园与樱花庭院 · 居住 ${pop} 人`,
      population: pop,
      treesCount: trees.length,
      trees,
      emissiveMeshes
    };
  } else {
    // 3D Commercial Plaza with Storefronts, Striped Awnings, Rooftop Terraces & Neon Pillars
    const height = 7.2 + Math.random() * 2.5;
    const mat = mats.commercialNeon.clone();
    emissiveMeshes.push(mat);

    const mall = new THREE.Mesh(new THREE.BoxGeometry(8.2, height, 8.2), mat);
    mall.position.y = height / 2 + 0.36;
    mall.castShadow = true;
    mall.receiveShadow = true;
    group.add(mall);

    addArchitectural3DDetail(group, 8.2, height, 8.2, 0.36, mats.darkMetalMat, mats.darkMetalMat, 2.4);

    // 3D Storefront Awnings (立体遮阳棚) along street level
    const awningMat = new THREE.MeshStandardMaterial({
      color: 0xff2a85,
      emissive: 0xff2a85,
      emissiveIntensity: 0.45,
      roughness: 0.4
    });
    [-2.4, 0, 2.4].forEach((ax) => {
      const awning = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.25, 1.1), awningMat);
      awning.position.set(ax, 2.15, 4.45);
      awning.rotation.x = 0.28;
      awning.castShadow = true;
      group.add(awning);
    });

    // Glowing 3D Neon Crown & Vertical Blade Signboards
    const neonCrown = new THREE.Mesh(
      new THREE.BoxGeometry(8.55, 0.38, 8.55),
      new THREE.MeshStandardMaterial({
        color: 0x00f5d4,
        emissive: 0x00f5d4,
        emissiveIntensity: 1.5
      })
    );
    neonCrown.position.y = height + 0.52;
    group.add(neonCrown);

    const neonSign = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 1.45, 0.35),
      new THREE.MeshStandardMaterial({
        color: 0x00f5d4,
        emissive: 0x00f5d4,
        emissiveIntensity: 1.35
      })
    );
    neonSign.position.set(0, height + 1.35, 3.85);

    const neonSignPink = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 4.5, 1.2),
      new THREE.MeshStandardMaterial({
        color: 0xff2a85,
        emissive: 0xff2a85,
        emissiveIntensity: 1.45
      })
    );
    neonSignPink.position.set(4.35, height * 0.65, 2.2);
    group.add(neonSign, neonSignPink);

    const t1 = createTreeMesh('cherry');
    t1.position.set(-4.3, 0.3, 4.3);
    t1.scale.setScalar(0.82);
    group.add(t1);
    trees.push(t1);

    const pop = 110;
    group.userData = {
      entityType: 'building',
      subType: 'shop',
      title: '🏪 赛博霓虹 3D 商业天街',
      desc: `3D 街道遮阳棚、发光屋顶灯带与全息霓虹招牌 · 容纳客流 ${pop} 人`,
      population: pop,
      treesCount: trees.length,
      trees,
      emissiveMeshes
    };
  }

  return group;
}

export function createTowerBloxxFloor() {
  const mats = getSharedMaterials();
  const blockGroup = new THREE.Group();
  const width = 4.8;
  const height = 2.2;
  const depth = 4.8;

  const bodyMat = mats.residentialNokia.clone();
  bodyMat.map = bodyMat.map.clone();
  bodyMat.map.repeat.set(1, 0.25);
  bodyMat.map.needsUpdate = true;

  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  blockGroup.add(body);

  // 3D Corner Pilasters on each Tower Bloxx block!
  [
    [-width / 2, -depth / 2],
    [width / 2, -depth / 2],
    [-width / 2, depth / 2],
    [width / 2, depth / 2]
  ].forEach(([cx, cz]) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.28, height, 0.28), mats.concreteMat);
    col.position.set(cx, 0, cz);
    blockGroup.add(col);
  });

  // 3D Protruding Mini-Balconies on front/back of each Tower Bloxx floor
  [-1, 1].forEach((dirZ) => {
    const bal = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.14, 0.45),
      mats.concreteMat
    );
    bal.position.set(0, -height / 2 + 0.2, dirZ * (depth / 2 + 0.2));
    blockGroup.add(bal);
  });

  // Classic Yellow Roof Cornice Trim
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.32, 0.3, depth + 0.32),
    new THREE.MeshStandardMaterial({ color: 0xffc300, roughness: 0.28, metalness: 0.25 })
  );
  trim.position.y = height / 2 - 0.1;
  blockGroup.add(trim);

  blockGroup.userData.height = height;
  blockGroup.userData.emissiveMat = bodyMat;
  return blockGroup;
}

export function createTowerBloxxRoof() {
  const mats = getSharedMaterials();
  const roofGroup = new THREE.Group();
  const spireBase = new THREE.Mesh(
    new THREE.ConeGeometry(3.65, 2.85, 4),
    mats.terracottaRoofMat
  );
  spireBase.rotation.y = Math.PI / 4;
  spireBase.position.y = 1.42;
  spireBase.castShadow = true;
  roofGroup.add(spireBase);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  pole.position.y = 3.2;
  roofGroup.add(pole);

  const flag = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.6, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0xffc300,
      emissive: 0xffa000,
      emissiveIntensity: 0.6
    })
  );
  flag.position.set(0.55, 3.9, 0);
  roofGroup.add(flag);

  return roofGroup;
}

export function createStreetLamp() {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.65, roughness: 0.35 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.2, 8), poleMat);
  pole.position.y = 2.1;
  pole.castShadow = true;
  group.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), poleMat);
  arm.position.set(0.38, 4.15, 0);
  group.add(arm);

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e1,
    emissive: 0xffca28,
    emissiveIntensity: 0.2
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), bulbMat);
  bulb.position.set(0.75, 4.02, 0);
  group.add(bulb);

  group.userData.bulbMat = bulbMat;
  return group;
}
