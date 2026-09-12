import { WebGLRenderer, VSMShadowMap, ACESFilmicToneMapping } from "three";

function createRenderer(animate) {
  const renderer = new WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  // Cap pixel ratio to 1.5 to prevent high-DPI Retina screens from rendering 8M+ pixels
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = VSMShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping;
  return renderer;
}

export { createRenderer };
