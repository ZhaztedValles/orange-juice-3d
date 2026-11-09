// Kenney CC0 models (fetched by scripts/fetch-kenney.mjs into public/kenney/, never committed), loaded once per
// name list as a Kit of scene roots. Missing models are left out (prop() and kitClone() skip unknown names).
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import type { Kit } from "./build";

const cache = new Map<string, Promise<Kit>>();
export const kenneyUrl = (name: string) => staticFile(`kenney/${name}.glb`);
export const loadKenney = (names: string[]): Promise<Kit> => {
  const key = names.join("|");
  let p = cache.get(key);
  if (!p) {
    const loader = new GLTFLoader();
    p = Promise.all(names.map((n) => loader.loadAsync(kenneyUrl(n)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
      .then((list) => Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit);
    cache.set(key, p);
  }
  return p;
};
