import * as THREE from 'three';

// Generate dynamic procedural window canvas texture
export function createFacadeTexture(bgHex, winLitHex1, winLitHex2, cols = 6, rows = 14) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padX = 14;
  const padY = 16;
  const cellW = (canvas.width - padX * 2) / cols;
  const cellH = (canvas.height - padY * 2) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const litProb = Math.random();
      if (litProb > 0.32) {
        ctx.fillStyle = litProb > 0.65 ? winLitHex1 : winLitHex2;
      } else {
        ctx.fillStyle = '#182436';
      }
      ctx.fillRect(
        padX + c * cellW + 4,
        padY + r * cellH + 4,
        cellW - 8,
        cellH - 8
      );
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Pre-build shared facade textures
const FACADE_TEXTURES = {
  skyscraperBlue: createFacadeTexture('#1b3352', '#7ce8ff', '#d6f8ff', 8, 18),
  skyscraperGold: createFacadeTexture('#252a38', '#ffe082', '#90caf9', 6, 16),
  residentialWarm: createFacadeTexture('#5c6f84', '#ffd54f', '#fff3e0', 5, 10),
  residentialTeal: createFacadeTexture('#0077b6', '#90e0ef', '#ffd166', 4, 8),
  commercialNeon: createFacadeTexture('#221c38', '#ff4d94', '#00f5d4', 4, 6)
};

export function createTreeMesh(type = 'oak') {
  const group = new THREE.Group();
  group.userData.isTree = true;
  group.userData.swayPhase = Math.random() * Math.PI * 2;

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.5, 7), trunkMat);
  trunk.position.y = 0.75;
  trunk.castShadow = true;
  group.add(trunk);

  const foliageGroup = new THREE.Group();
  foliageGroup.position.y = 1.4;

  if (type === 'pine') {
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.75 });
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.15 - i * 0.25, 1.5 - i * 0.2, 7),
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
    // Oak / lush green
    const colors = [0x43a047, 0x66bb6a, 0x388e3c];
    const oakMat = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      roughness: 0.7
    });
    const puffs = [
      [0, 0.75, 0, 1.1],
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
  const mat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.8 });
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42 - i * 0.06, 1), mat);
    s.position.set((i - 1) * 0.35, 0.3, (i % 2) * 0.18);
    s.castShadow = true;
    bush.add(s);
  }
  // Small flowers on bush
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
  const group = new THREE.Group();
  group.userData = {
    entityType: 'park',
    title: '🌳 城市生态花园广场',
    desc: '包含樱花树、松柏、阔叶林、景观花坛与中央音乐喷泉，提供清新氧气。',
    population: 0,
    treesCount: 9
  };

  // Grass base
  const grass = new THREE.Mesh(
    new THREE.BoxGeometry(plotSize - 0.6, 0.35, plotSize - 0.6),
    new THREE.MeshStandardMaterial({ color: 0x3b873e, roughness: 0.85 })
  );
  grass.position.y = 0.175;
  grass.receiveShadow = true;
  group.add(grass);

  // Stone pathways
  const pathMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, roughness: 0.8 });
  const path1 = new THREE.Mesh(new THREE.BoxGeometry(plotSize - 1, 0.38, 1.8), pathMat);
  path1.position.y = 0.19;
  path1.receiveShadow = true;
  const path2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.38, plotSize - 1), pathMat);
  path2.position.y = 0.19;
  path2.receiveShadow = true;
  group.add(path1, path2);

  // Central Fountain
  const fountainRim = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.3, 0.65, 16),
    new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.5 })
  );
  fountainRim.position.y = 0.5;
  fountainRim.castShadow = true;
  group.add(fountainRim);

  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(1.85, 1.85, 0.55, 16),
    new THREE.MeshStandardMaterial({
      color: 0x00bcd4,
      emissive: 0x006064,
      emissiveIntensity: 0.35,
      roughness: 0.15,
      metalness: 0.3
    })
  );
  water.position.y = 0.6;
  group.add(water);

  const spout = new THREE.Mesh(
    new THREE.ConeGeometry(0.65, 1.8, 12),
    new THREE.MeshStandardMaterial({
      color: 0x80deea,
      transparent: true,
      opacity: 0.78,
      emissive: 0x00acc1,
      emissiveIntensity: 0.4
    })
  );
  spout.position.y = 1.4;
  group.add(spout);
  group.userData.fountainSpout = spout;

  // Corner Trees & Bushes
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
  const group = new THREE.Group();
  const basePad = new THREE.Mesh(
    new THREE.BoxGeometry(plotSize - 0.6, 0.35, plotSize - 0.6),
    new THREE.MeshStandardMaterial({ color: 0x455a64, roughness: 0.85 })
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
    const tex = Math.random() > 0.45 ? FACADE_TEXTURES.skyscraperBlue : FACADE_TEXTURES.skyscraperGold;

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: new THREE.Color(0x90e0ef),
      emissiveIntensity: 0.25,
      roughness: 0.25,
      metalness: 0.45
    });

    const tower = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
    tower.position.y = height / 2 + 0.35;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);
    emissiveMeshes.push(mat);

    // Stepped crown + spire
    const crown = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.72, 2.4, depth * 0.72),
      mat
    );
    crown.position.y = height + 1.55;
    crown.castShadow = true;
    group.add(crown);

    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.25, 4.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xe0e0e0, metalness: 0.8, roughness: 0.2 })
    );
    spire.position.y = height + 4.8;
    group.add(spire);

    // Aviation warning beacon
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xff1744,
        emissive: 0xff1744,
        emissiveIntensity: 1.5
      })
    );
    beacon.position.y = height + 7.1;
    group.add(beacon);

    // Corner decorative trees
    [[-4.3, -4.3], [4.3, 4.3]].forEach(([tx, tz]) => {
      const tr = createTreeMesh('oak');
      tr.position.set(tx, 0.3, tz);
      tr.scale.setScalar(0.75);
      group.add(tr);
      trees.push(tr);
    });

    const pop = Math.round(height * 16);
    group.userData = {
      entityType: 'building',
      subType: 'skyscraper',
      title: '🏙️ 超高层玻璃幕墙摩天大厦',
      desc: `楼高 ${height} 米 · 入住/办公人口 ${pop} 人 · 配备航空障碍灯与智能幕墙`,
      population: pop,
      treesCount: trees.length,
      trees,
      emissiveMeshes
    };
  } else if (style === 'residential') {
    const height = 10 + Math.floor(Math.random() * 6);
    const tex = FACADE_TEXTURES.residentialTeal;
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: new THREE.Color(0xffd166),
      emissiveIntensity: 0.22,
      roughness: 0.55
    });

    // Twin wing apartment
    const wingA = new THREE.Mesh(new THREE.BoxGeometry(4.4, height, 7.6), mat);
    wingA.position.set(-1.6, height / 2 + 0.35, 0);
    wingA.castShadow = true;
    wingA.receiveShadow = true;

    const wingB = new THREE.Mesh(new THREE.BoxGeometry(4.2, height * 0.82, 4.4), mat);
    wingB.position.set(2.1, (height * 0.82) / 2 + 0.35, 1.4);
    wingB.castShadow = true;
    wingB.receiveShadow = true;

    // Yellow Nokia Tower Bloxx style roof trim!
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xffc300, roughness: 0.4 });
    const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(4.65, 0.55, 7.85), trimMat);
    roofTrim.position.set(-1.6, height + 0.55, 0);

    group.add(wingA, wingB, roofTrim);
    emissiveMeshes.push(mat);

    // Courtyard cherry & pine trees
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
      title: '🏘️ 阳光花园住宅公寓',
      desc: `经典湖蓝配金顶设计 · 居住人口 ${pop} 人 · 附带樱花庭院绿化`,
      population: pop,
      treesCount: trees.length,
      trees,
      emissiveMeshes
    };
  } else {
    // Commercial / Neon Plaza
    const height = 6.5 + Math.random() * 3.5;
    const tex = FACADE_TEXTURES.commercialNeon;
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: new THREE.Color(0xff55aa),
      emissiveIntensity: 0.42,
      roughness: 0.35
    });

    const mall = new THREE.Mesh(new THREE.BoxGeometry(8.4, height, 8.4), mat);
    mall.position.y = height / 2 + 0.35;
    mall.castShadow = true;
    mall.receiveShadow = true;
    group.add(mall);
    emissiveMeshes.push(mat);

    // Glowing Neon Signboards
    const neonSign = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 1.3, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0x00f5d4,
        emissive: 0x00f5d4,
        emissiveIntensity: 1.1
      })
    );
    neonSign.position.set(0, height + 1.1, 3.9);
    group.add(neonSign);

    const t1 = createTreeMesh('cherry');
    t1.position.set(-4.3, 0.3, 4.3);
    t1.scale.setScalar(0.75);
    group.add(t1);
    trees.push(t1);

    const pop = 95;
    group.userData = {
      entityType: 'building',
      subType: 'shop',
      title: '🏪 赛博霓虹商业综合体',
      desc: `全天候繁华商业街区 · 容纳客流 ${pop} 人 · 夜间自动点亮霓虹灯牌`,
      population: pop,
      treesCount: trees.length,
      trees,
      emissiveMeshes
    };
  }

  return group;
}

// Create a single Tower Bloxx floor block (Nokia Teal Blue + Yellow Roof Trim + Twin Windows)
export function createTowerBloxxFloor(floorIndex = 0) {
  const blockGroup = new THREE.Group();
  const width = 4.8;
  const height = 2.2;
  const depth = 4.8;

  const bodyMat = new THREE.MeshStandardMaterial({
    map: FACADE_TEXTURES.residentialTeal,
    emissiveMap: FACADE_TEXTURES.residentialTeal,
    emissive: new THREE.Color(0x80ffdb),
    emissiveIntensity: 0.35,
    roughness: 0.4
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  blockGroup.add(body);

  // Classic Yellow Roof Trim
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.22, 0.28, depth + 0.22),
    new THREE.MeshStandardMaterial({ color: 0xffc300, roughness: 0.35 })
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
    new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.45 })
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
      emissiveIntensity: 0.5
    })
  );
  flag.position.set(0.55, 3.9, 0);
  roofGroup.add(flag);

  return roofGroup;
}

export function createStreetLamp() {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.6, roughness: 0.4 });
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
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bulbMat);
  bulb.position.set(0.75, 4.02, 0);
  group.add(bulb);

  group.userData.bulbMat = bulbMat;
  return group;
}
