import * as THREE from "three";

function setupControls(
  camera,
  playerVelocity,
  throwBall,
  playerDirection,
  setPlayerCrouch
) {
  const keyStates = {};

  // Movement & Shooting States
  let isSprinting = false;
  let isCrouching = false;
  let lastSprintEndTime = 0;
  const SPRINT_STOP_DELAY_MS = 350; // Pause after sprint before weapon can fire

  function canShoot() {
    // Cannot fire while sprinting
    if (isSprinting) return false;
    // In crouch, can fire immediately!
    if (isCrouching) return true;
    // After releasing Shift/stopping sprint, short recovery pause
    const elapsedSinceSprint = performance.now() - lastSprintEndTime;
    if (elapsedSinceSprint < SPRINT_STOP_DELAY_MS) {
      return false;
    }
    return true;
  }

  let isShiftHeld = false;

  document.addEventListener("keydown", (event) => {
    keyStates[event.code] = true;
    if (event.shiftKey || event.code === "ShiftLeft" || event.code === "ShiftRight") {
      isShiftHeld = true;
    }
  });

  document.addEventListener("keyup", (event) => {
    keyStates[event.code] = false;
    if (!event.shiftKey && (event.code === "ShiftLeft" || event.code === "ShiftRight")) {
      isShiftHeld = false;
    }
  });

  window.addEventListener("blur", () => {
    for (const k in keyStates) keyStates[k] = false;
    isShiftHeld = false;
    isSprinting = false;
  });

  const overlay = document.getElementById("start-overlay");
  const playBtn = document.getElementById("play-btn");

  if (playBtn) {
    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      document.body.requestPointerLock();
    });
  }

  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === document.body) {
      if (overlay) overlay.classList.add("hidden");
    } else {
      if (overlay) {
        overlay.classList.remove("hidden");
        const btnText = overlay.querySelector(".btn-text");
        if (btnText) btnText.textContent = "ПРОДОЛЖИТЬ ИГРУ";
      }
    }
  });

  document.body.addEventListener("mousedown", () => {
    if (document.pointerLockElement === document.body) {
      if (canShoot()) {
        throwBall(camera, playerDirection);
      }
    }
  });

  document.body.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement === document.body) {
      camera.rotation.y -= event.movementX / 500;
      camera.rotation.x -= event.movementY / 500;
      camera.rotation.x = Math.max(
        -Math.PI / 2.2,
        Math.min(Math.PI / 2.2, camera.rotation.x)
      );
    }
  });

  function applyControls(deltaTime, playerOnFloor, camera) {
    // 1. Crouch logic (KeyC)
    const wantCrouch = Boolean(keyStates["KeyC"]);
    if (wantCrouch !== isCrouching) {
      isCrouching = wantCrouch;
      if (setPlayerCrouch) setPlayerCrouch(isCrouching);
    }

    // 2. Sprint logic: Shift held + moving forward (KeyW or ArrowUp), not crouching
    const isMovingForward = Boolean(
      keyStates["KeyW"] || keyStates["ArrowUp"]
    );
    const wantSprint = isShiftHeld && isMovingForward && !isCrouching;

    if (isSprinting && !wantSprint) {
      // Just stopped sprinting -> start inertia recovery timer
      lastSprintEndTime = performance.now();
    }
    isSprinting = wantSprint;

    // Camera FOV effect when sprinting (subtle sensation of speed)
    const targetFov = isSprinting ? 75 : 70;
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.08);
      camera.updateProjectionMatrix();
    }

    // Speed calculation: normal walk = 25, sprint on Shift = 40
    let currentSpeed = 25;
    if (isSprinting) {
      currentSpeed = 40; // Sprint speed as requested
    } else if (isCrouching) {
      currentSpeed = 13; // Slower crouch crawl
    }

    // Use currentSpeed, or 75% when airborne
    const onFloor = playerOnFloor !== false;
    const speedDelta = deltaTime * (onFloor ? currentSpeed : currentSpeed * 0.75);

    // Update camera matrix
    camera.updateMatrixWorld();

    const forward = new THREE.Vector3();
    const side = new THREE.Vector3();

    if (camera.matrixWorld) {
      forward.setFromMatrixColumn(camera.matrixWorld, 0);
      forward.crossVectors(camera.up, forward).normalize();
      side.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    }

    if (keyStates["KeyW"] || keyStates["ArrowUp"])
      playerVelocity.add(forward.clone().multiplyScalar(speedDelta));
    if (keyStates["KeyS"] || keyStates["ArrowDown"])
      playerVelocity.add(forward.clone().multiplyScalar(-speedDelta));
    if (keyStates["KeyA"] || keyStates["ArrowLeft"])
      playerVelocity.add(side.clone().multiplyScalar(-speedDelta));
    if (keyStates["KeyD"] || keyStates["ArrowRight"])
      playerVelocity.add(side.clone().multiplyScalar(speedDelta));

    // Jump only when on floor and not crouching
    if (playerOnFloor && keyStates["Space"] && !isCrouching) {
      playerVelocity.y = 15;
    }
  }

  return applyControls;
}

export { setupControls };
