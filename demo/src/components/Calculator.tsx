import { useState, ChangeEvent } from 'react';
import type { CalculatorProps } from '../types/widget.types';

/**
 * Calculator Widget
 * 
 * Tax calculator that computes subtotal, tax amount, and total.
 * Currency and tax rate are configurable via AEM dialog.
 */
export default function Calculator({
    currency,
    taxRate,
    className = ''
}: CalculatorProps): JSX.Element {
    const [amount, setAmount] = useState<number>(100);

    const tax = amount * taxRate;
    const total = amount + tax;

    const handleAmountChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const value = parseFloat(e.target.value);
        setAmount(isNaN(value) ? 0 : value);
    };

    const formatCurrency = (value: number): string => {
        return value.toFixed(2);
    };

    return (
        <div className={`bg-slate-50 p-6 rounded-xl border border-slate-300 h-full ${className}`}>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Tax Calculator Widget</h3>

            <div className="space-y-4">
                <div>
                    <label
                        htmlFor="base-amount"
                        className="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Base Amount ({currency})
                    </label>
                    <input
                        id="base-amount"
                        type="number"
                        value={amount}
                        onChange={handleAmountChange}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        min="0"
                        step="0.01"
                    />
                </div>

                <div className="bg-white p-4 rounded shadow-sm space-y-2">
                    <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span>{currency} {formatCurrency(amount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>Tax ({(taxRate * 100).toFixed(0)}%):</span>
                        <span>{currency} {formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-900 border-t pt-2 mt-2">
                        <span>Total:</span>
                        <span>{currency} {formatCurrency(total)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
