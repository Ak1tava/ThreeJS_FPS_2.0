import { Scene, Color, Fog } from "three";

function createScene() {
  const scene = new Scene();
  scene.background = new Color(0x9fc2db);
  scene.fog = new Fog(0xb0cddf, 40, 160);
  return scene;
}

export { createScene };
