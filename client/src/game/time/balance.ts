import type { TimeConfig } from './types';

// Local defaults mirroring the `configurations` table in the DB (type 'time').
// The DB is the source of truth; this default is used for development without
// a backend and as a fallback if the DB is unreachable.
//
// NOTE: phase hours sum to 24h (1+2+0.5+8+0.5+2+2+8), matching the design doc.
export const DEFAULT_TIME_CONFIG: TimeConfig = {
  projectDays: 30,
  phases: {
    wake_up: { gameHours: 1, realSeconds: 0 },
    transport_to_work: { gameHours: 2, realSeconds: 0 },
    office_entry: { gameHours: 0.5, realSeconds: 0 },
    work: { gameHours: 8, realSeconds: 300 }, // 2 minigames x 2.5 min = 5 min real
    office_exit: { gameHours: 0.5, realSeconds: 0 },
    transport_home: { gameHours: 2, realSeconds: 0 },
    free_time: { gameHours: 2, realSeconds: 0 },
    sleep: { gameHours: 8, realSeconds: 0 },
  },
  lostSleepFatiguePerHour: 2,
};
