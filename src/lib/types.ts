export type PerformanceData = {
  date: string;
  value: number;
};

export type NavHistoryEntry = {
  date: string;
  nav: string;
  navValue?: number;
  formattedDate?: string;
};

export type Fund = {
  id: string;
  name: string;
  category: string;
  schemeCode: string;
  units: number;
  nav: number;
  navDate?: string; // Add navDate property
  currentValue: number;
  userId?: string;
};
