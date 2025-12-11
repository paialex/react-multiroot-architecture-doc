/**
 * Widget Types - Core type definitions for the React Integration Framework
 */

import { ComponentType, LazyExoticComponent } from 'react';

/**
 * Base props that all widgets receive
 */
export interface BaseWidgetProps {
    /** Optional className for styling */
    className?: string;
}

/**
 * Widget component type - can be lazy-loaded
 */
export type WidgetComponent<P extends BaseWidgetProps = BaseWidgetProps> =
    | ComponentType<P>
    | LazyExoticComponent<ComponentType<P>>;

/**
 * Registry type - maps component names to lazy-loaded components
 */
export type WidgetRegistry = Record<string, WidgetComponent<any>>;

/**
 * Props for ProductCard widget
 */
export interface ProductCardProps extends BaseWidgetProps {
    /** Unique product identifier */
    productId: string;
    /** Product display title */
    title: string;
    /** Product price in USD */
    price: number;
    /** Product image URL */
    image: string;
}

/**
 * Props for Calculator widget
 */
export interface CalculatorProps extends BaseWidgetProps {
    /** Currency symbol/code (e.g., 'USD', 'EUR') */
    currency: string;
    /** Tax rate as decimal (e.g., 0.08 for 8%) */
    taxRate: number;
}

/**
 * Widget container data attributes (from AEM HTL output)
 */
export interface WidgetDataAttributes {
    /** Component name matching registry key */
    widgetComponent: string;
    /** JSON-serialized props */
    props?: string;
}

/**
 * Extended HTMLDivElement with widget data attributes
 */
export interface WidgetContainer extends HTMLDivElement {
    dataset: DOMStringMap & {
        widgetComponent?: string;
        props?: string;
    };
}

/**
 * React Root instance tracker
 */
export interface RootEntry {
    root: import('react-dom/client').Root;
    componentName: string;
}
