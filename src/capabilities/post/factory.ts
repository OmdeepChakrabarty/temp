import * as THREE from "three";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
export const capabilityFactory = { id: 'post', createPipeline: (scene:any, camera:any, effects:any[], rendererAccess:any, scope:any) => {
  const composer = new EffectComposer(rendererAccess.renderer);
  composer.addPass(new RenderPass(scene, camera));
  effects.forEach(e => { if (e.name === 'bloom') composer.addPass(new UnrealBloomPass(new THREE.Vector2(1,1), 1.0, 0, 1)); });
  composer.addPass(new OutputPass());
  return { composer, render: () => composer.render(), resize: (w:number,h:number) => { composer.setSize(w,h); }, dispose: () => { composer.dispose(); } };
} };
