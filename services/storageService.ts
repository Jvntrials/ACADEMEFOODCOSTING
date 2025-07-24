
import { MarketItem } from '../types.ts';

const MARKET_LIST_KEY = 'foodCostingMarketList';

export const getMarketListFromStorage = (): MarketItem[] => {
  try {
    const rawData = localStorage.getItem(MARKET_LIST_KEY);
    if (rawData) {
      return JSON.parse(rawData);
    }
  } catch (error) {
    console.error("Failed to parse market list from localStorage", error);
  }
  return [
      { id: '1', name: 'Flour', price: 80, unit: 'kg' },
      { id: '2', name: 'Sugar', price: 90, unit: 'kg' },
      { id: '3', name: 'Eggs', price: 7, unit: 'pc' },
      { id: '4', name: 'Butter', price: 250, unit: 'kg' },
      { id: '5', name: 'Milk', price: 70, unit: 'liter' },
  ];
};

export const saveMarketListToStorage = (marketList: MarketItem[]): void => {
  try {
    const data = JSON.stringify(marketList);
    localStorage.setItem(MARKET_LIST_KEY, data);
  } catch (error) {
    console.error("Failed to save market list to localStorage", error);
  }
};
