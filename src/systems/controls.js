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

  document.addEventListener(
    "keydown",
    (event) => (keyStates[event.code] = true)
  );
  document.addEventListener(
    "keyup",
    (event) => (keyStates[event.code] = false)
  );

  document.body.addEventListener("click", () =>
    document.body.requestPointerLock()
  );

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

    // 2. Sprint logic (Shift held + W forward, on floor, not crouching)
    const isHoldingShift = Boolean(
      keyStates["ShiftLeft"] || keyStates["ShiftRight"]
    );
    const isMovingForward = Boolean(keyStates["KeyW"]);
    const wantSprint =
      isHoldingShift && isMovingForward && !isCrouching && playerOnFloor;

    if (isSprinting && !wantSprint) {
      // Just stopped sprinting -> start inertia recovery timer
      lastSprintEndTime = performance.now();
    }
    isSprinting = wantSprint;

    // Speed calculation
    let currentSpeed = 25; // Normal walking speed
    if (isSprinting) {
      currentSpeed = 46; // Sprint speed
    } else if (isCrouching) {
      currentSpeed = 13; // Slower crouch crawl
    }

    const speedDelta = deltaTime * (playerOnFloor ? currentSpeed : 8);

    // Update camera matrix
    camera.updateMatrixWorld();

    const forward = new THREE.Vector3();
    const side = new THREE.Vector3();

    if (camera.matrixWorld) {
      forward.setFromMatrixColumn(camera.matrixWorld, 0);
      forward.crossVectors(camera.up, forward).normalize();
      side.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    }

    if (keyStates["KeyW"])
      playerVelocity.add(forward.clone().multiplyScalar(speedDelta));
    if (keyStates["KeyS"])
      playerVelocity.add(forward.clone().multiplyScalar(-speedDelta));
    if (keyStates["KeyA"])
      playerVelocity.add(side.clone().multiplyScalar(-speedDelta));
    if (keyStates["KeyD"])
      playerVelocity.add(side.clone().multiplyScalar(speedDelta));

    // Jump only when on floor and not crouching
    if (playerOnFloor && keyStates["Space"] && !isCrouching) {
      playerVelocity.y = 15;
    }
  }

  return applyControls;
}

export { setupControls };
