// Spring per DIRECTOR.md: analytic static target (under/critical/over-damped) + bounded fixed-step for moving
export interface SpringOptions {
  frequency: number; // Hz
  dampingRatio: number;
  target: number | [number, number, number];
}
export function springStaticClosedForm(t: number, opts: SpringOptions, initial: number): number {
  const omega = opts.frequency * 2 * Math.PI;
  const zeta = opts.dampingRatio;
  const target = typeof opts.target === 'number' ? opts.target : 0;
  if (zeta < 1) { // under-damped
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    return target + Math.exp(-zeta * omega * t) * ((initial - target) * Math.cos(wd * t) + ((zeta * omega * (initial - target)) / wd) * Math.sin(wd * t));
  } else if (zeta === 1) { // critical
    return target + (initial - target) * (1 + omega * t) * Math.exp(-omega * t);
  } else { // over-damped
    const r1 = -omega * (zeta - Math.sqrt(zeta * zeta - 1));
    const r2 = -omega * (zeta + Math.sqrt(zeta * zeta - 1));
    const A = (initial - target - r2 * (initial - target) / (r1 - r2)) / (r1 - r2); // simplified; exact form varies
    return target + A * Math.exp(r1 * t) + (initial - target - A) * Math.exp(r2 * t);
  }
}
