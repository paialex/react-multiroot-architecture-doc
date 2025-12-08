# Refined React.js Integration Guide for AEM: Vendor Splitting

This document provides a validated, step-by-step implementation guide for the **Multi-Root Mounting Strategy**. It specifically addresses the requirement to separate React core libraries (Vendor) from application code (App) into distinct AEM Clientlibs while managing them via a single build pipeline.

## 1. Core Concept: How the Widget Engine Loads

The Widget Engine should be loaded as a standard **AEM Client Library (Clientlib)**.

To optimize caching and performance, we will split the delivery into two distinct Clientlibs:
1.  **`clientlib-react-vendor`**: Contains stable, heavy libraries (`react`, `react-dom`). This file changes rarely, allowing browsers to cache it aggressively.
2.  **`clientlib-react-app`**: Contains your "Widget Engine" (mount script), Component Registry, and the actual Widget components. This changes frequently with every deployment.

These libraries will be linked via the AEM Clientlib `dependencies` property, ensuring `vendor` always loads before `app`.

---

## 2. Implementation Steps

### Step 1: Configure Vite for Chunk Splitting (`ui.frontend`)

We need to instruct Vite (via Rollup) to explicitly pull `react` and `react-dom` out of the main bundle and into a file named `vendor`.

**File:** `ui.frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Clean dist folder before build
    manifest: true,    // Useful for debugging
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/main.jsx'),
      },
      output: {
        // 1. Force React & ReactDOM into a separate 'vendor' chunk
        manualChunks: {
          vendor: ['react', 'react-dom'], 
        },
        // 2. Ensure predictable naming so clientlib-generator can find it
        entryFileNames: '[name].js', // Result: 'main.js'
        chunkFileNames: '[name]-[hash].js', // Result: 'vendor-HASH.js' or 'ProductCard-HASH.js'
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
```

*Note: Depending on the specific version of Vite/Rollup, `chunkFileNames` might be used for the vendor chunk if it's not considered an "entry". If `vendor` ends up as `vendor-HASH.js`, we will handle that in the next step using glob patterns.*

### Step 2: Configure Clientlib Generator for Dual Output (`ui.frontend`)

We will define two separate libraries in the `libs` array of `clientlib.config.js`. The `clientlib-react-app` will depend on `clientlib-react-vendor`.

**File:** `ui.frontend/clientlib.config.js`

```javascript
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

const BUILD_DIR = path.join(__dirname, 'dist');
const CLIENTLIB_DIR = path.join(
  __dirname,
  '../ui.apps/src/main/content/jcr_root/apps/my-project/clientlibs'
);

module.exports = {
  context: __dirname,
  clientLibRoot: CLIENTLIB_DIR,
  libs: [
    // --- Library 1: Vendor (React Core) ---
    {
      name: 'clientlib-react-vendor',
      allowProxy: true,
      categories: ['my-project.react.vendor'],
      serializationFormat: 'xml',
      jsProcessor: ['default:none', 'min:none'], // Let Vite handle minification
      assets: {
        js: {
          cwd: BUILD_DIR,
          // Target the specific vendor chunk created by Vite
          // Using a glob pattern handles the hash (e.g., vendor-a1b2.js)
          files: ['vendor-*.js', 'vendor.js'], 
          flatten: false,
        },
      },
    },
    // --- Library 2: Application (Widgets & Engine) ---
    {
      name: 'clientlib-react-app',
      allowProxy: true,
      categories: ['my-project.react.app'],
      // CRITICAL: This ensures Vendor loads before App
      dependencies: ['my-project.react.vendor'], 
      serializationFormat: 'xml',
      jsProcessor: ['default:none', 'min:none'],
      assets: {
        js: {
          cwd: BUILD_DIR,
          // Include everything...
          files: ['**/*.js'],
          // ...BUT exclude the vendor file we already put in the other lib
          ignore: ['vendor-*.js', 'vendor.js'],
          flatten: false,
        },
        css: {
          cwd: BUILD_DIR,
          files: ['**/*.css'],
          flatten: false,
        },
      },
    },
  ],
};
```

### Step 3: The Widget Engine (Entry Point)

Ensure your main entry point handles the mounting logic. This remains largely the same but relies on React being available from the vendor bundle.

**File:** `ui.frontend/src/main.jsx`

```javascript
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { registry } from './registry';

// Initialize Widgets function
const initWidgets = (scope = document) => {
  const widgetContainers = scope.querySelectorAll('[data-widget-component]');
  
  widgetContainers.forEach((container) => {
    // Avoid double mounting
    if (container.dataset.reactMounted) return;

    const componentName = container.dataset.widgetComponent;
    const Component = registry[componentName];

    if (Component) {
      try {
        const props = JSON.parse(container.dataset.props || '{}');
        const root = createRoot(container);
        root.render(
          <React.StrictMode>
            <Suspense fallback={<div className="loading-skeleton">Loading...</div>}>
              <Component {...props} />
            </Suspense>
          </React.StrictMode>
        );
        container.dataset.reactMounted = "true";
      } catch (e) {
        console.error(`[React] Failed to mount ${componentName}`, e);
      }
    } else {
      console.warn(`[React] Component "${componentName}" not found in registry.`);
    }
  });
};

// 1. Initial Load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initWidgets(document));
} else {
  initWidgets(document);
}

// 2. AEM Editor Event Listener (for Authoring Mode)
// When an author edits a component, AEM fires 'cq-contentloaded'.
// We listen to this to re-hydrate the new HTML injected by the editor.
if (window.Granite && window.Granite.author) {
    $(document).on('cq-contentloaded', function(e) {
        initWidgets(e.target);
    });
}
```

### Step 4: Loading on the AEM Page

In your AEM Page Component (e.g., `customfooterlibs.html` or `body.html`), you only need to call the **App** category. Because of the `dependencies` property defined in Step 2, AEM will automatically load the Vendor category first.

**File:** `ui.apps/.../components/structure/page/customfooterlibs.html`

```html
<sly data-sly-use.clientlib="/libs/granite/sightly/templates/clientlib.html">
    <!-- This call will load 'my-project.react.vendor' FIRST, then 'my-project.react.app' -->
    <sly data-sly-call="${clientlib.js @ categories='my-project.react.app'}"/>
    <sly data-sly-call="${clientlib.css @ categories='my-project.react.app'}"/>
</sly>
```

### Summary of Artifacts

1.  **Vite** creates:
    *   `dist/vendor-[hash].js` (React Core)
    *   `dist/main.js` (Widget Engine)
    *   `dist/assets/ProductCard-[hash].js` (Lazy Loaded Widgets)
2.  **Clientlib Generator** picks these up and creates:
    *   `/apps/my-project/clientlibs/clientlib-react-vendor` (contains only `vendor-*.js`)
    *   `/apps/my-project/clientlibs/clientlib-react-app` (contains `main.js` and widget chunks)
3.  **AEM** serves them in the correct order due to the dependency chain.
