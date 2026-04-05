export interface WorldBankIndicatorValue {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}

export type WorldBankResponse = [
  { page: number; pages: number; per_page: number; total: number },
  WorldBankIndicatorValue[] | null,
];
