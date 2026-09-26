export interface FatigueState {
  value: number; // 0..100
}

export type Threshold = 'normal' | 'tired' | 'critical' | 'collapse';

export interface FatigueConfig {
  dailyCost: number;
  thresholds: {
    normal: number; // 40
    tired: number; // 60
    critical: number; // 80
    collapse: number; // 100
  };
  costs: Record<string, number>;
  recoveries: Record<string, number>;
}

export interface FatigueResult {
  ok: boolean;
  state: FatigueState;
  crossedThreshold?: Threshold;
  error?: string;
}
