import * as THREE from "three";
import { Capsule } from "three/examples/jsm/Addons.js";
import { Octree } from "three/examples/jsm/Addons.js";

// Animations & Targets
import { playGunAnimation } from "../components/camera";
import { interactiveTargets } from "../components/militaryRange";

const GRAVITY = 30;
const NUM_BULLETS = 100;
const BULLET_COLLIDER_RADIUS = 0.1;
const STEPS_PER_FRAME = 5;

const bullets = [];
let bulletIdx = 0;

// Animation Variables
let lastShotTime = 0;
let isGunLoaded = false;

function createBulletMesh() {
  const bulletGroup = new THREE.Group();

  // Brass cartridge body (7.62x39mm rifle cartridge shape)
  const bodyGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.12, 10);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Polished brass gold
    metalness: 0.9,
    roughness: 0.25,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  bulletGroup.add(body);

  // Aerodynamic bullet tip with fiery tracer glow
  const tipGeo = new THREE.ConeGeometry(0.018, 0.05, 10);
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0xcc6622,
    metalness: 0.8,
    roughness: 0.3,
    emissive: 0xff6600,
    emissiveIntensity: 0.85,
  });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.position.y = 0.085;
  tip.castShadow = true;
  bulletGroup.add(tip);

  // Glowing orange tracer tail streak
  const tracerGeo = new THREE.CylinderGeometry(0.012, 0.002, 0.22, 8);
  const tracerMat = new THREE.MeshBasicMaterial({
    color: 0xffaa22,
    transparent: true,
    opacity: 0.75,
  });
  const tracer = new THREE.Mesh(tracerGeo, tracerMat);
  tracer.position.y = -0.13;
  bulletGroup.add(tracer);

  bulletGroup.visible = false;
  return bulletGroup;
}

function createPhysics(scene) {
  const worldOctree = new Octree();

  const playerCollider = new Capsule(
    new THREE.Vector3(0, 0.35, 0),
    new THREE.Vector3(0, 1.35, 0),
    0.35
  );

  const playerVelocity = new THREE.Vector3();
  const playerDirection = new THREE.Vector3();
  let playerOnFloor = false;

  // Create rifle bullet pool
  for (let i = 0; i < NUM_BULLETS; i++) {
    const bulletMesh = createBulletMesh();
    scene.add(bulletMesh);

    bullets.push({
      mesh: bulletMesh,
      collider: new THREE.Sphere(
        new THREE.Vector3(0, -100, 0),
        BULLET_COLLIDER_RADIUS
      ),
      velocity: new THREE.Vector3(),
      active: false,
      timeAlive: 0,
    });
  }

  // Zero-latency Web Audio API setup for instant gunshot response
  let audioCtx = null;
  let gunshotBuffer = null;

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

  // Pre-decode gunshot into RAM buffer for 0ms latency playback
  fetch("/sounds/gunshot.wav")
    .then((res) => res.arrayBuffer())
    .then((data) => {
      const ctx = getAudioContext();
      if (ctx) return ctx.decodeAudioData(data);
    })
    .then((decoded) => {
      if (decoded) gunshotBuffer = decoded;
    })
    .catch(() => {});

  // Unlock audio context on initial user interaction
  document.addEventListener("pointerdown", () => getAudioContext(), { once: true });
  document.addEventListener("keydown", () => getAudioContext(), { once: true });

  function playInstantGunshot() {
    const ctx = getAudioContext();
    if (ctx && gunshotBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = gunshotBuffer;
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.9;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
    } else {
      const fallback = new Audio("/sounds/gunshot.wav");
      fallback.volume = 0.85;
      fallback.play().catch(() => {});
    }
  }

  // Sounds
  const sounds = {
    shoot: new Audio("/sounds/gunshot.wav"),
    reload: new Audio("/sounds/reload.mp3"),
  };

  let isCrouched = false;
  function setPlayerCrouch(crouch) {
    if (isCrouched === crouch) return;
    isCrouched = crouch;
    if (crouch) {
      playerCollider.end.y = playerCollider.start.y + 0.45;
    } else {
      playerCollider.end.y = playerCollider.start.y + 1.0;
    }
  }

  let isReloading = false;
  let isAnimationPlaying = false;

  function playAction(
    animationName,
    soundKey,
    autoIdle = true,
    idleDelay = 300
  ) {
    if (isAnimationPlaying) return;

    isAnimationPlaying = true;
    playGunAnimation(animationName);

    if (soundKey === "shoot") {
      playInstantGunshot();
    } else if (soundKey && sounds[soundKey]) {
      sounds[soundKey].pause();
      sounds[soundKey].currentTime = 0;
      sounds[soundKey].play().catch(() => {});
    }

    if (autoIdle) {
      setTimeout(() => {
        playGunAnimation("Armature|Idle");
        isAnimationPlaying = false;
      }, idleDelay);
    }

    if (animationName === "Armature|Reload") {
      setTimeout(() => {
        isReloading = false;
        isAnimationPlaying = false;
      }, 3000);
    }
  }

  let shotCount = 0;

  function throwBall(camera) {
    if (isReloading || isAnimationPlaying) return;

    const bullet = bullets[bulletIdx];

    const shootDirection = new THREE.Vector3();
    camera.getWorldDirection(shootDirection);
    shootDirection.normalize();

    // Spawn point slightly in front of camera
    bullet.collider.center
      .copy(playerCollider.end)
      .addScaledVector(shootDirection, 0.7);

    // Realistic rifle bullet velocity
    const bulletSpeed = 120;
    bullet.velocity.copy(shootDirection).multiplyScalar(bulletSpeed);

    // Orient bullet along shoot direction
    bullet.mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      shootDirection
    );
    bullet.mesh.position.copy(bullet.collider.center);
    bullet.mesh.visible = true;
    bullet.active = true;
    bullet.timeAlive = 0;

    // Trigger Shoot Animation + Sound
    playAction("Armature|Shoot", "shoot");

    shotCount++;
    lastShotTime = performance.now();

    bulletIdx = (bulletIdx + 1) % bullets.length;

    // Reload after 10 shots
    if (shotCount >= 10) {
      reloadGun();
      shotCount = 0;
    }
  }

  function reloadGun() {
    if (isReloading || isAnimationPlaying) return;

    isReloading = true;
    playAction("Armature|Reload", "reload", true, 3000);
    isAnimationPlaying = true;
  }

  function updatePlayer(deltaTime, worldOctree, camera) {
    if (!playerCollider || !playerCollider.end) return;

    let damping = Math.exp(-4 * deltaTime) - 1;

    if (!playerOnFloor) {
      playerVelocity.y -= GRAVITY * deltaTime;
      damping *= 0.1;
    }

    playerVelocity.addScaledVector(playerVelocity, damping);
    playerCollider.translate(playerVelocity.clone().multiplyScalar(deltaTime));

    const result = worldOctree.capsuleIntersect(playerCollider);
    playerOnFloor = result ? result.normal.y > 0 : false;
    playerCollider.onFloor = playerOnFloor;

    if (result) {
      playerVelocity.addScaledVector(
        result.normal,
        -result.normal.dot(playerVelocity)
      );
      playerCollider.translate(result.normal.multiplyScalar(result.depth));
    }

    if (playerCollider && playerCollider.end) {
      camera.position.copy(playerCollider.end);
    }
  }

  function updateSpheres(deltaTime, worldOctree) {
    bullets.forEach((bullet) => {
      if (!bullet.active) return;

      bullet.timeAlive += deltaTime;
      if (bullet.timeAlive > 2.5) {
        bullet.active = false;
        bullet.mesh.visible = false;
        bullet.velocity.set(0, 0, 0);
        return;
      }

      bullet.collider.center.addScaledVector(bullet.velocity, deltaTime);

      // Orient along velocity vector
      if (bullet.velocity.lengthSq() > 1) {
        const dir = bullet.velocity.clone().normalize();
        bullet.mesh.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir
        );
      }

      // Check hit on interactive targets
      for (const target of interactiveTargets) {
        if (!target.isHit) {
          const dist = bullet.collider.center.distanceTo(target.worldPos);
          if (dist < target.radius + BULLET_COLLIDER_RADIUS) {
            target.hit();
            bullet.active = false;
            bullet.mesh.visible = false;
            bullet.velocity.set(0, 0, 0);
            break;
          }
        }
      }

      if (!bullet.active) return;

      // Check collision with obstacles / terrain
      const result = worldOctree.sphereIntersect(bullet.collider);
      if (result) {
        bullet.active = false;
        bullet.mesh.visible = false;
        bullet.velocity.set(0, 0, 0);
      } else {
        // Minor ballistic gravity drop
        bullet.velocity.y -= 9.8 * deltaTime;
      }

      bullet.mesh.position.copy(bullet.collider.center);
    });
  }

  return {
    playerCollider,
    playerVelocity,
    playerDirection,
    updatePlayer,
    updateSpheres,
    throwBall,
    worldOctree,
    setPlayerCrouch,
  };
}

export { createPhysics, STEPS_PER_FRAME };
