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

function createFaceTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  // Base skin
  ctx.fillStyle = "#c89874";
  ctx.fillRect(0, 0, 64, 64);

  // Eyes (pixelated)
  ctx.fillStyle = "#111";
  ctx.fillRect(12, 24, 12, 12); // left eye
  ctx.fillRect(40, 24, 12, 12); // right eye

  // Nose
  ctx.fillStyle = "#a67b5b";
  ctx.fillRect(26, 36, 12, 8);

  // Tense mouth
  ctx.fillStyle = "#332211";
  ctx.fillRect(20, 50, 24, 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

// Procedural 3D Soldier Mesh (Blocky Minecraft style)
function createSoldierMesh() {
  const soldier = new THREE.Group();

  const camoMat = new THREE.MeshStandardMaterial({
    color: 0x485139, // Tactical military olive drab
    roughness: 0.9,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xc89874, // Skin
    roughness: 0.8,
  });

  const gunMat = new THREE.MeshStandardMaterial({
    color: 0x1b1b1e, // Gunmetal black
    roughness: 0.4,
  });

  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffe066,
    transparent: true,
    opacity: 0,
  });

  const faceMat = new THREE.MeshStandardMaterial({
    map: createFaceTexture(),
    roughness: 0.8,
  });

  // BoxGeometry materials: right, left, top, bottom, front (+Z), back (-Z)
  const headMaterials = [
    skinMat, skinMat, skinMat, skinMat, faceMat, skinMat
  ];

  // 1. Legs
  const legGeo = new THREE.BoxGeometry(0.18, 0.7, 0.18);
  for (const lx of [-0.1, 0.1]) {
    const leg = new THREE.Mesh(legGeo, camoMat);
    leg.position.set(lx, 0.35, 0);
    leg.castShadow = true;
    soldier.add(leg);
  }

  // 2. Torso
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.7, 0.2),
    camoMat
  );
  torso.position.y = 1.05;
  torso.castShadow = true;
  soldier.add(torso);

  // 3. Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.55, 0);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    headMaterials
  );
  head.castShadow = true;
  headGroup.add(head);
  soldier.add(headGroup);

  // 4. Arms & Weapon Assembly (Pivoting weapon assembly centered at shoulder height)
  const weaponAssembly = new THREE.Group();
  weaponAssembly.position.set(0, 1.25, 0.0);

  // Compact Assault Rifle (AK / Carbine style — total length ~50cm, strictly in front of torso)
  const rifleGroup = new THREE.Group();
  rifleGroup.position.set(0.04, -0.05, 0.0);

  // Receiver body
  const receiver = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.085, 0.24),
    gunMat
  );
  receiver.position.set(0, 0, 0.32);
  receiver.castShadow = true;
  rifleGroup.add(receiver);

  // Buttstock (rests against front shoulder at z = 0.15, torso ends at z = 0.10 — NEVER penetrates body!)
  const stock = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.075, 0.10),
    gunMat
  );
  stock.position.set(0, -0.01, 0.15);
  rifleGroup.add(stock);

  // Barrel
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.018, 0.18, 8),
    gunMat
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.015, 0.53);
  barrel.castShadow = true;
  rifleGroup.add(barrel);

  // Muzzle brake / flash hider
  const muzzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.04, 8),
    gunMat
  );
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 0.015, 0.63);
  rifleGroup.add(muzzle);

  // Curved magazine under receiver
  const mag = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.12, 0.065),
    gunMat
  );
  mag.position.set(0, -0.09, 0.34);
  mag.rotation.x = 0.18;
  rifleGroup.add(mag);

  // Pistol grip
  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.08, 0.045),
    gunMat
  );
  grip.position.set(0, -0.07, 0.24);
  grip.rotation.x = -0.25;
  rifleGroup.add(grip);

  // Right Hand (on pistol grip)
  const rHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.08),
    skinMat
  );
  rHand.position.set(0, -0.06, 0.24);
  rifleGroup.add(rHand);

  // Left Hand (on handguard)
  const lHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.08),
    skinMat
  );
  lHand.position.set(0, 0.0, 0.42);
  rifleGroup.add(lHand);

  // Muzzle flash
  const flash = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.12),
    flashMat
  );
  flash.position.set(0, 0.015, 0.68);
  flash.visible = false;
  rifleGroup.add(flash);

  weaponAssembly.add(rifleGroup);

  // Right Arm (from right shoulder x = 0.24 down and forward to pistol grip)
  const rShoulder = new THREE.Group();
  rShoulder.position.set(0.24, 0.02, 0.02);

  const rArmUpper = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.22, 0.12),
    camoMat
  );
  rArmUpper.position.set(0, -0.08, 0.06);
  rArmUpper.rotation.x = -Math.PI * 0.32;
  rShoulder.add(rArmUpper);

  const rArmFore = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.20, 0.11),
    camoMat
  );
  rArmFore.position.set(-0.08, -0.09, 0.18);
  rArmFore.rotation.x = -Math.PI * 0.25;
  rArmFore.rotation.y = -0.3;
  rShoulder.add(rArmFore);

  weaponAssembly.add(rShoulder);

  // Left Arm (from left shoulder x = -0.24 forward and across to handguard)
  const lShoulder = new THREE.Group();
  lShoulder.position.set(-0.24, 0.02, 0.02);

  const lArmUpper = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.22, 0.12),
    camoMat
  );
  lArmUpper.position.set(0.04, -0.06, 0.10);
  lArmUpper.rotation.x = -Math.PI * 0.38;
  lArmUpper.rotation.y = 0.3;
  lShoulder.add(lArmUpper);

  const lArmFore = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.24, 0.11),
    camoMat
  );
  lArmFore.position.set(0.14, -0.07, 0.28);
  lArmFore.rotation.x = -Math.PI * 0.18;
  lArmFore.rotation.y = 0.45;
  lShoulder.add(lArmFore);

  weaponAssembly.add(lShoulder);

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
    // atan2(x, z) makes +Z forward.
    const yaw = Math.atan2(aimDir.x, aimDir.z); 
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
        bot.soldier.weaponAssembly.position.z = -bot.recoilOffset;
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
        bot.recoilOffset = 0.03;
        bot.soldier.weaponAssembly.position.z = -bot.recoilOffset;
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
