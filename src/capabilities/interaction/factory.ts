export interface InteractionCapability { dispose(): void; subscribe(el: Element, handlers: { hover?: () => void; click?: () => void; drag?: () => void }): () => void; }
export const interactionFactory = {
  kind: 'interaction',
  prepare: async (): Promise<{ dispose(): void; subscribe(el: Element, h: { hover?: () => void; click?: () => void; drag?: () => void }): () => void }> => {
    const targets = new Set<Element>();
    const listeners: Array<{ el: Element; type: string; fn: EventListener }> = [];
    function compareId(a: object, b: object) { return a === b; }
    const adapter = {
      subscribe(el: Element, handlers: { hover?: () => void; click?: () => void; drag?: () => void }) {
        targets.add(el);
        const onPointerDown = (e: Event) => { const ev = e as PointerEvent; if (handlers.drag) handlers.drag(); (el as HTMLElement).setPointerCapture?.(ev.pointerId); };
        const onPointerMove = () => { if (handlers.drag) handlers.drag(); };
        const onPointerUp = (e: Event) => { const ev = e as PointerEvent; (el as HTMLElement).releasePointerCapture?.(ev.pointerId); if (handlers.click) handlers.click(); };
        const onPointerOver = () => { if (handlers.hover) handlers.hover(); };
        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointermove', onPointerMove);
        el.addEventListener('pointerup', onPointerUp);
        el.addEventListener('pointerover', onPointerOver);
        listeners.push({ el, type: 'pointerdown', fn: onPointerDown }, { el, type: 'pointermove', fn: onPointerMove }, { el, type: 'pointerup', fn: onPointerUp }, { el, type: 'pointerover', fn: onPointerOver });
        return () => {
          listeners.filter(l => l.el === el).forEach(l => el.removeEventListener(l.type, l.fn));
          targets.delete(el);
        };
      },
      dispose() {
        listeners.forEach(l => l.el.removeEventListener(l.type, l.fn));
        targets.clear();
        listeners.length = 0;
      }
    };
    return adapter;
  }
};
