import { assertFinite } from './errors.js';

export interface FixedFrame {
  readonly tick: number;
  readonly timeSeconds: number;
  readonly deltaSeconds: number;
}

export interface ClockAdvance {
  readonly fixedFrames: readonly FixedFrame[];
  readonly interpolation: number;
  readonly presentationTimeSeconds: number;
  readonly droppedSeconds: number;
}

export class FixedClock {
  public static readonly fixedDeltaSeconds = 1 / 60;
  private static readonly tickEpsilonSeconds = 1e-9;
  private accumulatorSeconds = 0;
  private lastWallSeconds: number | undefined;
  private tick = 0;
  private paused = false;
  private droppedSeconds = 0;

  public get isPaused(): boolean { return this.paused; }
  public get simulationTimeSeconds(): number { return this.tick * FixedClock.fixedDeltaSeconds; }
  public get totalDroppedSeconds(): number { return this.droppedSeconds; }

  public setPaused(paused: boolean, wallSeconds?: number): void {
    this.paused = paused;
    if (wallSeconds !== undefined) this.lastWallSeconds = assertFinite(wallSeconds, 'wallSeconds');
  }

  public reset(wallSeconds?: number): void {
    this.accumulatorSeconds = 0;
    this.lastWallSeconds = wallSeconds;
    this.tick = 0;
    this.droppedSeconds = 0;
  }

  public advance(wallSeconds: number): ClockAdvance {
    assertFinite(wallSeconds, 'wallSeconds');
    if (this.lastWallSeconds === undefined) {
      this.lastWallSeconds = wallSeconds;
      return this.result([]);
    }
    const wallDelta = Math.max(0, Math.min(wallSeconds - this.lastWallSeconds, 0.1));
    this.lastWallSeconds = wallSeconds;
    if (this.paused) return this.result([]);
    this.accumulatorSeconds += wallDelta;
    const frames: FixedFrame[] = [];
    while (this.accumulatorSeconds + FixedClock.tickEpsilonSeconds >= FixedClock.fixedDeltaSeconds && frames.length < 4) {
      this.accumulatorSeconds -= FixedClock.fixedDeltaSeconds;
      this.tick += 1;
      frames.push({ tick: this.tick, timeSeconds: this.simulationTimeSeconds, deltaSeconds: FixedClock.fixedDeltaSeconds });
    }
    if (this.accumulatorSeconds + FixedClock.tickEpsilonSeconds >= FixedClock.fixedDeltaSeconds) {
      const droppedTicks = Math.floor(this.accumulatorSeconds / FixedClock.fixedDeltaSeconds);
      const dropped = droppedTicks * FixedClock.fixedDeltaSeconds;
      this.accumulatorSeconds -= dropped;
      this.droppedSeconds += dropped;
    }
    return this.result(frames);
  }

  private result(fixedFrames: readonly FixedFrame[]): ClockAdvance {
    return {
      fixedFrames,
      interpolation: this.accumulatorSeconds / FixedClock.fixedDeltaSeconds,
      presentationTimeSeconds: this.simulationTimeSeconds + this.accumulatorSeconds,
      droppedSeconds: this.droppedSeconds,
    };
  }
}
