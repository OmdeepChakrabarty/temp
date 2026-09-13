import { FixedClock } from './clock.js';
import { Diagnostics } from './diagnostics.js';
import { HarnessError } from './errors.js';
import { QUALITY_LIMITS, type QualityProfile } from './quality.js';
import { RendererAccessController } from './renderer-access.js';
import { ResourceScope } from './scope.js';
import { createViewport, isRenderableViewport, type ViewportInput } from './viewport.js';

import type { DeviceProfile, FrameContext, PreparedSession, Viewport } from './types.js';

export interface FrameScheduler {
  request(callback: (nowMilliseconds: number) => void): number;
  cancel(handle: number): void;
}

/** The WebGL2 adapter belongs in the later Three.js integration; core owns its lifecycle. */
export interface WebglRendererDriver {
  readonly device: DeviceProfile;
  resize(viewport: Viewport): void;
  updateWorldMatrices(scene: unknown, camera: unknown): void;
  dispose(): void | Promise<void>;
}

export interface HarnessOptions {
  readonly renderer: WebglRendererDriver;
  readonly scheduler: FrameScheduler;
  readonly viewport: ViewportInput;
  readonly quality?: QualityProfile;
  readonly diagnostics?: Diagnostics;
}

export class Harness {
  private readonly scope = new ResourceScope();
  private readonly clock = new FixedClock();
  private readonly access = new RendererAccessController();
  private readonly diagnostics: Diagnostics;
  private readonly quality: QualityProfile;
  private viewport: Viewport;
  private active: PreparedSession | undefined;
  private pending: PreparedSession | undefined;
  private scheduledFrame: number | undefined;
  private disposed = false;
  private contextLost = false;

  public constructor(private readonly options: HarnessOptions) {
    this.quality = options.quality ?? 'balanced';
    this.diagnostics = options.diagnostics ?? new Diagnostics();
    this.viewport = createViewport({ ...options.viewport, dprCap: Math.min(options.viewport.dprCap, QUALITY_LIMITS[this.quality].dprCap) });
    this.options.renderer.resize(this.viewport);
  }

  public get rendererGeneration(): number { return this.access.rendererGeneration; }
  public get activeSession(): PreparedSession | undefined { return this.active; }
  public get currentViewport(): Viewport { return this.viewport; }

  /** Defers replacement until a frame boundary so a failed/late preparation cannot blank the active scene. */
  public commit(session: PreparedSession): void {
    this.assertOpen();
    const previousPending = this.pending;
    this.pending = session;
    if (previousPending) void previousPending.dispose();
    this.ensureFrame();
  }

  public resize(input: ViewportInput): void {
    this.assertOpen();
    const next = createViewport({ ...input, dprCap: Math.min(input.dprCap, QUALITY_LIMITS[this.quality].dprCap) });
    if (next.pixelWidth === this.viewport.pixelWidth && next.pixelHeight === this.viewport.pixelHeight && next.dpr === this.viewport.dpr) return;
    this.viewport = next;
    this.options.renderer.resize(next);
    this.active?.resize?.(next);
    this.active?.pipeline.resize(next);
  }

  public setPaused(paused: boolean, nowSeconds: number): void {
    this.assertOpen();
    this.clock.setPaused(paused, nowSeconds);
    if (!paused) this.ensureFrame();
  }

  public handleContextLost(): void {
    this.assertOpen();
    this.contextLost = true;
    this.access.invalidateGeneration();
    this.clock.setPaused(true);
    this.diagnostics.report({ code: 'CONTEXT_LOST', level: 'warning', message: 'WebGL context was lost; renderer-bound resources must be re-prepared.', remediation: 'Re-prepare the stored scene after context restoration.' });
  }

  public handleContextRestored(): number {
    this.assertOpen();
    this.contextLost = false;
    const generation = this.access.invalidateGeneration();
    this.clock.setPaused(false);
    this.ensureFrame();
    return generation;
  }

  public async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    if (this.scheduledFrame !== undefined) this.options.scheduler.cancel(this.scheduledFrame);
    this.scheduledFrame = undefined;
    this.access.dispose();
    const pending = this.pending; const active = this.active;
    this.pending = undefined; this.active = undefined;
    const failures: unknown[] = [];
    for (const cleanup of [() => pending?.dispose(), () => active?.dispose(), () => this.options.renderer.dispose(), () => this.scope.dispose()]) {
      try { await cleanup(); } catch (error) { failures.push(error); }
    }
    if (failures.length) throw new AggregateError(failures, 'Harness disposal encountered cleanup failures.');
  }

  private ensureFrame(): void {
    if (this.scheduledFrame !== undefined || this.disposed || this.contextLost || this.clock.isPaused) return;
    this.scheduledFrame = this.options.scheduler.request((now) => this.frame(now));
  }

  private frame(nowMilliseconds: number): void {
    this.scheduledFrame = undefined;
    if (this.disposed || this.contextLost) return;
    this.replaceAtBoundary();
    const advance = this.clock.advance(nowMilliseconds / 1000);
    const frame: FrameContext = { tick: advance.fixedFrames.at(-1)?.tick ?? 0, simulationTimeSeconds: this.clock.simulationTimeSeconds, presentationTimeSeconds: advance.presentationTimeSeconds, interpolation: advance.interpolation };
    const session = this.active;
    if (session && isRenderableViewport(this.viewport)) {
      try {
        for (const fixed of advance.fixedFrames) for (const instance of session.instances) instance.hooks?.simulate?.({ ...frame, tick: fixed.tick, simulationTimeSeconds: fixed.timeSeconds, presentationTimeSeconds: fixed.timeSeconds, interpolation: 0 });
        for (const instance of session.instances) instance.hooks?.evaluate?.(frame);
        for (const instance of session.instances) instance.hooks?.present?.(frame);
        this.options.renderer.updateWorldMatrices(session.scene, session.camera);
        session.pipeline.render(session.scene, session.camera, frame);
      } catch (error) {
        this.diagnostics.report({ code: 'RENDER_FAILED', level: 'error', message: error instanceof Error ? error.message : 'Unknown render failure.', remediation: 'Inspect capability diagnostics and replace or repair the failing scene.' });
        this.clock.setPaused(true, nowMilliseconds / 1000);
      }
    }
    if (!this.clock.isPaused) this.ensureFrame();
  }

  private replaceAtBoundary(): void {
    const pending = this.pending;
    if (!pending) return;
    this.pending = undefined;
    const previous = this.active;
    this.active = pending;
    pending.resize?.(this.viewport);
    pending.pipeline.resize(this.viewport);
    if (previous) void previous.dispose();
  }

  private assertOpen(): void {
    if (this.disposed) throw new HarnessError('HARNESS_DISPOSED', 'Harness has been disposed.', 'Create a new harness before loading or rendering a scene.');
  }
}

export const createHarness = (options: HarnessOptions): Harness => new Harness(options);
