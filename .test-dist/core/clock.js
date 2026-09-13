import { assertFinite } from './errors.js';
export class FixedClock {
    static fixedDeltaSeconds = 1 / 60;
    static tickEpsilonSeconds = 1e-9;
    accumulatorSeconds = 0;
    lastWallSeconds;
    tick = 0;
    paused = false;
    droppedSeconds = 0;
    get isPaused() { return this.paused; }
    get simulationTimeSeconds() { return this.tick * FixedClock.fixedDeltaSeconds; }
    get totalDroppedSeconds() { return this.droppedSeconds; }
    setPaused(paused, wallSeconds) {
        this.paused = paused;
        if (wallSeconds !== undefined)
            this.lastWallSeconds = assertFinite(wallSeconds, 'wallSeconds');
    }
    reset(wallSeconds) {
        this.accumulatorSeconds = 0;
        this.lastWallSeconds = wallSeconds;
        this.tick = 0;
        this.droppedSeconds = 0;
    }
    advance(wallSeconds) {
        assertFinite(wallSeconds, 'wallSeconds');
        if (this.lastWallSeconds === undefined) {
            this.lastWallSeconds = wallSeconds;
            return this.result([]);
        }
        const wallDelta = Math.max(0, Math.min(wallSeconds - this.lastWallSeconds, 0.1));
        this.lastWallSeconds = wallSeconds;
        if (this.paused)
            return this.result([]);
        this.accumulatorSeconds += wallDelta;
        const frames = [];
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
    result(fixedFrames) {
        return {
            fixedFrames,
            interpolation: this.accumulatorSeconds / FixedClock.fixedDeltaSeconds,
            presentationTimeSeconds: this.simulationTimeSeconds + this.accumulatorSeconds,
            droppedSeconds: this.droppedSeconds,
        };
    }
}
