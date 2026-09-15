import { Raycaster, Vector2 } from 'three';
export const interactionFactory = { id: 'interaction', createSource: (opts:any) => {
  const targets = opts.targets || []; const canvas = opts.canvas || { getBoundingClientRect: () => ({ left:0, top:0, width:800, height:600 }) };
  const raycaster = new Raycaster(); const pointer = new Vector2();
  const normalize = (clientX:number, clientY:number) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = 2*(clientX - r.left)/r.width - 1;
    pointer.y = 1 - 2*(clientY - r.top)/r.height;
  };
  const state = { active: false, compareId: (a:any,b:any) => a === b, queue: [] as any[] };
  const dispose = () => { state.active = false; };
  return { subscribe: () => {}, dispose, normalize, raycaster, pointer, state, addListener: () => {}, removeListener: () => {} };
} };
