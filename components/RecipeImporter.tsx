import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { GoogleGenAI, Type } from "@google/genai";
import { CloseIcon, SpinnerIcon, WandIcon } from './Icons.tsx';
import { ParsedIngredient } from '../types.ts';

interface RecipeImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (ingredients: ParsedIngredient[]) => void;
}

export function RecipeImporter({ isOpen, onClose, onImport }: RecipeImporterProps): React.ReactNode {
  const [recipeText, setRecipeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when modal opens
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
      
      const parsedIngredients = JSON.parse(response.text) as ParsedIngredient[];
      
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
  
  if (!isOpen) {
    return null;
  }
  
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
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
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
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-md bg-gray-600 text-gray-200 hover:bg-gray-500 transition-colors font-medium text-sm"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="px-5 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed transition-colors font-semibold text-sm flex items-center justify-center gap-2 w-48"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <SpinnerIcon className="h-5 w-5" />
                Parsing...
              </>
            ) : (
              'Generate Ingredients'
            )}
          </button>
        </footer>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
