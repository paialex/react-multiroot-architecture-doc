# React-AEM Integration Setup Checklist

> **Purpose:** Step-by-step implementation guide for integrating React widgets into AEM  
> **Time Estimate:** 2-4 hours for initial setup  
> **Prerequisites:** Existing AEM project with ui.frontend and ui.apps modules

---

## Quick Reference

- ✅ = Required step
- ⚠️ = Important configuration
- 📝 = Manual file creation
- 🔄 = Repeatable for each component

---

## Phase 1: Project Setup (ui.frontend)

### Step 1.1: Initialize React in ui.frontend

```bash
cd ui.frontend
```

**✅ 1.1.1 - Install dependencies**

```bash
npm install react react-dom
npm install -D vite @vitejs/plugin-react aem-clientlib-generator
```

**✅ 1.1.2 - Verify package.json**

Ensure your `package.json` has these scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:clientlib": "vite build && clientlib --verbose",
    "preview": "vite preview"
  }
}
```

---

### Step 1.2: Create Source Directory Structure

**✅ 1.2.1 - Create folder structure**

```bash
mkdir -p src/components
mkdir -p src/utils
mkdir -p src/styles
```

**✅ 1.2.2 - Final structure should be:**

```
ui.frontend/
├── src/
│   ├── main.jsx           # Widget Engine (create in Step 1.4)
│   ├── registry.js        # Component registry (create in Step 1.5)
│   ├── components/        # React widgets
│   ├── utils/
│   │   └── ErrorBoundary.jsx
│   └── styles/
│       └── skeleton.css
├── vite.config.js         # (create in Step 1.3)
├── clientlib.config.js    # (create in Step 2.1)
└── package.json
```

---

### Step 1.3: Create Vite Configuration

**✅ 1.3.1 - Create `vite.config.js`**

📝 **File:** `ui.frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // ⚠️ CRITICAL: Ensures lazy-loaded chunks use relative paths
  base: './',
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
    
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/main.jsx'),
      },
      output: {
        // ⚠️ CRITICAL: Force ES Module format
        format: 'es',
        
        // ⚠️ IMPORTANT: Vendor splitting for caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
        
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
});
```

**⚠️ Configuration Checklist:**

- [ ] `base: './'` is set
- [ ] `format: 'es'` is set
- [ ] `manualChunks` includes `react` and `react-dom`
- [ ] Entry point is `src/main.jsx`

---

### Step 1.4: Create Widget Engine

**✅ 1.4.1 - Create `main.jsx`**

📝 **File:** `ui.frontend/src/main.jsx`

```jsx
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { registry } from './registry';
import { ErrorBoundary } from './utils/ErrorBoundary';

// Configuration
const WIDGET_SELECTOR = '[data-widget-component]';
const activeRoots = new WeakMap();

// WCM Mode Detection
function getWCMMode() {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith('wcmmode=')) {
      return cookie.substring(8);
    }
  }
  return document.body.dataset.wcmmode || 'disabled';
}

// Mount Widget
function mountWidget(container) {
  if (activeRoots.has(container)) return;
  
  const componentName = container.dataset.widgetComponent;
  if (!componentName) return;
  
  const Component = registry[componentName];
  if (!Component) {
    console.warn(`[React] Component "${componentName}" not found in registry.`);
    return;
  }
  
  let props = {};
  try {
    props = JSON.parse(container.dataset.props || '{}');
  } catch (e) {
    console.error(`[React] Invalid props JSON for "${componentName}":`, e);
    return;
  }
  
  // Edit mode placeholder
  if (getWCMMode() === 'edit') {
    container.innerHTML = `
      <div style="padding:20px;background:#f5f5f5;border:2px dashed #ccc;text-align:center;">
        <strong>${componentName}</strong><br>
        <small>Switch to Preview to see widget</small>
      </div>
    `;
    return;
  }
  
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ErrorBoundary widgetName={componentName}>
          <Suspense fallback={<div>Loading...</div>}>
            <Component {...props} />
          </Suspense>
        </ErrorBoundary>
      </React.StrictMode>
    );
    activeRoots.set(container, root);
  } catch (e) {
    console.error(`[React] Failed to mount "${componentName}":`, e);
  }
}

// Initialize
function initWidgets(scope = document) {
  scope.querySelectorAll(WIDGET_SELECTOR).forEach(mountWidget);
}

// Cleanup observer
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.removedNodes.forEach((node) => {
      if (node.nodeType === 1 && activeRoots.has(node)) {
        activeRoots.get(node).unmount();
        activeRoots.delete(node);
      }
    });
  });
});

// Entry point
function initialize() {
  initWidgets(document);
  observer.observe(document.body, { childList: true, subtree: true });
  
  // AEM Author mode support
  if (window.Granite?.author) {
    document.addEventListener('cq-contentloaded', (e) => initWidgets(e.target || document));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

export { initWidgets, mountWidget };
```

---

### Step 1.5: Create Component Registry

**✅ 1.5.1 - Create `registry.js`**

📝 **File:** `ui.frontend/src/registry.js`

```javascript
import { lazy } from 'react';

/**
 * Component Registry
 * Add your React widgets here.
 * Keys must match the data-widget-component attribute in AEM.
 */
export const registry = {
  // Example: 'ComponentName': lazy(() => import('./components/ComponentName')),
};
```

---

### Step 1.6: Create Error Boundary

**✅ 1.6.1 - Create `ErrorBoundary.jsx`**

📝 **File:** `ui.frontend/src/utils/ErrorBoundary.jsx`

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
    console.error(`[React] Error in "${this.props.widgetName}":`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:'20px',background:'#fff0f0',border:'1px solid #fcc',color:'#c00'}}>
          <strong>Widget Error</strong>
          <p>The "{this.props.widgetName}" widget encountered an error.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## Phase 2: Clientlib Configuration

> ⚠️ **Important:** The clientlib generator regenerates the entire clientlib folder on each build.
> To prevent files from being deleted, we include `loader.js` in the frontend source.

### Step 2.1: Create Loader Script in Frontend Source

**✅ 2.1.1 - Create `loader.js` in src folder**

📝 **File:** `ui.frontend/src/loader.js`

```javascript
/**
 * React Widget Loader (ESM Bridge)
 * This file is part of the build process - do not use import/export syntax.
 */
(function() {
  'use strict';
  
  // ⚠️ UPDATE THESE FOR YOUR PROJECT
  var CLIENTLIB_NAME = 'clientlib-react';
  var PROJECT_NAME = 'YOUR-PROJECT';
  
  /**
   * Resolve clientlib base path.
   * Handles standard paths AND versioned/minified paths like:
   * /etc.clientlibs/project/clientlibs/clientlib-react.[lc-hash].min.js
   */
  function getClientlibBasePath() {
    var currentScript = document.currentScript;
    var src = currentScript ? currentScript.src : null;
    
    if (!src) {
      var scripts = document.querySelectorAll('script[src*="' + CLIENTLIB_NAME + '"]');
      if (scripts.length > 0) {
        src = scripts[scripts.length - 1].src;
      }
    }
    
    if (!src) {
      return '/etc.clientlibs/' + PROJECT_NAME + '/clientlibs/' + CLIENTLIB_NAME;
    }
    
    var url = new URL(src, window.location.origin);
    var pathname = url.pathname;
    
    // Standard path: /clientlib-react/js/loader.js
    var standardMatch = pathname.match(new RegExp('(.*/' + CLIENTLIB_NAME + ')/js/'));
    if (standardMatch) {
      return url.origin + standardMatch[1];
    }
    
    // Versioned path: /clientlib-react.[hash].min.js or /clientlib-react.min.js
    var versionedMatch = pathname.match(new RegExp('(.*/' + CLIENTLIB_NAME + ')[\\.\\[]'));
    if (versionedMatch) {
      return url.origin + versionedMatch[1];
    }
    
    // Fallback: find clientlib name in path
    var idx = pathname.indexOf('/' + CLIENTLIB_NAME);
    if (idx !== -1) {
      return url.origin + pathname.substring(0, idx + CLIENTLIB_NAME.length + 1);
    }
    
    return '/etc.clientlibs/' + PROJECT_NAME + '/clientlibs/' + CLIENTLIB_NAME;
  }
  
  function loadReactApp() {
    var basePath = getClientlibBasePath();
    var modulePath = basePath + '/resources/main.js';
    
    console.log('[React Loader] Loading from:', modulePath);
    
    var script = document.createElement('script');
    script.type = 'module';
    script.src = modulePath;
    script.onerror = function() {
      console.error('[React Loader] Failed to load:', modulePath);
    };
    document.body.appendChild(script);
  }
  
  loadReactApp();
})();
```

---

### Step 2.2: Configure Clientlib Generator

**✅ 2.2.1 - Create `clientlib.config.js`**

📝 **File:** `ui.frontend/clientlib.config.js`

```javascript
const path = require('path');

// ⚠️ UPDATE THESE PATHS FOR YOUR PROJECT
const BUILD_DIR = path.join(__dirname, 'dist');
const STATIC_DIR = path.join(__dirname, 'src');  // For loader.js
const CLIENTLIB_DIR = path.join(
  __dirname,
  '../ui.apps/src/main/content/jcr_root/apps/YOUR-PROJECT/clientlibs'  // ← Change this!
);

module.exports = {
  context: __dirname,
  clientLibRoot: CLIENTLIB_DIR,
  
  libs: [
    {
      name: 'clientlib-react',
      allowProxy: true,
      categories: ['YOUR-PROJECT.react'],  // ← Change this!
      serializationFormat: 'xml',
      jsProcessor: ['default:none', 'min:none'],
      cssProcessor: ['default:none', 'min:none'],
      
      assets: {
        // 1. Loader script → goes to 'js' folder (loaded by AEM)
        js: {
          cwd: STATIC_DIR,
          files: ['loader.js'],
          flatten: true,
        },
        
        // 2. Vite build output → goes to 'resources' folder
        resources: {
          cwd: BUILD_DIR,
          files: ['**/*'],
          flatten: false,
        },
      },
    },
  ],
};
```

**⚠️ Configuration Checklist:**

- [ ] `CLIENTLIB_DIR` path updated for your project
- [ ] `STATIC_DIR` points to `src` folder (for loader.js)
- [ ] `categories` updated to match your project naming convention
- [ ] `js` asset maps `loader.js` from src folder
- [ ] `resources` asset maps Vite output

---

### Step 2.3: Run Initial Build

**✅ 2.3.1 - Build and generate clientlib**

```bash
cd ui.frontend
npm run build:clientlib
```

**✅ 2.3.2 - Verify output**

Check that these files were created:

```
ui.apps/src/main/content/jcr_root/apps/YOUR-PROJECT/clientlibs/
└── clientlib-react/
    ├── js/                    ← Generated (from src/loader.js)
    │   └── loader.js
    ├── js.txt                 ← Generated
    ├── resources/             ← Generated (from dist/)
    │   ├── main.js
    │   ├── vendor-[hash].js
    │   └── assets/
    │       └── main-[hash].css (if you have CSS)
    └── .content.xml           ← Generated
```

**✅ All files are now generated!** No manual file creation needed.

---

### Step 2.4: Updated Project Structure

After setup, your structure should be:

```
ui.frontend/
├── src/
│   ├── main.jsx              # Widget Engine entry point
│   ├── loader.js             # ESM Bridge (copied to clientlib/js/)
│   ├── registry.js
│   ├── components/
│   └── utils/
│       └── ErrorBoundary.jsx
├── dist/                     # Vite build output
├── vite.config.js
├── clientlib.config.js
└── package.json
```

---

## Phase 3: AEM Page Integration

### Step 3.1: Add Clientlib to Page Template

**✅ 3.1.1 - Update customfooterlibs.html (or equivalent)**

**File:** `ui.apps/.../components/structure/page/customfooterlibs.html`

```html
<sly data-sly-use.clientlib="/libs/granite/sightly/templates/clientlib.html">
    <!-- Load React Widget Clientlib -->
    <sly data-sly-call="${clientlib.js @ categories='YOUR-PROJECT.react'}"/>
    
    <!-- CSS from resources folder -->
    <link rel="stylesheet" 
          href="/etc.clientlibs/YOUR-PROJECT/clientlibs/clientlib-react/resources/assets/main.css" 
          type="text/css">
</sly>
```

**⚠️ Update the category and paths for your project!**

---

## Phase 5: Create Your First Widget

### Step 5.1: Create a Sample Component

**🔄 5.1.1 - Create component folder**

```bash
mkdir -p ui.frontend/src/components/HelloWorld
```

**🔄 5.1.2 - Create component file**

**File:** `ui.frontend/src/components/HelloWorld/index.jsx`

```jsx
import React, { useState } from 'react';

export default function HelloWorld({ name = 'World', theme = 'light' }) {
  const [count, setCount] = useState(0);
  
  const styles = {
    container: {
      padding: '20px',
      borderRadius: '8px',
      background: theme === 'dark' ? '#333' : '#f0f0f0',
      color: theme === 'dark' ? '#fff' : '#333',
      fontFamily: 'sans-serif',
    },
    button: {
      marginTop: '10px',
      padding: '10px 20px',
      borderRadius: '4px',
      border: 'none',
      background: '#0066cc',
      color: 'white',
      cursor: 'pointer',
    },
  };
  
  return (
    <div style={styles.container}>
      <h2>Hello, {name}!</h2>
      <p>This is a React widget running in AEM.</p>
      <p>Count: {count}</p>
      <button style={styles.button} onClick={() => setCount(c => c + 1)}>
        Click me!
      </button>
    </div>
  );
}
```

---

### Step 5.2: Register the Component

**🔄 5.2.1 - Update registry.js**

**File:** `ui.frontend/src/registry.js`

```javascript
import { lazy } from 'react';

export const registry = {
  'HelloWorld': lazy(() => import('./components/HelloWorld')),
  // Add more components here...
};
```

---

### Step 5.3: Create AEM Component

**🔄 5.3.1 - Create the AEM component structure**

```
ui.apps/.../components/content/hello-world/
├── _cq_dialog/
│   └── .content.xml
├── hello-world.html
└── .content.xml
```

**🔄 5.3.2 - Create HTL template**

**File:** `.../components/content/hello-world/hello-world.html`

```html
<sly data-sly-use.model="com.adobe.cq.wcm.core.components.models.Component">
    <div class="react-widget-container"
         data-widget-component="HelloWorld"
         data-props='{"name": "${properties.name @ context='scriptString'}", "theme": "${properties.theme @ context='scriptString'}"}'>
        
        <!-- Server-side loading placeholder -->
        <div class="widget-skeleton">Loading widget...</div>
    </div>
</sly>
```

---

### Step 5.4: Build and Deploy

**✅ 5.4.1 - Rebuild the frontend**

```bash
cd ui.frontend
npm run build:clientlib
```

**✅ 5.4.2 - Deploy to AEM**

```bash
cd ..
mvn clean install -PautoInstallSinglePackage
```

---

## Phase 6: Verification Checklist

### Step 6.1: Verify in Browser

**✅ 6.1.1 - Open browser DevTools Network tab**

Check that these requests succeed:

- [ ] `/etc.clientlibs/.../clientlib-react/js/loader.js` (200 OK)
- [ ] `/etc.clientlibs/.../clientlib-react/resources/main.js` (200 OK)
- [ ] `/etc.clientlibs/.../clientlib-react/resources/vendor-[hash].js` (200 OK)

**✅ 6.1.2 - Check for console errors**

- [ ] No "Cannot use import statement outside a module" error
- [ ] No "Component not found in registry" warnings
- [ ] No 404 errors for chunk files

**✅ 6.1.3 - Verify widget rendering**

- [ ] Widget renders correctly on published page
- [ ] Widget shows placeholder in Edit mode
- [ ] Widget is interactive (click handlers work)

---

## Quick Troubleshooting

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| "Cannot use import" error | loader.js not working | Check js.txt and loader.js paths |
| 404 on chunk files | Missing `base: './'` | Add to vite.config.js |
| Widget not found | Registry mismatch | Check component name matches |
| Widget never mounts | Wrong selector | Verify `data-widget-component` |
| Memory leaks in author | MutationObserver missing | Check main.jsx has observer |

---

## Adding New Widgets (Repeatable Steps)

For each new React widget:

1. **Create component:** `ui.frontend/src/components/YourWidget/index.jsx`
2. **Register it:** Add to `ui.frontend/src/registry.js`
3. **Create AEM component:** With HTL using `data-widget-component`
4. **Rebuild:** `npm run build:clientlib`
5. **Deploy:** `mvn clean install -PautoInstallSinglePackage`

---

## File Checklist Summary

### Generated Files (by build process)

- [ ] `clientlib-react/js/loader.js` (from `src/loader.js`)
- [ ] `clientlib-react/js.txt`
- [ ] `clientlib-react/resources/main.js`
- [ ] `clientlib-react/resources/vendor-[hash].js`
- [ ] `clientlib-react/.content.xml`

### Source Files (in ui.frontend/src/)

- [ ] `ui.frontend/src/loader.js` - ESM Bridge script
- [ ] `ui.frontend/src/main.jsx` - Widget Engine
- [ ] `ui.frontend/src/registry.js` - Component registry
- [ ] `ui.frontend/src/utils/ErrorBoundary.jsx`

### Configuration Files

- [ ] `ui.frontend/vite.config.js`
- [ ] `ui.frontend/clientlib.config.js`

---

## Next Steps After Setup

1. **Add more widgets** following the repeatable steps above
2. **Configure CI/CD** to run `npm run build:clientlib` during builds
3. **Add unit tests** for React components with Vitest
4. **Consider adding:**
   - Shared context/state management
   - Design system integration
   - Analytics tracking hooks
