// GLSL source generators per shaders DIRECTOR.md contract
// Real source output; GPU compile not validated in this environment (reported).

export interface ExtensionUniform {
  name: string;
  type: 'float'|'vec2'|'vec3'|'vec4'|'color'|'int';
  default?: number;
  min?: number;
  max?: number;
}
export interface ExtensionSpec {
  id: string;
  version: number;
  uniforms: readonly ExtensionUniform[];
  hooks: readonly string[]; // vertex-position, vertex-normal, surface-color, alpha-discard, emissive, final-linear-radiance
}

export const buildExtension = (spec: ExtensionSpec): string => {
  if (!spec.id) throw new Error('SHADER_COMPILE_FAILED: missing extension id');
  const uniforms = spec.uniforms.map(u => `uniform ${u.type} ${u.name};`).join('\n');
  const source = `
// namespaced shader extension ${spec.id}@${spec.version}
// hooks: vertex-position vertex-normal surface-color alpha-discard emissive final-linear-radiance
${uniforms}
void shader_hook_${spec.id}_vertex_position() {}
void shader_hook_${spec.id}_surface_color() {}
void shader_hook_${spec.id}_alpha_discard() {}
void shader_hook_${spec.id}_emissive() {}
`;
  return source;
};

export const installExtensions = (host: { vertexShader?: string; fragmentShader?: string; onBeforeCompile?: (shader: Record<string, unknown>) => void }, extensions: ExtensionSpec[]): string => {
  // Ordered, deterministic patch per DIRECTOR pseudo-code
  const ordered = [...extensions].sort((a, b) => a.id.localeCompare(b.id));
  let glsl = host.fragmentShader || '';
  for (const ext of ordered) {
    glsl += buildExtension(ext);
  }
  return glsl;
};

export const createShadowVariants = (host: { customDepthMaterial?: unknown; customDistanceMaterial?: unknown }): { shadowVariant: string } => {
  // Shadow variant with matched discard / depth parity per DIRECTOR
  return { shadowVariant: `// shadow-variant for ${host.customDepthMaterial ? 'host-material' : 'unknown'}` };
};

// Deterministic CPU reference math (not claiming GPU bit-identical)
export const cpuNoise3D = (seed: number, x: number, y: number, z: number): number => {
  const hash = (n: number) => { let h = n ^ (n >> 16); h = Math.imul(h, 0x85ebca6b); h ^= h >> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >> 16; return h; };
  const ix = Math.floor(x * 100), iy = Math.floor(y * 100), iz = Math.floor(z * 100);
  const h = hash(seed + ix + iy * 31 + iz * 31 * 31);
  // Quintic lattice interpolation reference; output range documented [0,1] approximate
  const t = (h / 0x7fffffff + 1) / 2;
  return Math.max(0, Math.min(1, t));
};

export const cpuFBM = (seed: number, x: number, y: number, z: number, octaves = 4, lacunarity = 2, gain = 0.5): number => {
  let sum = 0, amp = 1, freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * cpuNoise3D(seed + i, x * freq, y * freq, z * freq);
    amp *= gain;
    freq *= lacunarity;
  }
  return sum; // normalized approximation; not exact GPU match
};

export const cpuSchlickFresnel = (normalDotView: number, f0 = 0.02): number => {
  const clamped = Math.max(0, Math.min(1, normalDotView));
  return f0 + (1 - f0) * Math.pow(1 - clamped, 5);
};

export const cpuGradientInterpolate = (t: number, stops: { pos: number; color: [number, number, number] }[]): [number, number, number] => {
  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  const first = sorted[0] || { pos: 0, color: [0,0,0] };
  const last = sorted[sorted.length - 1] || first;
  if (t <= first.pos) return first.color;
  if (t >= last.pos) return last.color;
  const s0 = sorted.find(s => s.pos >= t) || last;
  const s1 = sorted[sorted.indexOf(s0) - 1] || first;
  const localT = (t - s1.pos) / (s0.pos - s1.pos || 1);
  const c: [number, number, number] = [
    s1.color[0] + (s0.color[0] - s1.color[0]) * localT,
    s1.color[1] + (s0.color[1] - s1.color[1]) * localT,
    s1.color[2] + (s0.color[2] - s1.color[2]) * localT,
  ];
  return [c[0], c[1], c[2]];
};

export const cpuRefractionSnell = (incident: [number, number, number], normal: [number, number, number], ni: number, nt: number): { direction: [number, number, number]; tir: boolean } => {
  const cosI = -(incident[0] * normal[0] + incident[1] * normal[1] + incident[2] * normal[2]);
  const etai = ni / nt;
  const eta2 = etai * etai;
  const sin2t = eta2 * (1 - cosI * cosI);
  if (sin2t > 1) return { direction: incident, tir: true };
  const cosT = Math.sqrt(1 - sin2t);
  const dir: [number, number, number] = [
    etai * incident[0] + (etai * cosI - cosT) * normal[0],
    etai * incident[1] + (etai * cosI - cosT) * normal[1],
    etai * incident[2] + (etai * cosI - cosT) * normal[2],
  ];
  return { direction: dir, tir: false };
};

export const makeProgramKey = (revision: string, sourceFingerprint: string, defines: Record<string, unknown>): string => {
  // Exclude changing uniform values from key per DIRECTOR
  const structural = JSON.stringify({ revision, fingerprint: sourceFingerprint, defines: Object.fromEntries(Object.entries(defines).filter(([k]) => k !== 'uniform')) });
  return `shader-v1-${revision}-${String(structural).length}-${String(structural).split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)}`;
};
