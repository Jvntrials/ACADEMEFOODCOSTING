import React, { useState, useEffect, useRef } from 'react';
import { Ingredient, MarketItem } from '../types.ts';
import { TrashIcon } from './Icons.tsx';
import { FormattedInput } from './FormattedInput.tsx';

interface IngredientRowProps {
  ingredient: Ingredient;
  onIngredientChange: (id: string, field: keyof Ingredient, value: string | number) => void;
  onRemove: (id: string) => void;
  marketList: MarketItem[];
}

const unitOptions = ['g', 'kg', 'ml', 'liter', 'pc', 'pcs'];

export function IngredientRow({ ingredient, onIngredientChange, onRemove, marketList }: IngredientRowProps): React.ReactNode {
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
  
  const handleInputChange = (field: keyof Ingredient, value: string | number) => {
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
      {/* QTY */}
      <td className="block sm:table-cell px-4 pt-4 pb-2 sm:p-2 align-middle">
        <div className="flex justify-between items-center">
            <label className="sm:hidden font-medium text-gray-400">QTY</label>
            <FormattedInput 
                value={ingredient.quantity} 
                onValueChange={(val) => handleInputChange('quantity', val)} 
                className={commonInputClass} 
            />
        </div>
      </td>
      {/* UNIT */}
      <td className="block sm:table-cell px-4 py-2 sm:p-2 align-middle">
        <div className="flex justify-between items-center">
            <label className="sm:hidden font-medium text-gray-400">Unit</label>
            <select value={ingredient.unit} onChange={(e) => handleInputChange('unit', e.target.value)} className={commonSelectClass}>
                {unitOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
      </td>
      {/* INGREDIENT */}
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
      {/* PURCHASE PRICE */}
      <td className="block sm:table-cell px-4 py-2 sm:p-2 align-middle">
         <div className="flex justify-between items-center gap-2">
            <label className="sm:hidden font-medium text-gray-400">Purchase Price</label>
            <div className="flex items-center justify-end flex-grow">
                <span className="mr-1 text-gray-400">₱</span>
                <FormattedInput 
                    value={ingredient.purchasePrice} 
                    onValueChange={(val) => handleInputChange('purchasePrice', val)} 
                    className={`${commonInputClass} text-right`} 
                />
                <span className="mx-1 text-gray-400">/</span>
                <select value={ingredient.purchaseUnit} onChange={(e) => handleInputChange('purchaseUnit', e.target.value)} className={`${commonSelectClass} w-20 text-right sm:text-left`}>
                    {unitOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            </div>
        </div>
      </td>
      {/* UNIT CONVERSION */}
      <td className="block sm:table-cell px-4 py-2 sm:p-2 text-center align-middle">
        <div className="flex justify-between items-center">
            <label className="sm:hidden font-medium text-gray-400">Unit Conv.</label>
            <FormattedInput
              value={ingredient.conversionFactor}
              onValueChange={(val) => handleInputChange('conversionFactor', val > 0 ? val : 0)}
              className={`${commonInputClass} text-right sm:text-center`}
              title="How many recipe units are in one purchase unit? (e.g., 1000g in 1kg)"
            />
        </div>
      </td>
      {/* UNIT COST */}
      <td className="block sm:table-cell px-4 py-2 sm:p-2 align-middle">
        <div className="flex justify-between items-center">
            <label className="sm:hidden font-medium text-gray-400">Unit Cost</label>
            <span title={`${unitCost}`} className="text-gray-400">₱{unitCost.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
        </div>
      </td>
      {/* EXTENSION COST */}
      <td className="block sm:table-cell px-4 py-2 sm:p-2 align-middle">
        <div className="flex justify-between items-center">
            <label className="sm:hidden font-medium text-gray-400">Ext. Cost</label>
            <span className="font-medium text-gray-200">₱{extensionCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </td>
      {/* REMOVE BUTTON */}
      <td className="block sm:table-cell px-4 pb-4 pt-2 sm:p-2 text-center align-middle">
        <button onClick={() => onRemove(ingredient.id)} className="w-full sm:w-auto text-gray-500 hover:text-red-500 p-2 rounded-md hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 border border-gray-700 sm:border-transparent">
            <TrashIcon className="h-5 w-5" />
            <span className="sm:hidden">Remove Ingredient</span>
        </button>
      </td>
    </tr>
  );
}
