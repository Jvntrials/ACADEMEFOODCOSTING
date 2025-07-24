
import React, { useState, useEffect } from 'react';
import { CostingTable } from './components/CostingTable.tsx';
import { MarketList } from './components/MarketList.tsx';
import { Header } from './components/Header.tsx';
import { Ingredient, MarketItem, ParsedIngredient } from './types.ts';
import { getMarketListFromStorage, saveMarketListToStorage } from './services/storageService.ts';

const getConversionFactor = (purchaseUnit: string, recipeUnit: string): number => {
    const pUnit = purchaseUnit.toLowerCase();
    const rUnit = recipeUnit.toLowerCase();

    // Handle cases where AI might output variations of 'piece'
    const pieceUnits = ['pc', 'pcs', 'piece', 'pieces'];
    if (pieceUnits.includes(pUnit) && pieceUnits.includes(rUnit)) return 1;

    const massUnits = ['kg', 'g'];
    const volumeUnits = ['liter', 'ml'];

    const isMass = massUnits.includes(pUnit) && massUnits.includes(rUnit);
    const isVolume = volumeUnits.includes(pUnit) && volumeUnits.includes(rUnit);
    
    // If units are not compatible (e.g., kg to ml), or are piece-based without a match, default to 1.
    // The user should enter a manual conversion factor for complex units like 'cup' to 'g'.
    if (!isMass && !isVolume) return 1;

    const baseUnits: { [key: string]: number } = {
        kg: 1000, g: 1,
        liter: 1000, ml: 1,
    };

    const purchaseToBase = baseUnits[pUnit] || 1;
    const recipeToBase = baseUnits[rUnit] || 1;
    
    return purchaseToBase / recipeToBase;
};


function App(): React.ReactNode {
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: 'Flour', quantity: 1000, unit: 'g', purchasePrice: 80, purchaseUnit: 'kg', conversionFactor: 1000 },
    { id: '2', name: 'Sugar', quantity: 500, unit: 'g', purchasePrice: 90, purchaseUnit: 'kg', conversionFactor: 1000 },
    { id: '3', name: 'Eggs', quantity: 4, unit: 'pc', purchasePrice: 84, purchaseUnit: 'pc', conversionFactor: 12 },
  ]);
  const [marketList, setMarketList] = useState<MarketItem[]>(getMarketListFromStorage());
  const [sellingPrice, setSellingPrice] = useState<string>('150');
  const [recipeYield, setRecipeYield] = useState<string>('8');


  useEffect(() => {
    saveMarketListToStorage(marketList);
  }, [marketList]);

  // Sync market list changes to ingredients in the costing matrix
  useEffect(() => {
    setIngredients(prevIngredients => {
      const marketListMap = new Map(marketList.map(item => [item.name.trim().toLowerCase(), item]));
      
      const newIngredients = prevIngredients.map(ing => {
        const marketItem = ing.name ? marketListMap.get(ing.name.trim().toLowerCase()) : undefined;

        if (marketItem && (ing.purchasePrice !== marketItem.price || ing.purchaseUnit !== marketItem.unit)) {
          return {
            ...ing,
            purchasePrice: marketItem.price,
            purchaseUnit: marketItem.unit,
            conversionFactor: getConversionFactor(marketItem.unit, ing.unit),
          };
        }
        return ing;
      });

      // Only set state if something has actually changed to prevent render loops
      const hasChanged = newIngredients.some((ing, i) => ing !== prevIngredients[i]);
      return hasChanged ? newIngredients : prevIngredients;
    });
  }, [marketList]);

  const handleIngredientChange = (id: string, field: keyof Ingredient, value: string | number) => {
    setIngredients(prevIngredients => prevIngredients.map(ing => {
        if (ing.id !== id) {
            return ing;
        }

        const updatedIng = { ...ing, [field]: value };

        if (field === 'name') {
            const marketItem = marketList.find(item => item.name.trim().toLowerCase() === String(value).trim().toLowerCase());
            if (marketItem) {
                updatedIng.purchasePrice = marketItem.price;
                updatedIng.purchaseUnit = marketItem.unit;
                updatedIng.conversionFactor = getConversionFactor(marketItem.unit, updatedIng.unit);
            }
        } else if (field === 'unit' || field === 'purchaseUnit') {
            const newPurchaseUnit = field === 'purchaseUnit' ? String(value) : updatedIng.purchaseUnit;
            const newRecipeUnit = field === 'unit' ? String(value) : updatedIng.unit;
            updatedIng.conversionFactor = getConversionFactor(newPurchaseUnit, newRecipeUnit);
        }
        
        return updatedIng;
    }));
  };
  
  const handleImportedIngredients = (parsedIngredients: ParsedIngredient[]) => {
    const marketListMap = new Map(marketList.map(item => [item.name.trim().toLowerCase(), item]));

    const newIngredients: Ingredient[] = parsedIngredients.map((pIng, index) => {
        const name = pIng.name || 'Untitled Ingredient';
        const unit = (pIng.unit || 'pc').toLowerCase();

        const marketItem = marketListMap.get(name.trim().toLowerCase());
        
        // Default to a standard purchase unit if not in market list
        const purchaseUnit = marketItem?.unit || 'kg';
        
        // Normalize common 'piece' units which AI might return
        const pieceUnits = ['piece', 'pieces', 'pcs.'];
        const normalizedRecipeUnit = pieceUnits.includes(unit) ? 'pc' : unit;

        return {
            id: `${new Date().getTime()}-${index}`, // Create a robust unique ID
            name: name,
            quantity: pIng.quantity || 1,
            unit: normalizedRecipeUnit,
            purchasePrice: marketItem?.price || 0,
            purchaseUnit: purchaseUnit,
            conversionFactor: getConversionFactor(purchaseUnit, normalizedRecipeUnit),
        };
    });

    if (newIngredients.length > 0) {
        setIngredients(newIngredients);
    } else {
        console.warn("AI parsing resulted in an empty ingredient list.");
        // Optionally, add a user-facing notification here
    }
  };

  const addIngredient = () => {
    const newIngredient: Ingredient = {
      id: new Date().getTime().toString(),
      name: '',
      quantity: 1,
      unit: 'g',
      purchasePrice: 0,
      purchaseUnit: 'kg',
      conversionFactor: 1000,
    };
    setIngredients([...ingredients, newIngredient]);
  };
  
  const addIngredientFromMarket = (marketItem: MarketItem) => {
    const isPieceBased = ['pc', 'pcs'].includes(marketItem.unit.toLowerCase());
    const recipeUnit = isPieceBased ? 'pc' : 'g';
    const newIngredient: Ingredient = {
      id: new Date().getTime().toString(),
      name: marketItem.name,
      unit: recipeUnit,
      quantity: 1,
      purchasePrice: marketItem.price,
      purchaseUnit: marketItem.unit,
      conversionFactor: getConversionFactor(marketItem.unit, recipeUnit),
    };

    setIngredients(prevIngredients => {
      const firstEmptyIndex = prevIngredients.findIndex(ing => !ing.name.trim() && ing.purchasePrice === 0);

      if (firstEmptyIndex !== -1) {
        const newIngredientsList = [...prevIngredients];
        newIngredientsList[firstEmptyIndex] = newIngredient;
        return newIngredientsList;
      }
      return [...prevIngredients, newIngredient];
    });
  };


  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };
  
  const resetTable = () => {
     setIngredients([{ 
         id: new Date().getTime().toString(), 
         name: '', 
         quantity: 1, 
         unit: 'g', 
         purchasePrice: 0,
         purchaseUnit: 'kg',
         conversionFactor: 1000,
     }]);
     setSellingPrice('0');
     setRecipeYield('1');
  };

  return (
    <div className="bg-gray-900 min-h-screen font-sans text-gray-300">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-grow lg:w-2/3 printable-area">
             <CostingTable
                ingredients={ingredients}
                onIngredientChange={handleIngredientChange}
                onAddIngredient={addIngredient}
                onRemoveIngredient={removeIngredient}
                onReset={resetTable}
                sellingPrice={sellingPrice}
                onSellingPriceChange={setSellingPrice}
                marketList={marketList}
                onAddIngredientFromMarket={addIngredientFromMarket}
                recipeYield={recipeYield}
                onRecipeYieldChange={setRecipeYield}
                onImportIngredients={handleImportedIngredients}
            />
          </div>
          <div className="lg:w-1/3 no-print">
            <MarketList marketList={marketList} setMarketList={setMarketList} />
          </div>
        </div>
      </main>
      <footer className="text-center py-6 text-gray-500 text-sm no-print">
        All rights reserved for Jovan Y.
      </footer>
    </div>
  );
}

export default App;
