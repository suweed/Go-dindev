import type { MoneyConfig } from './types';

// Local defaults mirroring the `configurations` table in the DB (type 'money').
// The DB is the source of truth; this default is used for development without
// a backend and as a fallback if the DB is unreachable.
export const DEFAULT_MONEY_CONFIG: MoneyConfig = {
  initialSavings: 10000,
  transport: { on_foot: 0, bus: 60, car: 100 },
  food: {
    options: [
      { name: 'torta', price: 50 },
      { name: 'comida corrida', price: 100 },
      { name: 'restaurante', price: 150 },
    ],
  },
  drinks: {
    options: [
      { name: 'agua', price: 15 },
      { name: 'refresco', price: 25 },
      { name: 'cafe', price: 40 },
    ],
  },
  clothes: { office: 500, comfortable: 300 },
  activities: { tv: 0, goingOut: 100 },
  events: { accident: 200, fine: 150, illness: 300 },
};
