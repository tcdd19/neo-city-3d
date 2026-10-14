import * as THREE from 'three';

const VEHICLE_PROFILES = [
  { type: 'sedan', name: '🚗 城市新能源轿车', color: 0x00b4d8, len: 2.3, wid: 1.15, h: 0.85, speed: 9.5 },
  { type: 'sports', name: '🏎️ 超跑 GT', color: 0xff2a6d, len: 2.4, wid: 1.22, h: 0.72, speed: 12.8 },
  { type: 'taxi', name: '🚕 城市出租车', color: 0xffbe0b, len: 2.25, wid: 1.15, h: 0.88, speed: 10.2 },
  { type: 'bus', name: '🚌 智慧城市观光巴士', color: 0x06d6a0, len: 4.1, wid: 1.38, h: 1.55, speed: 7.4 },
  { type: 'truck', name: '🚚 城市物流货车', color: 0x8338ec, len: 3.3, wid: 1.3, h: 1.4, speed: 8.0 }
];

export function createVehicleMesh(roadCoords) {
  const prof = VEHICLE_PROFILES[Math.floor(Math.random() * VEHICLE_PROFILES.length)];
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: prof.color,
    roughness: 0.3,
    metalness: 0.35
  });

  // Main chassis
  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(prof.wid, prof.h * 0.55, prof.len),
    bodyMat
  );
  chassis.position.y = prof.h * 0.35 + 0.18;
  chassis.castShadow = true;
  group.add(chassis);

  // Cabin / Windows
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0x1d2d44,
    roughness: 0.15,
    metalness: 0.7
  });
  const cabinLen = prof.type === 'bus' ? prof.len * 0.88 : prof.len * 0.55;
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(prof.wid * 0.88, prof.h * 0.5, cabinLen),
    cabinMat
  );
  cabin.position.set(0, prof.h * 0.8 + 0.15, prof.type === 'truck' ? 0.65 : -0.1);
  cabin.castShadow = true;
  group.add(cabin);

  // Taxi sign
  if (prof.type === 'taxi') {
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.16, 0.22),
      new THREE.MeshStandardMaterial({ color: 0xfff3b0, emissive: 0xffbe0b, emissiveIntensity: 0.8 })
    );
    sign.position.set(0, prof.h + 0.28, -0.1);
    group.add(sign);
  }

  // 4 Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.8 });
  const wheelOffsets = [
    [-prof.wid * 0.5, 0.24, prof.len * 0.32],
    [prof.wid * 0.5, 0.24, prof.len * 0.32],
    [-prof.wid * 0.5, 0.24, -prof.len * 0.32],
    [prof.wid * 0.5, 0.24, -prof.len * 0.32]
  ];
  const wheels = [];
  wheelOffsets.forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(wx, wy, wz);
    group.add(w);
    wheels.push(w);
  });

  // Headlights & Taillights
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff59d,
    emissiveIntensity: 1.0
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xff1744,
    emissive: 0xff1744,
    emissiveIntensity: 0.9
  });

  [-prof.wid * 0.34, prof.wid * 0.34].forEach((lx) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.08), headMat);
    hl.position.set(lx, 0.42, prof.len * 0.5 + 0.02);
    group.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.08), tailMat);
    tl.position.set(lx, 0.42, -prof.len * 0.5 - 0.02);
    group.add(tl);
  });

  // Headlight beam cones (visible at night/rain/fog)
  const beamGeo = new THREE.ConeGeometry(1.15, 5.2, 12, 1, true);
  beamGeo.rotateX(-Math.PI / 2);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfff9c4,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const lightBeam = new THREE.Mesh(beamGeo, beamMat);
  lightBeam.position.set(0, 0.32, prof.len * 0.5 + 2.6);
  group.add(lightBeam);

  // Pick initial road & direction
  const isZAxis = Math.random() > 0.5;
  const roadCoord = roadCoords[Math.floor(Math.random() * roadCoords.length)];
  const dirSign = Math.random() > 0.5 ? 1 : -1;
  const laneOffset = dirSign * 1.15;

  if (isZAxis) {
    group.position.set(roadCoord + laneOffset, 0.1, (Math.random() - 0.5) * 76);
    group.rotation.y = dirSign > 0 ? 0 : Math.PI;
  } else {
    group.position.set((Math.random() - 0.5) * 76, 0.1, roadCoord - laneOffset);
    group.rotation.y = dirSign > 0 ? Math.PI / 2 : -Math.PI / 2;
  }

  group.userData = {
    entityType: 'vehicle',
    title: prof.name,
    desc: `巡航时速 ${(prof.speed * 4.5).toFixed(0)} km/h · 智能自动驾驶与自动远近光系统`,
    speed: prof.speed * (0.88 + Math.random() * 0.25),
    isZAxis,
    roadCoord,
    dirSign,
    laneOffset,
    wheels,
    beamMat,
    turnCooldown: 0
  };

  return group;
}

export function updateVehicle(car, dt, roadCoords, cityHalfExtent = 44) {
  const ud = car.userData;
  const step = ud.speed * dt;
  ud.turnCooldown = Math.max(0, ud.turnCooldown - dt);

  if (ud.isZAxis) {
    car.position.z += ud.dirSign * step;
    if (car.position.z > cityHalfExtent) car.position.z = -cityHalfExtent;
    if (car.position.z < -cityHalfExtent) car.position.z = cityHalfExtent;

    // Check intersection turn opportunity
    if (ud.turnCooldown <= 0) {
      for (const rc of roadCoords) {
        if (Math.abs(car.position.z - rc) < 0.45 && Math.random() < 0.28) {
          ud.isZAxis = false;
          ud.roadCoord = rc;
          ud.dirSign = Math.random() > 0.5 ? 1 : -1;
          ud.laneOffset = ud.dirSign * 1.15;
          car.position.z = rc - ud.laneOffset;
          car.rotation.y = ud.dirSign > 0 ? Math.PI / 2 : -Math.PI / 2;
          ud.turnCooldown = 2.2;
          break;
        }
      }
    }
  } else {
    car.position.x += ud.dirSign * step;
    if (car.position.x > cityHalfExtent) car.position.x = -cityHalfExtent;
    if (car.position.x < -cityHalfExtent) car.position.x = cityHalfExtent;

    if (ud.turnCooldown <= 0) {
      for (const rc of roadCoords) {
        if (Math.abs(car.position.x - rc) < 0.45 && Math.random() < 0.28) {
          ud.isZAxis = true;
          ud.roadCoord = rc;
          ud.dirSign = Math.random() > 0.5 ? 1 : -1;
          ud.laneOffset = ud.dirSign * 1.15;
          car.position.x = rc + ud.laneOffset;
          car.rotation.y = ud.dirSign > 0 ? 0 : Math.PI;
          ud.turnCooldown = 2.2;
          break;
        }
      }
    }
  }

  // Spin wheels
  ud.wheels.forEach((w) => {
    w.rotation.x += step * 2.2;
  });
}

// Create articulated 3D Pedestrian with walking cycle & rain umbrella
const SHIRT_COLORS = [0xff595e, 0xffca3a, 0x8ac926, 0x1982c4, 0x6a4c93, 0xff924c, 0x00bbf9];

export function createPedestrianMesh(roadCoords) {
  const group = new THREE.Group();
  const shirtColor = SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)];

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xffdcb1, roughness: 0.6 })
  );
  head.position.y = 0.92;
  head.castShadow = true;
  group.add(head);

  // Torso
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.36, 0.18),
    new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 })
  );
  torso.position.y = 0.62;
  torso.castShadow = true;
  group.add(torso);

  // Legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.8 });
  const legGeo = new THREE.BoxGeometry(0.1, 0.36, 0.11);
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.07, 0.24, 0);
  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.set(0.07, 0.24, 0);
  group.add(leftLeg, rightLeg);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.08, 0.3, 0.08);
  const armMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 });
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-0.2, 0.62, 0);
  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(0.2, 0.62, 0);
  group.add(leftArm, rightArm);

  // Umbrella (shown during Rain/Snow!)
  const umbrella = new THREE.Group();
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.55, 6),
    new THREE.MeshStandardMaterial({ color: 0xdddddd })
  );
  stick.position.y = 0.95;
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 0.22, 10),
    new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.4 })
  );
  canopy.position.y = 1.22;
  umbrella.add(stick, canopy);
  umbrella.visible = false;
  group.add(umbrella);

  // Place on sidewalk along roadCoords
  const isZAxis = Math.random() > 0.5;
  const roadCoord = roadCoords[Math.floor(Math.random() * roadCoords.length)];
  const sideSign = Math.random() > 0.5 ? 1 : -1;
  const sidewalkOffset = sideSign * 2.45;
  const dirSign = Math.random() > 0.5 ? 1 : -1;

  if (isZAxis) {
    group.position.set(roadCoord + sidewalkOffset, 0.15, (Math.random() - 0.5) * 72);
    group.rotation.y = dirSign > 0 ? 0 : Math.PI;
  } else {
    group.position.set((Math.random() - 0.5) * 72, 0.15, roadCoord + sidewalkOffset);
    group.rotation.y = dirSign > 0 ? Math.PI / 2 : -Math.PI / 2;
  }

  group.userData = {
    entityType: 'pedestrian',
    title: '🚶 城市漫步居民',
    desc: '正在人行道漫步 · 遇雨雪天气会自动撑起雨伞',
    isZAxis,
    roadCoord,
    sidewalkOffset,
    dirSign,
    speed: 1.7 + Math.random() * 0.9,
    walkPhase: Math.random() * Math.PI * 2,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    umbrella
  };

  return group;
}

export function updatePedestrian(ped, dt, cityHalfExtent = 42) {
  const ud = ped.userData;
  const step = ud.speed * dt;
  ud.walkPhase += dt * ud.speed * 5.2;

  if (ud.isZAxis) {
    ped.position.z += ud.dirSign * step;
    if (ped.position.z > cityHalfExtent || ped.position.z < -cityHalfExtent) {
      ud.dirSign *= -1;
      ped.rotation.y = ud.dirSign > 0 ? 0 : Math.PI;
    }
  } else {
    ped.position.x += ud.dirSign * step;
    if (ped.position.x > cityHalfExtent || ped.position.x < -cityHalfExtent) {
      ud.dirSign *= -1;
      ped.rotation.y = ud.dirSign > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
  }

  // Limb swing animation
  const swing = Math.sin(ud.walkPhase) * 0.55;
  ud.leftLeg.rotation.x = swing;
  ud.rightLeg.rotation.x = -swing;
  ud.leftArm.rotation.x = -swing * 0.8;
  ud.rightArm.rotation.x = ud.umbrella.visible ? -0.45 : swing * 0.8;
}
