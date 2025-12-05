
import { lazy } from 'react';

// Registry mapping string names (from AEM data attributes) to React components
// Using React.lazy for code splitting (simulated here for ES modules)
export const registry = {
    'ProductCard': lazy(() => import('./components/ProductCard.jsx')),
    'Calculator': lazy(() => import('./components/Calculator.jsx'))
};
