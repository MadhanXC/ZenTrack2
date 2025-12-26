import type { Fund } from './types';

// The base data for funds is now empty. All funds are managed by the user.
const fundsBaseData: { schemeCode: string; units: number; }[] = [];

// The initial fund data is created from the base data.
export const fundsData: Fund[] = fundsBaseData.map(fund => {
    return {
        id: fund.schemeCode, // Use schemeCode as the unique ID
        name: '', // Name will be fetched from the API
        category: '', // Category can also be fetched or left blank
        schemeCode: fund.schemeCode,
        units: fund.units,
        investmentFrequency: 'Monthly',
        investmentStartDate: new Date().toISOString().split('T')[0],
        nav: 0,
        currentValue: 0,
        performanceHistory: [],
    };
});
