import {
  applyCost,
  applyDailyCost,
  applyRecovery,
  createFatigueState,
  isCollapsed,
} from '../fatigue/fatigue';
import { applyExpense, canPay, createMoneyState, payTransport } from '../money/money';
import { advancePhase, consumeExtraTime, createTimeState } from '../time/time';
import type {
  DayEvent,
  DayResult,
  EndCondition,
  ExitChoice,
  FreeTimeActivity,
  GameConfig,
  GameState,
  MealChoice,
  WakeUpChoice,
} from './types';

const OVERTIME_HOURS = 1;

export function createGameState(config: GameConfig): GameState {
  return {
    day: 1,
    phase: 'wake_up',
    time: createTimeState(config.time),
    fatigue: createFatigueState(),
    money: createMoneyState(config.money),
    transportType: config.transportType,
    wentToWork: false,
    projectProgress: 0,
    lostSleepHours: 0,
    events: [],
  };
}

function withEvent(state: GameState, event: DayEvent): GameState {
  return { ...state, events: [...state.events, event] };
}

export function checkEndConditions(state: GameState, config: GameConfig): EndCondition | null {
  if (state.projectProgress >= 100) return { type: 'project_complete' };
  if (isCollapsed(state.fatigue, config.fatigue)) return { type: 'fatigue_collapse' };
  if (state.day > config.time.projectDays) return { type: 'fired' };
  return null;
}

function finish(state: GameState, config: GameConfig): DayResult {
  const endCondition = checkEndConditions(state, config);
  return endCondition ? { state, endCondition } : { state };
}

export function decideWakeUp(state: GameState, choice: WakeUpChoice, config: GameConfig): DayResult {
  if (choice === 'go_to_work') {
    const time = advancePhase(state.time, config.time);
    let next = withEvent(
      { ...state, phase: 'transport_to_work', time, wentToWork: true },
      { day: state.day, phase: 'wake_up', type: 'decision', detail: 'go_to_work' },
    );
    const cost = config.money.transport[state.transportType];
    if (!canPay(next.money, cost)) {
      return { state: next, endCondition: { type: 'out_of_money' } };
    }
    const paid = payTransport(next.money, next.transportType, config.money, next.day);
    next = withEvent(
      { ...next, money: paid.state },
      {
        day: state.day,
        phase: 'transport_to_work',
        type: 'expense',
        detail: `transport_${state.transportType}`,
        moneyDelta: -cost,
      },
    );
    return finish(next, config);
  }

  let time = state.time;
  while (time.phase !== 'free_time') {
    time = advancePhase(time, config.time);
  }
  const next = withEvent(
    { ...state, phase: 'free_time', time, wentToWork: false },
    { day: state.day, phase: 'wake_up', type: 'decision', detail: 'stay_home' },
  );
  return finish(next, config);
}

export function advanceToNextPhase(state: GameState, config: GameConfig): DayResult {
  if (state.phase === 'sleep') {
    return finish(state, config);
  }
  const time = advancePhase(state.time, config.time);
  return finish({ ...state, phase: time.phase, time }, config);
}

export function completeWorkSession(state: GameState, config: GameConfig): DayResult {
  let fatigue = state.fatigue;
  let progress = state.projectProgress;
  const events: DayEvent[] = [];
  for (let i = 0; i < config.project.minigamesPerDay; i++) {
    fatigue = applyCost(fatigue, 'work_activity', config.fatigue).state;
    progress = Math.min(100, progress + config.project.progressPerMinigame);
    events.push({
      day: state.day,
      phase: 'work',
      type: 'minigame',
      detail: `minigame_${i + 1}`,
      fatigueDelta: config.fatigue.costs.work_activity,
      projectDelta: config.project.progressPerMinigame,
    });
  }
  const next = { ...state, fatigue, projectProgress: progress, events: [...state.events, ...events] };
  return finish(next, config);
}

export function decideMeal(state: GameState, choice: MealChoice, config: GameConfig): DayResult {
  if (choice === 'eat') {
    const food = config.money.food.options[0];
    if (!canPay(state.money, food.price)) {
      return { state, endCondition: { type: 'out_of_money' } };
    }
    const paid = applyExpense(state.money, 'food', food.price, state.day);
    const fatigue = applyRecovery(state.fatigue, 'food', config.fatigue).state;
    const next = withEvent(
      { ...state, money: paid.state, fatigue },
      {
        day: state.day,
        phase: 'work',
        type: 'meal',
        detail: 'eat',
        moneyDelta: -food.price,
        fatigueDelta: -config.fatigue.recoveries.food,
      },
    );
    return finish(next, config);
  }
  const fatigue = applyCost(state.fatigue, 'not_eating', config.fatigue).state;
  const next = withEvent(
    { ...state, fatigue },
    {
      day: state.day,
      phase: 'work',
      type: 'meal',
      detail: 'skip_meal',
      fatigueDelta: config.fatigue.costs.not_eating,
    },
  );
  return finish(next, config);
}

export function decideExit(state: GameState, choice: ExitChoice, config: GameConfig): DayResult {
  if (choice === 'leave') {
    const time = advancePhase(state.time, config.time);
    const next = withEvent(
      { ...state, phase: 'transport_home', time },
      { day: state.day, phase: 'office_exit', type: 'decision', detail: 'leave' },
    );
    return finish(next, config);
  }

  const extra = consumeExtraTime(state.time, OVERTIME_HOURS, config.time);
  const fatigue = applyCost(state.fatigue, 'work_activity', config.fatigue).state;
  const progress = Math.min(100, state.projectProgress + config.project.progressPerMinigame);
  const time = advancePhase(extra.state, config.time);
  const next = withEvent(
    {
      ...state,
      phase: 'transport_home',
      time,
      fatigue,
      projectProgress: progress,
      lostSleepHours: state.lostSleepHours + extra.lostSleepHours,
    },
    {
      day: state.day,
      phase: 'office_exit',
      type: 'decision',
      detail: 'keep_working',
      extraHours: OVERTIME_HOURS,
      fatigueDelta: config.fatigue.costs.work_activity,
      projectDelta: config.project.progressPerMinigame,
    },
  );
  if (extra.rolledToNextDay) {
    return closeDay(next, config);
  }
  return finish(next, config);
}

export function applyFreeTimeActivity(
  state: GameState,
  activity: FreeTimeActivity,
  config: GameConfig,
): DayResult {
  if (activity === 'end_free_time') {
    const time = advancePhase(state.time, config.time);
    const next = withEvent(
      { ...state, phase: 'sleep', time },
      { day: state.day, phase: 'free_time', type: 'decision', detail: 'end_free_time' },
    );
    return finish(next, config);
  }

  if (activity === 'tv') {
    const fatigue = applyCost(state.fatigue, 'multimedia', config.fatigue).state;
    const next = withEvent(
      { ...state, fatigue },
      {
        day: state.day,
        phase: 'free_time',
        type: 'activity',
        detail: 'tv',
        fatigueDelta: config.fatigue.costs.multimedia,
      },
    );
    return finish(next, config);
  }

  const cost = config.money.activities.goingOut;
  if (!canPay(state.money, cost)) {
    return { state, endCondition: { type: 'out_of_money' } };
  }
  const paid = applyExpense(state.money, 'going_out', cost, state.day);
  const fatigue = applyCost(state.fatigue, 'multimedia', config.fatigue).state;
  const next = withEvent(
    { ...state, money: paid.state, fatigue },
    {
      day: state.day,
      phase: 'free_time',
      type: 'activity',
      detail: 'going_out',
      moneyDelta: -cost,
      fatigueDelta: config.fatigue.costs.multimedia,
    },
  );
  return finish(next, config);
}

export function goToSleep(state: GameState, config: GameConfig): DayResult {
  const daily = applyDailyCost(state.fatigue, config.fatigue);
  const withDaily = withEvent(
    { ...state, fatigue: daily.state },
    {
      day: state.day,
      phase: 'sleep',
      type: 'daily_cost',
      detail: 'daily_fatigue',
      fatigueDelta: config.fatigue.dailyCost,
    },
  );

  const sleepHours = config.time.phases.sleep.gameHours;
  const hoursSlept = Math.max(0, sleepHours - state.lostSleepHours);
  const recovery =
    state.lostSleepHours === 0
      ? config.fatigue.recoveries.full_sleep
      : hoursSlept * config.fatigue.recoveries.partial_sleep_per_hour;
  const fatigue = { value: Math.max(0, daily.state.value - recovery) };
  const nextDay = state.time.day > state.day ? state.time.day : state.day + 1;

  const next = withEvent(
    {
      ...withDaily,
      phase: 'wake_up',
      day: nextDay,
      time: createTimeState(config.time),
      fatigue,
      lostSleepHours: 0,
    },
    {
      day: state.day,
      phase: 'sleep',
      type: 'sleep',
      detail: state.lostSleepHours === 0 ? 'full_sleep' : `partial_sleep_${hoursSlept}h`,
      fatigueDelta: -recovery,
    },
  );
  return finish(next, config);
}

function closeDay(state: GameState, config: GameConfig): DayResult {
  return goToSleep(state, config);
}
