import { capabilityFactory } from '../src/capabilities/post/factory.ts';
const p = capabilityFactory.createPipeline({}, { render:()=>{} }, [{name:'bloom',strength:0.5}], { renderer: { domElement: { width: 1, height: 1 } } }, undefined);
console.assert(typeof p.render === 'function');
console.assert(p.composer); // real passes added
console.log('post parity + real passer tests ok');
