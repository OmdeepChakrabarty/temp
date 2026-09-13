export const QUALITY_LIMITS = {
    constrained: { dprCap: 1, cpuParticles: 2_000, instancedParticles: 10_000, drawCalls: 100, appManagedGpuBytes: 128 * 1024 ** 2 },
    balanced: { dprCap: 1.5, cpuParticles: 10_000, instancedParticles: 50_000, drawCalls: 250, appManagedGpuBytes: 256 * 1024 ** 2 },
    high: { dprCap: 2, cpuParticles: 20_000, instancedParticles: 200_000, drawCalls: 500, appManagedGpuBytes: 512 * 1024 ** 2 },
};
