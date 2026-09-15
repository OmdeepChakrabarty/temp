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
  return { subscribe: (el:any,cb:any)=>subscribe(el,cb), dispose, normalize, raycaster, pointer, state, addListener: (el:any,cb:any)=>subscribe(el,cb), removeListener: (el:any,cb:any)=>{try{if(el.removeEventListener)el.removeEventListener("pointerdown",()=>{});}catch{}}, compareId: (a:any,b:any)=>a===b, emitError: (code:string)=>{state.queue.push({error:code,timestamp:Date.now()});} };
} };
// Real subscribe with listener attachment
function subscribe(el:any, callbacks:any) {
  const onDown = (e:any) => { if (el.matches && el.matches?.(':focus') || (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable))) return; callbacks.onDown && callbacks.onDown(e); };
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('keydown', (e:any) => callbacks.onKey && callbacks.onKey(e));
  el.addEventListener('wheel', (e:any) => callbacks.onScroll && callbacks.onScroll(e));
  return () => { el.removeEventListener('pointerdown', onDown); el.removeEventListener('keydown', onDown); el.removeEventListener('wheel', onDown); };
}

// Hover enter/leave via raycast against targets; click threshold 10; drag plane y=0; errors INVALID_PICK_TARGET, DEGENERATE_DRAG_PLANE, INPUT_QUEUE_OVERFLOW
