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

// High-Definition Procedural PBR Building Facade Generator (Diffuse + Emissive + Roughness + Bump)
export function createPBRFacadeMaterial({
  wallColor = '#2b394a',
  wallAccent = '#1e2936',
  frameColor = '#0f1722',
  glassUnlit = '#122338',
  litColors = ['#fff3b0', '#ffd166', '#90e0ef', '#ffffff'],
  cols = 8,
  rows = 16,
  litChance = 0.58,
  hasBalcony = false,
  isCurtainWall = false
}) {
  const width = 1024;
  const height = 2048;

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

  // 1. Base Wall Background with subtle architectural stone/metal grain
  dCtx.fillStyle = wallColor;
  dCtx.fillRect(0, 0, width, height);

  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, width, height);

  // Wall is matte (high roughness = bright gray, glass is glossy = dark gray)
  rCtx.fillStyle = isCurtainWall ? '#555555' : '#cccccc';
  rCtx.fillRect(0, 0, width, height);

  // Subtle horizontal stone cladding / panel seams
  const cellW = width / cols;
  const cellH = height / rows;

  for (let r = 0; r < rows; r++) {
    const y0 = r * cellH;
    // Floor slab band
    dCtx.fillStyle = wallAccent;
    dCtx.fillRect(0, y0, width, cellH * 0.16);
    rCtx.fillStyle = '#dddddd';
    rCtx.fillRect(0, y0, width, cellH * 0.16);

    // Subtle highlight trim line
    dCtx.fillStyle = 'rgba(255,255,255,0.08)';
    dCtx.fillRect(0, y0 + cellH * 0.15, width, 3);

    for (let c = 0; c < cols; c++) {
      const x0 = c * cellW;

      // Vertical pillar seam
      dCtx.fillStyle = wallAccent;
      dCtx.fillRect(x0, y0, cellW * 0.12, cellH);

      const padX = isCurtainWall ? cellW * 0.08 : cellW * 0.16;
      const padTop = isCurtainWall ? cellH * 0.12 : cellH * 0.22;
      const padBottom = isCurtainWall ? cellH * 0.08 : cellH * 0.16;

      const wx = x0 + padX;
      const wy = y0 + padTop;
      const ww = cellW - padX * 2;
      const wh = cellH - padTop - padBottom;

      // Outer Window Mullion Frame
      dCtx.fillStyle = frameColor;
      dCtx.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
      rCtx.fillStyle = '#777777';
      rCtx.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);

      // Glossy glass roughness (dark = very smooth/reflective)
      rCtx.fillStyle = '#181818';
      rCtx.fillRect(wx, wy, ww, wh);

      const isLit = Math.random() < litChance;
      if (isLit) {
        const picked = litColors[Math.floor(Math.random() * litColors.length)];
        // Interior room gradient (ceiling brighter, floor darker)
        const grad = dCtx.createLinearGradient(wx, wy, wx, wy + wh);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.25, picked);
        grad.addColorStop(0.85, picked);
        grad.addColorStop(1, '#334155');
        dCtx.fillStyle = grad;
        dCtx.fillRect(wx, wy, ww, wh);

        // Emissive map for glowing windows at dusk/night
        const eGrad = eCtx.createLinearGradient(wx, wy, wx, wy + wh);
        eGrad.addColorStop(0, picked);
        eGrad.addColorStop(0.75, picked);
        eGrad.addColorStop(1, '#222222');
        eCtx.fillStyle = eGrad;
        eCtx.fillRect(wx + 2, wy + 2, ww - 4, wh - 4);

        // Random interior blinds / silhouettes for realism
        if (Math.random() < 0.38) {
          const blindH = wh * (0.25 + Math.random() * 0.35);
          dCtx.fillStyle = 'rgba(20, 30, 48, 0.45)';
          dCtx.fillRect(wx, wy, ww, blindH);
          eCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          eCtx.fillRect(wx, wy, ww, blindH);
        }
      } else {
        // Dark reflective glass with sky reflection diagonal
        const darkGrad = dCtx.createLinearGradient(wx, wy, wx + ww, wy + wh);
        darkGrad.addColorStop(0, '#26415e');
        darkGrad.addColorStop(0.5, glassUnlit);
        darkGrad.addColorStop(1, '#0b1522');
        dCtx.fillStyle = darkGrad;
        dCtx.fillRect(wx, wy, ww, wh);
      }

      // Inner window casement divider (twin pane look)
      dCtx.fillStyle = frameColor;
      dCtx.fillRect(wx + ww * 0.48, wy, 4, wh);
      eCtx.fillStyle = '#000000';
      eCtx.fillRect(wx + ww * 0.48, wy, 4, wh);

      // Optional residential balcony rail & AC unit detail
      if (hasBalcony) {
        const balY = wy + wh * 0.68;
        dCtx.fillStyle = 'rgba(220, 235, 245, 0.45)';
        dCtx.fillRect(wx - 2, balY, ww + 4, wh * 0.32);
        dCtx.fillStyle = '#ffc300';
        dCtx.fillRect(wx - 3, balY, ww + 6, 4);
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
    roughness: 0.85,
    metalness: isCurtainWall ? 0.35 : 0.15,
    bumpMap: roughTex,
    bumpScale: 0.04
  });
}

// High-Res Asphalt Road & Sidewalk & Grass Textures
export function createAsphaltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#232933';
  ctx.fillRect(0, 0, 512, 512);

  // Fine asphalt aggregate speckles
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
      const shade = 102 + Math.floor(Math.random() * 16);
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
      wallColor: '#182b42',
      wallAccent: '#0f1e30',
      frameColor: '#3d5a80',
      glassUnlit: '#0d2137',
      litColors: ['#a8f9ff', '#e0fbfc', '#ffd166', '#90e0ef'],
      cols: 10,
      rows: 22,
      litChance: 0.62,
      isCurtainWall: true
    }),
    skyscraperGold: createPBRFacadeMaterial({
      wallColor: '#252934',
      wallAccent: '#171a21',
      frameColor: '#5c5346',
      glassUnlit: '#161a24',
      litColors: ['#ffe082', '#fff8e1', '#ffca28', '#b3e5fc'],
      cols: 8,
      rows: 20,
      litChance: 0.58,
      isCurtainWall: true
    }),
    residentialNokia: createPBRFacadeMaterial({
      wallColor: '#0096c7',
      wallAccent: '#0077b6',
      frameColor: '#023e8a',
      glassUnlit: '#03254c',
      litColors: ['#b7efc5', '#90e0ef', '#ffd166', '#fff3b0'],
      cols: 6,
      rows: 12,
      litChance: 0.68,
      hasBalcony: true
    }),
    residentialWarm: createPBRFacadeMaterial({
      wallColor: '#7f5539',
      wallAccent: '#582f0e',
      frameColor: '#dad7cd',
      glassUnlit: '#1d2d44',
      litColors: ['#ffe599', '#ffd166', '#fff8e1'],
      cols: 6,
      rows: 12,
      litChance: 0.65,
      hasBalcony: true
    }),
    commercialNeon: createPBRFacadeMaterial({
      wallColor: '#1d1836',
      wallAccent: '#110e20',
      frameColor: '#3c096c',
      glassUnlit: '#10002b',
      litColors: ['#ff4d94', '#00f5d4', '#fee440', '#9b5de5'],
      cols: 6,
      rows: 8,
      litChance: 0.78,
      isCurtainWall: true
    }),
    sidewalkMat: new THREE.MeshStandardMaterial({
      map: createSidewalkTexture(),
      roughness: 0.85
    }),
    grassMat: new THREE.MeshStandardMaterial({
      map: createGrassTexture(),
      roughness: 0.9
    })
  };
  return SHARED_MATERIALS;
}

export function createTreeMesh(type = 'oak') {
  const group = new THREE.Group();
  group.userData.isTree = true;
  group.userData.swayPhase = Math.random() * Math.PI * 2;

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.92 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 1.55, 8), trunkMat);
  trunk.position.y = 0.77;
  trunk.castShadow = true;
  group.add(trunk);

  const foliageGroup = new THREE.Group();
  foliageGroup.position.y = 1.4;

  if (type === 'pine') {
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.78 });
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.18 - i * 0.25, 1.55 - i * 0.2, 8),
        pineMat
      );
      cone.position.y = i * 0.85 + 0.5;
      cone.castShadow = true;
      cone.receiveShadow = true;
      foliageGroup.add(cone);
    }
  } else if (type === 'cherry') {
    const cherryMat = new THREE.MeshStandardMaterial({ color: 0xff85a1, roughness: 0.65 });
    const puffs = [
      [0, 0.7, 0, 1.05],
      [0.55, 0.5, 0.4, 0.75],
      [-0.55, 0.55, -0.35, 0.8],
      [0.3, 1.15, -0.3, 0.7]
    ];
    puffs.forEach(([x, y, z, r]) => {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), cherryMat);
      m.position.set(x, y, z);
      m.castShadow = true;
      foliageGroup.add(m);
    });
  } else {
    const colors = [0x388e3c, 0x43a047, 0x2e7d32];
    const oakMat = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      roughness: 0.72
    });
    const puffs = [
      [0, 0.75, 0, 1.12],
      [0.6, 0.5, 0.4, 0.78],
      [-0.55, 0.6, -0.4, 0.82],
      [-0.3, 1.15, 0.35, 0.72]
    ];
    puffs.forEach(([x, y, z, r]) => {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), oakMat);
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
  const mat = new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.8 });
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42 - i * 0.06, 1), mat);
    s.position.set((i - 1) * 0.35, 0.3, (i % 2) * 0.18);
    s.castShadow = true;
    bush.add(s);
  }
  const flowerColors = [0xffeb3b, 0xff5252, 0xe040fb];
  const flowerMat = new THREE.MeshStandardMaterial({
    color: flowerColors[Math.floor(Math.random() * flowerColors.length)]
  });
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), flowerMat);
    f.position.set((Math.random() - 0.5) * 0.7, 0.58, (Math.random() - 0.5) * 0.4);
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
    desc: '高清草坪纹理、樱花树、松柏、阔叶林与中央音乐喷泉。',
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

  // Central Fountain
  const fountainRim = new THREE.Mesh(
    new THREE.CylinderGeometry(2.15, 2.35, 0.65, 24),
    new THREE.MeshStandardMaterial({ color: 0xdfe6e9, roughness: 0.4 })
  );
  fountainRim.position.y = 0.5;
  fountainRim.castShadow = true;
  group.add(fountainRim);

  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 1.9, 0.56, 24),
    new THREE.MeshStandardMaterial({
      color: 0x00bcd4,
      emissive: 0x006064,
      emissiveIntensity: 0.35,
      roughness: 0.12,
      metalness: 0.35
    })
  );
  water.position.y = 0.6;
  group.add(water);

  const spout = new THREE.Mesh(
    new THREE.ConeGeometry(0.65, 1.85, 16),
    new THREE.MeshStandardMaterial({
      color: 0x80deea,
      transparent: true,
      opacity: 0.78,
      emissive: 0x00acc1,
      emissiveIntensity: 0.45
    })
  );
  spout.position.y = 1.42;
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

export function createBuildingPlot(style = 'skyscraper', plotSize = 12) {
  const mats = getSharedMaterials();
  const group = new THREE.Group();

  // High-res stone tiled plaza base
  const basePad = new THREE.Mesh(
    new THREE.BoxGeometry(plotSize - 0.5, 0.35, plotSize - 0.5),
    mats.sidewalkMat
  );
  basePad.position.y = 0.175;
  basePad.receiveShadow = true;
  group.add(basePad);

  const emissiveMeshes = [];
  const trees = [];

  if (style === 'skyscraper') {
    const height = 18 + Math.floor(Math.random() * 14);
    const width = 6.8;
    const depth = 6.8;
    const baseMat = Math.random() > 0.45 ? mats.skyscraperCyan : mats.skyscraperGold;
    const mat = baseMat.clone();

    // Ground Floor Lobby Podium
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.6
    });
    const podium = new THREE.Mesh(new THREE.BoxGeometry(width + 0.7, 2.2, depth + 0.7), podiumMat);
    podium.position.y = 1.45;
    podium.castShadow = true;
    group.add(podium);

    const tower = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
    tower.position.y = height / 2 + 0.35;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);
    emissiveMeshes.push(mat);

    // Architectural Vertical Corner Mullions
    const colMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.65, roughness: 0.3 });
    [
      [-width / 2, -depth / 2],
      [width / 2, -depth / 2],
      [-width / 2, depth / 2],
      [width / 2, depth / 2]
    ].forEach(([cx, cz]) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.42, height + 0.4, 0.42), colMat);
      pillar.position.set(cx, height / 2 + 0.35, cz);
      group.add(pillar);
    });

    // Stepped crown + rooftop helipad + spire
    const crown = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.72, 2.4, depth * 0.72),
      mat
    );
    crown.position.y = height + 1.55;
    crown.castShadow = true;
    group.add(crown);

    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.25, 4.5, 12),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.18 })
    );
    spire.position.y = height + 4.8;
    group.add(spire);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 10, 10),
      new THREE.MeshStandardMaterial({
        color: 0xff1744,
        emissive: 0xff1744,
        emissiveIntensity: 1.8
      })
    );
    beacon.position.y = height + 7.1;
    group.add(beacon);

    [[-4.3, -4.3], [4.3, 4.3]].forEach(([tx, tz]) => {
      const tr = createTreeMesh('oak');
      tr.position.set(tx, 0.3, tz);
      tr.scale.setScalar(0.78);
      group.add(tr);
      trees.push(tr);
    });

    const pop = Math.round(height * 16);
    group.userData = {
      entityType: 'building',
      subType: 'skyscraper',
      title: '🏙️ 超高层 PBR 玻璃幕墙大厦',
      desc: `楼高 ${height} 米 · 独立高光反射窗体与室内百叶窗细节 · 容纳 ${pop} 人`,
      population: pop,
      treesCount: trees.length,
      trees,
      emissiveMeshes
    };
  } else if (style === 'residential') {
    const height = 10 + Math.floor(Math.random() * 6);
    const baseMat = Math.random() > 0.35 ? mats.residentialNokia : mats.residentialWarm;
    const mat = baseMat.clone();

    const wingA = new THREE.Mesh(new THREE.BoxGeometry(4.5, height, 7.6), mat);
    wingA.position.set(-1.6, height / 2 + 0.35, 0);
    wingA.castShadow = true;
    wingA.receiveShadow = true;

    const wingB = new THREE.Mesh(new THREE.BoxGeometry(4.2, height * 0.82, 4.5), mat);
    wingB.position.set(2.1, (height * 0.82) / 2 + 0.35, 1.4);
    wingB.castShadow = true;
    wingB.receiveShadow = true;

    // Classic Yellow Roof Trim + Rooftop Water Tank / AC
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xffc300, roughness: 0.35, metalness: 0.2 });
    const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(4.75, 0.5, 7.85), trimMat);
    roofTrim.position.set(-1.6, height + 0.55, 0);

    const roofTrimB = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.42, 4.7), trimMat);
    roofTrimB.position.set(2.1, height * 0.82 + 0.48, 1.4);

    group.add(wingA, wingB, roofTrim, roofTrimB);
    emissiveMeshes.push(mat);

    const t1 = createTreeMesh('cherry');
    t1.position.set(2.6, 0.3, -2.8);
    t1.scale.setScalar(0.85);
    const t2 = createTreeMesh('pine');
    t2.position.set(4.1, 0.3, -1.2);
    t2.scale.setScalar(0.75);
    group.add(t1, t2);
    trees.push(t1, t2);

    const pop = Math.round(height * 11);
    group.userData = {
      entityType: 'building',
      subType: 'residential',
      title: '🏘️ 阳光阳台住宅公寓',
      desc: `高清立面窗框与阳台护栏细节 · 居住人口 ${pop} 人 · 附带樱花庭院`,
      population: pop,
      treesCount: trees.length,
      trees,
      emissiveMeshes
    };
  } else {
    const height = 6.8 + Math.random() * 3.2;
    const mat = mats.commercialNeon.clone();

    const mall = new THREE.Mesh(new THREE.BoxGeometry(8.4, height, 8.4), mat);
    mall.position.y = height / 2 + 0.35;
    mall.castShadow = true;
    mall.receiveShadow = true;
    group.add(mall);
    emissiveMeshes.push(mat);

    const neonSign = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 1.35, 0.32),
      new THREE.MeshStandardMaterial({
        color: 0x00f5d4,
        emissive: 0x00f5d4,
        emissiveIntensity: 1.25
      })
    );
    neonSign.position.set(0, height + 1.05, 3.9);

    const neonSignPink = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 4.2, 1.1),
      new THREE.MeshStandardMaterial({
        color: 0xff2a85,
        emissive: 0xff2a85,
        emissiveIntensity: 1.35
      })
    );
    neonSignPink.position.set(4.32, height * 0.65, 2.2);
    group.add(neonSign, neonSignPink);

    const t1 = createTreeMesh('cherry');
    t1.position.set(-4.3, 0.3, 4.3);
    t1.scale.setScalar(0.78);
    group.add(t1);
    trees.push(t1);

    const pop = 95;
    group.userData = {
      entityType: 'building',
      subType: 'shop',
      title: '🏪 赛博霓虹商业综合体',
      desc: `高清玻璃橱窗与立体霓虹灯牌 · 容纳客流 ${pop} 人`,
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

  // Corner white pilasters + classic yellow roof trim
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.24, 0.28, depth + 0.24),
    new THREE.MeshStandardMaterial({ color: 0xffc300, roughness: 0.3, metalness: 0.2 })
  );
  trim.position.y = height / 2 - 0.1;
  blockGroup.add(trim);

  blockGroup.userData.height = height;
  blockGroup.userData.emissiveMat = bodyMat;
  return blockGroup;
}

export function createTowerBloxxRoof() {
  const roofGroup = new THREE.Group();
  const spireBase = new THREE.Mesh(
    new THREE.ConeGeometry(3.6, 2.8, 4),
    new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.4 })
  );
  spireBase.rotation.y = Math.PI / 4;
  spireBase.position.y = 1.4;
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
