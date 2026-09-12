import * as THREE from "three";

// Components
import { createScene } from "./components/scene";
import { createCamera, gunMixer } from "./components/camera";
import { createLights } from "./components/lights";
import { loadWorld } from "./components/world";
import { addBgMusic } from "./components/music";
import { createSoldierBots } from "./components/bots";

// Systems
import { createRenderer } from "./systems/renderer";
import { createStats } from "./systems/stats";
import { Resizer } from "./systems/resizer";

// Physics & Controls
import { createPhysics, STEPS_PER_FRAME } from "./systems/physics";
import { setupControls } from "./systems/controls";

const clock = new THREE.Clock();
const scene = createScene();
const { camera, animations } = createCamera(scene); // Destructure to get the camera instance and animations
const { fillLight1, directionalLight } = createLights();
scene.add(fillLight1, directionalLight);

const container = document.getElementById("container");
const renderer = createRenderer(animate);
container.appendChild(renderer.domElement);
const stats = createStats();
container.appendChild(stats.domElement);

// Initialize Physics & Controls
const {
  playerCollider,
  playerVelocity,
  playerDirection,
  updatePlayer,
  updateSpheres,
  throwBall,
  worldOctree,
  setPlayerCrouch,
} = createPhysics(scene, animations);

const applyControls = setupControls(
  camera,
  playerVelocity,
  throwBall,
  playerDirection,
  setPlayerCrouch
);

// Load World
loadWorld(scene, worldOctree);

// Initialize 3 Soldier Bots alongside player
const { updateBots } = createSoldierBots(scene);

// Add Background Sound Effects
addBgMusic();

// Animation Loop

function animate() {
  const frameDelta = Math.min(0.05, clock.getDelta());
  const deltaTime = frameDelta / STEPS_PER_FRAME;

  for (let i = 0; i < STEPS_PER_FRAME; i++) {
    applyControls(deltaTime, playerCollider.onFloor, camera);
    updatePlayer(deltaTime, worldOctree, camera);
    updateSpheres(deltaTime, worldOctree);
  }

  // ✅ Update gun animations
  if (gunMixer) gunMixer.update(deltaTime);

  // ✅ Update soldier bots (firing at targets and reloading)
  updateBots(frameDelta);

  renderer.render(scene, camera);
  stats.update();
}

// Resizer
Resizer(camera, renderer);
