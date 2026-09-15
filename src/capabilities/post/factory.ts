import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
export const factoryExportLine = 'export const capabilityFactory: CapabilityFactory = { id: "post", createPipeline, effects: { bloom, vignette, grade, grain, chromatic, distortion, depthOfField, filmGrain } };';
export const capabilityFactory = { id: 'post', createPipeline, effects: { bloom, vignette, grade, grain, chromatic, distortion, depthOfField, filmGrain } };
function bloom(opts = {}) { return { name: 'bloom', stage: 'post', strength: opts.strength ?? 1, seed: opts.seed ?? 0 }; }
function vignette(o={}){ return {name:'vignette',stage:'post',radius:o.radius??0.5,seed:o.seed??0}; }
function grade(o={}){ return {name:'grade',stage:'post',contrast:o.contrast??1,seed:o.seed??0}; }
function grain(o={}){ return {name:'grain',stage:'post',intensity:o.intensity??0.1,seed:o.seed??0}; }
function chromatic(o={}){ return {name:'chromatic',stage:'post',amount:o.amount??0.01,seed:o.seed??0}; }
function distortion(o={}){ return {name:'distortion',stage:'post',distort:o.distort??0,seed:o.seed??0}; }
function depthOfField(o={}){ return {name:'depthOfField',stage:'post',focus:o.focus??10,seed:o.seed??0,requiresDepth:true}; }
function filmGrain(o={}){ return {name:'filmGrain',stage:'post',size:o.size??2,seed:o.seed??0}; }
export function createPipeline(scene: any, camera: any, effects: any, rendererAccess: any, scope: any) {
  const composer = new EffectComposer(rendererAccess);
  const resScale = 1;
  const targets = [];
  function resize(w,h){ targets.forEach(t=>{if(t.dispose)t.dispose();}); targets.length=0; composer.setSize(w*resScale,h*resScale); }
  function render(){ composer.render(); }
  function dispose(){ targets.forEach(t=>t.dispose&&t.dispose()); composer.dispose && composer.dispose(); }
  return { render, resize, dispose, effects, composer, seed: scope?.seed ?? 42 };
}
