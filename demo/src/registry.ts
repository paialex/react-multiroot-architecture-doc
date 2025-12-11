import { lazy } from 'react';
import type { WidgetRegistry } from './types/widget.types';

/**
 * Widget Registry
 * 
 * Maps string names (from AEM data attributes) to React components.
 * All components are lazy-loaded for optimal code-splitting.
 * 
 * To add a new widget:
 * 1. Create the component in ./components/
 * 2. Add an entry here with the exact name used in data-widget-component
 */
export const registry: WidgetRegistry = {
    'ProductCard': lazy(() => import('./components/ProductCard')),
    'Calculator': lazy(() => import('./components/Calculator')),
};

/**
 * Type-safe registry key check
 */
export function isRegisteredWidget(name: string): name is keyof typeof registry {
    return name in registry;
}
