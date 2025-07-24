
export interface Ingredient {
  id: string;
  quantity: number; // QTY
  unit: string; // The unit for the recipe (e.g., 'g', 'ml', 'pc')
  name: string; // INGREDIENT
  purchasePrice: number; // PURCHASE PRICE
  purchaseUnit: string; // The unit in which the item was purchased (e.g., 'kg', 'l', 'pc')
  conversionFactor: number; // The conversion factor, editable by the user.
}

export interface MarketItem {
  id: string;
  name: string;
  price: number;
  unit: string;
}

// Defines the structure for an ingredient parsed from text by the AI model.
export interface ParsedIngredient {
  name: string;
  quantity: number;
  unit: string;
}
