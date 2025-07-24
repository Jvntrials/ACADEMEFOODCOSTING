import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// From: types.ts
interface Ingredient {
  id: string;
  quantity: number; 
  unit: string; 
  name: string; 
  purchasePrice: number;
  purchaseUnit: string; 
  conversionFactor: number;
}

interface MarketItem {
  id: string;
  name: string;
  price: number;
  unit: string;
}

interface ParsedIngredient {
  name: string;
  quantity: number;
  unit:string;
}

interface SavedRecipe {
    id: string;
    name: string;
    ingredients: Ingredient[];
    sellingPrice: string;
    recipeYield: string;
    createdAt: string;
}


// From: services/storageService.ts
const MARKET_LIST_KEY = 'foodCostingMarketList';
const RECIPES_KEY = 'foodCostingRecipes';

const getMarketListFromStorage = (): MarketItem[] => {
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

const saveMarketListToStorage = (marketList: MarketItem[]): void => {
  try {
    const data = JSON.stringify(marketList);
    localStorage.setItem(MARKET_LIST_KEY, data);
  } catch (error) {
    console.error("Failed to save market list to localStorage", error);
  }
};

const getSavedRecipesFromStorage = (): SavedRecipe[] => {
    try {
        const rawData = localStorage.getItem(RECIPES_KEY);
        if (rawData) {
            return JSON.parse(rawData);
        }
    } catch (error) {
        console.error("Failed to parse recipes from localStorage", error);
    }
    return [];
};

const saveRecipesToStorage = (recipes: SavedRecipe[]): void => {
    try {
        const data = JSON.stringify(recipes);
        localStorage.setItem(RECIPES_KEY, data);
    } catch (error) {
        console.error("Failed to save recipes to localStorage", error);
    }
};

// From: components/Icons.tsx
type IconProps = {
  className?: string;
};

const AddIcon = ({ className }: IconProps): React.ReactNode => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
);

const TrashIcon = ({ className }: IconProps): React.ReactNode => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const PrintIcon = ({ className }: IconProps): React.ReactNode => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" />
  </svg>
);

const ResetIcon = ({ className }: IconProps): React.ReactNode => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M21 21v-5h-5" />
  </svg>
);

const PotIcon = ({ className }: IconProps): React.ReactNode => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 21h14" />
        <path d="M3 11h18" />
        <path d="M12 3a7 7 0 0 1 7 7v1H5v-1a7 7 0 0 1 7-7Z" />
        <path d="M7 11v10" />
        <path d="M17 11v10" />
    </svg>
);

const MarketIcon = ({ className }: IconProps): React.ReactNode => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
        <path d="M14 12v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4" />
        <path d="M18 12h-2.5" />
        <path d="M8.5 12H6" />
        <path d="M2 7h20" />
        <path d="m12 7 4 5-4 5-4-5Z" />
    </svg>
);

const ExcelIcon = ({ className }: IconProps): React.ReactNode => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <path d="M12 18h4"></path>
        <path d="M12 14h4"></path>
        <path d="M12 10h4"></path>
        <path d="M6 18h2"></path>
        <path d="M6 14h2"></path>
        <path d="M6 10h2"></path>
    </svg>
);

const DragHandleIcon = ({ className }: IconProps): React.ReactNode => (
    <svg viewBox="0 0 24 24" height="24" width="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="9" cy="12" r="1"></circle>
        <circle cx="9" cy="5" r="1"></circle>
        <circle cx="9" cy="19" r="1"></circle>
        <circle cx="15" cy="12" r="1"></circle>
        <circle cx="15" cy="5" r="1"></circle>
        <circle cx="15" cy="19" r="1"></circle>
    </svg>
);

const InfoIcon = ({ className }: IconProps): React.ReactNode => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 16v-4"></path>
        <path d="M12 8h.01"></path>
    </svg>
);

const WandIcon = ({ className }: IconProps): React.ReactNode => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" /><path d="M17.5 6.5 19 5" /><path d="m5 19 1-1" /><path d="M3 3 21 21" /><path d="M17.5 17.5 19 19" /><path d="m5 5 1 1" /><path d="m2 15 2 2" /><path d="M18 22l2-2" />
  </svg>
);

const CloseIcon = ({ className }: IconProps): React.ReactNode => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

const SpinnerIcon = ({ className }: IconProps): React.ReactNode => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${className} animate-spin`}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const SaveIcon = ({ className }: IconProps): React.ReactNode => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
);

const RecipeBookIcon = ({ className }: IconProps): React.ReactNode => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
);


// From: components/FormattedInput.tsx
interface FormattedInputProps {
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
  [x: string]: any; 
}

const FormattedInput = ({ value, onValueChange, className, ...rest }: FormattedInputProps): React.ReactNode => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(String(value));

  useEffect(() => {
    if (!isEditing) {
      setCurrentValue(String(value));
    }
  }, [value, isEditing]);

  const handleFocus = () => {
    setIsEditing(true);
    setCurrentValue(String(value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
        setCurrentValue(val);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const numericValue = parseFloat(currentValue) || 0;
    onValueChange(numericValue);
  };

  const displayValue = isEditing ? currentValue : value.toLocaleString('en-US');

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      {...rest}
    />
  );
};

// From: components/Tooltip.tsx
interface TooltipProps {
  children: React.ReactNode;
  text: string;
}

const TooltipContent = ({ text, coords }: { text: string; coords: { top: number; left: number } }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'none', 
      }}
      className="mb-3 w-max max-w-xs bg-gray-900 text-gray-200 text-sm rounded-lg shadow-xl p-3 z-50 ring-1 ring-gray-700 whitespace-pre-line text-left normal-case"
    >
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-900" />
    </div>
  );
};

const Tooltip = ({ children, text }: TooltipProps): React.ReactNode => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left + rect.width / 2,
      });
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };
  
  const trigger = (
    <span
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </span>
  );

  return (
    <>
      {trigger}
      {isVisible && createPortal(
        <TooltipContent text={text} coords={coords} />,
        document.body
      )}
    </>
  );
};


// From: components/RecipeImporter.tsx
interface RecipeImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (ingredients: ParsedIngredient[]) => void;
}

function RecipeImporter({ isOpen, onClose, onImport }: RecipeImporterProps): React.ReactNode {
  const [recipeText, setRecipeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRecipeText('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!recipeText.trim()) {
      setError('Please paste a recipe first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following recipe text and extract a list of all ingredients, including their quantities and units of measurement. \n\nRecipe:\n${recipeText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "A list of ingredients from the recipe.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "The name of the ingredient, e.g., 'all-purpose flour'." },
                quantity: { type: Type.NUMBER, description: "The quantity of the ingredient, e.g., 2.5." },
                unit: { type: Type.STRING, description: "The unit of measurement, e.g., 'cups', 'g', 'tsp', 'pc'." }
              },
              required: ["name", "quantity", "unit"]
            }
          }
        }
      });
      const parsedIngredients = JSON.parse(response.text);
      if (!parsedIngredients || parsedIngredients.length === 0) {
        throw new Error("The AI could not identify any ingredients. Please check your recipe text and try again.");
      }
      onImport(parsedIngredients);
      onClose();
    } catch (e) {
      console.error("Gemini API call failed:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to parse recipe. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  const modalContent = (
    <div 
      className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-importer-title"
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] ring-1 ring-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 id="recipe-importer-title" className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <WandIcon className="h-6 w-6 text-purple-400" />
            Import Recipe with AI
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white hover:bg-gray-700 rounded-full p-1 transition-colors" aria-label="Close modal">
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>
        <main className="p-6 flex-grow overflow-y-auto">
          <label htmlFor="recipe-text" className="block text-sm font-medium text-gray-400 mb-2">
            Paste your recipe below and the AI will extract the ingredients for you.
          </label>
          <textarea
            id="recipe-text"
            value={recipeText}
            onChange={(e) => setRecipeText(e.target.value)}
            className="w-full h-64 bg-gray-900 text-gray-300 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            placeholder="e.g.,&#10;For the cookies:&#10;2 1/4 cups all-purpose flour&#10;1 teaspoon baking soda&#10;1/2 teaspoon salt&#10;1 cup (2 sticks) unsalted butter, softened&#10;3/4 cup granulated sugar&#10;..."
            disabled={isLoading}
          ></textarea>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </main>
        <footer className="p-4 bg-gray-800/50 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 text-gray-200 hover:bg-gray-500 transition-colors font-medium text-sm" disabled={isLoading}>Cancel</button>
          <button onClick={handleGenerate} className="px-5 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed transition-colors font-semibold text-sm flex items-center justify-center gap-2 w-48" disabled={isLoading}>
            {isLoading ? (<><SpinnerIcon className="h-5 w-5" /> Parsing...</>) : ('Generate Ingredients')}
          </button>
        </footer>
      </div>
    </div>
  );
  return createPortal(modalContent, document.body);
}

// From: components/IngredientRow.tsx
interface IngredientRowProps {
  ingredient: Ingredient;
  onIngredientChange: (id: string, field: string, value: string | number) => void;
  onRemove: (id: string) => void;
  marketList: MarketItem[];
}

const unitOptions = ['g', 'kg', 'ml', 'liter', 'pc', 'pcs'];

function IngredientRow({ ingredient, onIngredientChange, onRemove, marketList }: IngredientRowProps): React.ReactNode {
  const [suggestions, setSuggestions] = useState<MarketItem[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLTableCellElement>(null);
  
  const unitCost = ingredient.conversionFactor > 0 ? ingredient.purchasePrice / ingredient.conversionFactor : 0;
  const extensionCost = unitCost * ingredient.quantity;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleInputChange = (field: string, value: string | number) => {
    onIngredientChange(ingredient.id, field, value);
    if (field === 'name' && typeof value === 'string') {
      if (value.length > 0) {
        setSuggestions(marketList.filter(item => item.name.toLowerCase().includes(value.toLowerCase())));
      } else {
        setSuggestions([]);
      }
    }
  };

  const handleSuggestionClick = (marketItem: MarketItem) => {
    onIngredientChange(ingredient.id, 'name', marketItem.name);
    setSuggestions([]);
    setIsFocused(false);
  };
  
  const commonInputClass = "w-full bg-transparent p-1 rounded focus:bg-gray-700 focus:ring-1 focus:ring-[#a1e540] outline-none text-right sm:text-left";
  const commonSelectClass = "w-full bg-gray-700/50 p-1 border border-transparent rounded focus:bg-gray-700 focus:ring-1 focus:ring-[#a1e540] outline-none text-right sm:text-left";

  return (
    <tr className="block sm:table-row border-b sm:border-b-0 border-gray-700 last:border-b-0 sm:hover:bg-gray-800/50 align-top">
      <td className="block sm:table-cell px-4 pt-4 pb-2 sm:p-2 align-middle">
        <div className="flex justify-between items-center">
            <label className="sm:hidden font-medium text-gray-400">QTY</label>
            <FormattedInput value={ingredient.quantity} onValueChange={(val) => handleInputChange('quantity', val)} className={commonInputClass} />
        </div>
      </td>
      <td className="block sm:table-cell px-4 py-2 sm:p-2 align-middle">
        <div className="flex justify-between items-center">
            <label className="sm:hidden font-medium text-gray-400">Unit</label>
            <select value={ingredient.unit} onChange={(e) => handleInputChange('unit', e.target.value)} className={commonSelectClass}>
                {unitOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
      </td>
      <td className="block sm:table-cell px-4 py-2 sm:p-2 align-middle relative" ref={wrapperRef}>
        <div className="flex justify-between items-center">
          <label className="sm:hidden font-medium text-gray-400">Ingredient</label>
          <input type="text" value={ingredient.name} onFocus={() => setIsFocused(true)} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Ingredient" className={`${commonInputClass} text-right sm:text-left`} autoComplete="off" />
        </div>
        {isFocused && suggestions.length > 0 && (
          <ul className="absolute z-20 w-full bg-gray-900 ring-1 ring-gray-700 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
            {suggestions.map(item => (
              <li key={item.id} className="px-3 py-2 cursor-pointer hover:bg-[#a1e540] hover:text-black" onMouseDown={() => handleSuggestionClick(item)}>
                <div className="flex justify-between items-center">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-gray-400">{`₱${item.price.toFixed(2)} / ${item.unit}`}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </td>
      <td className="block sm:table-cell px-4 py-2 sm:p-2 align-middle">
         <div className="flex justify-between items-center gap-2">
            <label className="sm:hidden font-medium text-gray-400">Purchase Price</label>
            <div className="flex items-center justify-end flex-grow">
                <span className="mr-1 text-gray-400">₱</span>
                <FormattedInput value={ingredient.purchasePrice} onValueChange={(val) => handleInputChange('purchasePrice', val)} className={`${commonInputClass} text-right`} />
                <span className="mx-1 text-gray-400">/</span>
                <select value={ingredient.purchaseUnit} onChange={(e) => handleInputChange('purchaseUnit', e.target.value)} className={`${commonSelectClass} w-20 text-right sm:text-left`}>
                    {unitOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            </div>
        </div>
      </td>
      <td className="block sm:table-cell px-4 py-2 sm:p-2 text-center align-middle">
        <div className="flex justify-between items-center">
            <label className="sm:hidden font-medium text-gray-400">Unit Conv.</label>
            <FormattedInput value={ingredient.conversionFactor} onValueChange={(val) => handleInputChange('conversionFactor', val > 0 ? val : 0)} className={`${commonInputClass} text-right sm:text-center`} title="How many recipe units are in one purchase unit? (e.g., 1000g in 1kg)" />
        </div>
      </td>
      <td className="block sm:table-cell px-4 py-2 sm:p-2 align-middle">
        <div className="flex justify-between items-center">
            <label className="sm:hidden font-medium text-gray-400">Unit Cost</label>
            <span title={`${unitCost}`} className="text-gray-400">₱{unitCost.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
        </div>
      </td>
      <td className="block sm:table-cell px-4 py-2 sm:p-2 align-middle">
        <div className="flex justify-between items-center">
            <label className="sm:hidden font-medium text-gray-400">Ext. Cost</label>
            <span className="font-medium text-gray-200">₱{extensionCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </td>
      <td className="block sm:table-cell px-4 pb-4 pt-2 sm:p-2 text-center align-middle">
        <button onClick={() => onRemove(ingredient.id)} className="w-full sm:w-auto text-gray-500 hover:text-red-500 p-2 rounded-md hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 border border-gray-700 sm:border-transparent">
            <TrashIcon className="h-5 w-5" />
            <span className="sm:hidden">Remove Ingredient</span>
        </button>
      </td>
    </tr>
  );
}

// From: components/MarketList.tsx
interface MarketListProps {
  marketList: MarketItem[];
  setMarketList: React.Dispatch<React.SetStateAction<MarketItem[]>>;
}

function MarketList({ marketList, setMarketList }: MarketListProps): React.ReactNode {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handlePriceChange = (id: string, newPrice: number) => {
    setMarketList(marketList.map(item => (item.id === id ? { ...item, price: newPrice } : item)));
  };
  
  const handleNameChange = (id: string, newName: string) => {
    setMarketList(marketList.map(item => (item.id === id ? { ...item, name: newName } : item)));
  };

  const handleUnitChange = (id: string, newUnit: string) => {
    setMarketList(marketList.map(item => (item.id === id ? { ...item, unit: newUnit } : item)));
  };

  const addNewItem = () => {
    const newItem: MarketItem = { id: new Date().getTime().toString(), name: 'New Item', price: 0, unit: 'kg' };
    setMarketList([...marketList, newItem]);
  };

  const removeItem = (id: string) => {
    setMarketList(marketList.filter(item => item.id !== id));
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    const item = marketList[index];
    dragItem.current = index;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'copyMove';
    e.dataTransfer.setData('application/json', JSON.stringify(item));
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggedIndex(null);
  };

  const handleDrop = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
        const newList = [...marketList];
        const draggedItemContent = newList.splice(dragItem.current, 1)[0];
        newList.splice(dragOverItem.current, 0, draggedItemContent);
        setMarketList(newList);
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <MarketIcon className="h-6 w-6 text-[#a1e540]" />
        <h3 className="text-xl font-semibold text-gray-100">Market List</h3>
      </div>
      <p className="text-sm text-gray-400 mb-4">Drag to reorder or drag an item to the Costing Matrix to add it. Changes are saved locally.</p>
      <div 
        className="space-y-3 max-h-[40vh] sm:max-h-[60vh] overflow-y-auto pr-2 flex-grow"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {marketList.map((item, index) => (
          <div key={item.id} className={`flex items-center flex-wrap gap-2 p-2 rounded-md transition-opacity ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
            draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd}>
            <span className="cursor-grab text-gray-500 hover:text-gray-300" title="Drag to reorder"><DragHandleIcon className="h-5 w-5" /></span>
            <input type="text" value={item.name} onChange={(e) => handleNameChange(item.id, e.target.value)} className="flex-grow bg-transparent p-1 -m-1 rounded focus:bg-gray-700 focus:ring-1 focus:ring-[#a1e540] outline-none font-medium min-w-[100px]" />
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-gray-400">₱</span>
              <input type="number" step="0.01" value={item.price} onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)} className="w-20 bg-transparent p-1 -m-1 rounded focus:bg-gray-700 focus:ring-1 focus:ring-[#a1e540] outline-none" />
              <span className="text-gray-400">/</span>
              <select value={item.unit} onChange={(e) => handleUnitChange(item.id, e.target.value)} className="bg-gray-700 border-gray-600 rounded p-1 text-sm focus:ring-1 focus:ring-[#a1e540] outline-none">
                {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <button onClick={() => removeItem(item.id)} className="text-gray-500 hover:text-red-500 p-1 rounded-full hover:bg-red-500/10 transition-colors"><TrashIcon className="h-5 w-5" /></button>
          </div>
        ))}
      </div>
       <button onClick={addNewItem} className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-700 text-gray-300 px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm font-medium">
          <AddIcon className="h-5 w-5" /> Add Market Item
       </button>
    </div>
  );
}

// From: components/Header.tsx
function Header(): React.ReactNode {
    return (
        <header className="bg-gray-800 shadow-md no-print">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center gap-3">
                    <PotIcon className="h-8 w-8 text-[#a1e540]" />
                    <h1 className="text-2xl font-bold text-gray-100 tracking-tight">JVN Food Costing Calculator</h1>
                </div>
            </div>
        </header>
    );
}

// From: components/CostingTable.tsx
declare var XLSX: any;

interface CostingTableProps {
  ingredients: Ingredient[];
  onIngredientChange: (id: string, field: string, value: string | number) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (id: string) => void;
  onReset: () => void;
  sellingPrice: string;
  onSellingPriceChange: (value: string) => void;
  marketList: MarketItem[];
  onAddIngredientFromMarket: (item: MarketItem) => void;
  recipeYield: string;
  onRecipeYieldChange: (value: string) => void;
  onImportIngredients: (ingredients: ParsedIngredient[]) => void;
  onSaveRecipe: () => void;
}

const columnDescriptions = {
  qty: 'The quantity of the ingredient needed for your recipe.',
  unit: 'The unit of measurement for the quantity (e.g., g, kg, pc).',
  ingredient: 'The name of the food item or ingredient.',
  purchasePrice: 'The price you paid for the ingredient and the unit you bought it in (e.g., ₱250 / kg).',
  unitConversion: `Unit Conversion translates the purchase unit (e.g., 'kg') into the recipe unit (e.g., 'g') to find the correct cost per portion.\n\nHOW IT WORKS:\nIt's the number of recipe units in one purchase unit.\n\nEXAMPLE:\nIf you buy 1 kg of flour and your recipe uses grams, the conversion factor is 1000 (since 1kg = 1000g).\nIf you buy a case of 24 sodas and your recipe uses 1 soda, the factor is 24.`,
  unitCost: `Unit Cost is the cost of a single recipe unit (e.g., cost per gram or per piece).\n\nFORMULA:\nUnit Cost = Purchase Price / Unit Conversion\n\nEXAMPLE:\nYou bought 1 kg of flour for ₱80 (conversion = 1000).\nUnit Cost = ₱80 / 1000 = ₱0.08 per gram.`,
  extCost: `Extension Cost is the total cost of an ingredient for the quantity you actually use in the recipe.\n\nFORMULA:\nExtension Cost = Quantity Used × Unit Cost\n\nEXAMPLE:\nYour recipe uses 500g of flour (unit cost = ₱0.08/g).\nExtension Cost = 500g × ₱0.08 = ₱40.00.`
};

const pricingMethodDescriptions = {
  costPercentage: `Calculates the selling price based on your desired food cost percentage.\n\nFORMULA:\nSelling Price = Grand Total / (Target Food Cost % / 100)\n\nEXAMPLE:\nIf total cost is ₱30 and you want a 30% food cost, the selling price is ₱30 / 0.30 = ₱100.`,
  factorPricing: `Calculates the selling price by multiplying the total cost by a pricing factor. This is a quick way to set prices.\n\nFORMULA:\nSelling Price = Grand Total × Pricing Factor\n\nEXAMPLE:\nIf total cost is ₱30 and your factor is 3.33, the selling price is ₱30 × 3.33 = ₱99.90. (A factor of 3.33 equals a ~30% food cost).`,
}

function CostingTable({ ingredients, onIngredientChange, onAddIngredient, onRemoveIngredient, onReset, sellingPrice, onSellingPriceChange, marketList, onAddIngredientFromMarket, recipeYield, onRecipeYieldChange, onImportIngredients, onSaveRecipe }: CostingTableProps): React.ReactNode {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [pricingMethod, setPricingMethod] = useState<'costPercentage' | 'factorPricing'>('costPercentage');

  const grandTotal = useMemo(() => ingredients.reduce((total, ing) => {
    if (!ing.name || ing.quantity <= 0 || ing.purchasePrice <= 0 || ing.conversionFactor <= 0) return total;
    const unitCost = ing.purchasePrice / ing.conversionFactor;
    return total + (unitCost * ing.quantity);
  }, 0), [ingredients]);

  const sellingPriceNum = parseFloat(sellingPrice) || 0;
  const recipeYieldNum = parseFloat(recipeYield) || 1;

  const costPerServing = useMemo(() => recipeYieldNum <= 0 ? 0 : grandTotal / recipeYieldNum, [grandTotal, recipeYieldNum]);
  const resultingFoodCostPercentage = useMemo(() => sellingPriceNum > 0 ? (grandTotal / sellingPriceNum) * 100 : 0, [grandTotal, sellingPriceNum]);
  const pricingFactor = useMemo(() => (grandTotal <= 0 || sellingPriceNum <= 0) ? 0 : sellingPriceNum / grandTotal, [grandTotal, sellingPriceNum]);

  const handleFoodCostChange = (newPercentage: number) => {
    if (newPercentage > 0 && grandTotal > 0) onSellingPriceChange(String(grandTotal / (newPercentage / 100)));
  };
  
  const handlePricingFactorChange = (newFactor: number) => {
    if (newFactor > 0 && grandTotal > 0) onSellingPriceChange(String(grandTotal * newFactor));
  };

  const handlePrint = () => window.print();
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('application/json')) {
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }
  };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const data = e.dataTransfer.getData('application/json');
    if (data) onAddIngredientFromMarket(JSON.parse(data) as MarketItem);
  };
  
  const handleExportExcel = () => {
    const headers = ['QTY', 'UNIT', 'INGREDIENT', 'PURCHASE PRICE', 'UNIT CONVERSION', 'UNIT COST (₱)', 'EXTENSION COST (₱)'];
    const data = ingredients.map(ing => {
      if (!ing.name) return null;
      const unitCost = ing.conversionFactor > 0 ? ing.purchasePrice / ing.conversionFactor : 0;
      return [ing.quantity, ing.unit, ing.name, `₱${ing.purchasePrice.toFixed(2)} / ${ing.purchaseUnit}`, ing.conversionFactor, unitCost, unitCost * ing.quantity];
    }).filter(row => row !== null);

    const summary = [[],
      ['', '', '', '', '', 'Grand Total:', grandTotal],
      ['', '', '', '', '', 'Yield (Servings):', recipeYieldNum],
      ['', '', '', '', '', 'Cost per Serving:', costPerServing],
    ];
    
    if (pricingMethod === 'costPercentage') {
        summary.push(['', '', '', '', '', 'Pricing Method:', 'Cost Percentage'], ['', '', '', '', '', 'Target Food Cost %:', resultingFoodCostPercentage / 100]);
    } else {
        summary.push(['', '', '', '', '', 'Pricing Method:', 'Factor Pricing'], ['', '', '', '', '', 'Pricing Factor:', pricingFactor]);
    }
    
    summary.push(['', '', '', '', '', 'Recipe Selling Price:', sellingPriceNum], ['', '', '', '', '', 'Final Food Cost %:', resultingFoodCostPercentage / 100]);
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data, ...summary]);
    ws['!cols'] = [ { wch: 10 }, { wch: 8 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 18 } ];

    const numberFormat = '#,##0.00', integerFormat = '#,##0', currencyFormat = `"₱"#,##0.00`, currencyFormat4DP = `"₱"#,##0.0000`, percentageFormat = '0.00%';
    for(let i = 2; i <= data.length + 1; i++) {
        if(ws[`A${i}`]) ws[`A${i}`].z = numberFormat;
        if(ws[`E${i}`]) ws[`E${i}`].z = integerFormat;
        if(ws[`F${i}`]) ws[`F${i}`].z = currencyFormat4DP;
        if(ws[`G${i}`]) ws[`G${i}`].z = currencyFormat;
    }
    const summaryStartRow = data.length + 3;
    ws[`G${summaryStartRow}`].z = currencyFormat;
    ws[`G${summaryStartRow + 1}`].z = integerFormat;
    ws[`G${summaryStartRow + 2}`].z = currencyFormat;
    ws[`G${summaryStartRow + 4}`].z = (pricingMethod === 'costPercentage') ? percentageFormat : numberFormat;
    ws[`G${summaryStartRow + 5}`].z = currencyFormat;
    ws[`G${summaryStartRow + 6}`].z = percentageFormat;

    XLSX.writeFile(XLSX.utils.book_new(), ws, 'FoodCosting.xlsx');
  };

  return (
    <>
      <div className={`bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg transition-all duration-300 ${isDragOver ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-[#a1e540]' : ''}`} onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-100">Costing Matrix</h2>
          <div className="flex gap-2 no-print flex-wrap">
            <button onClick={() => setIsImporterOpen(true)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-bold"><WandIcon className="h-5 w-5" /> Import Recipe</button>
            <button onClick={onAddIngredient} className="flex items-center gap-2 bg-[#a1e540] text-black px-4 py-2 rounded-md hover:bg-[#8fcc38] transition-colors text-sm font-bold"><AddIcon className="h-5 w-5" /> Add Ingredient</button>
            <button onClick={onSaveRecipe} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"><SaveIcon className="h-5 w-5" /> Save</button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 bg-transparent border border-[#a1e540] text-[#a1e540] px-4 py-2 rounded-md hover:bg-[#a1e540] hover:text-black transition-colors text-sm font-medium"><ExcelIcon className="h-5 w-5" /> Export</button>
            <button onClick={onReset} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"><ResetIcon className="h-5 w-5" /> Reset</button>
            <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-700 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"><PrintIcon className="h-5 w-5" /> Print</button>
          </div>
        </div>
        <div className="overflow-x-auto print-table">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-900/60 hidden sm:table-header-group">
              <tr>
                <th scope="col" className="px-2 py-3"><Tooltip text={columnDescriptions.qty}><span className="border-b border-dotted border-gray-500 cursor-help">QTY</span></Tooltip></th>
                <th scope="col" className="px-2 py-3"><Tooltip text={columnDescriptions.unit}><span className="border-b border-dotted border-gray-500 cursor-help">UNIT</span></Tooltip></th>
                <th scope="col" className="px-2 py-3 w-1/4"><Tooltip text={columnDescriptions.ingredient}><span className="border-b border-dotted border-gray-500 cursor-help">Ingredient</span></Tooltip></th>
                <th scope="col" className="px-2 py-3"><Tooltip text={columnDescriptions.purchasePrice}><span className="border-b border-dotted border-gray-500 cursor-help">Purchase Price</span></Tooltip></th>
                <th scope="col" className="px-2 py-3 text-center"><Tooltip text={columnDescriptions.unitConversion}><span className="border-b border-dotted border-gray-500 cursor-help">Unit Conv.</span></Tooltip></th>
                <th scope="col" className="px-2 py-3"><Tooltip text={columnDescriptions.unitCost}><span className="border-b border-dotted border-gray-500 cursor-help">Unit Cost</span></Tooltip></th>
                <th scope="col" className="px-2 py-3"><Tooltip text={columnDescriptions.extCost}><span className="border-b border-dotted border-gray-500 cursor-help">Ext. Cost</span></Tooltip></th>
                <th scope="col" className="px-1 py-3 w-12 no-print"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 sm:divide-y-0">
              {ingredients.map((ingredient) => <IngredientRow key={ingredient.id} ingredient={ingredient} onIngredientChange={onIngredientChange} onRemove={onRemoveIngredient} marketList={marketList} />)}
            </tbody>
          </table>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="w-full lg:w-1/2">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Pricing & Yield</h3>
              <div className="w-full space-y-4 bg-gray-900/50 p-4 rounded-lg">
                  <div className="flex flex-col gap-1">
                      <label htmlFor="recipeYield" className="text-sm font-medium text-gray-400">Yield (No. of Servings)</label>
                      <FormattedInput value={recipeYieldNum} onValueChange={(val) => onRecipeYieldChange(String(val > 0 ? val : 1))} id="recipeYield" className="no-print p-2 bg-gray-700 border border-gray-600 rounded-md w-full focus:ring-2 focus:ring-[#a1e540] focus:border-[#a1e540] text-white" placeholder="e.g., 8" />
                  </div>
                  <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-400">Pricing Method</label>
                      <div className="flex rounded-md bg-gray-700 p-1 text-sm">
                          <button onClick={() => setPricingMethod('costPercentage')} className={`flex-1 p-1 rounded-md transition-colors relative ${pricingMethod === 'costPercentage' ? 'bg-[#a1e540] text-black font-semibold' : 'hover:bg-gray-600/50'}`}>Cost Percentage<Tooltip text={pricingMethodDescriptions.costPercentage}><span className="absolute top-0 right-1 text-gray-500 hover:text-gray-200"><InfoIcon className="h-4 w-4" /></span></Tooltip></button>
                          <button onClick={() => setPricingMethod('factorPricing')} className={`flex-1 p-1 rounded-md transition-colors relative ${pricingMethod === 'factorPricing' ? 'bg-[#a1e540] text-black font-semibold' : 'hover:bg-gray-600/50'}`}>Factor Pricing<Tooltip text={pricingMethodDescriptions.factorPricing}><span className="absolute top-0 right-1 text-gray-500 hover:text-gray-200"><InfoIcon className="h-4 w-4" /></span></Tooltip></button>
                      </div>
                  </div>
                  {pricingMethod === 'costPercentage' ? (
                      <div className="flex flex-col gap-1">
                          <label htmlFor="foodCostTarget" className="text-sm font-medium text-gray-400">Target Food Cost (%)</label>
                          <FormattedInput value={resultingFoodCostPercentage} onValueChange={handleFoodCostChange} id="foodCostTarget" className="no-print p-2 bg-gray-700 border border-gray-600 rounded-md w-full focus:ring-2 focus:ring-[#a1e540] focus:border-[#a1e540] text-white" placeholder="e.g., 30" />
                      </div>
                  ) : (
                      <div className="flex flex-col gap-1">
                          <label htmlFor="pricingFactor" className="text-sm font-medium text-gray-400">Pricing Factor</label>
                          <FormattedInput value={pricingFactor} onValueChange={handlePricingFactorChange} id="pricingFactor" className="no-print p-2 bg-gray-700 border border-gray-600 rounded-md w-full focus:ring-2 focus:ring-[#a1e540] focus:border-[#a1e540] text-white" placeholder="e.g., 3.33" />
                      </div>
                  )}
                  <div className="flex flex-col gap-1">
                      <label htmlFor="sellingPrice" className="text-sm font-medium text-gray-400">Recipe Selling Price (₱)</label>
                      <FormattedInput value={sellingPriceNum} onValueChange={(val) => onSellingPriceChange(String(val))} id="sellingPrice" className="no-print p-2 bg-gray-700 border border-gray-600 rounded-md w-full focus:ring-2 focus:ring-[#a1e540] focus:border-[#a1e540] text-white" placeholder="e.g., 1500.00" />
                  </div>
              </div>
          </div>
          <div className="w-full lg:w-1/2">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Cost Summary</h3>
              <div className="w-full space-y-3 bg-gray-900/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-lg">
                      <span className="text-gray-400">Grand Total:</span>
                      <span className="font-bold text-gray-50 text-xl">₱{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                      <span className="text-gray-400">Cost per Serving:</span>
                      <span className="font-bold text-yellow-400 text-xl">₱{costPerServing.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <hr className="border-gray-700 my-1"/>
                  <div className="flex justify-between items-center text-lg pt-2">
                      <span className="text-gray-400">Final Food Cost %:</span>
                      <span className={`font-bold text-xl ${resultingFoodCostPercentage > 40 ? 'text-red-500' : 'text-[#a1e540]'}`}>{resultingFoodCostPercentage.toFixed(2)}%</span>
                  </div>
              </div>
          </div>
        </div>
      </div>
      <RecipeImporter isOpen={isImporterOpen} onClose={() => setIsImporterOpen(false)} onImport={onImportIngredients} />
    </>
  );
}

// ** NEW COMPONENT **
const Tabs = ({ tabs, activeTab, setActiveTab }) => {
    return (
        <div className="flex border-b border-gray-700 flex-shrink-0">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors w-1/2 justify-center
                        ${activeTab === tab.id
                            ? 'border-b-2 border-[#a1e540] text-white'
                            : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                        }`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

// ** NEW COMPONENT **
interface RecipeManagerProps {
    recipes: SavedRecipe[];
    currentRecipeId: string | null;
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
}

function RecipeManager({ recipes, currentRecipeId, onLoad, onDelete }: RecipeManagerProps) {
    return (
        <div className="p-4 sm:p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <RecipeBookIcon className="h-6 w-6 text-[#a1e540]" />
                <h3 className="text-xl font-semibold text-gray-100">My Recipes</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
                Load a previously saved recipe or delete ones you no longer need.
            </p>
            <div className="space-y-3 max-h-[40vh] sm:max-h-[60vh] overflow-y-auto pr-2 flex-grow">
                {recipes.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        <p>No saved recipes yet.</p>
                        <p className="text-xs mt-1">Click the "Save" button in the Costing Matrix to get started.</p>
                    </div>
                ) : (
                    [...recipes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(recipe => (
                        <div key={recipe.id} className={`flex items-center gap-2 p-3 rounded-md transition-colors ${currentRecipeId === recipe.id ? 'bg-blue-900/50 ring-1 ring-blue-500' : 'bg-gray-900/50'}`}>
                            <div className="flex-grow">
                                <p className="font-medium text-gray-200">{recipe.name}</p>
                                <p className="text-xs text-gray-500">Saved: {new Date(recipe.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onLoad(recipe.id)}
                                    className="px-3 py-1 text-sm rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
                                    title="Load this recipe"
                                >
                                    Load
                                </button>
                                <button
                                    onClick={() => onDelete(recipe.id)}
                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                                    title="Delete this recipe"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}


// From: App.tsx
const getConversionFactor = (purchaseUnit: string, recipeUnit: string): number => {
    const pUnit = purchaseUnit.toLowerCase();
    const rUnit = recipeUnit.toLowerCase();
    const pieceUnits = ['pc', 'pcs', 'piece', 'pieces'];
    if (pieceUnits.includes(pUnit) && pieceUnits.includes(rUnit)) return 1;
    const massUnits = ['kg', 'g'], volumeUnits = ['liter', 'ml'];
    if (!((massUnits.includes(pUnit) && massUnits.includes(rUnit)) || (volumeUnits.includes(pUnit) && volumeUnits.includes(rUnit)))) return 1;
    const baseUnits: { [key: string]: number } = { kg: 1000, g: 1, liter: 1000, ml: 1 };
    return (baseUnits[pUnit] || 1) / (baseUnits[rUnit] || 1);
};

function App(): React.ReactNode {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [marketList, setMarketList] = useState<MarketItem[]>(getMarketListFromStorage());
  const [sellingPrice, setSellingPrice] = useState<string>('0');
  const [recipeYield, setRecipeYield] = useState<string>('1');
  
  // New state for recipe management
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>(getSavedRecipesFromStorage());
  const [currentRecipeId, setCurrentRecipeId] = useState<string | null>(null);
  const [activeRightPanelTab, setActiveRightPanelTab] = useState('market');

  useEffect(() => { resetTable(); }, []); // Load with an empty table on first mount
  useEffect(() => { saveMarketListToStorage(marketList); }, [marketList]);
  useEffect(() => { saveRecipesToStorage(savedRecipes); }, [savedRecipes]);

  useEffect(() => {
    if(!currentRecipeId) {
        setIngredients(prevIngredients => {
          const marketListMap = new Map(marketList.map(item => [item.name.trim().toLowerCase(), item]));
          const newIngredients = prevIngredients.map(ing => {
            const marketItem = ing.name ? marketListMap.get(ing.name.trim().toLowerCase()) : undefined;
            if (marketItem && (ing.purchasePrice !== marketItem.price || ing.purchaseUnit !== marketItem.unit)) {
              return { ...ing, purchasePrice: marketItem.price, purchaseUnit: marketItem.unit, conversionFactor: getConversionFactor(marketItem.unit, ing.unit) };
            }
            return ing;
          });
          return newIngredients.some((ing, i) => JSON.stringify(ing) !== JSON.stringify(prevIngredients[i])) ? newIngredients : prevIngredients;
        });
    }
  }, [marketList, currentRecipeId]);

  const handleIngredientChange = (id: string, field: string, value: string | number) => {
    setIngredients(prev => prev.map(ing => {
        if (ing.id !== id) return ing;
        const updatedIng = { ...ing, [field]: value };
        if (field === 'name') {
            const marketItem = marketList.find(item => item.name.trim().toLowerCase() === String(value).trim().toLowerCase());
            if (marketItem) {
                updatedIng.purchasePrice = marketItem.price;
                updatedIng.purchaseUnit = marketItem.unit;
                updatedIng.conversionFactor = getConversionFactor(marketItem.unit, updatedIng.unit);
            }
        } else if (field === 'unit' || field === 'purchaseUnit') {
            updatedIng.conversionFactor = getConversionFactor(field === 'purchaseUnit' ? String(value) : updatedIng.purchaseUnit, field === 'unit' ? String(value) : updatedIng.unit);
        }
        return updatedIng;
    }));
  };
  
  const handleImportedIngredients = (parsedIngredients: ParsedIngredient[]) => {
    const marketListMap = new Map(marketList.map(item => [item.name.trim().toLowerCase(), item]));
    const newIngredients: Ingredient[] = parsedIngredients.map((pIng, index) => {
        const name = pIng.name || 'Untitled Ingredient', unit = (pIng.unit || 'pc').toLowerCase();
        const marketItem = marketListMap.get(name.trim().toLowerCase());
        const purchaseUnit = marketItem?.unit || 'kg';
        const normalizedRecipeUnit = ['piece', 'pieces', 'pcs.'].includes(unit) ? 'pc' : unit;
        return {
            id: `${new Date().getTime()}-${index}`, name, quantity: pIng.quantity || 1, unit: normalizedRecipeUnit,
            purchasePrice: marketItem?.price || 0, purchaseUnit, conversionFactor: getConversionFactor(purchaseUnit, normalizedRecipeUnit),
        };
    });
    if (newIngredients.length > 0) {
        setIngredients(newIngredients);
        setCurrentRecipeId(null); // Imported recipe is a new, unsaved recipe
    }
    else console.warn("AI parsing resulted in an empty ingredient list.");
  };

  const addIngredient = () => setIngredients([...ingredients, { id: new Date().getTime().toString(), name: '', quantity: 1, unit: 'g', purchasePrice: 0, purchaseUnit: 'kg', conversionFactor: 1000 }]);
  
  const addIngredientFromMarket = (marketItem: MarketItem) => {
    const isPieceBased = ['pc', 'pcs'].includes(marketItem.unit.toLowerCase());
    const recipeUnit = isPieceBased ? 'pc' : 'g';
    const newIngredient: Ingredient = {
      id: new Date().getTime().toString(), name: marketItem.name, unit: recipeUnit, quantity: 1,
      purchasePrice: marketItem.price, purchaseUnit: marketItem.unit, conversionFactor: getConversionFactor(marketItem.unit, recipeUnit),
    };
    setIngredients(prev => {
      const emptyIdx = prev.findIndex(ing => !ing.name.trim() && ing.purchasePrice === 0);
      if (emptyIdx !== -1) {
        const newList = [...prev];
        newList[emptyIdx] = newIngredient;
        return newList;
      }
      return [...prev, newIngredient];
    });
  };

  const removeIngredient = (id: string) => setIngredients(ingredients.filter(ing => ing.id !== id));
  
  const resetTable = () => {
     setIngredients([{ id: new Date().getTime().toString(), name: '', quantity: 1, unit: 'g', purchasePrice: 0, purchaseUnit: 'kg', conversionFactor: 1000 }]);
     setSellingPrice('0');
     setRecipeYield('1');
     setCurrentRecipeId(null);
  };

  const handleSaveRecipe = () => {
    const existingRecipe = currentRecipeId ? savedRecipes.find(r => r.id === currentRecipeId) : null;
    const recipeName = prompt("Enter a name for this recipe:", existingRecipe?.name || "");

    if (recipeName) {
        if(existingRecipe) { // Update existing recipe
            const updatedRecipes = savedRecipes.map(r => r.id === currentRecipeId ? {
                ...r,
                name: recipeName,
                ingredients: ingredients,
                sellingPrice: sellingPrice,
                recipeYield: recipeYield,
                createdAt: new Date().toISOString()
            } : r);
            setSavedRecipes(updatedRecipes);
        } else { // Save new recipe
            const newRecipe: SavedRecipe = {
                id: new Date().getTime().toString(),
                name: recipeName,
                ingredients: ingredients,
                sellingPrice: sellingPrice,
                recipeYield: recipeYield,
                createdAt: new Date().toISOString()
            };
            setSavedRecipes([...savedRecipes, newRecipe]);
            setCurrentRecipeId(newRecipe.id);
        }
    }
  };

  const handleLoadRecipe = (id: string) => {
    const recipeToLoad = savedRecipes.find(r => r.id === id);
    if (recipeToLoad) {
        setIngredients(recipeToLoad.ingredients);
        setSellingPrice(recipeToLoad.sellingPrice);
        setRecipeYield(recipeToLoad.recipeYield);
        setCurrentRecipeId(recipeToLoad.id);
    }
  };

  const handleDeleteRecipe = (id: string) => {
    if (confirm("Are you sure you want to delete this recipe?")) {
        setSavedRecipes(savedRecipes.filter(r => r.id !== id));
        if (currentRecipeId === id) {
            resetTable();
        }
    }
  };
  
  const rightPanelTabs = [
    { id: 'market', label: 'Market List', icon: <MarketIcon className="h-5 w-5" /> },
    { id: 'recipes', label: 'My Recipes', icon: <RecipeBookIcon className="h-5 w-5" /> }
  ];

  return (
    <div className="bg-gray-900 min-h-screen font-sans text-gray-300">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-grow lg:w-2/3 printable-area">
             <CostingTable ingredients={ingredients} onIngredientChange={handleIngredientChange} onAddIngredient={addIngredient} onRemoveIngredient={removeIngredient} onReset={resetTable} sellingPrice={sellingPrice} onSellingPriceChange={setSellingPrice} marketList={marketList} onAddIngredientFromMarket={addIngredientFromMarket} recipeYield={recipeYield} onRecipeYieldChange={setRecipeYield} onImportIngredients={handleImportedIngredients} onSaveRecipe={handleSaveRecipe}/>
          </div>
          <div className="lg:w-1/3 no-print">
            <div className="bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
                <Tabs tabs={rightPanelTabs} activeTab={activeRightPanelTab} setActiveTab={setActiveRightPanelTab} />
                <div className="flex-grow">
                    {activeRightPanelTab === 'market' && <MarketList marketList={marketList} setMarketList={setMarketList} />}
                    {activeRightPanelTab === 'recipes' && <RecipeManager recipes={savedRecipes} currentRecipeId={currentRecipeId} onLoad={handleLoadRecipe} onDelete={handleDeleteRecipe} />}
                </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center py-6 text-gray-500 text-sm no-print">All rights reserved for Jovan Y.</footer>
    </div>
  );
}

// From: index.tsx (entry point)
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
