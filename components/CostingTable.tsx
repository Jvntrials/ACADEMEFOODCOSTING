import React, { useState, useMemo } from 'react';
import { Ingredient, MarketItem, ParsedIngredient } from '../types.ts';
import { IngredientRow } from './IngredientRow.tsx';
import { AddIcon, PrintIcon, ResetIcon, ExcelIcon, InfoIcon, WandIcon } from './Icons.tsx';
import { FormattedInput } from './FormattedInput.tsx';
import { Tooltip } from './Tooltip.tsx';
import { RecipeImporter } from './RecipeImporter.tsx';

interface CostingTableProps {
  ingredients: Ingredient[];
  onIngredientChange: (id: string, field: keyof Ingredient, value: string | number) => void;
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
}

declare var XLSX: any;

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


export function CostingTable({
  ingredients,
  onIngredientChange,
  onAddIngredient,
  onRemoveIngredient,
  onReset,
  sellingPrice,
  onSellingPriceChange,
  marketList,
  onAddIngredientFromMarket,
  recipeYield,
  onRecipeYieldChange,
  onImportIngredients,
}: CostingTableProps): React.ReactNode {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [pricingMethod, setPricingMethod] = useState<'costPercentage' | 'factorPricing'>('costPercentage');

  const grandTotal = useMemo(() => {
    return ingredients.reduce((total, ing) => {
        if (!ing.name || ing.quantity <= 0 || ing.purchasePrice <= 0 || ing.conversionFactor <= 0) {
            return total;
        }
        const unitCost = ing.purchasePrice / ing.conversionFactor;
        const extensionCost = unitCost * ing.quantity;
        return total + extensionCost;
    }, 0);
  }, [ingredients]);

  const sellingPriceNum = parseFloat(sellingPrice) || 0;
  const recipeYieldNum = parseFloat(recipeYield) || 1;

  const costPerServing = useMemo(() => {
    if (recipeYieldNum <= 0) return 0;
    return grandTotal / recipeYieldNum;
  }, [grandTotal, recipeYieldNum]);
  
  const resultingFoodCostPercentage = useMemo(() => {
    return sellingPriceNum > 0 ? (grandTotal / sellingPriceNum) * 100 : 0;
  }, [grandTotal, sellingPriceNum]);
  
  const pricingFactor = useMemo(() => {
    if (grandTotal <= 0 || sellingPriceNum <= 0) return 0;
    return sellingPriceNum / grandTotal;
  }, [grandTotal, sellingPriceNum]);


  const handleFoodCostChange = (newPercentage: number) => {
    if (newPercentage > 0 && grandTotal > 0) {
        const newSellingPrice = grandTotal / (newPercentage / 100);
        onSellingPriceChange(String(newSellingPrice));
    }
  };
  
  const handlePricingFactorChange = (newFactor: number) => {
    if (newFactor > 0 && grandTotal > 0) {
        const newSellingPrice = grandTotal * newFactor;
        onSellingPriceChange(String(newSellingPrice));
    }
  };

  const handlePrint = () => { window.print(); };
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
    if (data) {
      const marketItem = JSON.parse(data) as MarketItem;
      onAddIngredientFromMarket(marketItem);
    }
  };
  
  const handleExportExcel = () => {
    const headers = ['QTY', 'UNIT', 'INGREDIENT', 'PURCHASE PRICE', 'UNIT CONVERSION', 'UNIT COST (₱)', 'EXTENSION COST (₱)'];
    
    const data = ingredients.map(ing => {
      if (!ing.name) return null;
      
      const unitCost = ing.conversionFactor > 0 ? ing.purchasePrice / ing.conversionFactor : 0;
      const extensionCost = unitCost * ing.quantity;
      const purchasePriceFormatted = `₱${ing.purchasePrice.toFixed(2)} / ${ing.purchaseUnit}`;

      return [
        ing.quantity, ing.unit, ing.name, purchasePriceFormatted,
        ing.conversionFactor, 
        unitCost, extensionCost
      ];
    }).filter(row => row !== null);

    const summary = [
      [],
      ['', '', '', '', '', 'Grand Total:', grandTotal],
      ['', '', '', '', '', 'Yield (Servings):', recipeYieldNum],
      ['', '', '', '', '', 'Cost per Serving:', costPerServing],
    ];
    
    if (pricingMethod === 'costPercentage') {
        summary.push(['', '', '', '', '', 'Pricing Method:', 'Cost Percentage']);
        summary.push(['', '', '', '', '', 'Target Food Cost %:', resultingFoodCostPercentage / 100]);
    } else {
        summary.push(['', '', '', '', '', 'Pricing Method:', 'Factor Pricing']);
        summary.push(['', '', '', '', '', 'Pricing Factor:', pricingFactor]);
    }
    
    summary.push(['', '', '', '', '', 'Recipe Selling Price:', sellingPriceNum]);
    summary.push(['', '', '', '', '', 'Final Food Cost %:', resultingFoodCostPercentage / 100]);
    
    const worksheetData = [headers, ...data, ...summary];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws['!cols'] = [ { wch: 10 }, { wch: 8 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 18 } ];

    const numberFormat = '#,##0.00';
    const integerFormat = '#,##0';
    const currencyFormat = `"₱"#,##0.00`;
    const currencyFormat4DP = `"₱"#,##0.0000`;
    const percentageFormat = '0.00%';

    for(let i = 2; i <= data.length + 1; i++) {
        if(ws[`A${i}`]) ws[`A${i}`].z = numberFormat; // QTY
        if(ws[`E${i}`]) ws[`E${i}`].z = integerFormat; // Unit Conv
        if(ws[`F${i}`]) ws[`F${i}`].z = currencyFormat4DP; // Unit Cost
        if(ws[`G${i}`]) ws[`G${i}`].z = currencyFormat; // Ext. Cost
    }
    // Summary formats
    const summaryStartRow = data.length + 3;
    ws[`G${summaryStartRow}`].z = currencyFormat; // Grand Total
    ws[`G${summaryStartRow + 1}`].z = integerFormat; // Yield
    ws[`G${summaryStartRow + 2}`].z = currencyFormat; // Cost per Serving
    if (pricingMethod === 'costPercentage') {
        ws[`G${summaryStartRow + 4}`].z = percentageFormat;
    } else {
        ws[`G${summaryStartRow + 4}`].z = numberFormat;
    }
    ws[`G${summaryStartRow + 5}`].z = currencyFormat; // Selling Price
    ws[`G${summaryStartRow + 6}`].z = percentageFormat; // Final Food Cost %

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Food Costing');
    XLSX.writeFile(wb, 'FoodCosting.xlsx');
  };

  return (
    <>
      <div 
        className={`bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg transition-all duration-300 ${isDragOver ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-[#a1e540]' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-100">Costing Matrix</h2>
          <div className="flex gap-2 no-print flex-wrap">
            <button onClick={() => setIsImporterOpen(true)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-bold"><WandIcon className="h-5 w-5" /> Import Recipe</button>
            <button onClick={onAddIngredient} className="flex items-center gap-2 bg-[#a1e540] text-black px-4 py-2 rounded-md hover:bg-[#8fcc38] transition-colors text-sm font-bold"><AddIcon className="h-5 w-5" /> Add Ingredient</button>
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
              {ingredients.map((ingredient) => (
                <IngredientRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  onIngredientChange={onIngredientChange}
                  onRemove={onRemoveIngredient}
                  marketList={marketList}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="w-full lg:w-1/2">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Pricing & Yield</h3>
              <div className="w-full space-y-4 bg-gray-900/50 p-4 rounded-lg">
                  <div className="flex flex-col gap-1">
                      <label htmlFor="recipeYield" className="text-sm font-medium text-gray-400">Yield (No. of Servings)</label>
                      <FormattedInput
                          value={recipeYieldNum}
                          onValueChange={(val) => onRecipeYieldChange(String(val > 0 ? val : 1))}
                          id="recipeYield"
                          className="no-print p-2 bg-gray-700 border border-gray-600 rounded-md w-full focus:ring-2 focus:ring-[#a1e540] focus:border-[#a1e540] text-white"
                          placeholder="e.g., 8"
                      />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-400">Pricing Method</label>
                      <div className="flex rounded-md bg-gray-700 p-1 text-sm">
                          <button onClick={() => setPricingMethod('costPercentage')} className={`flex-1 p-1 rounded-md transition-colors relative ${pricingMethod === 'costPercentage' ? 'bg-[#a1e540] text-black font-semibold' : 'hover:bg-gray-600/50'}`}>
                            Cost Percentage
                            <Tooltip text={pricingMethodDescriptions.costPercentage}><span className="absolute top-0 right-1 text-gray-500 hover:text-gray-200"><InfoIcon className="h-4 w-4" /></span></Tooltip>
                          </button>
                          <button onClick={() => setPricingMethod('factorPricing')} className={`flex-1 p-1 rounded-md transition-colors relative ${pricingMethod === 'factorPricing' ? 'bg-[#a1e540] text-black font-semibold' : 'hover:bg-gray-600/50'}`}>
                            Factor Pricing
                            <Tooltip text={pricingMethodDescriptions.factorPricing}><span className="absolute top-0 right-1 text-gray-500 hover:text-gray-200"><InfoIcon className="h-4 w-4" /></span></Tooltip>
                          </button>
                      </div>
                  </div>

                  {pricingMethod === 'costPercentage' ? (
                      <div className="flex flex-col gap-1">
                          <label htmlFor="foodCostTarget" className="text-sm font-medium text-gray-400">Target Food Cost (%)</label>
                          <FormattedInput
                              value={resultingFoodCostPercentage}
                              onValueChange={handleFoodCostChange}
                              id="foodCostTarget"
                              className="no-print p-2 bg-gray-700 border border-gray-600 rounded-md w-full focus:ring-2 focus:ring-[#a1e540] focus:border-[#a1e540] text-white"
                              placeholder="e.g., 30"
                          />
                      </div>
                  ) : (
                      <div className="flex flex-col gap-1">
                          <label htmlFor="pricingFactor" className="text-sm font-medium text-gray-400">Pricing Factor</label>
                          <FormattedInput
                              value={pricingFactor}
                              onValueChange={handlePricingFactorChange}
                              id="pricingFactor"
                              className="no-print p-2 bg-gray-700 border border-gray-600 rounded-md w-full focus:ring-2 focus:ring-[#a1e540] focus:border-[#a1e540] text-white"
                              placeholder="e.g., 3.33"
                          />
                      </div>
                  )}

                  <div className="flex flex-col gap-1">
                      <label htmlFor="sellingPrice" className="text-sm font-medium text-gray-400">Recipe Selling Price (₱)</label>
                      <FormattedInput
                          value={sellingPriceNum}
                          onValueChange={(val) => onSellingPriceChange(String(val))}
                          id="sellingPrice"
                          className="no-print p-2 bg-gray-700 border border-gray-600 rounded-md w-full focus:ring-2 focus:ring-[#a1e540] focus:border-[#a1e540] text-white"
                          placeholder="e.g., 1500.00"
                      />
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
      <RecipeImporter
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImport={onImportIngredients}
      />
    </>
  );
}
