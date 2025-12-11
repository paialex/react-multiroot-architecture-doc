import React, { Suspense } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { registry } from './registry';
import type { WidgetContainer, RootEntry } from './types/widget.types';

// Track active roots to prevent double-mounting
const activeRoots = new Map<WidgetContainer, RootEntry>();

/**
 * Parse props from data attribute with type safety
 */
function parseProps<T extends Record<string, unknown>>(propsJson: string | undefined): T {
    if (!propsJson) {
        return {} as T;
    }

    try {
        return JSON.parse(propsJson) as T;
    } catch (error) {
        console.error('[Widget Engine] Invalid props JSON:', error);
        return {} as T;
    }
}

/**
 * Core Widget Engine
 * Scans for mount points and hydrates React components
 */
function mountWidget(container: WidgetContainer): void {
    // 1. Prevention: Check if already mounted
    if (activeRoots.has(container)) {
        console.warn('[Widget Engine] Widget already mounted:', container);
        return;
    }

    // 2. Discovery: Read configuration from data attributes
    const componentName = container.dataset.widgetComponent;

    if (!componentName) {
        console.warn('[Widget Engine] No widget-component specified:', container);
        return;
    }

    const Component = registry[componentName];

    if (!Component) {
        console.warn(`[Widget Engine] Component "${componentName}" not found in registry.`);
        return;
    }

    // 3. Safety: Parse Props
    const props = parseProps(container.dataset.props);

    // 4. Mounting: React 19 style (createRoot) with Suspense
    const root: Root = createRoot(container);
    root.render(
        <React.StrictMode>
            <Suspense fallback={<div className="skeleton-loader"></div>}>
                <Component {...props} />
            </Suspense>
        </React.StrictMode>
    );

    // 5. Tracking
    activeRoots.set(container, { root, componentName });
    console.log(`[Widget Engine] Mounted ${componentName}`);
}

/**
 * Unmount a widget and cleanup resources
 */
function unmountWidget(container: WidgetContainer): void {
    const entry = activeRoots.get(container);

    if (entry) {
        entry.root.unmount();
        activeRoots.delete(container);
        console.log(`[Widget Engine] Unmounted ${entry.componentName}`);
    }
}

/**
 * Initialize all widgets on the page
 */
function initializeWidgets(): void {
    console.log('[Widget Engine] Scanning for widgets...');
    const containers = document.querySelectorAll<WidgetContainer>('.react-widget-container');
    containers.forEach(mountWidget);
}

/**
 * Cleanup function for SPA-like navigation
 */
export function cleanupAllWidgets(): void {
    activeRoots.forEach((_entry, container) => {
        unmountWidget(container);
    });
}

// Start engine when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidgets);
} else {
    initializeWidgets();
}

// Export for potential programmatic use
export { mountWidget, unmountWidget, initializeWidgets };
