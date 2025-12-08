# React-AEM Integration: Consolidated Implementation Guide

> **Version:** 1.0  
> **Status:** Production-Ready  
> **Last Updated:** December 2024

This document provides the **definitive, production-ready implementation guide** for integrating React.js widgets into Adobe Experience Manager (AEM). It consolidates the architectural decisions from the POC findings with validated technical solutions for ES Module compatibility, build configuration, and clientlib mapping.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [The Core Challenge: ES Modules in AEM](#2-the-core-challenge-es-modules-in-aem)
3. [Project Structure](#3-project-structure)
4. [Vite Build Configuration](#4-vite-build-configuration)
5. [Clientlib Generator Configuration](#5-clientlib-generator-configuration)
6. [The Loader Script (ESM Bridge)](#6-the-loader-script-esm-bridge)
7. [Widget Engine Implementation](#7-widget-engine-implementation)
8. [Component Registry](#8-component-registry)
9. [AEM Page Integration](#9-aem-page-integration)
10. [AEM Component HTML Contract](#10-aem-component-html-contract)
11. [Build & Deployment Workflow](#11-build--deployment-workflow)
12. [Troubleshooting Guide](#12-troubleshooting-guide)

---

## 1. Architecture Overview

### 1.1 Multi-Root Mounting Strategy

We use an **Islands Architecture** where AEM (Sling/HTL) remains the primary page renderer, and React is mounted as independent "islands" of interactivity.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AEM Page (HTL Rendered)                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   Static     │  │   Static     │  │   Static     │               │
│  │   Content    │  │   Content    │  │   Content    │               │
│  │   (HTL)      │  │   (HTL)      │  │   (HTL)      │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                      │
│  ┌──────────────┐                    ┌──────────────┐               │
│  │ React Island │                    │ React Island │               │
│  │  (Widget 1)  │                    │  (Widget 2)  │               │
│  │  createRoot()│                    │  createRoot()│               │
│  └──────────────┘                    └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Benefits

| Benefit | Description |
|---------|-------------|
| **SEO Preserved** | AEM renders full HTML; React enhances, not replaces |
| **Fault Isolation** | Each widget is an independent React root |
| **Lazy Loading** | Widget code downloaded only when component exists on page |
| **Optimal Caching** | Vendor (React core) separated from app code |
| **Native Authoring** | Works with standard AEM dialogs and Page Editor |

---

## 2. The Core Challenge: ES Modules in AEM

### 2.1 The Problem

Modern Vite builds output **ES Modules** with `import` statements:

```javascript
// Vite output (main.js)
import React from './vendor-abc123.js';
import { createRoot } from 'react-dom/client';
```

However, AEM Clientlibs generate **standard script tags**:

```html
<!-- AEM generates this -->
<script src="/etc.clientlibs/my-project/clientlibs/clientlib-react/js/main.js"></script>
```

**Result:** Browser throws `SyntaxError: Cannot use import statement outside a module`

### 2.2 The Solution: Resource + Loader Pattern

We solve this with a two-part approach:

1. **Resources Folder:** Store the actual ES Module build in the clientlib's `resources` folder (AEM serves these raw, preserving relative paths)
2. **Loader Script:** A tiny standard JS file that dynamically injects a `<script type="module">` tag

```
┌─────────────────────────────────────────────────────────────────┐
│                    Clientlib Structure                           │
├─────────────────────────────────────────────────────────────────┤
│  clientlib-react/                                                │
│  ├── js/                                                         │
│  │   └── loader.js          ← Standard JS (loaded by AEM)       │
│  ├── js.txt                 ← Points to loader.js                │
│  ├── resources/             ← ES Modules (served raw)           │
│  │   ├── main.js            ← Entry point                        │
│  │   ├── vendor-abc123.js   ← React/ReactDOM                     │
│  │   └── ProductCard-def456.js ← Lazy-loaded component          │
│  └── .content.xml                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Project Structure

```
my-aem-project/
├── ui.frontend/                          # Frontend module
│   ├── src/
│   │   ├── main.jsx                      # Widget Engine entry point
│   │   ├── registry.js                   # Component registry
│   │   ├── components/
│   │   │   ├── ProductCard/
│   │   │   │   ├── index.jsx
│   │   │   │   └── ProductCard.module.css
│   │   │   └── Calculator/
│   │   │       └── index.jsx
│   │   └── utils/
│   │       └── ErrorBoundary.jsx
│   ├── dist/                             # Vite build output
│   ├── vite.config.js
│   ├── clientlib.config.js               # Clientlib generator config
│   └── package.json
│
├── ui.apps/
│   └── src/main/content/jcr_root/apps/my-project/
│       ├── clientlibs/
│       │   └── clientlib-react/          # Generated clientlib
│       │       ├── js/
│       │       │   └── loader.js         # Manual: ESM bridge
│       │       ├── js.txt                # Manual: loader.js reference
│       │       ├── resources/            # Generated: Vite output
│       │       └── .content.xml          # Generated
│       └── components/
│           └── product-card/             # AEM Component
│               ├── _cq_dialog/
│               ├── product-card.html     # HTL template
│               └── .content.xml
```

---

## 4. Vite Build Configuration

**File:** `ui.frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // CRITICAL: Ensures dynamic imports use relative paths
  // Without this, lazy-loaded chunks fail when served from /etc.clientlibs/...
  base: './',
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    
    // Generate manifest.json for debugging and potential future integrations
    manifest: true,
    
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/main.jsx'),
      },
      output: {
        // CRITICAL: Force ES Module format
        format: 'es',
        
        // Vendor splitting: React core in separate chunk for long-term caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
        
        // Predictable naming for clientlib mapping
        // Entry files: no hash (main.js)
        entryFileNames: '[name].js',
        
        // Chunks: include hash for cache busting (vendor-abc123.js, ProductCard-def456.js)
        chunkFileNames: '[name]-[hash].js',
        
        // Assets (CSS, images): include hash
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  
  // Ensure .js files with JSX are processed correctly
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
});
```

### 4.1 Build Output

After running `npm run build`, the `dist/` folder contains:

```
dist/
├── main.js                    # Widget Engine (entry point)
├── vendor-abc123.js           # React + ReactDOM (cached long-term)
├── ProductCard-def456.js      # Lazy-loaded component
├── Calculator-ghi789.js       # Another lazy-loaded component
├── assets/
│   └── main-xyz123.css        # Combined CSS (if any)
└── manifest.json              # Build manifest
```

---

## 5. Clientlib Generator Configuration

The clientlib generator regenerates the entire clientlib folder on each build. To prevent `loader.js` from being deleted, we include it as part of the frontend source and copy it during the build process.

### 5.1 Create Loader Script in Frontend Source

First, create the loader script in your frontend module (NOT in ui.apps):

**File:** `ui.frontend/src/loader.js`

```javascript
/**
 * React Widget Loader (ESM Bridge)
 * 
 * This script is loaded as a standard <script> tag by AEM Clientlibs.
 * Its purpose is to dynamically inject the actual React application
 * as an ES Module, which browsers can properly handle.
 * 
 * This file is part of the build process - do not use import/export syntax.
 */
(function() {
  'use strict';
  
  // ============================================================================
  // Configuration - Update these for your project
  // ============================================================================
  
  var CLIENTLIB_NAME = 'clientlib-react';  // Your clientlib folder name
  var PROJECT_NAME = 'my-project';          // Your project name in /apps/
  
  // ============================================================================
  // Path Detection
  // ============================================================================
  
  /**
   * Resolve the path to the resources folder of this clientlib.
   * 
   * AEM serves clientlib JS files in multiple formats:
   * 
   * 1. Direct path (author/no proxy):
   *    /apps/my-project/clientlibs/clientlib-react/js/loader.js
   * 
   * 2. Proxy path (publish):
   *    /etc.clientlibs/my-project/clientlibs/clientlib-react/js/loader.js
   * 
   * 3. Versioned/minified proxy path (with long-term caching):
   *    /etc.clientlibs/my-project/clientlibs/clientlib-react.[lc-abc123-lc].min.js
   *    /etc.clientlibs/my-project/clientlibs/clientlib-react.min.[hash].js
   * 
   * We need to extract the base path that works for accessing /resources/
   */
  function getClientlibBasePath() {
    var currentScript = document.currentScript;
    var src = currentScript ? currentScript.src : null;
    
    // Fallback: find script by pattern
    if (!src) {
      var scripts = document.querySelectorAll('script[src*="' + CLIENTLIB_NAME + '"]');
      if (scripts.length > 0) {
        src = scripts[scripts.length - 1].src;
      }
    }
    
    if (!src) {
      console.warn('[React Loader] Could not detect script source, using fallback.');
      return '/etc.clientlibs/' + PROJECT_NAME + '/clientlibs/' + CLIENTLIB_NAME;
    }
    
    // Parse the URL to extract the path
    var url;
    try {
      url = new URL(src);
    } catch (e) {
      // Fallback for relative URLs
      url = new URL(src, window.location.origin);
    }
    
    var pathname = url.pathname;
    
    // Case 1: Standard path format (ends with /js/loader.js or similar)
    // /etc.clientlibs/my-project/clientlibs/clientlib-react/js/loader.js
    // → /etc.clientlibs/my-project/clientlibs/clientlib-react
    var standardMatch = pathname.match(new RegExp('(.*/' + CLIENTLIB_NAME + ')/js/'));
    if (standardMatch) {
      return url.origin + standardMatch[1];
    }
    
    // Case 2: Versioned/minified format (ends with hash and .js)
    // /etc.clientlibs/my-project/clientlibs/clientlib-react.[lc-abc123].min.js
    // /etc.clientlibs/my-project/clientlibs/clientlib-react.min.abc123.js
    // → /etc.clientlibs/my-project/clientlibs/clientlib-react
    var versionedMatch = pathname.match(new RegExp('(.*/' + CLIENTLIB_NAME + ')[\\.\\[]'));
    if (versionedMatch) {
      return url.origin + versionedMatch[1];
    }
    
    // Case 3: Try to find clientlib name and extract everything before the hash/extension
    var clientlibIndex = pathname.indexOf('/' + CLIENTLIB_NAME);
    if (clientlibIndex !== -1) {
      var basePath = pathname.substring(0, clientlibIndex + CLIENTLIB_NAME.length + 1);
      return url.origin + basePath;
    }
    
    // Fallback: return configured path
    console.warn('[React Loader] Could not parse script path, using fallback.');
    return '/etc.clientlibs/' + PROJECT_NAME + '/clientlibs/' + CLIENTLIB_NAME;
  }
  
  // ============================================================================
  // Module Loading
  // ============================================================================
  
  /**
   * Inject the ES Module script
   */
  function loadReactApp() {
    var basePath = getClientlibBasePath();
    
    if (!basePath) {
      console.error('[React Loader] Failed to resolve clientlib base path.');
      return;
    }
    
    var modulePath = basePath + '/resources/main.js';
    
    // Debug logging (remove in production if desired)
    console.log('[React Loader] Loading from:', modulePath);
    
    // Create and inject the module script
    var script = document.createElement('script');
    script.type = 'module';
    script.src = modulePath;
    
    // Error handling
    script.onerror = function() {
      console.error('[React Loader] Failed to load React application from:', modulePath);
      console.error('[React Loader] Detected base path was:', basePath);
      console.error('[React Loader] Original script src:', document.currentScript ? document.currentScript.src : 'N/A');
    };
    
    // Append to body (ensures DOM is available when module executes)
    document.body.appendChild(script);
  }
  
  // Execute immediately
  loadReactApp();
  
})();
```

### 5.2 Create js.txt Template

**File:** `ui.frontend/src/js.txt`

```text
#base=js
loader.js
```

### 5.3 Clientlib Generator Configuration

**File:** `ui.frontend/clientlib.config.js`

```javascript
const path = require('path');

const BUILD_DIR = path.join(__dirname, 'dist');
const STATIC_DIR = path.join(__dirname, 'src');  // For loader.js
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
      categories: ['my-project.react'],
      serializationFormat: 'xml',
      
      // IMPORTANT: Disable AEM's JS/CSS processing
      // Vite already handles minification and optimization
      jsProcessor: ['default:none', 'min:none'],
      cssProcessor: ['default:none', 'min:none'],
      
      assets: {
        // 1. The loader script goes to standard 'js' folder
        //    This is loaded by AEM as a regular script
        js: {
          cwd: STATIC_DIR,
          files: ['loader.js'],
          flatten: true,
        },
        
        // 2. The Vite build output goes to 'resources' folder
        //    This preserves relative paths for ES Module imports
        resources: {
          cwd: BUILD_DIR,
          files: ['**/*'],
          flatten: false,
        },
        
        // 3. Optional: Copy CSS to standard location for clientlib.css usage
        // css: {
        //   cwd: BUILD_DIR,
        //   files: ['assets/**/*.css'],
        //   flatten: false,
        // },
      },
      
      // Include js.txt template
      // The generator will use this to create js.txt in the clientlib
    },
  ],
};
```

### 5.4 Alternative: Using Vite Copy Plugin

If you prefer to handle this entirely in Vite, you can use a copy plugin:

**Install the plugin:**

```bash
npm install -D vite-plugin-static-copy
```

**Update vite.config.js:**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/loader.js',
          dest: '../js',  // Will create dist/js/loader.js
        },
      ],
    }),
  ],
  // ... rest of config
});
```

Then update clientlib.config.js to use the dist folder for both:

```javascript
assets: {
  js: {
    cwd: BUILD_DIR,
    files: ['js/loader.js'],
    flatten: true,
  },
  resources: {
    cwd: BUILD_DIR,
    files: ['*.js', 'assets/**/*'],  // Exclude js folder
    flatten: false,
  },
},
```

### 5.5 Generator Behavior

With this configuration, `aem-clientlib-generator` will:

1. **Regenerate** `clientlib-react/` folder completely (this is expected)
2. **Copy** `loader.js` to `clientlib-react/js/loader.js`
3. **Copy** Vite output to `clientlib-react/resources/`
4. **Generate** `.content.xml` with the clientlib definition
5. **Generate** `js.txt` referencing `loader.js`

**Result:** No more manual file management needed. Everything is part of the build process.

### 5.6 Updated Project Structure

```
ui.frontend/
├── src/
│   ├── main.jsx              # Widget Engine entry point
│   ├── loader.js             # ESM Bridge (copied to clientlib/js/)
│   ├── js.txt                # js.txt template (optional)
│   ├── registry.js
│   └── components/
├── dist/                     # Vite build output
├── vite.config.js
├── clientlib.config.js
└── package.json
```

---

## 6. The Loader Script (ESM Bridge)

The loader script bridges AEM's standard script loading with ES Modules. As shown in Section 5.1, this file now lives in `ui.frontend/src/loader.js` and is automatically copied during the build process.

### 6.1 Why This Pattern Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    Script Loading Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. AEM includes clientlib                                       │
│     <sly data-sly-call="${clientlib.js}"/>                       │
│                         │                                        │
│                         ▼                                        │
│  2. AEM generates standard script tag                            │
│     <script src=".../clientlib-react/js/loader.js"></script>     │
│                         │                                        │
│                         ▼                                        │
│  3. loader.js executes (standard JS, no modules)                 │
│     - Detects its own path                                       │
│     - Creates: <script type="module" src=".../resources/main.js">│
│                         │                                        │
│                         ▼                                        │
│  4. Browser loads main.js as ES Module                           │
│     - import statements work correctly                           │
│     - Relative paths resolve to /resources/                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Loader Script Details

The loader script (from Section 5.1) performs these key functions:

1. **Path Detection:** Uses `document.currentScript` to find its own URL
2. **Path Calculation:** Removes `/js/loader.js` to get the clientlib base path
3. **Module Injection:** Creates a `<script type="module">` pointing to `/resources/main.js`
4. **Error Handling:** Logs errors if the module fails to load

### 6.3 Customizing the Loader

**For multiple React apps on different pages:**

```javascript
(function() {
  'use strict';
  
  function getClientlibBasePath() {
    var currentScript = document.currentScript;
    if (currentScript && currentScript.src) {
      return currentScript.src.replace(/\/js\/loader\.js.*$/, '');
    }
    return null;
  }
  
  function loadReactApp() {
    var basePath = getClientlibBasePath();
    if (!basePath) return;
    
    // Check if any React widgets exist on the page before loading
    var hasWidgets = document.querySelector('[data-widget-component]');
    if (!hasWidgets) {
      console.log('[React Loader] No widgets found, skipping load.');
      return;
    }
    
    var script = document.createElement('script');
    script.type = 'module';
    script.src = basePath + '/resources/main.js';
    document.body.appendChild(script);
  }
  
  // Wait for DOM if needed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadReactApp);
  } else {
    loadReactApp();
  }
})();
```

---

## 7. Widget Engine Implementation

**File:** `ui.frontend/src/main.jsx`

```jsx
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { registry } from './registry';
import { ErrorBoundary } from './utils/ErrorBoundary';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Selector for widget containers
  WIDGET_SELECTOR: '[data-widget-component]',
  
  // Attribute names
  ATTR_COMPONENT: 'widgetComponent',
  ATTR_PROPS: 'props',
  ATTR_MOUNTED: 'reactMounted',
  ATTR_LAZY_HYDRATE: 'lazyHydrate',
  
  // Default loading fallback
  DEFAULT_FALLBACK: <div className="react-widget-loading">Loading...</div>,
};

// ============================================================================
// Active Roots Management
// ============================================================================

// Track mounted roots for cleanup (prevents memory leaks)
const activeRoots = new WeakMap();

// ============================================================================
// WCM Mode Detection (AEM Authoring)
// ============================================================================

/**
 * Detect the current AEM WCM mode.
 * @returns {'edit' | 'preview' | 'disabled'} The current mode
 */
function getWCMMode() {
  // Check wcmmode cookie (set by AEM in author mode)
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith('wcmmode=')) {
      return cookie.substring(8);
    }
  }
  
  // Check data attribute on body (alternative approach)
  if (document.body.dataset.wcmmode) {
    return document.body.dataset.wcmmode;
  }
  
  // Default: disabled (published/production)
  return 'disabled';
}

/**
 * Check if we're in AEM author mode (edit or preview)
 */
function isAuthorMode() {
  return typeof window !== 'undefined' && 
         window.Granite && 
         window.Granite.author;
}

// ============================================================================
// Widget Mounting
// ============================================================================

/**
 * Mount a single widget to a container element.
 * @param {HTMLElement} container - The widget container element
 */
function mountWidget(container) {
  // 1. Prevent double mounting
  if (activeRoots.has(container)) {
    return;
  }
  
  // 2. Get component name from data attribute
  const componentName = container.dataset[CONFIG.ATTR_COMPONENT];
  if (!componentName) {
    console.warn('[React] Container missing data-widget-component attribute:', container);
    return;
  }
  
  // 3. Check if component exists in registry
  const Component = registry[componentName];
  if (!Component) {
    console.warn(`[React] Component "${componentName}" not found in registry.`);
    return;
  }
  
  // 4. Parse props with error handling
  let props = {};
  try {
    const propsAttribute = container.dataset[CONFIG.ATTR_PROPS];
    if (propsAttribute) {
      props = JSON.parse(propsAttribute);
    }
  } catch (error) {
    console.error(`[React] Invalid JSON in data-props for "${componentName}":`, error);
    return;
  }
  
  // 5. Check WCM mode for authoring behavior
  const wcmMode = getWCMMode();
  if (wcmMode === 'edit') {
    // In Edit mode: Render a placeholder instead of the full widget
    // This prevents interactive elements from interfering with AEM's overlay
    container.innerHTML = `
      <div class="react-widget-placeholder" style="
        padding: 20px;
        background: #f5f5f5;
        border: 2px dashed #ccc;
        text-align: center;
        font-family: sans-serif;
      ">
        <strong>${componentName}</strong>
        <br>
        <small style="color: #666;">Interactive widget (preview to see)</small>
      </div>
    `;
    return;
  }
  
  // 6. Create React root and render
  try {
    const root = createRoot(container);
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary widgetName={componentName}>
          <Suspense fallback={CONFIG.DEFAULT_FALLBACK}>
            <Component {...props} />
          </Suspense>
        </ErrorBoundary>
      </React.StrictMode>
    );
    
    // 7. Track the root
    activeRoots.set(container, root);
    container.dataset[CONFIG.ATTR_MOUNTED] = 'true';
    
  } catch (error) {
    console.error(`[React] Failed to mount "${componentName}":`, error);
  }
}

/**
 * Unmount a widget from a container.
 * @param {HTMLElement} container - The widget container element
 */
function unmountWidget(container) {
  const root = activeRoots.get(container);
  if (root) {
    root.unmount();
    activeRoots.delete(container);
    delete container.dataset[CONFIG.ATTR_MOUNTED];
  }
}

// ============================================================================
// Widget Discovery & Initialization
// ============================================================================

/**
 * Initialize all widgets within a given scope.
 * @param {Document | HTMLElement} scope - The DOM scope to search within
 */
function initWidgets(scope = document) {
  const containers = scope.querySelectorAll(CONFIG.WIDGET_SELECTOR);
  
  containers.forEach((container) => {
    // Check for lazy hydration
    if (container.dataset[CONFIG.ATTR_LAZY_HYDRATE] === 'true') {
      // Use IntersectionObserver for viewport-based mounting
      setupLazyHydration(container);
    } else {
      // Mount immediately
      mountWidget(container);
    }
  });
}

/**
 * Setup lazy hydration for a widget using IntersectionObserver.
 * @param {HTMLElement} container - The widget container element
 */
function setupLazyHydration(container) {
  // Skip if already mounted
  if (activeRoots.has(container)) {
    return;
  }
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          mountWidget(container);
          observer.disconnect();
        }
      });
    },
    {
      // Trigger slightly before entering viewport
      rootMargin: '100px',
    }
  );
  
  observer.observe(container);
}

// ============================================================================
// DOM Mutation Observer (Memory Leak Prevention)
// ============================================================================

/**
 * Setup a MutationObserver to detect when widget containers are removed.
 * This is crucial for AEM author mode where components are frequently replaced.
 */
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the removed node is a widget container
          if (activeRoots.has(node)) {
            unmountWidget(node);
          }
          
          // Check for widget containers within the removed subtree
          const childContainers = node.querySelectorAll?.(CONFIG.WIDGET_SELECTOR);
          if (childContainers) {
            childContainers.forEach((container) => {
              if (activeRoots.has(container)) {
                unmountWidget(container);
              }
            });
          }
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  return observer;
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Main initialization function.
 */
function initialize() {
  // 1. Initialize all current widgets
  initWidgets(document);
  
  // 2. Setup mutation observer for cleanup
  setupMutationObserver();
  
  // 3. AEM Author Mode: Listen for content reload events
  if (isAuthorMode()) {
    // Use native event listener (jQuery-free)
    document.addEventListener('cq-contentloaded', (event) => {
      // Re-initialize widgets within the updated content
      initWidgets(event.target || document);
    });
  }
}

// ============================================================================
// Entry Point
// ============================================================================

// Handle different page load states
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOM already loaded
  initialize();
}

// Export for potential external usage
export { initWidgets, mountWidget, unmountWidget };
```

---

## 8. Component Registry

**File:** `ui.frontend/src/registry.js`

```javascript
import { lazy } from 'react';

/**
 * Component Registry
 * 
 * Maps component names (used in data-widget-component) to React components.
 * All components are lazy-loaded to ensure code-splitting.
 * 
 * Usage in AEM component HTML:
 * <div data-widget-component="ProductCard" data-props='{"sku":"123"}'></div>
 */
export const registry = {
  // Product components
  'ProductCard': lazy(() => import('./components/ProductCard')),
  'ProductGallery': lazy(() => import('./components/ProductGallery')),
  
  // Utility components
  'Calculator': lazy(() => import('./components/Calculator')),
  'SearchWidget': lazy(() => import('./components/SearchWidget')),
  
  // Form components
  'MultiStepForm': lazy(() => import('./components/MultiStepForm')),
  'ContactForm': lazy(() => import('./components/ContactForm')),
};

/**
 * Register a new component at runtime.
 * Useful for dynamically added components or testing.
 * 
 * @param {string} name - Component name
 * @param {React.ComponentType | Promise<{default: React.ComponentType}>} component - Component or dynamic import
 */
export function registerComponent(name, component) {
  if (registry[name]) {
    console.warn(`[Registry] Overwriting existing component: ${name}`);
  }
  registry[name] = typeof component === 'function' && component.$$typeof 
    ? component 
    : lazy(() => Promise.resolve({ default: component }));
}
```

---

## 9. AEM Page Integration

**File:** `ui.apps/.../components/structure/page/customfooterlibs.html`

```html
<sly data-sly-use.clientlib="/libs/granite/sightly/templates/clientlib.html">
    <!--/* 
        Load the React Widget clientlib.
        
        This loads loader.js, which then bootstraps the ES Module application.
        The dependency on vendor code is handled internally by the modules.
    */-->
    <sly data-sly-call="${clientlib.js @ categories='my-project.react'}"/>
    
    <!--/* 
        CSS: Two options depending on your clientlib configuration
        
        Option 1: If CSS is in the standard 'css' folder:
        <sly data-sly-call="${clientlib.css @ categories='my-project.react'}"/>
        
        Option 2: If CSS is in 'resources' folder (current setup):
    */-->
    <link rel="stylesheet" 
          href="/etc.clientlibs/my-project/clientlibs/clientlib-react/resources/assets/main.css" 
          type="text/css">
</sly>
```

### 9.1 Alternative: CSS in Standard Location

If you prefer using `clientlib.css`, modify `clientlib.config.js`:

```javascript
assets: {
  resources: {
    cwd: BUILD_DIR,
    files: ['**/*.js'],  // Only JS files
    flatten: false,
  },
  css: {
    cwd: BUILD_DIR,
    files: ['assets/**/*.css'],
    flatten: false,
  },
}
```

Then use:

```html
<sly data-sly-call="${clientlib.css @ categories='my-project.react'}"/>
```

---

## 10. AEM Component HTML Contract

Each AEM component that uses a React widget must output a container element with specific data attributes.

### 10.1 Required HTML Structure

```html
<!-- AEM Component HTL Template: product-card.html -->
<sly data-sly-use.model="com.myproject.models.ProductCardModel">
    <div class="react-widget-container"
         data-widget-component="ProductCard"
         data-props='${model.propsJson}'
         data-lazy-hydrate="${properties.lazyLoad || 'false'}">
        
        <!--/* Server-side placeholder for CLS optimization */-->
        <div class="widget-skeleton">
            <div class="skeleton-image"></div>
            <div class="skeleton-text"></div>
        </div>
        
    </div>
</sly>
```

### 10.2 Data Attributes Reference

| Attribute | Required | Description |
|-----------|----------|-------------|
| `data-widget-component` | ✅ Yes | Component name matching registry key |
| `data-props` | ⚠️ Optional | JSON-encoded props object |
| `data-lazy-hydrate` | ⚠️ Optional | If `"true"`, mount only when in viewport |

### 10.3 Props JSON Example

```html
<div data-widget-component="ProductCard"
     data-props='{
       "sku": "ABC-123",
       "title": "Premium Widget",
       "price": 99.99,
       "currency": "USD",
       "theme": "dark",
       "showAddToCart": true
     }'>
</div>
```

---

## 11. Build & Deployment Workflow

### 11.1 Package.json Scripts

**File:** `ui.frontend/package.json`

```json
{
  "name": "my-project-react",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:clientlib": "vite build && clientlib --verbose",
    "preview": "vite preview",
    "lint": "eslint src/**/*.{js,jsx}",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "aem-clientlib-generator": "^1.8.0",
    "vite": "^5.0.0"
  }
}
```

### 11.2 Build Commands

```bash
# Development: Start Vite dev server with HMR
npm run dev

# Production: Build and generate clientlib
npm run build:clientlib

# This generates:
# ui.apps/src/main/content/jcr_root/apps/my-project/clientlibs/clientlib-react/
#   ├── resources/          (from Vite build)
#   │   ├── main.js
#   │   ├── vendor-abc123.js
#   │   ├── ProductCard-def456.js
#   │   └── assets/
#   │       └── main-xyz123.css
#   └── .content.xml        (generated)
```

### 11.3 Manual Files Checklist

After first clientlib generation, **manually create** these files (they won't be overwritten):

1. `clientlib-react/js/loader.js` - The ESM bridge script
2. `clientlib-react/js.txt` - Reference to loader.js

---

## 12. Troubleshooting Guide

### Issue: "Cannot use import statement outside a module"

**Cause:** `main.js` is being loaded as a standard script, not as a module.

**Solution:**

1. Verify `js/loader.js` exists and contains the correct code
2. Verify `js.txt` contains `loader.js`
3. Check that `loader.js` is generating the correct path to `resources/main.js`

### Issue: Lazy-loaded chunks fail to load (404)

**Cause:** Vite's `base` path is not set correctly.

**Solution:**

1. Ensure `base: './'` is in `vite.config.js`
2. Verify chunks are in the `resources/` folder
3. Check browser Network tab for the attempted path

### Issue: Widgets not mounting in AEM Author mode

**Cause:** WCM mode detection showing placeholder instead of widget.

**Solution:**

1. Switch to Preview mode to see the full widget
2. Or, modify the WCM mode check in `main.jsx` if you want full rendering in Edit mode

### Issue: Memory leaks in Author mode

**Cause:** React roots not being unmounted when AEM replaces DOM.

**Solution:**

1. Verify the MutationObserver is set up correctly
2. Check console for unmount logs when editing components

### Issue: Widget not found in registry

**Cause:** Component name mismatch or component not exported.

**Solution:**

1. Verify the `data-widget-component` value matches a key in `registry.js`
2. Ensure the component file has a default export

---

## Appendix A: Error Boundary Component

**File:** `ui.frontend/src/utils/ErrorBoundary.jsx`

```jsx
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[React] Error in widget "${this.props.widgetName}":`, error, errorInfo);
    
    // Optional: Send to error tracking service
    // errorTrackingService.log(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="react-widget-error" style={{
          padding: '20px',
          background: '#fff0f0',
          border: '1px solid #ffcccc',
          borderRadius: '4px',
          color: '#cc0000',
        }}>
          <strong>Widget Error</strong>
          <p>The "{this.props.widgetName}" widget encountered an error.</p>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Appendix B: CSS Skeleton Styles

**File:** `ui.frontend/src/styles/skeleton.css`

```css
/* Prevent CLS during widget loading */
.react-widget-container {
  min-height: 100px; /* Adjust based on expected widget size */
}

.widget-skeleton {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-image {
  background: #e0e0e0;
  height: 200px;
  border-radius: 4px;
}

.skeleton-text {
  background: #e0e0e0;
  height: 20px;
  margin-top: 10px;
  border-radius: 4px;
  width: 80%;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.react-widget-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  color: #666;
}

.react-widget-placeholder {
  padding: 20px;
  background: #f5f5f5;
  border: 2px dashed #ccc;
  text-align: center;
}
```

---

## 13. Sling Model Integration

This section covers how to pass data from AEM's backend (Sling Models) to React widgets via HTML data attributes.

### 13.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Data Flow                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  JCR Content    →    Sling Model    →    HTL Template           │
│  (Properties)        (Java/Kotlin)       (data-props JSON)      │
│                                                 │                │
│                                                 ↓                │
│                                          React Widget            │
│                                          (props object)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 13.2 Sling Model Implementation

**File:** `core/src/main/java/com/myproject/models/ProductCardModel.java`

```java
package com.myproject.models;

import com.adobe.cq.export.json.ComponentExporter;
import com.adobe.cq.export.json.ExporterConstants;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.apache.sling.models.annotations.injectorspecific.Self;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

@Model(
    adaptables = {SlingHttpServletRequest.class, Resource.class},
    adapters = {ProductCardModel.class, ComponentExporter.class},
    resourceType = ProductCardModel.RESOURCE_TYPE,
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
@Exporter(name = ExporterConstants.SLING_MODEL_EXPORTER_NAME, 
          extensions = ExporterConstants.SLING_MODEL_EXTENSION)
public class ProductCardModel implements ComponentExporter {

    public static final String RESOURCE_TYPE = "my-project/components/product-card";
    
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Self
    private SlingHttpServletRequest request;

    @ValueMapValue
    private String productId;

    @ValueMapValue
    private String title;

    @ValueMapValue
    private Double price;

    @ValueMapValue
    private String currency;

    @ValueMapValue
    private String theme;

    @ValueMapValue
    private Boolean showAddToCart;

    @ValueMapValue
    private Boolean lazyLoad;

    private String propsJson;

    @PostConstruct
    protected void init() {
        // Build props object for React
        Map<String, Object> props = new HashMap<>();
        props.put("productId", productId);
        props.put("title", title);
        props.put("price", price);
        props.put("currency", currency != null ? currency : "USD");
        props.put("theme", theme != null ? theme : "light");
        props.put("showAddToCart", showAddToCart != null ? showAddToCart : true);
        
        // Add current locale for i18n
        if (request != null && request.getLocale() != null) {
            props.put("locale", request.getLocale().toLanguageTag());
        }
        
        // Serialize to JSON
        try {
            this.propsJson = OBJECT_MAPPER.writeValueAsString(props);
        } catch (JsonProcessingException e) {
            this.propsJson = "{}";
        }
    }

    /**
     * Returns JSON string for use in data-props attribute
     */
    @JsonProperty("propsJson")
    public String getPropsJson() {
        return propsJson;
    }

    /**
     * Whether to use lazy hydration
     */
    public Boolean getLazyLoad() {
        return lazyLoad != null ? lazyLoad : false;
    }

    @Override
    public String getExportedType() {
        return RESOURCE_TYPE;
    }
}
```

### 13.3 HTL Template Using Sling Model

**File:** `ui.apps/.../components/product-card/product-card.html`

```html
<sly data-sly-use.model="com.myproject.models.ProductCardModel">
    <div class="product-card react-widget-container"
         data-widget-component="ProductCard"
         data-props="${model.propsJson @ context='unsafe'}"
         data-lazy-hydrate="${model.lazyLoad}">
        
        <!--/* SEO-friendly server-side content */-->
        <div class="widget-skeleton" aria-hidden="true">
            <div class="skeleton-image"></div>
            <div class="skeleton-text"></div>
        </div>
        
        <!--/* Noscript fallback for SEO and accessibility */-->
        <noscript>
            <p>Product: ${properties.title}</p>
            <p>Price: ${properties.price} ${properties.currency}</p>
        </noscript>
    </div>
</sly>
```

### 13.4 Security: Context Escaping

⚠️ **Important:** When using `@ context='unsafe'` for JSON, ensure your Sling Model properly sanitizes all input values to prevent XSS attacks.

**Safe patterns:**

```html
<!-- ✅ Safe: JSON from Sling Model with proper serialization -->
data-props="${model.propsJson @ context='unsafe'}"

<!-- ✅ Safe: Individual properties with scriptString context -->
data-props='{"title": "${properties.title @ context='scriptString'}"}'

<!-- ❌ UNSAFE: Direct property injection without escaping -->
data-props='{"title": "${properties.title}"}'
```

---

## 14. Shared State Management

While each React widget is an independent root, sometimes you need to share state between widgets on the same page.

### 14.1 Options Overview

| Approach | Best For | Complexity |
|----------|----------|------------|
| **URL/Query Params** | Filter state, pagination | Low |
| **Custom Events** | Simple cross-widget communication | Low |
| **Shared Context Store** | Complex shared state | Medium |
| **External State (Zustand)** | Large-scale state management | Medium |

### 14.2 Custom Events Pattern

**File:** `ui.frontend/src/utils/widgetEvents.js`

```javascript
/**
 * Widget Event Bus
 * Simple pub/sub for cross-widget communication
 */
const WIDGET_EVENT_PREFIX = 'react-widget:';

/**
 * Emit an event that other widgets can listen to
 */
export function emitWidgetEvent(eventName, detail) {
  const event = new CustomEvent(`${WIDGET_EVENT_PREFIX}${eventName}`, {
    detail,
    bubbles: true,
  });
  document.dispatchEvent(event);
}

/**
 * Subscribe to widget events
 * Returns cleanup function
 */
export function onWidgetEvent(eventName, callback) {
  const handler = (event) => callback(event.detail);
  document.addEventListener(`${WIDGET_EVENT_PREFIX}${eventName}`, handler);
  
  // Return cleanup function
  return () => {
    document.removeEventListener(`${WIDGET_EVENT_PREFIX}${eventName}`, handler);
  };
}

/**
 * React hook for widget events
 */
export function useWidgetEvent(eventName, callback) {
  React.useEffect(() => {
    return onWidgetEvent(eventName, callback);
  }, [eventName, callback]);
}
```

**Usage in Components:**

```jsx
// ProductCard.jsx - Emit event when product selected
import { emitWidgetEvent } from '../utils/widgetEvents';

function ProductCard({ productId }) {
  const handleSelect = () => {
    emitWidgetEvent('product:selected', { productId });
  };
  
  return <button onClick={handleSelect}>Select</button>;
}

// ShoppingCart.jsx - Listen for product selection
import { useWidgetEvent } from '../utils/widgetEvents';

function ShoppingCart() {
  const [items, setItems] = useState([]);
  
  useWidgetEvent('product:selected', ({ productId }) => {
    setItems(prev => [...prev, productId]);
  });
  
  return <div>Cart: {items.length} items</div>;
}
```

### 14.3 Zustand Store (For Complex State)

**File:** `ui.frontend/src/store/globalStore.js`

```javascript
import { create } from 'zustand';

/**
 * Global store shared across all React widgets
 */
export const useGlobalStore = create((set, get) => ({
  // Cart state
  cart: [],
  addToCart: (product) => set((state) => ({ 
    cart: [...state.cart, product] 
  })),
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(p => p.id !== productId)
  })),
  
  // User preferences
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  
  // Filters
  filters: {},
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),
}));
```

**Usage:**

```jsx
import { useGlobalStore } from '../store/globalStore';

function ProductCard({ product }) {
  const addToCart = useGlobalStore((state) => state.addToCart);
  const theme = useGlobalStore((state) => state.theme);
  
  return (
    <div className={`product-card theme-${theme}`}>
      <button onClick={() => addToCart(product)}>Add to Cart</button>
    </div>
  );
}
```

---

## 15. Analytics Integration

### 15.1 Adobe Analytics / Launch Integration

**File:** `ui.frontend/src/utils/analytics.js`

```javascript
/**
 * Analytics utility for React widgets
 * Integrates with Adobe Launch/Analytics via the data layer
 */

/**
 * Push event to Adobe Client Data Layer
 */
export function trackEvent(eventName, eventData = {}) {
  // Wait for data layer to be available
  window.adobeDataLayer = window.adobeDataLayer || [];
  
  window.adobeDataLayer.push({
    event: eventName,
    eventInfo: {
      ...eventData,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track component view (impression)
 */
export function trackComponentView(componentName, componentData = {}) {
  trackEvent('component-view', {
    component: {
      name: componentName,
      ...componentData,
    },
  });
}

/**
 * Track user interaction
 */
export function trackInteraction(action, target, additionalData = {}) {
  trackEvent('user-interaction', {
    action,
    target,
    ...additionalData,
  });
}

/**
 * React hook for tracking component views
 */
export function useTrackView(componentName, componentData) {
  React.useEffect(() => {
    trackComponentView(componentName, componentData);
  }, [componentName, JSON.stringify(componentData)]);
}
```

**Usage in Components:**

```jsx
import { useTrackView, trackInteraction } from '../utils/analytics';

function ProductCard({ productId, title, price }) {
  // Track when component comes into view
  useTrackView('ProductCard', { productId, title, price });
  
  const handleAddToCart = () => {
    // Track the interaction
    trackInteraction('click', 'add-to-cart', {
      productId,
      productTitle: title,
      productPrice: price,
    });
    
    // ... rest of add to cart logic
  };
  
  return (
    <button onClick={handleAddToCart}>Add to Cart</button>
  );
}
```

### 15.2 Google Tag Manager Integration

```javascript
/**
 * Push event to GTM data layer
 */
export function pushToDataLayer(event, data = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...data,
  });
}

// E-commerce tracking example
export function trackPurchase(transaction) {
  pushToDataLayer('purchase', {
    ecommerce: {
      transaction_id: transaction.id,
      value: transaction.total,
      currency: transaction.currency,
      items: transaction.items.map(item => ({
        item_id: item.sku,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    },
  });
}
```

---

## 16. Performance Optimization

### 16.1 Bundle Size Analysis

Add to `package.json`:

```json
{
  "scripts": {
    "build:analyze": "vite build && npx vite-bundle-analyzer dist/manifest.json"
  }
}
```

Or use Rollup plugin:

```javascript
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/bundle-stats.html',
      open: true,
    }),
  ],
});
```

### 16.2 Code Splitting Best Practices

**Per-Component Splitting:**

```javascript
// registry.js - Each component is a separate chunk
export const registry = {
  'ProductCard': lazy(() => import('./components/ProductCard')),
  'Calculator': lazy(() => import('./components/Calculator')),
};
```

**Feature-Based Splitting:**

```javascript
// For components that share dependencies, group them
export const registry = {
  // Charting components share chart.js - group into one chunk
  'BarChart': lazy(() => import('./features/charts')),
  'PieChart': lazy(() => import('./features/charts')),
  'LineChart': lazy(() => import('./features/charts')),
};
```

### 16.3 Preloading Critical Widgets

**In loader.js (for critical widgets):**

```javascript
// Preload critical widget chunks
function preloadCriticalChunks() {
  const criticalWidgets = document.querySelectorAll('[data-widget-component][data-critical="true"]');
  
  criticalWidgets.forEach(container => {
    const componentName = container.dataset.widgetComponent;
    // Create preload link
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = basePath + '/resources/' + componentName + '.js';
    document.head.appendChild(link);
  });
}
```

### 16.4 Performance Monitoring

**File:** `ui.frontend/src/utils/performance.js`

```javascript
/**
 * Performance monitoring for React widgets
 */

/**
 * Measure widget mount time
 */
export function measureMountTime(widgetName, startTime) {
  const duration = performance.now() - startTime;
  
  // Report to analytics
  if (window.performance && window.performance.measure) {
    performance.measure(`widget-mount-${widgetName}`, {
      start: startTime,
      duration,
    });
  }
  
  // Log if slow
  if (duration > 100) {
    console.warn(`[Performance] ${widgetName} took ${duration.toFixed(2)}ms to mount`);
  }
  
  return duration;
}

/**
 * Web Vitals tracking
 */
export function trackWebVitals() {
  if ('web-vital' in window) {
    import('web-vitals').then(({ getCLS, getFID, getLCP }) => {
      getCLS(console.log);
      getFID(console.log);
      getLCP(console.log);
    });
  }
}
```

---

## 17. Testing Strategy

### 17.1 Unit Testing with Vitest

**File:** `ui.frontend/vitest.config.js`

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

**File:** `ui.frontend/src/test/setup.js`

```javascript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock AEM-specific globals
global.Granite = undefined;
global.adobeDataLayer = [];
```

**Example Test:**

```jsx
// src/components/ProductCard/ProductCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductCard from './index';

describe('ProductCard', () => {
  const defaultProps = {
    productId: '123',
    title: 'Test Product',
    price: 99.99,
    currency: 'USD',
  };

  it('renders product title', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('formats price correctly', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('calls onAddToCart when button clicked', () => {
    const onAddToCart = vi.fn();
    render(<ProductCard {...defaultProps} onAddToCart={onAddToCart} />);
    
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    
    expect(onAddToCart).toHaveBeenCalledWith('123');
  });
});
```

### 17.2 Integration Testing with Cypress

**File:** `ui.frontend/cypress/e2e/product-card.cy.js`

```javascript
describe('ProductCard Widget', () => {
  beforeEach(() => {
    // Visit AEM page with the widget
    cy.visit('/content/my-project/en/products.html');
  });

  it('mounts React widget correctly', () => {
    // Check that React mounted
    cy.get('[data-widget-component="ProductCard"]')
      .should('have.attr', 'data-react-mounted', 'true');
  });

  it('displays product information', () => {
    cy.get('[data-widget-component="ProductCard"]')
      .should('contain', 'Product Title')
      .and('contain', '$99.99');
  });

  it('adds product to cart on click', () => {
    cy.get('[data-widget-component="ProductCard"] button')
      .contains('Add to Cart')
      .click();
    
    // Verify cart widget updated
    cy.get('[data-widget-component="ShoppingCart"]')
      .should('contain', '1 item');
  });
});
```

### 17.3 Widget Engine Testing

**File:** `ui.frontend/src/main.test.jsx`

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initWidgets, mountWidget, unmountWidget } from './main';

describe('Widget Engine', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <div data-widget-component="TestWidget" data-props='{"name": "test"}'></div>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('finds and mounts widgets', () => {
    initWidgets(container);
    
    const widget = container.querySelector('[data-widget-component]');
    expect(widget.dataset.reactMounted).toBe('true');
  });

  it('handles invalid props JSON gracefully', () => {
    container.innerHTML = `
      <div data-widget-component="TestWidget" data-props='invalid json'></div>
    `;
    
    const consoleSpy = vi.spyOn(console, 'error');
    initWidgets(container);
    
    expect(consoleSpy).toHaveBeenCalled();
  });
});
```

---

## 18. CI/CD Integration

### 18.1 GitHub Actions Workflow

**File:** `.github/workflows/build.yml`

```yaml
name: Build and Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: ui.frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: ui.frontend
        run: npm ci
      
      - name: Run linting
        working-directory: ui.frontend
        run: npm run lint
      
      - name: Run tests
        working-directory: ui.frontend
        run: npm run test -- --coverage
      
      - name: Build
        working-directory: ui.frontend
        run: npm run build:clientlib
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ui.frontend/coverage

  maven:
    runs-on: ubuntu-latest
    needs: frontend
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '11'
          cache: 'maven'
      
      - name: Build with Maven
        run: mvn clean install -B
```

### 18.2 Maven Integration

**File:** `ui.frontend/pom.xml` (excerpt)

```xml
<build>
    <plugins>
        <plugin>
            <groupId>com.github.eirslett</groupId>
            <artifactId>frontend-maven-plugin</artifactId>
            <version>1.14.0</version>
            
            <executions>
                <execution>
                    <id>install node and npm</id>
                    <goals><goal>install-node-and-npm</goal></goals>
                    <configuration>
                        <nodeVersion>v20.10.0</nodeVersion>
                    </configuration>
                </execution>
                
                <execution>
                    <id>npm install</id>
                    <goals><goal>npm</goal></goals>
                    <configuration>
                        <arguments>ci</arguments>
                    </configuration>
                </execution>
                
                <execution>
                    <id>npm build</id>
                    <goals><goal>npm</goal></goals>
                    <configuration>
                        <arguments>run build:clientlib</arguments>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

---

## 19. Security Considerations

### 19.1 XSS Prevention

**Never use `dangerouslySetInnerHTML` with user-provided content:**

```jsx
// ❌ UNSAFE
function UnsafeComponent({ htmlContent }) {
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}

// ✅ SAFE - Use a sanitizer
import DOMPurify from 'dompurify';

function SafeComponent({ htmlContent }) {
  const sanitized = DOMPurify.sanitize(htmlContent);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### 19.2 Content Security Policy (CSP)

If your AEM site uses CSP, ensure the React scripts are allowed:

**Dispatcher config:**

```
Header set Content-Security-Policy "script-src 'self' /etc.clientlibs/;"
```

**For dynamic script injection (loader.js), you may need:**

```
Header set Content-Security-Policy "script-src 'self' 'unsafe-inline' /etc.clientlibs/;"
```

Or use nonce-based CSP:

```javascript
// In loader.js, read nonce from a meta tag
var nonce = document.querySelector('meta[name="csp-nonce"]')?.content;
script.nonce = nonce;
```

### 19.3 API Security

**Always validate and sanitize API responses:**

```javascript
// utils/api.js
export async function fetchProduct(productId) {
  // Validate input
  if (!/^[a-zA-Z0-9-]+$/.test(productId)) {
    throw new Error('Invalid product ID format');
  }
  
  const response = await fetch(`/api/products/${productId}`);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Validate response structure
  if (!data.id || !data.title) {
    throw new Error('Invalid API response structure');
  }
  
  return data;
}
```

---

## 20. Internationalization (i18n)

### 20.1 Using react-intl

**File:** `ui.frontend/src/i18n/IntlProvider.jsx`

```jsx
import React from 'react';
import { IntlProvider as ReactIntlProvider } from 'react-intl';

// Import message bundles
import enMessages from './messages/en.json';
import esMessages from './messages/es.json';
import frMessages from './messages/fr.json';

const messages = {
  'en': enMessages,
  'en-US': enMessages,
  'es': esMessages,
  'es-ES': esMessages,
  'fr': frMessages,
  'fr-FR': frMessages,
};

export function IntlProvider({ locale, children }) {
  const normalizedLocale = locale || 'en';
  const languageMessages = messages[normalizedLocale] || messages['en'];
  
  return (
    <ReactIntlProvider 
      locale={normalizedLocale} 
      messages={languageMessages}
      defaultLocale="en"
    >
      {children}
    </ReactIntlProvider>
  );
}
```

**Wrapping widgets with IntlProvider:**

```jsx
// In main.jsx, wrap each widget with IntlProvider
root.render(
  <React.StrictMode>
    <ErrorBoundary widgetName={componentName}>
      <IntlProvider locale={props.locale}>
        <Suspense fallback={CONFIG.DEFAULT_FALLBACK}>
          <Component {...props} />
        </Suspense>
      </IntlProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
```

### 20.2 Passing Locale from AEM

**In HTL:**

```html
<div data-widget-component="ProductCard"
     data-props='{"locale": "${currentPage.language @ context='scriptString'}", ...}'>
</div>
```

**Or from request locale:**

```java
// In Sling Model
props.put("locale", request.getLocale().toLanguageTag());
```

---

## 21. Design System Integration

### 21.1 Wrapper Pattern for External Components

When integrating external design system components (like NBC Design System or UMA), use wrapper components to adapt props:

**File:** `ui.frontend/src/components/ProductCard/index.jsx`

```jsx
import React from 'react';
// Import from external design system
import { Card, Button, Typography } from '@nbc/design-system';

/**
 * ProductCard Wrapper
 * Adapts AEM props to NBC Design System component props
 */
export default function ProductCard({
  // AEM props
  productId,
  title,
  price,
  currency = 'USD',
  theme = 'light',
  showAddToCart = true,
  locale = 'en-US',
  // Event handlers
  onAddToCart,
}) {
  const formattedPrice = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(price);
  
  const handleAddToCart = () => {
    onAddToCart?.(productId);
  };
  
  return (
    <Card variant={theme === 'dark' ? 'elevated' : 'outlined'}>
      <Card.Header>
        <Typography variant="h3">{title}</Typography>
      </Card.Header>
      <Card.Body>
        <Typography variant="body1" color="primary">
          {formattedPrice}
        </Typography>
      </Card.Body>
      {showAddToCart && (
        <Card.Footer>
          <Button 
            variant="primary" 
            onClick={handleAddToCart}
            aria-label={`Add ${title} to cart`}
          >
            Add to Cart
          </Button>
        </Card.Footer>
      )}
    </Card>
  );
}
```

### 21.2 Theme Integration

**File:** `ui.frontend/src/context/ThemeContext.jsx`

```jsx
import React, { createContext, useContext } from 'react';
import { ThemeProvider as DesignSystemTheme } from '@nbc/design-system';

const ThemeContext = createContext({ theme: 'light' });

export function ThemeProvider({ theme = 'light', children }) {
  return (
    <ThemeContext.Provider value={{ theme }}>
      <DesignSystemTheme mode={theme}>
        {children}
      </DesignSystemTheme>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

---

## 22. Debugging Tips

### 22.1 Development Helpers

**File:** `ui.frontend/src/utils/debug.js`

```javascript
/**
 * Debug utilities for React widgets
 * Only active in development mode
 */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Log widget lifecycle events
 */
export function logWidgetEvent(widgetName, event, data = {}) {
  if (isDev) {
    console.log(
      `%c[Widget: ${widgetName}]%c ${event}`,
      'color: #0066cc; font-weight: bold',
      'color: inherit',
      data
    );
  }
}

/**
 * Expose widgets to window for debugging
 */
export function exposeToWindow(name, value) {
  if (isDev) {
    window.__REACT_WIDGETS__ = window.__REACT_WIDGETS__ || {};
    window.__REACT_WIDGETS__[name] = value;
  }
}

/**
 * Debug panel component
 */
export function WidgetDebugPanel({ widgetName, props }) {
  if (!isDev) return null;
  
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      background: 'rgba(0,0,0,0.8)',
      color: '#fff',
      padding: '4px 8px',
      fontSize: '10px',
      fontFamily: 'monospace',
      zIndex: 9999,
    }}>
      {widgetName}
    </div>
  );
}
```

### 22.2 Browser DevTools Integration

Add React DevTools support by ensuring development builds aren't stripped:

```javascript
// vite.config.js
export default defineConfig({
  define: {
    // Enable React DevTools in development
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});
```

### 22.3 Common Debug Commands

**In browser console:**

```javascript
// List all mounted widgets
document.querySelectorAll('[data-react-mounted="true"]')

// Get props of a widget
JSON.parse(document.querySelector('[data-widget-component="ProductCard"]').dataset.props)

// Force re-mount a widget
const container = document.querySelector('[data-widget-component="ProductCard"]');
delete container.dataset.reactMounted;
// Then trigger initWidgets

// Check if React is loaded
console.log('React version:', React.version);

// Check data layer events
console.log('Data Layer:', window.adobeDataLayer);
```

---

## Appendix C: Version Compatibility Matrix

| Package | Minimum Version | Recommended | Notes |
|---------|----------------|-------------|-------|
| React | 18.0.0 | 18.2.0+ | Required for `createRoot` API |
| React DOM | 18.0.0 | 18.2.0+ | Must match React version |
| Vite | 4.0.0 | 5.0.0+ | For ES Module output |
| Node.js | 18.0.0 | 20.x LTS | For build tooling |
| AEM | 6.5.10+ | AEMaaCS | For modern clientlib features |
| aem-clientlib-generator | 1.8.0 | 1.8.0+ | For resources folder support |

---

## Appendix D: Migration Guide

### From jQuery Widgets to React

**Step 1:** Identify widgets to migrate

```
- Complex state management? → Migrate
- Simple DOM manipulation? → Keep jQuery
- Heavy user interaction? → Migrate
```

**Step 2:** Create React equivalent without removing jQuery

```jsx
// Create new React component
// Keep jQuery version running
// A/B test if possible
```

**Step 3:** Gradual rollout

```html
<!-- Feature flag approach -->
<sly data-sly-test="${wcmmode.disabled && model.useReact}">
    <!-- React widget -->
</sly>
<sly data-sly-test="${wcmmode.disabled && !model.useReact}">
    <!-- jQuery widget -->
</sly>
```

**Step 4:** Remove jQuery version once stable

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial consolidated guide |
| 1.1 | Dec 2024 | Added Sling Model integration, state management, analytics, performance, testing, CI/CD, security, i18n, design system integration, debugging tips, compatibility matrix, and migration guide |
