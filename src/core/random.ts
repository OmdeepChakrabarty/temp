/** Deterministic 32-bit PRNG. Stream seeds derive from a scene seed and stable node ID. */
export class SeededRandom {
  private state: number;

  public constructor(seed: number) {
    this.state = seed >>> 0;
  }

  public nextUint32(): number {
    let value = (this.state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  }

  public next(): number {
    return this.nextUint32() / 0x1_0000_0000;
  }
}

export const deriveSeed = (sceneSeed: number, stableNodeId: string): number => {
  let hash = (sceneSeed >>> 0) ^ 0x811c9dc5;
  for (let index = 0; index < stableNodeId.length; index += 1) {
    hash ^= stableNodeId.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};
