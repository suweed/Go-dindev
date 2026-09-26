import type { DaySummary, ExtraTimeResult, PhaseId, TimeConfig, TimeState } from './types';

export const PHASE_ORDER: PhaseId[] = [
  'wake_up',
  'transport_to_work',
  'office_entry',
  'work',
  'office_exit',
  'transport_home',
  'free_time',
  'sleep',
];

export function createTimeState(_config: TimeConfig): TimeState {
  return {
    day: 1,
    phase: 'wake_up',
    gameHour: 0,
    dayHoursConsumed: 0,
  };
}

export function getPhaseHours(config: TimeConfig, phase: PhaseId): number {
  return config.phases[phase].gameHours;
}

export function totalDayHours(config: TimeConfig): number {
  return PHASE_ORDER.reduce((sum, phase) => sum + config.phases[phase].gameHours, 0);
}

export function advancePhase(state: TimeState, config: TimeConfig): TimeState {
  const idx = PHASE_ORDER.indexOf(state.phase);
  const phaseHours = config.phases[state.phase].gameHours;
  const nextIdx = (idx + 1) % PHASE_ORDER.length;
  const nextPhase = PHASE_ORDER[nextIdx];

  if (nextIdx === 0) {
    // After sleep: a new day starts
    return {
      day: state.day + 1,
      phase: nextPhase,
      gameHour: 0,
      dayHoursConsumed: 0,
    };
  }

  return {
    ...state,
    phase: nextPhase,
    gameHour: state.gameHour + phaseHours,
    dayHoursConsumed: state.dayHoursConsumed + phaseHours,
  };
}

export function consumeExtraTime(
  state: TimeState,
  extraHours: number,
  config: TimeConfig,
): ExtraTimeResult {
  const freeTimeHours = config.phases.free_time.gameHours;
  const sleepHours = config.phases.sleep.gameHours;

  const hoursTakenFromFreeTime = Math.min(extraHours, freeTimeHours);
  let remaining = extraHours - hoursTakenFromFreeTime;
  const hoursTakenFromSleep = Math.min(remaining, sleepHours);
  remaining -= hoursTakenFromSleep;

  const lostSleepHours = hoursTakenFromSleep + remaining; // remaining beyond sleep is lost sleep
  const rolledToNextDay = remaining > 0;

  const nextState: TimeState = rolledToNextDay
    ? { day: state.day + 1, phase: 'wake_up', gameHour: 0, dayHoursConsumed: 0 }
    : {
        ...state,
        dayHoursConsumed: state.dayHoursConsumed + extraHours,
      };

  return {
    state: nextState,
    hoursTakenFromFreeTime,
    hoursTakenFromSleep,
    lostSleepHours,
    rolledToNextDay,
  };
}

export function endDay(state: TimeState, _config: TimeConfig): DaySummary {
  const totalHours = state.dayHoursConsumed;
  return {
    day: state.day,
    totalHours,
    lostSleepHours: 0,
    nextState: {
      day: state.day + 1,
      phase: 'wake_up',
      gameHour: 0,
      dayHoursConsumed: 0,
    },
  };
}
