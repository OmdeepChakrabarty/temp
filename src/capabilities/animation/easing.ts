// Easing per DIRECTOR.md: scalar interpolation with ease(alpha)
export const easeLinear = (t: number): number => t;
export const easeInOut = (t: number): number => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export interface Keyframe {
  time: number;
  value: number | [number, number, number] | [number, number, number, number];
}

export function sampleScalar(track: { keyframes: Keyframe[] }, t: number): number {
  const kfs = track.keyframes;
  if (!kfs || kfs.length === 0) return 0;
  if (kfs.length === 0) return 0;
  if (kfs.length === 1) return typeof kfs[0]!.value === 'number' ? kfs[0]!.value : 0;
  // Strictly increasing check (DIRECTOR)
  for (let i = 1; i < kfs.length; i++) if (kfs[i]!.time <= kfs[i - 1]!.time) throw new Error('INVALID_KEYFRAMES: times must be strictly increasing');
  // Binary-search interval (cached cursor would be production; simple binary here)
  let loh = 0, hi = kfs.length - 1;
  while (loh < hi) {
    const mid = Math.floor((loh + hi) / 2);
    if (kfs[mid]!.time <= t) loh = mid + 1; else hi = mid;
  }
  const idx = Math.max(0, Math.min(Math.max(0, loh - 1), Math.max(0, kfs.length - 2)));
  const a = kfs[idx] as Keyframe;
  const b = kfs[idx + 1] as Keyframe;
  const len = Math.max(1e-9, b.time - a.time);
  const alpha = Math.max(0, Math.min(1, (t - a.time) / len));
  const eased = easeInOut(alpha);
  const av = typeof a.value === 'number' ? a.value : 0;
  const bv = typeof b.value === 'number' ? b.value : 0;
  return av + (bv - av) * eased;
}

// Loop/clamp/ping-pong per DIRECTOR
export function mapLoopTime(t: number, duration: number, loop: boolean, pingPong: boolean): number {
  if (!loop) return Math.max(0, Math.min(duration, t));
  if (pingPong) {
    const cycle = duration * 2;
    const p = ((t + duration) % cycle + cycle) % cycle; // normalized
    return p <= duration ? p : cycle - p;
  }
  return ((t % duration) + duration) % duration;
}
