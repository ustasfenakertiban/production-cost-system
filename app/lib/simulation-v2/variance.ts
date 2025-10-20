
import { SimulationSettings } from './types';

export function productivityWithVariance(base: number, s: SimulationSettings): number {
  const x = Math.max(0, s.variancePercent) / 100;
  switch (s.varianceMode) {
    case 'no_variance': return base;
    case 'min_only': return base * (1 - x);
    case 'max_only': return base;
    case 'random_nonnegative': return base * (1 - Math.random() * x);
    case 'random_full_range': return base * (1 + ((Math.random() * 2 - 1) * x));
    case 'perf_min_materials_max': return base * (1 - x);
    case 'perf_random_down_materials_random_up': return base * (1 - Math.random() * x);
    default: return base;
  }
}

export function materialsOrDepVarianceMultiplier(s: SimulationSettings): number {
  const x = Math.max(0, s.variancePercent) / 100;
  switch (s.varianceMode) {
    case 'no_variance': return 1;
    case 'min_only': return 1;
    case 'max_only': return 1 + x;
    case 'random_nonnegative': return 1 + Math.random() * x;
    case 'random_full_range': return 1 + ((Math.random() * 2 - 1) * x);
    case 'perf_min_materials_max': return 1 + x;
    case 'perf_random_down_materials_random_up': return 1 + Math.random() * x;
    default: return 1;
  }
}
