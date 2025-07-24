import React, { useRef, useState } from 'react';
import { MarketItem } from '../types.ts';
import { AddIcon, DragHandleIcon, MarketIcon, TrashIcon } from './Icons.tsx';

interface MarketListProps {
  marketList: MarketItem[];
  setMarketList: React.Dispatch<React.SetStateAction<MarketItem[]>>;
}

const unitOptions = ['kg', 'g', 'pc', 'pcs', 'liter', 'ml'];

export function MarketList({ marketList, setMarketList }: MarketListProps): React.ReactNode {
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
    const newItem: MarketItem = {
      id: new Date().getTime().toString(),
      name: 'New Item',
      price: 0,
      unit: 'kg',
    };
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
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <MarketIcon className="h-6 w-6 text-[#a1e540]" />
        <h3 className="text-xl font-semibold text-gray-100">Market List</h3>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        Drag to reorder or drag an item to the Costing Matrix to add it. Changes are saved locally.
      </p>
      <div 
        className="space-y-3 max-h-[40vh] sm:max-h-[60vh] overflow-y-auto pr-2 flex-grow"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {marketList.map((item, index) => (
          <div 
            key={item.id} 
            className={`flex items-center flex-wrap gap-2 p-2 rounded-md transition-opacity ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragEnd={handleDragEnd}
            >
            <span className="cursor-grab text-gray-500 hover:text-gray-300" title="Drag to reorder">
              <DragHandleIcon className="h-5 w-5" />
            </span>
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleNameChange(item.id, e.target.value)}
              className="flex-grow bg-transparent p-1 -m-1 rounded focus:bg-gray-700 focus:ring-1 focus:ring-[#a1e540] outline-none font-medium min-w-[100px]"
            />
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-gray-400">₱</span>
              <input
                type="number"
                step="0.01"
                value={item.price}
                onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                className="w-20 bg-transparent p-1 -m-1 rounded focus:bg-gray-700 focus:ring-1 focus:ring-[#a1e540] outline-none"
              />
               <span className="text-gray-400">/</span>
              <select
                value={item.unit}
                onChange={(e) => handleUnitChange(item.id, e.target.value)}
                className="bg-gray-700 border-gray-600 rounded p-1 text-sm focus:ring-1 focus:ring-[#a1e540] outline-none"
              >
                {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <button onClick={() => removeItem(item.id)} className="text-gray-500 hover:text-red-500 p-1 rounded-full hover:bg-red-500/10 transition-colors">
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
       <button
          onClick={addNewItem}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-700 text-gray-300 px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
        >
          <AddIcon className="h-5 w-5" />
          Add Market Item
        </button>
    </div>
  );
}
