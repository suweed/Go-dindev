export interface Transaction {
  source: string;
  amount: number;
  day: number;
}

export interface MoneyState {
  value: number;
  initialSavings: number;
  history: Transaction[];
}

export interface FoodOption {
  name: string;
  price: number;
}

export interface DrinkOption {
  name: string;
  price: number;
}

export type TransportType = 'on_foot' | 'bus' | 'car';

export interface MoneyConfig {
  initialSavings: number;
  transport: Record<TransportType, number>;
  food: { options: FoodOption[] };
  drinks: { options: DrinkOption[] };
  clothes: { office: number; comfortable: number };
  activities: { tv: number; goingOut: number };
  events: { accident: number; fine: number; illness: number };
}

export interface Result {
  ok: boolean;
  state: MoneyState;
  error?: string;
}
