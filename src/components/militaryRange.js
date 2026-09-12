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
  // 1. TERRAIN & BOUNDARIES (140x140m)
  // ==========================================
  const groundGeo = new THREE.PlaneGeometry(140, 140, 32, 32);
  const ground = new THREE.Mesh(groundGeo, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  militaryWorld.add(ground);

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

  // Four boundary walls (North, South, East, West)
  createBerm(140, 5, 4, 0, -68);
  createBerm(140, 5, 4, 0, 68);
  createBerm(4, 5, 140, -68, 0);
  createBerm(4, 5, 140, 68, 0);

  // ==========================================
  // 2. TRENCH NETWORK (ОКОПЫ: ЦЕНТР И ФЛАНГИ)
  // ==========================================
  const trenchGroup = new THREE.Group();

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

  // Builder for an individual trench segment
  function addTrenchSegment(x1, z1, x2, z2, width = 2.4, depth = 1.5) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const angle = Math.atan2(z2 - z1, x2 - x1);

    // Floor
    const floorGeo = new THREE.BoxGeometry(len, 0.15, width);
    const floor = new THREE.Mesh(floorGeo, trenchWoodMaterial);
    floor.position.set(midX, -depth + 0.08, midZ);
    floor.rotation.y = -angle;
    floor.receiveShadow = true;
    trenchGroup.add(floor);

    // Wall 1
    const wallGeo = new THREE.BoxGeometry(len, depth, 0.2);
    const perpX = Math.sin(angle) * (width / 2);
    const perpZ = -Math.cos(angle) * (width / 2);

    const wall1 = new THREE.Mesh(wallGeo, trenchWoodMaterial);
    wall1.position.set(midX + perpX, -depth / 2, midZ + perpZ);
    wall1.rotation.y = -angle;
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    trenchGroup.add(wall1);

    // Wall 2
    const wall2 = new THREE.Mesh(wallGeo, trenchWoodMaterial);
    wall2.position.set(midX - perpX, -depth / 2, midZ - perpZ);
    wall2.rotation.y = -angle;
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    trenchGroup.add(wall2);

    // Sandbags along top
    trenchGroup.add(
      createSandbagWall(
        x1 + perpX,
        z1 + perpZ,
        x2 + perpX,
        z2 + perpZ,
        2
      )
    );
    trenchGroup.add(
      createSandbagWall(
        x1 - perpX,
        z1 - perpZ,
        x2 - perpX,
        z2 - perpZ,
        2
      )
    );
  }

  // Wooden entrance ramp into trench
  function addRamp(x, z, rotY, len = 4.2, width = 2.2, depth = 1.5) {
    const rampGeo = new THREE.BoxGeometry(len, 0.15, width);
    const ramp = new THREE.Mesh(rampGeo, trenchWoodMaterial);
    ramp.position.set(x, -depth / 2, z);
    ramp.rotation.set(0, rotY, Math.atan2(depth, len));
    ramp.receiveShadow = true;
    trenchGroup.add(ramp);
  }

  // 1) FRONT CENTRAL TRENCH (running right in front of the player and firing counter)
  addTrenchSegment(-18, -10, 18, -10, 2.4, 1.5);
  // Center entry ramp leading into front trench from spawn
  addRamp(0, -8.2, Math.PI / 2, 3.8);
  // Side entries
  addRamp(-18, -10, 0, 3.8);
  addRamp(18, -10, Math.PI, 3.8);

  // 2) LEFT FLANK TRENCH NETWORK
  addTrenchSegment(-18, -10, -18, -42, 2.4, 1.5);
  addTrenchSegment(-18, -25, -28, -25, 2.2, 1.5);
  addRamp(-18, -43.8, -Math.PI / 2, 3.8);

  // 3) RIGHT FLANK TRENCH
  addTrenchSegment(18, -10, 18, -35, 2.4, 1.5);
  addTrenchSegment(18, -22, 26, -22, 2.2, 1.5);
  addRamp(18, -36.8, -Math.PI / 2, 3.8);

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

    // Tracks (Left & Right)
    const trackGeo = new THREE.BoxGeometry(0.85, 0.9, 6.2);
    const leftTrack = new THREE.Mesh(trackGeo, metalDark);
    leftTrack.position.set(-1.6, 0.45, 0);
    leftTrack.castShadow = true;
    leftTrack.receiveShadow = true;
    tank.add(leftTrack);

    const rightTrack = new THREE.Mesh(trackGeo, metalDark);
    rightTrack.position.set(1.6, 0.45, 0);
    rightTrack.castShadow = true;
    rightTrack.receiveShadow = true;
    tank.add(rightTrack);

    // Track wheels
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    for (let i = -2.2; i <= 2.2; i += 0.88) {
      const wL = new THREE.Mesh(wheelGeo, tankArmorTrim);
      wL.position.set(-2.05, 0.38, i);
      tank.add(wL);
      const wR = new THREE.Mesh(wheelGeo, tankArmorTrim);
      wR.position.set(2.05, 0.38, i);
      tank.add(wR);
    }

    // Main Hull
    const hullLowerGeo = new THREE.BoxGeometry(2.6, 0.8, 5.8);
    const hullLower = new THREE.Mesh(hullLowerGeo, tankArmorDark);
    hullLower.position.set(0, 0.75, 0);
    hullLower.castShadow = true;
    hullLower.receiveShadow = true;
    tank.add(hullLower);

    // Sloped upper front glacis plate
    const glacisGeo = new THREE.BoxGeometry(2.58, 0.65, 1.8);
    const glacis = new THREE.Mesh(glacisGeo, tankArmorDark);
    glacis.position.set(0, 1.2, 2.0);
    glacis.rotation.x = -Math.PI * 0.18;
    glacis.castShadow = true;
    tank.add(glacis);

    // Main hull top plate
    const hullTopGeo = new THREE.BoxGeometry(2.58, 0.4, 3.8);
    const hullTop = new THREE.Mesh(hullTopGeo, tankArmorDark);
    hullTop.position.set(0, 1.25, -0.6);
    hullTop.castShadow = true;
    tank.add(hullTop);

    // Turret
    const turretGeo = new THREE.BoxGeometry(2.0, 0.85, 2.4);
    const turret = new THREE.Mesh(turretGeo, tankArmorDark);
    turret.position.set(0, 1.85, -0.2);
    turret.castShadow = true;
    turret.receiveShadow = true;
    tank.add(turret);

    // Commander's Cupola & Hatch
    const cupolaGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.28, 12);
    const cupola = new THREE.Mesh(cupolaGeo, tankArmorTrim);
    cupola.position.set(-0.5, 2.35, -0.4);
    cupola.castShadow = true;
    tank.add(cupola);

    // Radio Antenna
    const antGeo = new THREE.CylinderGeometry(0.02, 0.03, 2.4, 6);
    const ant = new THREE.Mesh(antGeo, metalDark);
    ant.position.set(0.65, 3.2, -0.8);
    ant.rotation.z = -0.08;
    tank.add(ant);

    // Main Cannon Gun & Mantlet
    const mantletGeo = new THREE.BoxGeometry(0.9, 0.6, 0.6);
    const mantlet = new THREE.Mesh(mantletGeo, tankArmorTrim);
    mantlet.position.set(0, 1.85, 1.2);
    mantlet.castShadow = true;
    tank.add(mantlet);

    // Long barrel
    const barrelGeo = new THREE.CylinderGeometry(0.12, 0.15, 4.4, 12);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, metalDark);
    barrel.position.set(0, 1.85, 3.6);
    barrel.castShadow = true;
    tank.add(barrel);

    // Muzzle brake
    const muzzleGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12);
    muzzleGeo.rotateX(Math.PI / 2);
    const muzzle = new THREE.Mesh(muzzleGeo, tankArmorTrim);
    muzzle.position.set(0, 1.85, 5.85);
    muzzle.castShadow = true;
    tank.add(muzzle);

    // Rear external fuel tanks
    const fuelGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.0, 12);
    fuelGeo.rotateZ(Math.PI / 2);
    const extFuel1 = new THREE.Mesh(fuelGeo, redBarrelMaterial);
    extFuel1.position.set(-0.75, 1.35, -2.85);
    tank.add(extFuel1);
    const extFuel2 = new THREE.Mesh(fuelGeo, redBarrelMaterial);
    extFuel2.position.set(0.75, 1.35, -2.85);
    tank.add(extFuel2);

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

    // Windshield
    const windshieldGeo = new THREE.BoxGeometry(2.1, 0.65, 0.05);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1a2b3c,
      roughness: 0.1,
      metalness: 0.9,
    });
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 2.05, 3.32);
    truck.add(windshield);

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
