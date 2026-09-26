import type { FatigueConfig } from './types';

// Local defaults mirroring the `configurations` table in the DB (type 'fatigue').
// The DB is the source of truth; this default is used for development without
// a backend and as a fallback if the DB is unreachable.
export const DEFAULT_FATIGUE_CONFIG: FatigueConfig = {
  dailyCost: 10,
  thresholds: { normal: 40, tired: 60, critical: 80, collapse: 100 },
  costs: {
    work_activity: 2,
    wake_up_late: 5,
    transport_problems: 5,
    not_eating: 8,
    multimedia: 3,
    lost_sleep_hour: 2,
    weekend_work: 15,
  },
  recoveries: {
    full_sleep: 25,
    partial_sleep_per_hour: 3,
    food: 10,
    drink: 5,
    comfortable_clothes: 5,
  },
};
