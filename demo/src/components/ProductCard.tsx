import { useState } from 'react';
import type { ProductCardProps } from '../types/widget.types';

/**
 * ProductCard Widget
 * 
 * Displays a product with image, title, price, and add-to-cart functionality.
 * Receives props from AEM dialog configuration via data-props attribute.
 */
export default function ProductCard({
    title,
    price,
    image,
    productId,
    className = ''
}: ProductCardProps): JSX.Element {
    const [added, setAdded] = useState<boolean>(false);

    const handleClick = (): void => {
        setAdded((prev) => !prev);
    };

    return (
        <div className={`bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200 p-4 ${className}`}>
            <img
                src={image}
                alt={title}
                className="w-full h-48 object-cover rounded-md mb-4"
            />
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <p className="text-lg text-green-600 font-semibold mt-1">${price}</p>
            <p className="text-sm text-slate-400 mb-4">ID: {productId}</p>

            <button
                onClick={handleClick}
                className={`w-full py-2 px-4 rounded transition-colors duration-200 ${added
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                aria-pressed={added}
            >
                {added ? 'Added to Cart ✓' : 'Add to Cart'}
            </button>
        </div>
    );
}
