export class AnimationError extends Error {
  constructor(public code: string, message: string, public track?: string, public channel?: string) {
    super(message);
    this.name = 'AnimationError';
  }
}

export const INVALID_KEYFRAMES = (track: string, reason: string) => new AnimationError('INVALID_KEYFRAMES', `Track ${track}: ${reason}`, track);
export const CHANNEL_TYPE_MISMATCH = (track: string, channel: string, expected: string, got: string) => new AnimationError('CHANNEL_TYPE_MISMATCH', `Track ${track}: channel ${channel} expected ${expected} got ${got}`, track, channel);
export const MULTIPLE_WRITERS = (track: string, channel: string) => new AnimationError('MULTIPLE_WRITERS', `Track ${track}: multiple exclusive writers to ${channel}`, track, channel);
export const SEEK_LIMIT_EXCEEDED = (track: string, limit: number) => new AnimationError('SEEK_LIMIT_EXCEEDED', `Track ${track}: seek exceeds ${limit}`, track);
export const NONFINITE_ANIMATION = (track: string, value: number) => new AnimationError('NONFINITE_ANIMATION', `Track ${track}: non-finite value ${value}`, track);
