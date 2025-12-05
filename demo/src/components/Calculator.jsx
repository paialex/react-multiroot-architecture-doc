
import React, { useState } from 'react';

export default function Calculator({ currency, taxRate }) {
    const [amount, setAmount] = useState(100);
    
    const tax = amount * taxRate;
    const total = parseFloat(amount) + tax;

    return (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-300 h-full">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Tax Calculator Widget</h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Base Amount ({currency})</label>
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="bg-white p-4 rounded shadow-sm space-y-2">
                    <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span>{currency} {parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>Tax ({(taxRate * 100).toFixed(0)}%):</span>
                        <span>{currency} {tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-900 border-t pt-2 mt-2">
                        <span>Total:</span>
                        <span>{currency} {total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
