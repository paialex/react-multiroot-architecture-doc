
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { registry } from './registry.js';

// Track active roots to prevent double-mounting
const activeRoots = new Map();

/**
 * Core Widget Engine
 * Scans for mount points and hydrates React components
 */
function mountWidget(container) {
    // 1. Prevention: Check if already mounted
    if (activeRoots.has(container)) {
        console.warn('Widget already mounted:', container);
        return;
    }

    // 2. Discovery: Read configuration from data attributes
    const componentName = container.dataset.widgetComponent;
    const Component = registry[componentName];

    if (!Component) {
        console.warn(`[Widget Engine] Component "${componentName}" not found in registry.`);
        return;
    }

    // 3. Safety: Parse Props
    let props = {};
    try {
        props = JSON.parse(container.dataset.props || '{}');
    } catch (e) {
        console.error(`[Widget Engine] Invalid props JSON for ${componentName}`, e);
        return;
    }

    // 4. Mounting: React 19 style (createRoot) with Suspense
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <Suspense fallback={<div className="skeleton-loader"></div>}>
                <Component {...props} />
            </Suspense>
        </React.StrictMode>
    );

    // 5. Tracking
    activeRoots.set(container, root);
    console.log(`[Widget Engine] Mounted ${componentName}`);
}

function initializeWidgets() {
    console.log('[Widget Engine] Scanning for widgets...');
    const containers = document.querySelectorAll('.react-widget-container');
    containers.forEach(mountWidget);
}

// Start engine when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidgets);
} else {
    initializeWidgets();
}
