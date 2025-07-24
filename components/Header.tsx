
import React from 'react';
import { PotIcon } from './Icons.tsx';

export function Header(): React.ReactNode {
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
