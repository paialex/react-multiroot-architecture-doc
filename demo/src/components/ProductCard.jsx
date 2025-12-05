
import React from 'react';

export default function ProductCard({ title, price, image, productId }) {
    const [added, setAdded] = React.useState(false);

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200 p-4">
            <img src={image} alt={title} className="w-full h-48 object-cover rounded-md mb-4" />
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <p className="text-lg text-green-600 font-semibold mt-1">${price}</p>
            <p className="text-sm text-slate-400 mb-4">ID: {productId}</p>
            
            <button 
                onClick={() => setAdded(!added)}
                className={`w-full py-2 px-4 rounded transition-colors duration-200 ${
                    added 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
                {added ? 'Added to Cart ✓' : 'Add to Cart'}
            </button>
        </div>
    );
}
