import { createMilitaryRange } from "./militaryRange";
import GUI from "lil-gui";

function loadWorld(scene, worldOctree) {
  const militaryWorld = createMilitaryRange(scene);
  worldOctree.fromGraphNode(militaryWorld);

  const gui = new GUI({ width: 200 });
  gui.add({ debug: false }, "debug").onChange((value) => {
    console.log("Debug Mode:", value);
  });
}

export { loadWorld };

