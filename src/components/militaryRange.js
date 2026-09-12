import * as THREE from "three";

// Interactive targets registered for bullet hit detection
export const interactiveTargets = [];

/**
 * Procedural texture helpers using HTML Canvas
 */
function createDirtCanvasTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Base dirt / sandy ground
  ctx.fillStyle = "#877353";
  ctx.fillRect(0, 0, 512, 512);

  // Noise / pebble speckles
  for (let i = 0; i < 40000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const tone = Math.random();
    if (tone < 0.3) {
      ctx.fillStyle = "rgba(70, 55, 38, 0.4)";
    } else if (tone < 0.7) {
      ctx.fillStyle = "rgba(160, 140, 105, 0.4)";
    } else {
      ctx.fillStyle = "rgba(45, 35, 25, 0.25)";
    }
    ctx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
  }

  // Subtle vehicle track lines
  ctx.strokeStyle = "rgba(55, 42, 28, 0.2)";
  ctx.lineWidth = 14;
  for (let y = 60; y < 512; y += 120) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y + (Math.random() * 20 - 10));
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}

function createTargetCanvasTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Background white
  ctx.fillStyle = "#f4ebd9";
  ctx.fillRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 256;
  const rings = [
    { r: 230, color: "#1c1c1c" },
    { r: 195, color: "#f4ebd9" },
    { r: 160, color: "#1c1c1c" },
    { r: 125, color: "#f4ebd9" },
    { r: 90, color: "#1c1c1c" },
    { r: 55, color: "#d92b2b" }, // Red center ring
    { r: 25, color: "#d92b2b", fill: true }, // Bullseye
  ];

  ctx.lineWidth = 14;
  for (const ring of rings) {
    ctx.beginPath();
    ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
    if (ring.fill) {
      ctx.fillStyle = ring.color;
      ctx.fill();
    } else {
      ctx.strokeStyle = ring.color;
      ctx.stroke();
    }
  }

  // Crosshairs
  ctx.strokeStyle = "rgba(28, 28, 28, 0.4)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, 15);
  ctx.lineTo(cx, 497);
  ctx.moveTo(15, cy);
  ctx.lineTo(497, cy);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

function createSilhouetteTargetTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Cardboard olive background
  ctx.fillStyle = "#6b6f58";
  ctx.fillRect(0, 0, 256, 512);

  // Black silhouette of head and shoulders
  ctx.fillStyle = "#1e2219";
  // Head
  ctx.beginPath();
  ctx.arc(128, 90, 45, 0, Math.PI * 2);
  ctx.fill();
  // Helmet shape
  ctx.beginPath();
  ctx.ellipse(128, 80, 52, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  // Torso / shoulders
  ctx.beginPath();
  ctx.moveTo(25, 230);
  ctx.quadraticCurveTo(128, 140, 231, 230);
  ctx.lineTo(235, 512);
  ctx.lineTo(21, 512);
  ctx.closePath();
  ctx.fill();

  // Bullseye on chest
  ctx.strokeStyle = "#e8b835";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(128, 270, 35, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(128, 270, 12, 0, Math.PI * 2);
  ctx.fillStyle = "#d92b2b";
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function createCrateTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // Army olive wood
  ctx.fillStyle = "#4a4c38";
  ctx.fillRect(0, 0, 256, 256);

  // Border frame
  ctx.strokeStyle = "#2f3122";
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, 240, 240);

  // Cross brace
  ctx.beginPath();
  ctx.moveTo(8, 8);
  ctx.lineTo(248, 248);
  ctx.stroke();

  // Stencil text
  ctx.fillStyle = "#e5ddb8";
  ctx.font = "bold 24px monospace";
  ctx.textAlign = "center";
  ctx.fillText("7.62x39mm", 128, 100);
  ctx.font = "bold 16px monospace";
  ctx.fillText("AMMO CRATE", 128, 130);
  ctx.fillText("LOT 41-B", 128, 160);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Main Builder Function for the Military Polygon
 */
export function createMilitaryRange(scene) {
  // Clear any previous target registrations
  interactiveTargets.length = 0;

  const militaryWorld = new THREE.Group();
  militaryWorld.name = "MilitaryTrainingRange";

  // Shared reusable materials
  const dirtTexture = createDirtCanvasTexture();
  const groundMaterial = new THREE.MeshStandardMaterial({
    map: dirtTexture,
    roughness: 0.95,
    metalness: 0.05,
  });

  const trenchWoodMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a4228,
    roughness: 0.85,
  });

  const sandbagMaterial = new THREE.MeshStandardMaterial({
    color: 0xc8b28a,
    roughness: 0.9,
  });

  const tankArmorDark = new THREE.MeshStandardMaterial({
    color: 0x3d4331, // Olive Drab Green
    roughness: 0.65,
    metalness: 0.35,
  });

  const tankArmorTrim = new THREE.MeshStandardMaterial({
    color: 0x272a20,
    roughness: 0.8,
    metalness: 0.5,
  });

  const metalDark = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.5,
    metalness: 0.8,
  });

  const redBarrelMaterial = new THREE.MeshStandardMaterial({
    color: 0x9e2a2b,
    roughness: 0.55,
    metalness: 0.4,
  });

  const greenBarrelMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a4f3b,
    roughness: 0.55,
    metalness: 0.4,
  });

  const crateMaterial = new THREE.MeshStandardMaterial({
    map: createCrateTexture(),
    roughness: 0.8,
  });

  const targetBullseyeMat = new THREE.MeshStandardMaterial({
    map: createTargetCanvasTexture(),
    roughness: 0.7,
  });

  const targetSilhouetteMat = new THREE.MeshStandardMaterial({
    map: createSilhouetteTargetTexture(),
    roughness: 0.7,
  });

  // ==========================================
  // ==========================================
  // 1. TERRAIN WITH REAL EXCAVATED TRENCH (140x140m)
  // ==========================================
  // Ground is split into 4 segments around the central trench (X: -24 to 24, Z: -12.5 to -8.5)
  // leaving an actual open chasm 1.8 meters deep below ground level!

  // South Sector (Behind the trench, including player spawn)
  const groundSouthGeo = new THREE.BoxGeometry(140, 1.0, 76.5);
  const groundSouth = new THREE.Mesh(groundSouthGeo, groundMaterial);
  groundSouth.position.set(0, -0.5, 29.75);
  groundSouth.receiveShadow = true;
  militaryWorld.add(groundSouth);

  // North Sector (Target range in front of the trench)
  const groundNorthGeo = new THREE.BoxGeometry(140, 1.0, 55.5);
  const groundNorth = new THREE.Mesh(groundNorthGeo, groundMaterial);
  groundNorth.position.set(0, -0.5, -40.25);
  groundNorth.receiveShadow = true;
  militaryWorld.add(groundNorth);

  // West Flank Ground (Left of trench)
  const groundWestGeo = new THREE.BoxGeometry(46, 1.0, 4.0);
  const groundWest = new THREE.Mesh(groundWestGeo, groundMaterial);
  groundWest.position.set(-47, -0.5, -10.5);
  groundWest.receiveShadow = true;
  militaryWorld.add(groundWest);

  // East Flank Ground (Right of trench)
  const groundEastGeo = new THREE.BoxGeometry(46, 1.0, 4.0);
  const groundEast = new THREE.Mesh(groundEastGeo, groundMaterial);
  groundEast.position.set(47, -0.5, -10.5);
  groundEast.receiveShadow = true;
  militaryWorld.add(groundEast);

  // Outer boundary earthen berms / walls (keeps player on range)
  const bermMaterial = new THREE.MeshStandardMaterial({
    color: 0x6e5c43,
    roughness: 1.0,
  });

  function createBerm(width, height, depth, x, z, rotY = 0) {
    const bermGeo = new THREE.BoxGeometry(width, height, depth);
    const berm = new THREE.Mesh(bermGeo, bermMaterial);
    berm.position.set(x, height / 2, z);
    berm.rotation.y = rotY;
    berm.castShadow = true;
    berm.receiveShadow = true;
    militaryWorld.add(berm);
  }

  createBerm(140, 5, 4, 0, -68);
  createBerm(140, 5, 4, 0, 68);
  createBerm(4, 5, 140, -68, 0);
  createBerm(4, 5, 140, 68, 0);

  // ==========================================
  // 2. SUNKEN TRENCH (DEEPLY EXCAVATED: 1.8M DEEP)
  // ==========================================
  const trenchGroup = new THREE.Group();
  const TRENCH_DEPTH = 1.8;
  const TRENCH_FLOOR_Y = -TRENCH_DEPTH; // -1.8m
  const TRENCH_WIDTH = 4.0; // from Z = -8.5 to -12.5
  const TRENCH_LENGTH = 48.0; // from X = -24 to +24
  const TRENCH_CENTER_Z = -10.5;

  // Sandbag generator helper
  function createSandbag(x, y, z, rotY = 0) {
    const bagGeo = new THREE.BoxGeometry(0.85, 0.28, 0.45);
    const bag = new THREE.Mesh(bagGeo, sandbagMaterial);
    bag.position.set(x, y, z);
    bag.rotation.y = rotY;
    bag.castShadow = true;
    bag.receiveShadow = true;
    return bag;
  }

  function createSandbagWall(startX, startZ, endX, endZ, layers = 3) {
    const wallGroup = new THREE.Group();
    const length = Math.hypot(endX - startX, endZ - startZ);
    const angle = Math.atan2(endZ - startZ, endX - startX);
    const bagLength = 0.8;
    const count = Math.ceil(length / bagLength);

    for (let l = 0; l < layers; l++) {
      const y = l * 0.26 + 0.14;
      const layerOffset = (l % 2) * (bagLength * 0.5);
      for (let i = 0; i < count; i++) {
        const dist = i * bagLength + layerOffset;
        if (dist > length) continue;
        const x = startX + Math.cos(angle) * dist;
        const z = startZ + Math.sin(angle) * dist;
        const bag = createSandbag(x, y, z, angle);
        wallGroup.add(bag);
      }
    }
    return wallGroup;
  }

  // 1. Trench floor (duckboards / planks at Y = -1.8)
  const trenchFloorGeo = new THREE.BoxGeometry(TRENCH_LENGTH, 0.2, TRENCH_WIDTH);
  const trenchFloor = new THREE.Mesh(trenchFloorGeo, trenchWoodMaterial);
  trenchFloor.position.set(0, TRENCH_FLOOR_Y + 0.1, TRENCH_CENTER_Z);
  trenchFloor.receiveShadow = true;
  trenchGroup.add(trenchFloor);

  // 2. South Retaining Wall (from Y = -1.8 up to ground level Y = 0)
  const southWallGeo = new THREE.BoxGeometry(TRENCH_LENGTH, TRENCH_DEPTH, 0.25);
  const southWall = new THREE.Mesh(southWallGeo, trenchWoodMaterial);
  southWall.position.set(0, TRENCH_FLOOR_Y / 2, -8.4);
  southWall.castShadow = true;
  southWall.receiveShadow = true;
  trenchGroup.add(southWall);

  // 3. North Retaining Wall (from Y = -1.8 up to ground level Y = 0)
  const northWallGeo = new THREE.BoxGeometry(TRENCH_LENGTH, TRENCH_DEPTH, 0.25);
  const northWall = new THREE.Mesh(northWallGeo, trenchWoodMaterial);
  northWall.position.set(0, TRENCH_FLOOR_Y / 2, -12.6);
  northWall.castShadow = true;
  northWall.receiveShadow = true;
  trenchGroup.add(northWall);

  // 4. West and East End Caps
  const endWallGeo = new THREE.BoxGeometry(0.25, TRENCH_DEPTH, TRENCH_WIDTH);
  const westWall = new THREE.Mesh(endWallGeo, trenchWoodMaterial);
  westWall.position.set(-24.1, TRENCH_FLOOR_Y / 2, TRENCH_CENTER_Z);
  westWall.castShadow = true;
  westWall.receiveShadow = true;
  trenchGroup.add(westWall);

  const eastWall = new THREE.Mesh(endWallGeo, trenchWoodMaterial);
  eastWall.position.set(24.1, TRENCH_FLOOR_Y / 2, TRENCH_CENTER_Z);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;
  trenchGroup.add(eastWall);

  // 5. Firing steps inside the trench (wooden ledge at Y = -1.1 along north wall)
  const firingStepGeo = new THREE.BoxGeometry(TRENCH_LENGTH - 4, 0.65, 1.2);
  const firingStep = new THREE.Mesh(firingStepGeo, trenchWoodMaterial);
  firingStep.position.set(0, TRENCH_FLOOR_Y + 0.325, -11.9);
  firingStep.castShadow = true;
  firingStep.receiveShadow = true;
  trenchGroup.add(firingStep);

  // 6. Sandbag Parapets along top edges at Y = 0
  // Forward parapet facing shooting targets
  trenchGroup.add(createSandbagWall(-24, -12.7, 24, -12.7, 3));
  // Rear rim
  trenchGroup.add(createSandbagWall(-24, -8.3, 24, -8.3, 2));

  // 7. Wooden Entrance Ramps (smooth descent 1.8m down into trench)
  function createEntranceRamp(x, startZ, endZ) {
    const dz = endZ - startZ;
    const rampLen = Math.hypot(dz, TRENCH_DEPTH);
    const rampGeo = new THREE.BoxGeometry(2.4, 0.15, rampLen);
    const ramp = new THREE.Mesh(rampGeo, trenchWoodMaterial);
    const midZ = (startZ + endZ) / 2;
    ramp.position.set(x, TRENCH_FLOOR_Y / 2, midZ);
    ramp.rotation.x = Math.atan2(TRENCH_DEPTH, dz);
    ramp.receiveShadow = true;
    ramp.castShadow = true;
    trenchGroup.add(ramp);
  }

  // 3 Wide descent ramps into the trench:
  createEntranceRamp(0, -5.5, -9.5);     // Center ramp right ahead from spawn!
  createEntranceRamp(-16, -5.5, -9.5);   // Left flank ramp
  createEntranceRamp(16, -5.5, -9.5);    // Right flank ramp

  militaryWorld.add(trenchGroup);

  // ==========================================
  // 3. FIRING LINE & SHOOTING STANDS
  // ==========================================
  const firingLineGroup = new THREE.Group();
  firingLineGroup.position.set(0, 0, -6);

  // Low sandbag parapet for prone/kneeling shooting
  firingLineGroup.add(createSandbagWall(-9, 0, 9, 0, 3));

  // Wooden firing tables / weapon benches
  function createBench(x, z) {
    const benchGroup = new THREE.Group();
    benchGroup.position.set(x, 0, z);

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.1, 0.9),
      trenchWoodMaterial
    );
    top.position.y = 0.85;
    top.castShadow = true;
    top.receiveShadow = true;
    benchGroup.add(top);

    const legGeo = new THREE.BoxGeometry(0.1, 0.85, 0.1);
    for (const [dx, dz] of [
      [-0.8, -0.35],
      [0.8, -0.35],
      [-0.8, 0.35],
      [0.8, 0.35],
    ]) {
      const leg = new THREE.Mesh(legGeo, trenchWoodMaterial);
      leg.position.set(dx, 0.425, dz);
      leg.castShadow = true;
      benchGroup.add(leg);
    }
    return benchGroup;
  }

  firingLineGroup.add(createBench(-5, 1.2));
  firingLineGroup.add(createBench(0, 1.2));
  firingLineGroup.add(createBench(5, 1.2));

  militaryWorld.add(firingLineGroup);

  // ==========================================
  // DRONE EXHIBITION TABLES NEAR PLAYER SPAWN (0, 0, 0)
  // ==========================================
  function createFPVDrone(x, y, z, rotY = 0, withRPG = true) {
    const drone = new THREE.Group();
    drone.position.set(x, y, z);
    drone.rotation.y = rotY;

    // Carbon fiber X-frame
    const armMat = new THREE.MeshStandardMaterial({
      color: 0x1c1c1c,
      roughness: 0.8,
      metalness: 0.2,
    });
    const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.04), armMat);
    arm1.rotation.y = Math.PI / 4;
    drone.add(arm1);
    const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.04), armMat);
    arm2.rotation.y = -Math.PI / 4;
    drone.add(arm2);

    // Center electronics stack
    const stack = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.09), metalDark);
    stack.position.y = 0.02;
    drone.add(stack);

    // Top LiPo battery with yellow warning wrap
    const batMat = new THREE.MeshStandardMaterial({ color: 0xdeb021, roughness: 0.6 });
    const battery = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.045, 0.12), batMat);
    battery.position.set(0, 0.055, -0.01);
    drone.add(battery);

    // Front FPV camera lens
    const camMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
    const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 8), camMat);
    cam.rotation.x = -Math.PI / 3;
    cam.position.set(0, 0.035, 0.06);
    drone.add(cam);

    // 4 Motors & 3-Blade Propellers
    const motorMat = new THREE.MeshStandardMaterial({ color: 0xb32424, metalness: 0.8, roughness: 0.3 });
    const propMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6 });
    const r = 0.13;
    for (const [mx, mz] of [[r, r], [-r, r], [r, -r], [-r, -r]]) {
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.025, 8), motorMat);
      motor.position.set(mx, 0.02, mz);
      drone.add(motor);

      const propGroup = new THREE.Group();
      propGroup.position.set(mx, 0.035, mz);
      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.003, 0.015), propMat);
        blade.position.x = 0.04;
        blade.rotation.y = (b * Math.PI * 2) / 3;
        propGroup.add(blade);
      }
      drone.add(propGroup);
    }

    // RPG-7 warhead payload mockup strapped underneath
    if (withRPG) {
      const payloadGroup = new THREE.Group();
      payloadGroup.position.set(0, -0.04, 0);

      const rpgMat = new THREE.MeshStandardMaterial({ color: 0x485338, roughness: 0.7 });
      const rocketBody = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 10), rpgMat);
      rocketBody.rotation.x = Math.PI / 2;
      payloadGroup.add(rocketBody);

      const warhead = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 10), rpgMat);
      warhead.rotation.x = Math.PI / 2;
      warhead.position.z = 0.18;
      payloadGroup.add(warhead);

      drone.add(payloadGroup);
    }

    return drone;
  }

  function createReconDrone(x, y, z, rotY = 0) {
    const drone = new THREE.Group();
    drone.position.set(x, y, z);
    drone.rotation.y = rotY;

    // Sleek grey aerodynamic body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x6e7378, roughness: 0.5, metalness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.32), bodyMat);
    body.position.y = 0.05;
    drone.add(body);

    // 4 folding arms
    const armMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
    for (const [ax, az, rot] of [
      [-0.14, 0.12, -0.3],
      [0.14, 0.12, 0.3],
      [-0.16, -0.12, -0.4],
      [0.16, -0.12, 0.4]
    ]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.03), armMat);
      arm.position.set(ax, 0.05, az);
      arm.rotation.y = rot;
      drone.add(arm);

      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 8), metalDark);
      motor.position.set(ax * 1.6, 0.06, az * 1.5);
      drone.add(motor);

      const prop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.004, 0.02), metalDark);
      prop.position.set(ax * 1.6, 0.075, az * 1.5);
      drone.add(prop);
    }

    // Optical camera gimbal
    const camSphere = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), metalDark);
    camSphere.position.set(0, 0.01, 0.16);
    drone.add(camSphere);

    // Landing legs
    for (const lx of [-0.08, 0.08]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), metalDark);
      leg.position.set(lx, 0.03, 0);
      leg.rotation.z = lx > 0 ? -0.2 : 0.2;
      drone.add(leg);
    }

    return drone;
  }

  function createDroneController(x, y, z, rotY = 0) {
    const ctrl = new THREE.Group();
    ctrl.position.set(x, y, z);
    ctrl.rotation.y = rotY;

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.16), bodyMat);
    body.position.y = 0.02;
    ctrl.add(body);

    // Display screen
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x0e2a3a, metalness: 0.8, roughness: 0.2 });
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.008, 0.09), screenMat);
    screen.position.set(0, 0.045, 0.01);
    ctrl.add(screen);

    // 2 Joysticks
    const stickMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
    for (const sx of [-0.06, 0.06]) {
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.025, 6), stickMat);
      stick.position.set(sx, 0.05, -0.04);
      ctrl.add(stick);
    }

    // Antenna
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.15, 6), metalDark);
    ant.rotation.z = Math.PI / 2;
    ant.position.set(0, 0.03, -0.09);
    ctrl.add(ant);

    return ctrl;
  }

  function createDroneGoggles(x, y, z, rotY = 0) {
    const goggles = new THREE.Group();
    goggles.position.set(x, y, z);
    goggles.rotation.y = rotY;

    const gogMat = new THREE.MeshStandardMaterial({ color: 0x242426, roughness: 0.6 });
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.09), gogMat);
    visor.position.y = 0.035;
    goggles.add(visor);

    // Head strap
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 16), strapMat);
    strap.rotation.x = Math.PI / 2;
    strap.position.set(0, 0.035, -0.05);
    goggles.add(strap);

    // 2 antennas
    for (const ax of [-0.06, 0.06]) {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.05, 6), metalDark);
      stalk.position.set(ax, 0.08, 0.02);
      goggles.add(stalk);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.015, 8), redBarrelMaterial);
      cap.position.set(ax, 0.11, 0.02);
      goggles.add(cap);
    }

    return goggles;
  }

  function createDroneTable(x, z, rotY = 0) {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(x, 0, z);
    tableGroup.rotation.y = rotY;

    // Military table top
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x4a3d2c, roughness: 0.85 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.0), tableMat);
    top.position.y = 0.85;
    top.castShadow = true;
    top.receiveShadow = true;
    tableGroup.add(top);

    // 4 legs
    const legGeo = new THREE.BoxGeometry(0.08, 0.85, 0.08);
    for (const [lx, lz] of [[-1.1, -0.4], [1.1, -0.4], [-1.1, 0.4], [1.1, 0.4]]) {
      const leg = new THREE.Mesh(legGeo, tableMat);
      leg.position.set(lx, 0.425, lz);
      leg.castShadow = true;
      tableGroup.add(leg);
    }

    return tableGroup;
  }

  // Display Tables stationed beside the player spawn point at (0, 0, 0)
  const droneStationGroup = new THREE.Group();

  // Left Table: 2 FPV Attack Drones with RPG payloads + FPV Goggles
  const leftTable = createDroneTable(-2.4, 0.4, 0.08);
  leftTable.add(createFPVDrone(-0.6, 0.94, 0.05, 0.35, true));
  leftTable.add(createFPVDrone(0.6, 0.94, -0.05, -0.2, true));
  leftTable.add(createDroneGoggles(0, 0.94, -0.15, 0.1));
  droneStationGroup.add(leftTable);

  // Right Table: Reconnaissance Drone + Remote Controller + Ammo/Battery crate
  const rightTable = createDroneTable(2.4, 0.4, -0.08);
  rightTable.add(createReconDrone(-0.5, 0.94, 0, -0.25));
  rightTable.add(createDroneController(0.4, 0.94, 0.05, 0.15));
  droneStationGroup.add(rightTable);

  // Ready FPV Drone sitting directly on the front firing bench
  firingLineGroup.add(createFPVDrone(0, 0.94, 1.2, 0, true));

  militaryWorld.add(droneStationGroup);

  // ==========================================
  // 4. INTERACTIVE SHOOTING TARGETS
  // ==========================================
  function createInteractiveTarget(x, z, type = "round") {
    const targetRoot = new THREE.Group();
    targetRoot.position.set(x, 0, z);

    // Base wooden post stuck in ground
    const postGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.2, 8);
    const post = new THREE.Mesh(postGeo, trenchWoodMaterial);
    post.position.y = 0.6;
    post.castShadow = true;
    targetRoot.add(post);

    // Hinge pivot group for falling animation
    const pivot = new THREE.Group();
    pivot.position.set(0, 1.2, 0);

    let targetMesh;
    if (type === "round") {
      const plateGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.04, 24);
      plateGeo.rotateX(Math.PI / 2);
      targetMesh = new THREE.Mesh(plateGeo, targetBullseyeMat);
      targetMesh.position.set(0, 0.55, 0);
    } else {
      const plateGeo = new THREE.BoxGeometry(0.65, 1.2, 0.04);
      targetMesh = new THREE.Mesh(plateGeo, targetSilhouetteMat);
      targetMesh.position.set(0, 0.65, 0);
    }
    targetMesh.castShadow = true;
    targetMesh.receiveShadow = true;
    pivot.add(targetMesh);
    targetRoot.add(pivot);

    // Interactive target record
    const targetObj = {
      root: targetRoot,
      pivot: pivot,
      worldPos: new THREE.Vector3(x, 1.7, z),
      radius: type === "round" ? 0.6 : 0.75,
      isHit: false,
      hit: function () {
        if (this.isHit) return;
        this.isHit = true;
        // Knock down backwards
        pivot.rotation.x = -Math.PI * 0.48;

        // Stand back up after 3.5 seconds
        setTimeout(() => {
          pivot.rotation.x = 0;
          this.isHit = false;
        }, 3500);
      },
    };

    interactiveTargets.push(targetObj);
    militaryWorld.add(targetRoot);
  }

  // Firing range lanes
  createInteractiveTarget(-5.5, -20, "round");
  createInteractiveTarget(-5.5, -34, "silhouette");
  createInteractiveTarget(-5.5, -52, "round");

  createInteractiveTarget(0, -22, "silhouette");
  createInteractiveTarget(0, -38, "round");
  createInteractiveTarget(0, -56, "silhouette");

  createInteractiveTarget(5.5, -20, "round");
  createInteractiveTarget(5.5, -34, "silhouette");
  createInteractiveTarget(5.5, -52, "round");

  createInteractiveTarget(-10, -60, "silhouette");
  createInteractiveTarget(10, -60, "silhouette");

  // Backstop berm behind targets
  createBerm(36, 4.5, 4, 0, -63);

  // ==========================================
  // 5. MILITARY VEHICLES (TANKS & TRUCK)
  // ==========================================
  function createTank(x, y, z, rotY = 0) {
    const tank = new THREE.Group();
    tank.position.set(x, y, z);
    tank.rotation.y = rotY;

    // 1. Tracks (Left & Right)
    const trackGeo = new THREE.BoxGeometry(0.85, 0.85, 6.2);
    const leftTrack = new THREE.Mesh(trackGeo, metalDark);
    leftTrack.position.set(-1.6, 0.425, 0);
    leftTrack.castShadow = true;
    tank.add(leftTrack);

    const rightTrack = new THREE.Mesh(trackGeo, metalDark);
    rightTrack.position.set(1.6, 0.425, 0);
    rightTrack.castShadow = true;
    tank.add(rightTrack);

    // Track mudguards / side skirts (level & straight)
    const trackGuardGeo = new THREE.BoxGeometry(0.9, 0.12, 6.2);
    const lGuard = new THREE.Mesh(trackGuardGeo, tankArmorDark);
    lGuard.position.set(-1.6, 0.9, 0);
    tank.add(lGuard);
    const rGuard = new THREE.Mesh(trackGuardGeo, tankArmorDark);
    rGuard.position.set(1.6, 0.9, 0);
    tank.add(rGuard);

    // Outer side armor skirts (straight & level)
    const skirtGeo = new THREE.BoxGeometry(0.06, 0.55, 5.8);
    const lSkirt = new THREE.Mesh(skirtGeo, tankArmorTrim);
    lSkirt.position.set(-2.06, 0.6, 0);
    tank.add(lSkirt);
    const rSkirt = new THREE.Mesh(skirtGeo, tankArmorTrim);
    rSkirt.position.set(2.06, 0.6, 0);
    tank.add(rSkirt);

    // 2. Main Hull (Straight, flat, solid)
    // Lower hull
    const hullLowerGeo = new THREE.BoxGeometry(2.35, 0.8, 6.0);
    const hullLower = new THREE.Mesh(hullLowerGeo, tankArmorDark);
    hullLower.position.set(0, 0.75, 0);
    hullLower.castShadow = true;
    tank.add(hullLower);

    // Upper hull deck (straight level rectangular box)
    const hullDeckGeo = new THREE.BoxGeometry(2.35, 0.45, 5.8);
    const hullDeck = new THREE.Mesh(hullDeckGeo, tankArmorDark);
    hullDeck.position.set(0, 1.25, 0);
    hullDeck.castShadow = true;
    tank.add(hullDeck);

    // Front nose plate (straight level step, NO tilt)
    const noseGeo = new THREE.BoxGeometry(2.34, 0.4, 0.5);
    const nose = new THREE.Mesh(noseGeo, tankArmorTrim);
    nose.position.set(0, 1.05, 3.0);
    tank.add(nose);

    // 3. Turret (Clean, low-profile battle tank turret)
    const turretGeo = new THREE.BoxGeometry(2.2, 0.75, 2.8);
    const turret = new THREE.Mesh(turretGeo, tankArmorDark);
    turret.position.set(0, 1.85, -0.2);
    turret.castShadow = true;
    tank.add(turret);

    // Front turret mantlet block
    const mantletBlock = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.55, 0.6),
      tankArmorTrim
    );
    mantletBlock.position.set(0, 1.85, 1.4);
    mantletBlock.castShadow = true;
    tank.add(mantletBlock);

    // 4. Main Cannon Barrel (Straight horizontal cylinder pointing forward)
    const barrelGeo = new THREE.CylinderGeometry(0.12, 0.14, 4.4, 10);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, metalDark);
    barrel.position.set(0, 1.85, 3.8);
    barrel.castShadow = true;
    tank.add(barrel);

    // Fume extractor thermal sleeve
    const fumeGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.85, 10);
    fumeGeo.rotateX(Math.PI / 2);
    const fume = new THREE.Mesh(fumeGeo, tankArmorTrim);
    fume.position.set(0, 1.85, 3.5);
    tank.add(fume);

    // Muzzle brake
    const muzzleGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.35, 10);
    muzzleGeo.rotateX(Math.PI / 2);
    const muzzle = new THREE.Mesh(muzzleGeo, tankArmorTrim);
    muzzle.position.set(0, 1.85, 6.1);
    tank.add(muzzle);

    // 5. Turret Roof Equipment
    // Commander's cupola
    const cupola = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.38, 0.22, 10),
      tankArmorTrim
    );
    cupola.position.set(-0.55, 2.3, -0.4);
    cupola.castShadow = true;
    tank.add(cupola);

    // Gunner's hatch
    const gunnerHatch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.32, 0.12, 10),
      tankArmorTrim
    );
    gunnerHatch.position.set(0.55, 2.25, -0.3);
    tank.add(gunnerHatch);

    // Machine gun on cupola (12.7mm)
    const mgBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.025, 0.9, 8),
      metalDark
    );
    mgBarrel.rotateX(Math.PI / 2);
    mgBarrel.position.set(-0.55, 2.5, 0.1);
    tank.add(mgBarrel);

    // Radio antenna
    const ant = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.02, 2.2, 6),
      metalDark
    );
    ant.position.set(0.7, 3.1, -0.8);
    tank.add(ant);

    // 6. Rear Engine Deck & External Fuel Drums
    const stowageBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.25, 0.5),
      tankArmorTrim
    );
    stowageBox.position.set(0, 1.55, -2.4);
    tank.add(stowageBox);

    const fuelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.9, 10);
    fuelGeo.rotateZ(Math.PI / 2);
    const fuel1 = new THREE.Mesh(fuelGeo, redBarrelMaterial);
    fuel1.position.set(-0.75, 1.35, -2.95);
    tank.add(fuel1);
    const fuel2 = new THREE.Mesh(fuelGeo, redBarrelMaterial);
    fuel2.position.set(0.75, 1.35, -2.95);
    tank.add(fuel2);

    return tank;
  }

  // Tank 1: On the right flank pointing downrange
  militaryWorld.add(createTank(18, 0, -18, -Math.PI * 0.2));

  // Tank 2: Near maintenance area on the right
  militaryWorld.add(createTank(26, 0, -36, Math.PI * 0.15));

  // Military Transport Truck
  function createMilitaryTruck(x, y, z, rotY = 0) {
    const truck = new THREE.Group();
    truck.position.set(x, y, z);
    truck.rotation.y = rotY;

    // Chassis & Wheels
    const chassisGeo = new THREE.BoxGeometry(2.3, 0.4, 7.2);
    const chassis = new THREE.Mesh(chassisGeo, metalDark);
    chassis.position.y = 0.8;
    truck.add(chassis);

    const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelZPositions = [-2.4, -1.2, 2.2];
    for (const wz of wheelZPositions) {
      const wL = new THREE.Mesh(wheelGeo, metalDark);
      wL.position.set(-1.25, 0.55, wz);
      wL.castShadow = true;
      truck.add(wL);

      const wR = new THREE.Mesh(wheelGeo, metalDark);
      wR.position.set(1.25, 0.55, wz);
      wR.castShadow = true;
      truck.add(wR);
    }

    // Cab
    const cabGeo = new THREE.BoxGeometry(2.3, 1.7, 2.2);
    const cab = new THREE.Mesh(cabGeo, tankArmorDark);
    cab.position.set(0, 1.85, 2.2);
    cab.castShadow = true;
    cab.receiveShadow = true;
    truck.add(cab);

    // Glass Material for all windows
    const truckGlassMat = new THREE.MeshStandardMaterial({
      color: 0x1f3344,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.75,
    });

    // 1. Windshield (Front split dual-pane glass)
    const windshieldGeo = new THREE.BoxGeometry(0.98, 0.62, 0.05);
    const leftWindshield = new THREE.Mesh(windshieldGeo, truckGlassMat);
    leftWindshield.position.set(-0.52, 2.05, 3.32);
    truck.add(leftWindshield);

    const rightWindshield = new THREE.Mesh(windshieldGeo, truckGlassMat);
    rightWindshield.position.set(0.52, 2.05, 3.32);
    truck.add(rightWindshield);

    const centerPost = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.65, 0.06),
      tankArmorTrim
    );
    centerPost.position.set(0, 2.05, 3.33);
    truck.add(centerPost);

    // 2. Side Door Windows (Left & Right)
    const sideWindowGeo = new THREE.BoxGeometry(0.05, 0.55, 0.85);
    const lSideWin = new THREE.Mesh(sideWindowGeo, truckGlassMat);
    lSideWin.position.set(-1.16, 2.05, 2.35);
    truck.add(lSideWin);

    const rSideWin = new THREE.Mesh(sideWindowGeo, truckGlassMat);
    rSideWin.position.set(1.16, 2.05, 2.35);
    truck.add(rSideWin);

    // 3. Rear Cab Window
    const rearWinGeo = new THREE.BoxGeometry(0.9, 0.45, 0.05);
    const rearWin = new THREE.Mesh(rearWinGeo, truckGlassMat);
    rearWin.position.set(0, 2.05, 1.09);
    truck.add(rearWin);

    // 4. Door Handles (Left & Right)
    const handleMat = metalDark;
    for (const hx of [-1.17, 1.17]) {
      const handleBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.05, 0.18),
        tankArmorTrim
      );
      handleBase.position.set(hx, 1.55, 1.95);
      truck.add(handleBase);

      const handleBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.025, 0.14),
        handleMat
      );
      handleBar.position.set(hx < 0 ? hx - 0.02 : hx + 0.02, 1.55, 1.95);
      truck.add(handleBar);
    }

    // 5. Side Mirrors (Left & Right)
    for (const mx of [-1.35, 1.35]) {
      const bracket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6),
        handleMat
      );
      bracket.rotateZ(Math.PI / 2);
      bracket.position.set(mx > 0 ? 1.25 : -1.25, 2.0, 3.0);
      truck.add(bracket);

      const mirror = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.35, 0.18),
        handleMat
      );
      mirror.position.set(mx, 2.0, 3.0);
      truck.add(mirror);

      const mirrorGlass = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.32, 0.16),
        truckGlassMat
      );
      mirrorGlass.position.set(mx > 0 ? mx - 0.025 : mx + 0.025, 2.0, 3.0);
      truck.add(mirrorGlass);
    }

    // 6. Front Grille, Bumper & Headlights
    const bumper = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.35, 0.3),
      metalDark
    );
    bumper.position.set(0, 0.8, 3.45);
    bumper.castShadow = true;
    truck.add(bumper);

    // Headlights
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xfff2b0,
      emissive: 0xffeeaa,
      emissiveIntensity: 0.3,
      roughness: 0.2,
    });
    for (const lx of [-0.85, 0.85]) {
      const light = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12),
        lightMat
      );
      light.rotateX(Math.PI / 2);
      light.position.set(lx, 0.8, 3.61);
      truck.add(light);
    }

    // Radiator grille
    const grille = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.5, 0.05),
      metalDark
    );
    grille.position.set(0, 1.45, 3.32);
    truck.add(grille);

    // Door footsteps under cab
    for (const sx of [-1.22, 1.22]) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.04, 0.45),
        metalDark
      );
      step.position.set(sx, 0.7, 2.1);
      truck.add(step);
    }

    // Flatbed Cargo Area
    const flatbedGeo = new THREE.BoxGeometry(2.4, 0.3, 4.4);
    const flatbed = new THREE.Mesh(flatbedGeo, trenchWoodMaterial);
    flatbed.position.set(0, 1.15, -1.2);
    flatbed.castShadow = true;
    flatbed.receiveShadow = true;
    truck.add(flatbed);

    // Canvas Cover (Tarpaulin)
    const coverGeo = new THREE.BoxGeometry(2.4, 1.6, 4.3);
    const coverMat = new THREE.MeshStandardMaterial({
      color: 0x474938,
      roughness: 0.9,
    });
    const cover = new THREE.Mesh(coverGeo, coverMat);
    cover.position.set(0, 2.1, -1.2);
    cover.castShadow = true;
    cover.receiveShadow = true;
    truck.add(cover);

    return truck;
  }

  militaryWorld.add(createMilitaryTruck(20, 0, -4, -Math.PI * 0.35));

  // ==========================================
  // БОЕВАЯ МАШИНА ПЕХОТЫ (БМП-2)
  // ==========================================
  function createBMP(x, y, z, rotY = 0) {
    const bmp = new THREE.Group();
    bmp.position.set(x, y, z);
    bmp.rotation.y = rotY;

    // Tracks
    const trackGeo = new THREE.BoxGeometry(0.6, 0.6, 5.2);
    const leftTrack = new THREE.Mesh(trackGeo, metalDark);
    leftTrack.position.set(-1.4, 0.3, 0);
    leftTrack.castShadow = true;
    bmp.add(leftTrack);

    const rightTrack = new THREE.Mesh(trackGeo, metalDark);
    rightTrack.position.set(1.4, 0.3, 0);
    rightTrack.castShadow = true;
    bmp.add(rightTrack);

    // Lower hull
    const hullGeo = new THREE.BoxGeometry(2.3, 0.6, 5.0);
    const hull = new THREE.Mesh(hullGeo, tankArmorDark);
    hull.position.set(0, 0.6, 0);
    hull.castShadow = true;
    bmp.add(hull);

    // Front glacis (sloped)
    const glacisGeo = new THREE.BoxGeometry(2.28, 0.4, 1.6);
    const glacis = new THREE.Mesh(glacisGeo, tankArmorDark);
    glacis.position.set(0, 0.9, 1.6);
    glacis.rotation.x = -Math.PI * 0.2;
    glacis.castShadow = true;
    bmp.add(glacis);

    // Upper deck
    const deckGeo = new THREE.BoxGeometry(2.28, 0.3, 3.0);
    const deck = new THREE.Mesh(deckGeo, tankArmorDark);
    deck.position.set(0, 1.0, -0.6);
    deck.castShadow = true;
    bmp.add(deck);

    // Turret (slightly tapered box)
    const turretGeo = new THREE.BoxGeometry(1.3, 0.55, 1.5);
    const turret = new THREE.Mesh(turretGeo, tankArmorDark);
    turret.position.set(0, 1.4, 0.2);
    turret.castShadow = true;
    bmp.add(turret);

    // Cannon mantlet
    const mantletGeo = new THREE.BoxGeometry(0.5, 0.35, 0.4);
    const mantlet = new THREE.Mesh(mantletGeo, tankArmorTrim);
    mantlet.position.set(0, 1.42, 0.95);
    bmp.add(mantlet);

    // 30mm barrel
    const barrelGeo = new THREE.CylinderGeometry(0.04, 0.05, 2.8, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, metalDark);
    barrel.position.set(0, 1.44, 2.3);
    barrel.castShadow = true;
    bmp.add(barrel);

    // Muzzle brake
    const muzzleGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.25, 8);
    muzzleGeo.rotateX(Math.PI / 2);
    const muzzleBrake = new THREE.Mesh(muzzleGeo, tankArmorTrim);
    muzzleBrake.position.set(0, 1.44, 3.75);
    bmp.add(muzzleBrake);

    // ATGM launcher tube on top
    const atgmGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 8);
    atgmGeo.rotateX(Math.PI / 2);
    const atgm = new THREE.Mesh(atgmGeo, tankArmorTrim);
    atgm.position.set(0, 1.8, 0.2);
    bmp.add(atgm);

    // Rear troop doors
    for (const dx of [-0.5, 0.5]) {
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.6, 0.06),
        tankArmorTrim
      );
      door.position.set(dx, 0.7, -2.55);
      bmp.add(door);
    }

    // Radio antenna
    const ant = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.02, 2.0, 6),
      metalDark
    );
    ant.position.set(0.6, 2.2, -0.3);
    bmp.add(ant);

    return bmp;
  }

  // ==========================================
  // САУ / АРТИЛЛЕРИЙСКАЯ УСТАНОВКА (152ММ ГАУБИЦА)
  // ==========================================
  function createArtillery(x, y, z, rotY = 0) {
    const arty = new THREE.Group();
    arty.position.set(x, y, z);
    arty.rotation.y = rotY;

    // Tracks
    const trackGeo = new THREE.BoxGeometry(0.9, 0.9, 6.4);
    const leftTrack = new THREE.Mesh(trackGeo, metalDark);
    leftTrack.position.set(-1.7, 0.45, 0);
    leftTrack.castShadow = true;
    arty.add(leftTrack);

    const rightTrack = new THREE.Mesh(trackGeo, metalDark);
    rightTrack.position.set(1.7, 0.45, 0);
    rightTrack.castShadow = true;
    arty.add(rightTrack);

    // Lower hull
    const hullGeo = new THREE.BoxGeometry(2.7, 0.8, 6.2);
    const hull = new THREE.Mesh(hullGeo, tankArmorDark);
    hull.position.set(0, 0.8, 0);
    hull.castShadow = true;
    arty.add(hull);

    // Front glacis (sloped)
    const glacisGeo = new THREE.BoxGeometry(2.68, 0.55, 1.8);
    const glacis = new THREE.Mesh(glacisGeo, tankArmorDark);
    glacis.position.set(0, 1.2, 2.0);
    glacis.rotation.x = -Math.PI * 0.16;
    arty.add(glacis);

    // Upper hull deck
    const deckGeo = new THREE.BoxGeometry(2.68, 0.35, 4.0);
    const deck = new THREE.Mesh(deckGeo, tankArmorDark);
    deck.position.set(0, 1.3, -0.8);
    arty.add(deck);

    // Massive boxy turret
    const turretGeo = new THREE.BoxGeometry(2.4, 1.3, 3.4);
    const turret = new THREE.Mesh(turretGeo, tankArmorDark);
    turret.position.set(0, 2.1, -0.3);
    turret.castShadow = true;
    arty.add(turret);

    // Turret rear bustle
    const bustleGeo = new THREE.BoxGeometry(2.1, 0.9, 1.2);
    const bustle = new THREE.Mesh(bustleGeo, tankArmorTrim);
    bustle.position.set(0, 2.0, -2.3);
    bustle.castShadow = true;
    arty.add(bustle);

    // Gun mantlet / cradle
    const mantletGeo = new THREE.BoxGeometry(1.0, 0.8, 0.7);
    const mantlet = new THREE.Mesh(mantletGeo, tankArmorTrim);
    mantlet.position.set(0, 2.1, 1.7);
    mantlet.castShadow = true;
    arty.add(mantlet);

    // Massive 152mm Gun (Elevated)
    const gunGroup = new THREE.Group();
    gunGroup.position.set(0, 2.1, 2.0);
    gunGroup.rotation.x = -Math.PI * 0.14;

    // Main barrel
    const barrelGeo = new THREE.CylinderGeometry(0.16, 0.22, 6.0, 10);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, metalDark);
    barrel.position.set(0, 0, 3.0);
    barrel.castShadow = true;
    gunGroup.add(barrel);

    // Fume extractor
    const fumeGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.9, 10);
    fumeGeo.rotateX(Math.PI / 2);
    const fume = new THREE.Mesh(fumeGeo, tankArmorTrim);
    fume.position.set(0, 0, 2.8);
    gunGroup.add(fume);

    // Muzzle brake
    const brakeGeo = new THREE.BoxGeometry(0.45, 0.38, 0.6);
    const brake = new THREE.Mesh(brakeGeo, tankArmorTrim);
    brake.position.set(0, 0, 6.1);
    gunGroup.add(brake);

    arty.add(gunGroup);

    // Commander cupola
    const cupolaGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.25, 10);
    const cupola = new THREE.Mesh(cupolaGeo, tankArmorTrim);
    cupola.position.set(-0.6, 2.85, -0.4);
    arty.add(cupola);

    // Fuel drums at rear
    for (const dx of [-0.8, 0.8]) {
      const drumGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.85, 10);
      drumGeo.rotateZ(Math.PI / 2);
      const drum = new THREE.Mesh(drumGeo, greenBarrelMaterial);
      drum.position.set(dx, 1.4, -3.2);
      arty.add(drum);
    }

    return arty;
  }

  // ==========================================
  // DEPLOYMENT OF HEAVY ARMOR ON FLANKS
  // ==========================================
  // LEFT FLANK ARMOR:
  militaryWorld.add(createBMP(-20, 0, -20, -Math.PI * 0.12));
  militaryWorld.add(createArtillery(-28, 0, -44, -Math.PI * 0.16));
  militaryWorld.add(createBMP(-44, 0, -28, -Math.PI * 0.25));
  militaryWorld.add(createTank(-36, 0, 26, Math.PI * 0.3));

  // RIGHT FLANK ARMOR:
  militaryWorld.add(createArtillery(35, 0, -24, Math.PI * 0.12));
  militaryWorld.add(createBMP(32, 0, -50, -Math.PI * 0.08));
  militaryWorld.add(createBMP(34, 0, -6, -Math.PI * 0.28));
  militaryWorld.add(createTank(36, 0, 8, -Math.PI * 0.45));

  // ==========================================
  // 6. WATCHTOWER (СМОТРОВАЯ ВЫШКА)
  // ==========================================
  function createWatchtower(x, z) {
    const tower = new THREE.Group();
    tower.position.set(x, 0, z);

    const pillarHeight = 7.0;
    const legGeo = new THREE.BoxGeometry(0.25, pillarHeight, 0.25);

    for (const [dx, dz] of [
      [-2, -2],
      [2, -2],
      [-2, 2],
      [2, 2],
    ]) {
      const leg = new THREE.Mesh(legGeo, trenchWoodMaterial);
      leg.position.set(dx, pillarHeight / 2, dz);
      leg.castShadow = true;
      tower.add(leg);
    }

    // Platform floor
    const platformFloor = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.2, 4.6),
      trenchWoodMaterial
    );
    platformFloor.position.set(0, pillarHeight, 0);
    platformFloor.castShadow = true;
    platformFloor.receiveShadow = true;
    tower.add(platformFloor);

    // Guard rails
    const railGeo = new THREE.BoxGeometry(4.6, 0.9, 0.1);
    for (const [rx, rz, ry] of [
      [0, -2.25, 0],
      [0, 2.25, 0],
      [-2.25, 0, Math.PI / 2],
      [2.25, 0, Math.PI / 2],
    ]) {
      const rail = new THREE.Mesh(railGeo, trenchWoodMaterial);
      rail.position.set(rx, pillarHeight + 0.45, rz);
      rail.rotation.y = ry;
      tower.add(rail);
    }

    // Roof
    for (const [dx, dz] of [
      [-2, -2],
      [2, -2],
      [-2, 2],
      [2, 2],
    ]) {
      const rPole = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 2.2, 0.12),
        metalDark
      );
      rPole.position.set(dx, pillarHeight + 1.1, dz);
      tower.add(rPole);
    }

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.15, 5.2),
      tankArmorTrim
    );
    roof.position.set(0, pillarHeight + 2.2, 0);
    roof.castShadow = true;
    tower.add(roof);

    return tower;
  }

  militaryWorld.add(createWatchtower(28, 12));

  // ==========================================
  // 7. CRATES, FUEL BARRELS, CZECH HEDGEHOGS
  // ==========================================
  function createBarrel(x, y, z, mat) {
    const barrelGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.0, 16);
    const barrel = new THREE.Mesh(barrelGeo, mat);
    barrel.position.set(x, y + 0.5, z);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    militaryWorld.add(barrel);
  }

  function createCrate(x, y, z, size = 1.0, rotY = 0) {
    const crateGeo = new THREE.BoxGeometry(size, size, size);
    const crate = new THREE.Mesh(crateGeo, crateMaterial);
    crate.position.set(x, y + size / 2, z);
    crate.rotation.y = rotY;
    crate.castShadow = true;
    crate.receiveShadow = true;
    militaryWorld.add(crate);
  }

  // Ammo crates near firing line
  createCrate(-7.5, 0, -4, 1.0, 0.15);
  createCrate(-6.4, 0, -4.2, 1.0, -0.2);
  createCrate(-6.9, 1.0, -4.1, 0.9, 0.05);

  createCrate(7.2, 0, -4.5, 1.1, -0.1);
  createCrate(8.4, 0, -4.3, 1.0, 0.3);

  // Fuel barrels
  createBarrel(9.8, 0, -3.8, greenBarrelMaterial);
  createBarrel(10.5, 0, -4.2, greenBarrelMaterial);
  createBarrel(10.1, 0, -4.8, redBarrelMaterial);

  createBarrel(-8.5, 0, -8.5, redBarrelMaterial);
  createBarrel(-9.2, 0, -8.2, greenBarrelMaterial);

  // Czech Hedgehogs
  function createCzechHedgehog(x, z) {
    const hog = new THREE.Group();
    hog.position.set(x, 0.8, z);
    const beamGeo = new THREE.BoxGeometry(0.18, 2.2, 0.18);

    const b1 = new THREE.Mesh(beamGeo, metalDark);
    b1.rotation.set(0.6, 0.6, 0);
    b1.castShadow = true;
    hog.add(b1);

    const b2 = new THREE.Mesh(beamGeo, metalDark);
    b2.rotation.set(-0.6, -0.6, 0);
    b2.castShadow = true;
    hog.add(b2);

    const b3 = new THREE.Mesh(beamGeo, metalDark);
    b3.rotation.set(0, 0, Math.PI / 2);
    b3.castShadow = true;
    hog.add(b3);

    militaryWorld.add(hog);
  }

  createCzechHedgehog(12, -26);
  createCzechHedgehog(14, -28);
  createCzechHedgehog(10, -30);

  // ==========================================
  // 8. FIGHTER JET (СУ-30 / МИГ-29 СТИЛЬ) & KAZAKHSTAN FLAG
  // ==========================================

  // Canvas texture generator for Kazakhstan Flag
  function createKazakhstanFlagCanvasTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // Official Kazakhstan sky blue (Pantone 3125 C)
    ctx.fillStyle = "#00afca";
    ctx.fillRect(0, 0, 1024, 512);

    // Official national gold (Pantone 102 C)
    const goldColor = "#fec50c";
    ctx.fillStyle = goldColor;
    ctx.strokeStyle = goldColor;

    // --- 1. Traditional National Ornament "Koshkar-Muiz" on hoist (left) side ---
    const ornX = 64;
    const ornWidth = 48;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw vertical spine band
    ctx.beginPath();
    ctx.moveTo(ornX, 10);
    ctx.lineTo(ornX, 502);
    ctx.stroke();

    // Repeating symmetrical ram horn spirals
    const numUnits = 5;
    const unitHeight = 512 / numUnits;
    for (let u = 0; u < numUnits; u++) {
      const cy = u * unitHeight + unitHeight / 2;
      
      // Upper curl left & right
      ctx.beginPath();
      ctx.arc(ornX - 22, cy - 20, 16, 0, Math.PI * 1.5, false);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ornX + 22, cy - 20, 16, -Math.PI * 0.5, Math.PI, false);
      ctx.stroke();

      // Lower curl left & right
      ctx.beginPath();
      ctx.arc(ornX - 22, cy + 20, 16, 0, Math.PI * 1.5, true);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ornX + 22, cy + 20, 16, -Math.PI * 0.5, Math.PI, true);
      ctx.stroke();

      // Center diamond node
      ctx.beginPath();
      ctx.moveTo(ornX, cy - 14);
      ctx.lineTo(ornX + 12, cy);
      ctx.lineTo(ornX, cy + 14);
      ctx.lineTo(ornX - 12, cy);
      ctx.closePath();
      ctx.fill();
    }

    // --- 2. Golden Sun with 32 Rays in Center ---
    const sunX = 570;
    const sunY = 200;
    const sunRadius = 65;

    // Sun core disc
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // 32 pointed triangular rays
    const numRays = 32;
    const rayInnerRadius = sunRadius + 6;
    const rayOuterRadius = sunRadius + 44;
    for (let i = 0; i < numRays; i++) {
      const angle = (i * Math.PI * 2) / numRays;
      const angleLeft = angle - (Math.PI / numRays) * 0.65;
      const angleRight = angle + (Math.PI / numRays) * 0.65;

      const tipX = sunX + Math.cos(angle) * rayOuterRadius;
      const tipY = sunY + Math.sin(angle) * rayOuterRadius;
      const baseLeftX = sunX + Math.cos(angleLeft) * rayInnerRadius;
      const baseLeftY = sunY + Math.sin(angleLeft) * rayInnerRadius;
      const baseRightX = sunX + Math.cos(angleRight) * rayInnerRadius;
      const baseRightY = sunY + Math.sin(angleRight) * rayInnerRadius;

      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(baseLeftX, baseLeftY);
      ctx.lineTo(baseRightX, baseRightY);
      ctx.closePath();
      ctx.fill();
    }

    // --- 3. Soaring Steppe Eagle under the Sun ---
    const eagleY = 345;
    ctx.beginPath();
    // Head with beak pointing to the hoist side (left)
    ctx.moveTo(sunX - 14, eagleY - 24);
    ctx.lineTo(sunX - 28, eagleY - 20); // sharp beak tip
    ctx.lineTo(sunX - 18, eagleY - 14);
    ctx.lineTo(sunX - 6, eagleY - 8);

    // Left sweeping wing (curving up and out)
    ctx.quadraticCurveTo(sunX - 80, eagleY - 45, sunX - 140, eagleY - 65);
    // Left wingtip primary feathers
    ctx.lineTo(sunX - 134, eagleY - 50);
    ctx.lineTo(sunX - 150, eagleY - 58);
    ctx.lineTo(sunX - 138, eagleY - 40);
    ctx.lineTo(sunX - 145, eagleY - 44);
    // Lower curve of left wing back to body
    ctx.quadraticCurveTo(sunX - 80, eagleY - 15, sunX - 16, eagleY + 12);

    // Tail feathers fanning downward
    ctx.lineTo(sunX - 22, eagleY + 54);
    ctx.lineTo(sunX - 8, eagleY + 48);
    ctx.lineTo(sunX, eagleY + 58);
    ctx.lineTo(sunX + 8, eagleY + 48);
    ctx.lineTo(sunX + 22, eagleY + 54);

    // Lower curve of right wing
    ctx.lineTo(sunX + 16, eagleY + 12);
    ctx.quadraticCurveTo(sunX + 80, eagleY - 15, sunX + 145, eagleY - 44);
    // Right wingtip primary feathers
    ctx.lineTo(sunX + 138, eagleY - 40);
    ctx.lineTo(sunX + 150, eagleY - 58);
    ctx.lineTo(sunX + 134, eagleY - 50);
    ctx.lineTo(sunX + 140, eagleY - 65);
    // Upper curve of right wing back to neck
    ctx.quadraticCurveTo(sunX + 80, eagleY - 45, sunX + 6, eagleY - 18);
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    return texture;
  }

  // Helper for Kazakhstan Air Force roundel on fighter jet
  function createKazakhAirForceRoundel() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    // Outer sky blue ring
    ctx.fillStyle = "#00afca";
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();

    // Red star
    ctx.fillStyle = "#d92b2b";
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const aOuter = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const aInner = aOuter + Math.PI / 5;
      const xo = 64 + Math.cos(aOuter) * 52;
      const yo = 64 + Math.sin(aOuter) * 52;
      const xi = 64 + Math.cos(aInner) * 22;
      const yi = 64 + Math.sin(aInner) * 22;
      if (i === 0) ctx.moveTo(xo, yo);
      else ctx.lineTo(xo, yo);
      ctx.lineTo(xi, yi);
    }
    ctx.closePath();
    ctx.fill();

    // Center gold sun
    ctx.fillStyle = "#fec50c";
    ctx.beginPath();
    ctx.arc(64, 64, 16, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // Fighter Jet (Su-30 / MiG-29 Air Superiority Fighter)
  function createFighterJet(x, y, z, rotY = 0) {
    const jet = new THREE.Group();
    jet.position.set(x, y, z);
    jet.rotation.y = rotY;

    // Aircraft materials
    const camoBodyMat = new THREE.MeshStandardMaterial({
      color: 0x58697a, // Air Superiority Grey-Blue
      roughness: 0.45,
      metalness: 0.35,
    });

    const camoUpperMat = new THREE.MeshStandardMaterial({
      color: 0x415263, // Darker camouflage blotches
      roughness: 0.5,
      metalness: 0.3,
    });

    const radomeMat = new THREE.MeshStandardMaterial({
      color: 0x22262a, // Dark composite dielectric radome nose
      roughness: 0.7,
      metalness: 0.1,
    });

    const cockpitCanopyMat = new THREE.MeshStandardMaterial({
      color: 0x0e1b26, // Reflective tinted cockpit glass
      roughness: 0.08,
      metalness: 0.95,
    });

    const titaniumNozzleMat = new THREE.MeshStandardMaterial({
      color: 0x1f2022, // Burnt titanium jet exhausts
      roughness: 0.3,
      metalness: 0.9,
    });

    const missileWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xe8eaed,
      roughness: 0.4,
    });

    const missileFinMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
    });

    const roundelMat = new THREE.MeshStandardMaterial({
      map: createKazakhAirForceRoundel(),
      roughness: 0.5,
      transparent: true,
    });

    // 0. Concrete Parking Hardstand / Apron underneath
    const apronGeo = new THREE.BoxGeometry(18, 0.1, 20);
    const apronMat = new THREE.MeshStandardMaterial({
      color: 0x7a7f85,
      roughness: 0.9,
      metalness: 0.1,
    });
    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.position.set(0, 0.05, 0);
    apron.receiveShadow = true;
    jet.add(apron);

    // Yellow taxiway line on concrete
    const lineGeo = new THREE.BoxGeometry(0.35, 0.11, 16);
    const lineMat = new THREE.MeshStandardMaterial({
      color: 0xf5b700,
      roughness: 0.6,
    });
    const taxiLine = new THREE.Mesh(lineGeo, lineMat);
    taxiLine.position.set(0, 0.06, 0);
    jet.add(taxiLine);

    // 1. Central Fuselage & Blended Body (Y = 1.95m above ground)
    const bodyGeo = new THREE.BoxGeometry(2.3, 0.85, 8.4);
    const body = new THREE.Mesh(bodyGeo, camoBodyMat);
    body.position.set(0, 1.95, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    jet.add(body);

    // Upper spine / dorsal ridge
    const spineGeo = new THREE.BoxGeometry(1.2, 0.45, 6.0);
    const spine = new THREE.Mesh(spineGeo, camoUpperMat);
    spine.position.set(0, 2.5, 0.5);
    spine.castShadow = true;
    jet.add(spine);

    // Forward fuselage tapering towards cockpit
    const forwardBodyGeo = new THREE.BoxGeometry(1.7, 0.75, 3.2);
    const forwardBody = new THREE.Mesh(forwardBodyGeo, camoBodyMat);
    forwardBody.position.set(0, 1.95, -4.8);
    forwardBody.castShadow = true;
    jet.add(forwardBody);

    // Aerodynamic Radome Nose Cone
    const noseGeo = new THREE.ConeGeometry(0.65, 3.0, 16);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, radomeMat);
    nose.position.set(0, 1.95, -7.9);
    nose.castShadow = true;
    jet.add(nose);

    // Pitot probe needle on nose
    const pitotGeo = new THREE.CylinderGeometry(0.015, 0.03, 1.6, 8);
    pitotGeo.rotateX(Math.PI / 2);
    const pitot = new THREE.Mesh(pitotGeo, metalDark);
    pitot.position.set(0, 1.95, -9.8);
    jet.add(pitot);

    // 2. Cockpit Canopy & Interior
    const canopyGeo = new THREE.CapsuleGeometry(0.5, 1.9, 8, 16);
    canopyGeo.rotateX(Math.PI / 2);
    const canopy = new THREE.Mesh(canopyGeo, cockpitCanopyMat);
    canopy.position.set(0, 2.65, -3.8);
    canopy.rotation.x = 0.05;
    canopy.castShadow = true;
    jet.add(canopy);

    // Ejection seat silhouette inside canopy
    const seatGeo = new THREE.BoxGeometry(0.38, 0.65, 0.35);
    const seat = new THREE.Mesh(seatGeo, metalDark);
    seat.position.set(0, 2.5, -3.6);
    jet.add(seat);

    // 3. Leading-Edge Root Extensions (LERX / Strakes)
    const lerxGeo = new THREE.BoxGeometry(1.2, 0.15, 4.2);
    const leftLerx = new THREE.Mesh(lerxGeo, camoBodyMat);
    leftLerx.position.set(-1.45, 1.95, -2.4);
    leftLerx.rotation.y = 0.18;
    jet.add(leftLerx);

    const rightLerx = new THREE.Mesh(lerxGeo, camoBodyMat);
    rightLerx.position.set(1.45, 1.95, -2.4);
    rightLerx.rotation.y = -0.18;
    jet.add(rightLerx);

    // 4. Swept Main Wings (Wingspan 11.6m)
    function createWing(isLeft) {
      const wingGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;

      // Main swept wing panel
      const wingGeo = new THREE.BoxGeometry(4.6, 0.14, 3.8);
      const wing = new THREE.Mesh(wingGeo, camoBodyMat);
      wing.position.set(sign * 3.2, 1.95, 0.2);
      wing.rotation.y = -sign * 0.35;
      wing.castShadow = true;
      wing.receiveShadow = true;
      wingGroup.add(wing);

      // Kazakh Air Force roundel on upper wing surface
      const roundel = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1.2),
        roundelMat
      );
      roundel.rotation.x = -Math.PI / 2;
      roundel.position.set(sign * 3.4, 2.03, 0.2);
      wingGroup.add(roundel);

      // Wingtip missile launch rail
      const railGeo = new THREE.BoxGeometry(0.12, 0.14, 2.6);
      const rail = new THREE.Mesh(railGeo, camoUpperMat);
      rail.position.set(sign * 5.6, 1.95, 0.8);
      wingGroup.add(rail);

      // Wingtip Air-to-Air Missile (R-73 style)
      const missileBodyGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 12);
      missileBodyGeo.rotateX(Math.PI / 2);
      const missile = new THREE.Mesh(missileBodyGeo, missileWhiteMat);
      missile.position.set(sign * 5.6, 1.88, 0.8);

      // Missile fins
      const finGeo = new THREE.BoxGeometry(0.45, 0.02, 0.25);
      const finH = new THREE.Mesh(finGeo, missileFinMat);
      finH.position.set(0, 0, 0.9);
      missile.add(finH);
      const finV = new THREE.Mesh(finGeo, missileFinMat);
      finV.rotation.z = Math.PI / 2;
      finV.position.set(0, 0, 0.9);
      missile.add(finV);
      wingGroup.add(missile);

      // Mid-wing Pylon with Heavy Missile (R-27 style)
      const pylonGeo = new THREE.BoxGeometry(0.12, 0.25, 1.8);
      const pylon = new THREE.Mesh(pylonGeo, camoUpperMat);
      pylon.position.set(sign * 3.1, 1.75, 0.2);
      wingGroup.add(pylon);

      const heavyMissileGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.2, 12);
      heavyMissileGeo.rotateX(Math.PI / 2);
      const heavyMissile = new THREE.Mesh(heavyMissileGeo, missileWhiteMat);
      heavyMissile.position.set(sign * 3.1, 1.55, 0.2);
      
      const heavyFin = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.02, 0.45),
        missileFinMat
      );
      heavyFin.position.set(0, 0, 0.3);
      heavyMissile.add(heavyFin);
      wingGroup.add(heavyMissile);

      return wingGroup;
    }

    jet.add(createWing(true));
    jet.add(createWing(false));

    // 5. Twin Canted Vertical Stabilizers (Iconic Twin Tails)
    function createTailFin(isLeft) {
      const sign = isLeft ? -1 : 1;
      const finGroup = new THREE.Group();
      finGroup.position.set(sign * 1.35, 2.4, 2.4);

      // Slanted outward ~8 degrees
      finGroup.rotation.z = -sign * 0.14;

      const finGeo = new THREE.BoxGeometry(0.16, 2.5, 1.9);
      const fin = new THREE.Mesh(finGeo, camoBodyMat);
      fin.position.set(0, 1.15, 0);
      fin.rotation.x = -0.32; // Swept back
      fin.castShadow = true;
      finGroup.add(fin);

      // Kazakh Air Force roundel on tail
      const tailRoundel = new THREE.Mesh(
        new THREE.PlaneGeometry(0.85, 0.85),
        roundelMat
      );
      tailRoundel.rotation.y = sign * (Math.PI / 2);
      tailRoundel.position.set(sign * 0.09, 1.2, 0.1);
      finGroup.add(tailRoundel);

      return finGroup;
    }

    jet.add(createTailFin(true));
    jet.add(createTailFin(false));

    // 6. Horizontal Stabilators (All-moving tailplanes)
    const stabGeo = new THREE.BoxGeometry(2.2, 0.1, 1.8);
    const leftStab = new THREE.Mesh(stabGeo, camoBodyMat);
    leftStab.position.set(-2.0, 1.95, 3.8);
    leftStab.rotation.y = -0.35;
    leftStab.castShadow = true;
    jet.add(leftStab);

    const rightStab = new THREE.Mesh(stabGeo, camoBodyMat);
    rightStab.position.set(2.0, 1.95, 3.8);
    rightStab.rotation.y = 0.35;
    rightStab.castShadow = true;
    jet.add(rightStab);

    // 7. Twin Jet Engines & Afterburner Nozzles
    for (const sx of [-0.85, 0.85]) {
      // Nacelle underside trunk
      const nacelleGeo = new THREE.CylinderGeometry(0.55, 0.58, 4.4, 16);
      nacelleGeo.rotateX(Math.PI / 2);
      const nacelle = new THREE.Mesh(nacelleGeo, camoBodyMat);
      nacelle.position.set(sx, 1.55, 1.8);
      nacelle.castShadow = true;
      jet.add(nacelle);

      // Intake ramp under wing root
      const intakeGeo = new THREE.BoxGeometry(0.95, 0.65, 2.4);
      const intake = new THREE.Mesh(intakeGeo, camoUpperMat);
      intake.position.set(sx, 1.55, -0.9);
      jet.add(intake);

      // Black intake opening
      const openingGeo = new THREE.BoxGeometry(0.85, 0.55, 0.1);
      const opening = new THREE.Mesh(openingGeo, metalDark);
      opening.position.set(sx, 1.55, -2.12);
      jet.add(opening);

      // Exhaust Nozzle (Reheat / Afterburner titanium ring)
      const nozzleGeo = new THREE.CylinderGeometry(0.52, 0.46, 1.2, 16);
      nozzleGeo.rotateX(Math.PI / 2);
      const nozzle = new THREE.Mesh(nozzleGeo, titaniumNozzleMat);
      nozzle.position.set(sx, 1.55, 4.4);
      nozzle.castShadow = true;
      jet.add(nozzle);
    }

    // 8. Sturdy Three-Point Landing Gear
    const strutMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.7,
      roughness: 0.3,
    });
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x181818,
      roughness: 0.9,
    });

    // Front nose gear (under forward cockpit)
    const noseStrut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 1.4, 8),
      strutMat
    );
    noseStrut.position.set(0, 0.75, -4.8);
    jet.add(noseStrut);

    // Front dual tires
    const frontWheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.14, 12);
    frontWheelGeo.rotateZ(Math.PI / 2);
    const fwL = new THREE.Mesh(frontWheelGeo, tireMat);
    fwL.position.set(-0.12, 0.25, -4.8);
    fwL.castShadow = true;
    jet.add(fwL);
    const fwR = new THREE.Mesh(frontWheelGeo, tireMat);
    fwR.position.set(0.12, 0.25, -4.8);
    fwR.castShadow = true;
    jet.add(fwR);

    // Main gear (left & right under wing roots)
    for (const gx of [-1.55, 1.55]) {
      const mainStrut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 1.5, 8),
        strutMat
      );
      mainStrut.position.set(gx, 0.75, 0.6);
      jet.add(mainStrut);

      const mainWheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.25, 14);
      mainWheelGeo.rotateZ(Math.PI / 2);
      const mw = new THREE.Mesh(mainWheelGeo, tireMat);
      mw.position.set(gx, 0.42, 0.6);
      mw.castShadow = true;
      jet.add(mw);

      // Yellow wheel chocks on main tires
      const chockGeo = new THREE.BoxGeometry(0.3, 0.18, 0.25);
      const chockMat = new THREE.MeshStandardMaterial({
        color: 0xf5b700,
        roughness: 0.6,
      });
      const chockF = new THREE.Mesh(chockGeo, chockMat);
      chockF.position.set(gx, 0.1, 0.95);
      jet.add(chockF);

      const chockR = new THREE.Mesh(chockGeo, chockMat);
      chockR.position.set(gx, 0.1, 0.25);
      jet.add(chockR);
    }

    // 9. Ground Maintenance Crew Access Ladder (Yellow steel)
    const ladderGroup = new THREE.Group();
    ladderGroup.position.set(-1.1, 0, -3.4);
    ladderGroup.rotation.y = 0.35;
    ladderGroup.rotation.z = -0.18;

    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xf0b800,
      roughness: 0.5,
      metalness: 0.3,
    });
    const railGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.6, 6);
    const leftRail = new THREE.Mesh(railGeo, yellowMat);
    leftRail.position.set(-0.25, 1.25, 0);
    ladderGroup.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, yellowMat);
    rightRail.position.set(0.25, 1.25, 0);
    ladderGroup.add(rightRail);

    const rungGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6);
    rungGeo.rotateZ(Math.PI / 2);
    for (let ry = 0.3; ry <= 2.3; ry += 0.35) {
      const rung = new THREE.Mesh(rungGeo, yellowMat);
      rung.position.set(0, ry, 0);
      ladderGroup.add(rung);
    }
    jet.add(ladderGroup);

    return jet;
  }

  // Majestic Kazakhstan Flag on 16m Flagpole
  function createKazakhstanFlagpole(x, z, angleTowardsRange = Math.PI * 0.38) {
    const flagRoot = new THREE.Group();
    flagRoot.position.set(x, 0, z);

    // 1. Concrete Monument Pedestal at base
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x4a4f54,
      roughness: 0.8,
      metalness: 0.2,
    });
    const pedestalGeo = new THREE.CylinderGeometry(1.6, 1.9, 0.45, 12);
    const pedestal = new THREE.Mesh(pedestalGeo, baseMat);
    pedestal.position.y = 0.225;
    pedestal.receiveShadow = true;
    pedestal.castShadow = true;
    flagRoot.add(pedestal);

    // Polished steel collar
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.85,
      roughness: 0.2,
    });
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.65, 0.4, 16),
      collarMat
    );
    collar.position.y = 0.55;
    flagRoot.add(collar);

    // 2. Tapered 16-Meter Steel Mast / Flagpole
    const poleHeight = 16.0;
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.22, poleHeight, 16);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde2,
      metalness: 0.88,
      roughness: 0.18,
    });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = poleHeight / 2 + 0.45;
    pole.castShadow = true;
    flagRoot.add(pole);

    // Halyard cable running along pole
    const cableGeo = new THREE.CylinderGeometry(0.008, 0.008, poleHeight, 4);
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
    });
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.position.set(0.16, poleHeight / 2 + 0.45, 0);
    flagRoot.add(cable);

    // 3. Polished Golden Finial Ball on Top
    const goldBallMat = new THREE.MeshStandardMaterial({
      color: 0xfec50c,
      metalness: 0.95,
      roughness: 0.15,
    });
    const topBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 20, 20),
      goldBallMat
    );
    topBall.position.y = poleHeight + 0.65;
    topBall.castShadow = true;
    flagRoot.add(topBall);

    // 4. Kazakhstan National Flag Cloth (5.6m x 2.8m, waving in the wind)
    const flagWidth = 5.6;
    const flagHeight = 2.8;
    const flagGeo = new THREE.PlaneGeometry(flagWidth, flagHeight, 28, 14);

    // Offset geometry origin so the left hoist edge aligns directly with the pole
    flagGeo.translate(flagWidth / 2, 0, 0);

    // Realistic wind flutter deformation (amplitude grows toward free edge)
    const pos = flagGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const t = Math.min(1.0, px / flagWidth); // 0 at mast, 1 at free end
      const wave =
        Math.sin(px * 1.6 - py * 0.4) * 0.32 * t +
        Math.cos(px * 3.2 + py * 1.4) * 0.14 * (t * t);
      pos.setZ(i, wave);
    }
    flagGeo.computeVertexNormals();

    const flagTexture = createKazakhstanFlagCanvasTexture();
    const flagMat = new THREE.MeshStandardMaterial({
      map: flagTexture,
      side: THREE.DoubleSide,
      roughness: 0.7,
      metalness: 0.1,
    });

    const flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.castShadow = true;
    flagMesh.receiveShadow = true;

    // Place flag near the top of the mast (attached from Y = 13.0m to 15.8m)
    const flagGroup = new THREE.Group();
    flagGroup.position.set(0.12, poleHeight - 1.6, 0);

    // Orient flag so its full broadside face directly greets anyone in the polygon center
    flagGroup.rotation.y = angleTowardsRange;
    flagGroup.add(flagMesh);

    flagRoot.add(flagGroup);
    return flagRoot;
  }

  // Place Fighter Jet on the left flank of the training range
  // Parked on South Sector concrete pad at X = -32, Z = 6, angled toward center
  militaryWorld.add(createFighterJet(-32, 0, 6, Math.PI * 0.35));

  // Place Kazakhstan Flag to the LEFT of the Fighter Jet (further out at X = -46, Z = 6)
  // Mast stands 16m high and flag is angled so it is clearly visible from polygon center!
  militaryWorld.add(createKazakhstanFlagpole(-46, 6, Math.PI * 0.38));

  // Apply shadow flags to all meshes
  militaryWorld.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material && child.material.map) {
        child.material.map.anisotropy = 4;
      }
    }
  });

  scene.add(militaryWorld);
  return militaryWorld;
}
