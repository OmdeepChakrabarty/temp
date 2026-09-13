import { FixedClock } from './clock.js';
import { Diagnostics } from './diagnostics.js';
import { HarnessError } from './errors.js';
import { QUALITY_LIMITS } from './quality.js';
import { RendererAccessController } from './renderer-access.js';
import { ResourceScope } from './scope.js';
import { createViewport, isRenderableViewport } from './viewport.js';
export class Harness {
    options;
    scope = new ResourceScope();
    clock = new FixedClock();
    access = new RendererAccessController();
    diagnostics;
    quality;
    viewport;
    active;
    pending;
    scheduledFrame;
    disposed = false;
    contextLost = false;
    constructor(options) {
        this.options = options;
        this.quality = options.quality ?? 'balanced';
        this.diagnostics = options.diagnostics ?? new Diagnostics();
        this.viewport = createViewport({ ...options.viewport, dprCap: Math.min(options.viewport.dprCap, QUALITY_LIMITS[this.quality].dprCap) });
        this.options.renderer.resize(this.viewport);
    }
    get rendererGeneration() { return this.access.rendererGeneration; }
    get activeSession() { return this.active; }
    get currentViewport() { return this.viewport; }
    /** Defers replacement until a frame boundary so a failed/late preparation cannot blank the active scene. */
    commit(session) {
        this.assertOpen();
        const previousPending = this.pending;
        this.pending = session;
        if (previousPending)
            void previousPending.dispose();
        this.ensureFrame();
    }
    resize(input) {
        this.assertOpen();
        const next = createViewport({ ...input, dprCap: Math.min(input.dprCap, QUALITY_LIMITS[this.quality].dprCap) });
        if (next.pixelWidth === this.viewport.pixelWidth && next.pixelHeight === this.viewport.pixelHeight && next.dpr === this.viewport.dpr)
            return;
        this.viewport = next;
        this.options.renderer.resize(next);
        this.active?.resize?.(next);
        this.active?.pipeline.resize(next);
    }
    setPaused(paused, nowSeconds) {
        this.assertOpen();
        this.clock.setPaused(paused, nowSeconds);
        if (!paused)
            this.ensureFrame();
    }
    handleContextLost() {
        this.assertOpen();
        this.contextLost = true;
        this.access.invalidateGeneration();
        this.clock.setPaused(true);
        this.diagnostics.report({ code: 'CONTEXT_LOST', level: 'warning', message: 'WebGL context was lost; renderer-bound resources must be re-prepared.', remediation: 'Re-prepare the stored scene after context restoration.' });
    }
    handleContextRestored() {
        this.assertOpen();
        this.contextLost = false;
        const generation = this.access.invalidateGeneration();
        this.clock.setPaused(false);
        this.ensureFrame();
        return generation;
    }
    async dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        if (this.scheduledFrame !== undefined)
            this.options.scheduler.cancel(this.scheduledFrame);
        this.scheduledFrame = undefined;
        this.access.dispose();
        const pending = this.pending;
        const active = this.active;
        this.pending = undefined;
        this.active = undefined;
        const failures = [];
        for (const cleanup of [() => pending?.dispose(), () => active?.dispose(), () => this.options.renderer.dispose(), () => this.scope.dispose()]) {
            try {
                await cleanup();
            }
            catch (error) {
                failures.push(error);
            }
        }
        if (failures.length)
            throw new AggregateError(failures, 'Harness disposal encountered cleanup failures.');
    }
    ensureFrame() {
        if (this.scheduledFrame !== undefined || this.disposed || this.contextLost || this.clock.isPaused)
            return;
        this.scheduledFrame = this.options.scheduler.request((now) => this.frame(now));
    }
    frame(nowMilliseconds) {
        this.scheduledFrame = undefined;
        if (this.disposed || this.contextLost)
            return;
        this.replaceAtBoundary();
        const advance = this.clock.advance(nowMilliseconds / 1000);
        const frame = { tick: advance.fixedFrames.at(-1)?.tick ?? 0, simulationTimeSeconds: this.clock.simulationTimeSeconds, presentationTimeSeconds: advance.presentationTimeSeconds, interpolation: advance.interpolation };
        const session = this.active;
        if (session && isRenderableViewport(this.viewport)) {
            try {
                for (const fixed of advance.fixedFrames)
                    for (const instance of session.instances)
                        instance.hooks?.simulate?.({ ...frame, tick: fixed.tick, simulationTimeSeconds: fixed.timeSeconds, presentationTimeSeconds: fixed.timeSeconds, interpolation: 0 });
                for (const instance of session.instances)
                    instance.hooks?.evaluate?.(frame);
                for (const instance of session.instances)
                    instance.hooks?.present?.(frame);
                this.options.renderer.updateWorldMatrices(session.scene, session.camera);
                session.pipeline.render(session.scene, session.camera, frame);
            }
            catch (error) {
                this.diagnostics.report({ code: 'RENDER_FAILED', level: 'error', message: error instanceof Error ? error.message : 'Unknown render failure.', remediation: 'Inspect capability diagnostics and replace or repair the failing scene.' });
                this.clock.setPaused(true, nowMilliseconds / 1000);
            }
        }
        if (!this.clock.isPaused)
            this.ensureFrame();
    }
    replaceAtBoundary() {
        const pending = this.pending;
        if (!pending)
            return;
        this.pending = undefined;
        const previous = this.active;
        this.active = pending;
        pending.resize?.(this.viewport);
        pending.pipeline.resize(this.viewport);
        if (previous)
            void previous.dispose();
    }
    assertOpen() {
        if (this.disposed)
            throw new HarnessError('HARNESS_DISPOSED', 'Harness has been disposed.', 'Create a new harness before loading or rendering a scene.');
    }
}
export const createHarness = (options) => new Harness(options);
