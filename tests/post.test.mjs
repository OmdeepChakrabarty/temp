import { capabilityFactory, createPipeline } from '../src/capabilities/post/factory.ts';
function assert(cond, msg) { if (!cond) throw new Error(msg || 'fail'); }
// Minimal smoke using stub renderer access (no real GPU required for structure check)
const effects = [capabilityFactory.effects.bloom({ seed: 1 }), capabilityFactory.effects.vignette({ seed: 2 }), capabilityFactory.effects.grade(), capabilityFactory.effects.grain(), capabilityFactory.effects.chromatic(), capabilityFactory.effects.distortion(), capabilityFactory.effects.depthOfField({ seed: 3 }), capabilityFactory.effects.filmGrain()];
const rendererAccess = { render: () => {}, getSize: () => ({ width: 4, height: 4 }) };
const pipeline = createPipeline(null, null, effects, rendererAccess, { seed: 7 });
assert(pipeline, 'pipeline exists');
assert(typeof pipeline.render === 'function', 'render fn');
assert(pipeline.seed === 7, 'deterministic seed');
pipeline.resize(4,4);
pipeline.render();
assert(pipeline.resize && pipeline.dispose, 'resize/dispose');
console.log('post.test.mjs ok', { exportLine: capabilityFactory.id, factoryPath: 'src/capabilities/post/factory.ts', exportLineNumber: 4 });
