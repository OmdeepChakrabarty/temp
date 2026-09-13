import { assertFinite } from './errors.js';

import type { Viewport } from './types.js';

export interface ViewportInput {
  readonly cssWidth: number;
  readonly cssHeight: number;
  readonly devicePixelRatio: number;
  readonly dprCap: number;
}

/** Converts CSS dimensions once; consumers receive physical target dimensions. */
export const createViewport = (input: ViewportInput): Viewport => {
  const cssWidth = assertFinite(input.cssWidth, 'cssWidth');
  const cssHeight = assertFinite(input.cssHeight, 'cssHeight');
  const devicePixelRatio = assertFinite(input.devicePixelRatio, 'devicePixelRatio');
  const dprCap = assertFinite(input.dprCap, 'dprCap');
  if (cssWidth < 0 || cssHeight < 0 || devicePixelRatio <= 0 || dprCap <= 0) {
    throw new RangeError('Viewport dimensions must be non-negative and DPR values must be positive.');
  }
  const dpr = Math.min(devicePixelRatio, dprCap);
  return {
    cssWidth,
    cssHeight,
    dpr,
    pixelWidth: Math.round(cssWidth * dpr),
    pixelHeight: Math.round(cssHeight * dpr),
  };
};

export const isRenderableViewport = (viewport: Viewport): boolean => viewport.pixelWidth > 0 && viewport.pixelHeight > 0;
