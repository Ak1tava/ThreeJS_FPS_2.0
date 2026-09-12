import * as THREE from "three";
import { interactiveTargets } from "./militaryRange";

/**
 * Military Soldier Bots (NPCs) that shoot at targets and reload
 */

// Shared Web Audio API context for bot gunshot and reload sounds
let audioCtx = null;
let gunshotBuffer = null;
let reloadBuffer = null;

function getAudioContext() {
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Pre-fetch and decode gunshot & reload sounds into memory
fetch("/sounds/gunshot.wav")
  .then((res) => res.arrayBuffer())
  .then((data) => {
    const ctx = getAudioContext();
    if (ctx) return ctx.decodeAudioData(data);
  })
  .then((buf) => {
    if (buf) gunshotBuffer = buf;
  })
  .catch(() => {});

fetch("/sounds/reload.mp3")
  .then((res) => res.arrayBuffer())
  .then((data) => {
    const ctx = getAudioContext();
    if (ctx) return ctx.decodeAudioData(data);
  })
  .then((buf) => {
    if (buf) reloadBuffer = buf;
  })
  .catch(() => {});

function playBotGunshot(panX = 0) {
  const ctx = getAudioContext();
  if (ctx && gunshotBuffer) {
    const source = ctx.createBufferSource();
    source.buffer = gunshotBuffer;
    // Slight pitch variation so bots don't sound identical
    source.playbackRate.value = 0.94 + Math.random() * 0.12;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.22; // Pleasant background ambient level

    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-0.8, Math.min(0.8, panX / 8));
      source.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(ctx.destination);
    } else {
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
    }
    source.start(0);
  } else {
    const fallback = new Audio("/sounds/gunshot.wav");
    fallback.volume = 0.22;
    fallback.play().catch(() => {});
  }
}

function playBotReload() {
  const ctx = getAudioContext();
  if (ctx && reloadBuffer) {
    const source = ctx.createBufferSource();
    source.buffer = reloadBuffer;
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.28;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);
  } else {
    const fallback = new Audio("/sounds/reload.mp3");
    fallback.volume = 0.28;
    fallback.play().catch(() => {});
  }
}

// Procedural 3D Soldier Mesh (0 KB extra assets)
function createSoldierMesh() {
  const soldier = new THREE.Group();

  const camoUniformMat = new THREE.MeshStandardMaterial({
    color: 0x485139, // Tactical military olive drab
    roughness: 0.8,
    metalness: 0.1,
  });

  const vestMat = new THREE.MeshStandardMaterial({
    color: 0x2e3422, // Dark tactical vest
    roughness: 0.7,
    metalness: 0.2,
  });

  const helmetMat = new THREE.MeshStandardMaterial({
    color: 0x363d28, // Kevlar helmet
    roughness: 0.6,
    metalness: 0.2,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xc89874, // Skin
    roughness: 0.7,
  });

  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x161616, // Black combat boots
    roughness: 0.85,
  });

  const gunMat = new THREE.MeshStandardMaterial({
    color: 0x1b1b1e, // Gunmetal black
    metalness: 0.85,
    roughness: 0.25,
  });

  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffe066,
    transparent: true,
    opacity: 0,
  });

  // 1. Legs & Boots (combat firing stance)
  for (const lx of [-0.18, 0.18]) {
    const legGeo = new THREE.BoxGeometry(0.18, 0.76, 0.2);
    const leg = new THREE.Mesh(legGeo, camoUniformMat);
    leg.position.set(lx, 0.44, lx > 0 ? 0.06 : -0.06);
    leg.castShadow = true;
    soldier.add(leg);

    const bootGeo = new THREE.BoxGeometry(0.19, 0.14, 0.26);
    const boot = new THREE.Mesh(bootGeo, bootMat);
    boot.position.set(lx, 0.07, lx > 0 ? 0.09 : -0.03);
    boot.castShadow = true;
    soldier.add(boot);
  }

  // 2. Torso & Body Armor
  const pelvis = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.2, 0.24),
    camoUniformMat
  );
  pelvis.position.y = 0.88;
  soldier.add(pelvis);

  const chest = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.42, 0.28),
    camoUniformMat
  );
  chest.position.y = 1.15;
  chest.castShadow = true;
  soldier.add(chest);

  const vest = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.36, 0.32),
    vestMat
  );
  vest.position.y = 1.15;
  vest.castShadow = true;
  soldier.add(vest);

  // Mag pouches on vest front
  for (let p = -0.14; p <= 0.14; p += 0.14) {
    const pouch = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.16, 0.08),
      vestMat
    );
    pouch.position.set(p, 1.08, 0.18);
    soldier.add(pouch);
  }

  // 3. Head & Helmet
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.44, 0);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.1, 0.1, 8),
    skinMat
  );
  neck.position.y = -0.04;
  headGroup.add(neck);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.22, 0.22),
    skinMat
  );
  head.position.y = 0.08;
  head.castShadow = true;
  headGroup.add(head);

  // Balaclava mask
  const mask = new THREE.Mesh(
    new THREE.BoxGeometry(0.205, 0.12, 0.225),
    vestMat
  );
  mask.position.set(0, 0.04, 0.01);
  headGroup.add(mask);

  // Helmet
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
    helmetMat
  );
  helmet.position.set(0, 0.15, 0);
  helmet.castShadow = true;
  headGroup.add(helmet);

  soldier.add(headGroup);

  // 4. Arms & Assault Rifle (Pivoting weapon assembly)
  const weaponAssembly = new THREE.Group();
  weaponAssembly.position.set(0.12, 1.25, 0.08);

  // Right arm (trigger grip)
  const rArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.35, 0.12),
    camoUniformMat
  );
  rArm.position.set(0.1, -0.08, 0.05);
  rArm.rotation.x = -Math.PI * 0.35;
  rArm.rotation.z = -0.15;
  weaponAssembly.add(rArm);

  // Left arm (handguard support)
  const lArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.42, 0.12),
    camoUniformMat
  );
  lArm.position.set(-0.28, -0.05, 0.22);
  lArm.rotation.x = -Math.PI * 0.28;
  lArm.rotation.y = Math.PI * 0.32;
  weaponAssembly.add(lArm);

  // Rifle
  const rifle = new THREE.Group();
  rifle.position.set(-0.08, 0.02, 0.28);

  const receiver = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.11, 0.55),
    gunMat
  );
  receiver.castShadow = true;
  rifle.add(receiver);

  const stock = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.1, 0.28),
    gunMat
  );
  stock.position.set(0, -0.02, -0.38);
  rifle.add(stock);

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.018, 0.42, 8),
    gunMat
  );
  barrel.rotateX(Math.PI / 2);
  barrel.position.set(0, 0.02, 0.45);
  rifle.add(barrel);

  const muzzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.08, 8),
    gunMat
  );
  muzzle.rotateX(Math.PI / 2);
  muzzle.position.set(0, 0.02, 0.68);
  rifle.add(muzzle);

  const mag = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.22, 0.11),
    gunMat
  );
  mag.position.set(0, -0.14, 0.08);
  mag.rotation.x = 0.25;
  rifle.add(mag);

  // Muzzle flash
  const flashGeo = new THREE.ConeGeometry(0.08, 0.25, 6);
  flashGeo.rotateX(-Math.PI / 2);
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.set(0, 0.02, 0.82);
  flash.visible = false;
  rifle.add(flash);

  weaponAssembly.add(rifle);
  soldier.add(weaponAssembly);

  return {
    root: soldier,
    headGroup,
    weaponAssembly,
    flash,
  };
}

/**
 * Creates 3 soldier bots stationed alongside the player
 */
export function createSoldierBots(scene) {
  const botsGroup = new THREE.Group();
  botsGroup.name = "SoldierBots";

  // Active flying bullet tracers pool
  const tracers = [];
  const tracerGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6);
  tracerGeo.rotateX(Math.PI / 2);
  const tracerMat = new THREE.MeshBasicMaterial({ color: 0xffd23f });

  // Bot definitions: Stationed alongside the player at the firing benches
  const botConfigs = [
    {
      name: "Bot 1 (Left Lane)",
      pos: new THREE.Vector3(-5.0, 0, -3.8),
      targetPos: new THREE.Vector3(-5.5, 1.7, -34.0),
      ammo: 6, // will reload after 6 shots first
      maxAmmo: 12,
      shotInterval: 1.05,
    },
    {
      name: "Bot 2 (Right Lane)",
      pos: new THREE.Vector3(5.0, 0, -3.8),
      targetPos: new THREE.Vector3(5.5, 1.7, -34.0),
      ammo: 10,
      maxAmmo: 14,
      shotInterval: 0.98,
    },
    {
      name: "Bot 3 (Mid-Left Lane)",
      pos: new THREE.Vector3(-2.6, 0, -3.6),
      targetPos: new THREE.Vector3(-5.5, 1.7, -52.0),
      ammo: 14,
      maxAmmo: 12,
      shotInterval: 1.02,
    },
  ];

  const bots = botConfigs.map((cfg) => {
    const soldierObj = createSoldierMesh();
    soldierObj.root.position.copy(cfg.pos);

    // Aim soldier toward target (targets are at negative Z)
    const aimDir = new THREE.Vector3().subVectors(cfg.targetPos, cfg.pos).normalize();
    const yaw = Math.atan2(aimDir.x, -aimDir.z); // Facing negative Z
    soldierObj.root.rotation.y = yaw;

    // Slight pitch of weapon assembly
    const pitch = Math.asin(aimDir.y);
    soldierObj.weaponAssembly.rotation.x = -pitch;

    botsGroup.add(soldierObj.root);

    return {
      config: cfg,
      soldier: soldierObj,
      aimDir,
      ammo: cfg.ammo,
      maxAmmo: cfg.maxAmmo,
      isReloading: false,
      reloadTimer: 0,
      shootTimer: Math.random() * 0.6, // staggered start
      flashTimer: 0,
      recoilOffset: 0,
    };
  });

  scene.add(botsGroup);

  // Bot simulation loop (called once per frame)
  function updateBots(deltaTime) {
    // 1. Update flying bullet tracers
    for (let i = tracers.length - 1; i >= 0; i--) {
      const tr = tracers[i];
      tr.life += deltaTime;
      tr.mesh.position.addScaledVector(tr.velocity, deltaTime);

      // Check arrival at target distance
      if (tr.life >= tr.maxLife) {
        scene.remove(tr.mesh);
        tracers.splice(i, 1);

        // Check knockdown on interactive targets
        for (const target of interactiveTargets) {
          if (target && !target.isHit) {
            const dist = target.worldPos.distanceTo(tr.mesh.position);
            if (dist < target.radius * 1.5) {
              target.hit();
              break;
            }
          }
        }
      }
    }

    // 2. Update each soldier bot
    for (const bot of bots) {
      // Muzzle flash timer
      if (bot.flashTimer > 0) {
        bot.flashTimer -= deltaTime;
        if (bot.flashTimer <= 0) {
          bot.soldier.flash.visible = false;
        }
      }

      // Smooth recoil recovery
      if (bot.recoilOffset > 0) {
        bot.recoilOffset = Math.max(0, bot.recoilOffset - deltaTime * 0.35);
        bot.soldier.weaponAssembly.position.z = 0.08 - bot.recoilOffset;
      }

      // Reload state
      if (bot.isReloading) {
        bot.reloadTimer -= deltaTime;

        // Animate gun lowered during reload
        const reloadProgress = 1.0 - bot.reloadTimer / 2.8;
        if (reloadProgress < 0.5) {
          bot.soldier.weaponAssembly.rotation.x = THREE.MathUtils.lerp(
            bot.soldier.weaponAssembly.rotation.x,
            -0.35,
            0.15
          );
        } else {
          bot.soldier.weaponAssembly.rotation.x = THREE.MathUtils.lerp(
            bot.soldier.weaponAssembly.rotation.x,
            0,
            0.15
          );
        }

        if (bot.reloadTimer <= 0) {
          // Finished reload!
          bot.isReloading = false;
          bot.ammo = bot.maxAmmo;
          bot.shootTimer = 0.4; // ready to fire after short pause
          bot.soldier.weaponAssembly.rotation.x = 0;
        }
        continue;
      }

      // Shooting state (fires approx. once per second)
      bot.shootTimer += deltaTime;
      if (bot.shootTimer >= bot.config.shotInterval) {
        bot.shootTimer = 0;
        bot.ammo--;

        // Visual shot effect: recoil + muzzle flash
        bot.recoilOffset = 0.05;
        bot.soldier.weaponAssembly.position.z = 0.08 - bot.recoilOffset;
        bot.soldier.flash.visible = true;
        bot.soldier.flash.material.opacity = 1.0;
        bot.flashTimer = 0.06;

        // Play authentic gunshot audio at ambient volume
        playBotGunshot(bot.soldier.root.position.x);

        // Spawn bullet tracer streak toward target
        const muzzleWorldPos = new THREE.Vector3();
        bot.soldier.flash.getWorldPosition(muzzleWorldPos);

        const targetPosWithJitter = bot.config.targetPos.clone();
        targetPosWithJitter.x += (Math.random() - 0.5) * 0.3;
        targetPosWithJitter.y += (Math.random() - 0.5) * 0.25;

        const bulletDir = new THREE.Vector3()
          .subVectors(targetPosWithJitter, muzzleWorldPos)
          .normalize();
        const dist = muzzleWorldPos.distanceTo(targetPosWithJitter);
        const speed = 95.0; // 95 m/s
        const maxLife = dist / speed;

        const tracerMesh = new THREE.Mesh(tracerGeo, tracerMat);
        tracerMesh.position.copy(muzzleWorldPos);
        tracerMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), bulletDir);
        scene.add(tracerMesh);

        tracers.push({
          mesh: tracerMesh,
          velocity: bulletDir.clone().multiplyScalar(speed),
          life: 0,
          maxLife: maxLife,
        });

        // Check if magazine is empty -> start reload!
        if (bot.ammo <= 0) {
          bot.isReloading = true;
          bot.reloadTimer = 2.8; // 2.8s reload duration
          playBotReload();
        }
      }
    }
  }

  return {
    botsGroup,
    updateBots,
  };
}
