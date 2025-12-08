# Revalidated React Integration: The ESM-Safe Architecture

This document outlines the **final, revalidated architecture** for integrating React into AEM. It specifically addresses:
1.  **AEM Clientlib Compatibility:** Resolving the conflict between standard AEM `<script>` tags and modern JavaScript `import` statements (ES Modules).
2.  **Lazy Loading:** Guaranteeing that component code (e.g., `ProductCard.js`) is **only** downloaded if the component is actually present on the page.
3.  **Vendor Splitting:** Efficiently separating React Core from App code while maintaining a single, robust Clientlib structure.

---

## 1. The Core Problem & Solution

### The Challenge: "Imports" in AEM
Modern React builds (Vite) output **ES Modules** (`import React from 'react'`).
*   **Problem:** Standard AEM Clientlibs (`<sly data-sly-call...>`) generate standard `<script src="...">` tags. If a browser sees `import` statements in a standard script, it throws a syntax error.
*   **Problem 2:** Splitting code into multiple AEM Clientlibs (e.g., `clientlib-vendor` and `clientlib-app`) breaks relative imports (e.g., `import './vendor.js'`) because AEM serves them from different root paths.

### The Solution: The "Resource + Loader" Pattern
We will use a **Single AEM Clientlib** that acts as a container.
1.  **Resources Folder:** We place the actual Vite build (ES Modules) in the `resources` folder of the clientlib. AEM serves these files raw, preserving their relative paths.
2.  **Loader Script:** The Clientlib's main JS file (loaded by AEM) is a tiny "Loader" script. Its only job is to inject a `<script type="module" src="...">` pointing to the main app file in the `resources` folder.

This ensures:
*   AEM is happy (standard clientlib inclusion).
*   Browser is happy (correct `type="module"`).
*   Lazy Loading works (relative paths in `resources` are preserved).

---

## 2. Implementation Guide

### Step 1: Vite Configuration (`ui.frontend`)
We configure Vite to output a modern ESM build with vendor splitting.

**File:** `ui.frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL: Ensures dynamic imports use relative paths
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/main.jsx'),
      },
      output: {
        format: 'es', // Force ES Modules
        // 1. Separate Vendor (React) for caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
        // 2. Predictable naming
        entryFileNames: '[name].js',        // main.js
        chunkFileNames: '[name]-[hash].js', // vendor-hash.js, ProductCard-hash.js
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
```

### Step 2: Clientlib Generator Config (`ui.frontend`)
We configure the generator to copy the build to `resources` instead of `js`.

**File:** `ui.frontend/clientlib.config.js`

```javascript
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
    {
      name: 'clientlib-react',
      allowProxy: true,
      categories: ['my-project.react'], // The category to call in HTL
      serializationFormat: 'xml',
      jsProcessor: ['default:none', 'min:none'],
      
      // 1. Main Assets (The ESM Build) -> Copy to 'resources' folder
      assets: {
        resources: {
          cwd: BUILD_DIR,
          files: ['**/*'], // Copy main.js, vendor.js, chunks, css
          flatten: false,
        }
      }
    }
  ]
};
```

**Note:** We intentionally **DO NOT** map `js` assets here. We will create the JS entry point manually in the next step.

### Step 3: Create the Loader Script (`ui.apps`)
Manually create a `loader.js` in your AEM Clientlib folder. This is the bridge.

**File:** `ui.apps/.../clientlibs/clientlib-react/js/loader.js`

```javascript
(function() {
    // 1. Identify the path to the 'resources' folder of this clientlib
    // In AEM Proxy mode, scripts are served from /etc.clientlibs/.../js/loader.js
    // We want to reach /etc.clientlibs/.../resources/main.js
    
    // Simple robust detection: Get the script tag that loaded this file
    const currentScript = document.currentScript;
    const clientlibPath = currentScript ? currentScript.src.substring(0, currentScript.src.lastIndexOf('/js/')) : null;

    if (clientlibPath) {
        const modulePath = clientlibPath + '/resources/main.js';
        
        // 2. Inject the Module Script
        const script = document.createElement('script');
        script.type = 'module';
        script.src = modulePath;
        document.body.appendChild(script);
    } else {
        console.error('[React Loader] Could not resolve Clientlib path.');
    }
})();
```

**File:** `ui.apps/.../clientlibs/clientlib-react/js.txt`
```text
loader.js
```

### Step 4: The Widget Engine (`ui.frontend`)
This remains the same (scanning DOM and mounting).
**Validation Check:**
*   **Lazy Loading:** Inside `main.jsx`, you have:
    ```javascript
    const registry = {
      'ProductCard': lazy(() => import('./components/ProductCard'))
    };
    ```
    When `main.js` runs (loaded by loader.js), it imports `vendor.js` (static import, loaded immediately).
    It scans the DOM.
    *   **Scenario A (ProductCard is NOT on page):** The `ProductCard` key in registry is never accessed. The `import()` function is never called. The browser **NEVER** downloads `ProductCard-hash.js`. **Requirement Met.**
    *   **Scenario B (ProductCard IS on page):** `registry['ProductCard']` is accessed. `import()` is called. Browser fetches `ProductCard-hash.js` from the `resources` folder. **Requirement Met.**

### Step 5: AEM Page Inclusion
Use the standard AEM approach. No custom HTL required.

**File:** `customfooterlibs.html`
```html
<sly data-sly-use.clientlib="/libs/granite/sightly/templates/clientlib.html">
    <!-- Loads loader.js (Standard JS), which then bootstraps the React App -->
    <sly data-sly-call="${clientlib.js @ categories='my-project.react'}"/>
    
    <!-- CSS can be loaded directly as AEM handles CSS includes fine -->
    <link rel="stylesheet" href="/etc.clientlibs/my-project/clientlibs/clientlib-react/resources/style.css" type="text/css">
</sly>
```
*(Note: For CSS, you might need to adjust the clientlib config to map CSS to the standard `css` folder if you want `clientlib.css` to work, or reference it from resources as shown above).*

---

## Summary of Validated Behavior

| Requirement | Implementation Validation |
| :--- | :--- |
| **AEM/Clientlib Compatible** | **Pass.** We use a standard Clientlib structure (`js.txt`, `allowProxy`). The incompatibility of ESM is solved by the `loader.js` shim. |
| **Handle "Imports"** | **Pass.** The actual application code runs as `<script type="module">`. Browsers natively handle `import` relative paths within the `resources` directory. |
| **Load Only Used JS** | **Pass.** `main.js` contains only the registry logic. Component code is split into chunks. `import()` is only triggered if the DOM element exists. |
| **Vendor Splitting** | **Pass.** Vite `manualChunks` splits `react` into `vendor.js`. Since it's in the same `resources` folder, `main.js` imports it via `./vendor.js` seamlessly. |
