import { HemisphereLight, DirectionalLight } from "three";

function createLights() {
  // Fill Light with warm dirt bounce
  const fillLight1 = new HemisphereLight(0xdbe9f5, 0x6e5c46, 1.6);
  fillLight1.position.set(2, 1, 1);

  // Sun Light
  const directionalLight = new DirectionalLight(0xfffaea, 2.4);
  directionalLight.position.set(25, 45, 20);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 220;
  directionalLight.shadow.camera.right = 65;
  directionalLight.shadow.camera.left = -65;
  directionalLight.shadow.camera.top = 65;
  directionalLight.shadow.camera.bottom = -65;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.radius = 2;
  directionalLight.shadow.bias = -0.0001;

  return { fillLight1, directionalLight };
}

export { createLights };
