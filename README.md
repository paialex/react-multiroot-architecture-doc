# React Integration Framework for AEM

> **A Multi-Root Mounting Architecture for Embedding React Widgets in AEM Pages**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646cff.svg)](https://vitejs.dev/)
[![AEM](https://img.shields.io/badge/AEM-Cloud%20Service-red.svg)](https://www.adobe.com/experience-manager/)

---

## Table of Contents

- [Overview](#overview)
- [Architecture Summary](#architecture-summary)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Creating a New React Component](#creating-a-new-react-component)
- [AEM Integration](#aem-integration)
- [Build & Deployment](#build--deployment)
- [Framework Components](#framework-components)
- [Wrapper Component Pattern](#wrapper-component-pattern)
- [Development Guidelines](#development-guidelines)
- [Troubleshooting](#troubleshooting)
- [Technical Reference](#technical-reference)

---

## Overview

This framework enables **React widgets** to be mounted as independent "islands" within AEM-rendered pages. It follows the **Islands Architecture** pattern where:

- **AEM** remains the primary host for page structure, SEO, and content authoring
- **React** provides interactive UI components ("widgets") that mount at specific DOM locations
- A **custom bridge layer** handles ES Module loading within AEM's clientlib constraints

### Key Benefits

| Benefit | Description |
|---------|-------------|
| **SEO Preserved** | AEM renders full HTML; React enhances, not replaces |
| **Fault Isolation** | Each widget is an independent React root—one crash doesn't affect others |
| **Lazy Loading** | Widget code downloaded only when component exists on page |
| **Optimal Caching** | Vendor bundle (React core) separated from app code |
| **Native Authoring** | Works with standard AEM dialogs and Page Editor |

---

## Architecture Summary

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

### Data Flow

1. **AEM renders HTML** with `data-widget-component` and `data-props` attributes
2. **`loader.js`** (standard JS) detects widgets and injects `<script type="module">`
3. **`main.tsx`** (Widget Engine) scans DOM and mounts React components
4. **`registry.ts`** maps component names to lazy-loaded React components
5. **Each widget** renders within an `ErrorBoundary` for fault isolation

---

## Project Structure

```
ui.frontend.react/
├── src/
│   ├── main.tsx              # Widget Engine - discovers & mounts components
│   ├── registry.ts           # Component registry (name → lazy component)
│   ├── loader.js             # ESM Bridge - injects module scripts
│   ├── types/
│   │   └── widget.types.ts   # TypeScript interfaces
│   ├── utils/
│   │   └── ErrorBoundary.tsx # Fault isolation component
│   ├── components/
│   │   ├── ProductCard/      # Example widget
│   │   │   ├── index.tsx
│   │   │   ├── ProductCard.types.ts
│   │   │   └── ProductCard.module.css
│   │   └── ...
│   └── styles/
│       └── main.css          # Global widget styles
├── dist/                     # Vite build output (ES Modules)
├── vite.config.ts            # Vite configuration
├── clientlib.config.js       # AEM Clientlib generator config
├── tsconfig.json             # TypeScript configuration
└── package.json
```

### After Build: AEM Clientlib Structure

```
ui.apps/.../clientlibs/clientlib-react/
├── js/
│   └── loader.js             # Loaded by AEM (standard JS)
├── js.txt                    # Points to loader.js
├── resources/                # ES Modules (served raw)
│   ├── main.js               # Widget Engine entry point
│   ├── react-[hash].js       # React/ReactDOM vendor bundle
│   ├── [Component]-[hash].js # Lazy-loaded component chunks
│   └── assets/
│       └── main.css          # Bundled styles
└── .content.xml              # JCR node definition
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **AEM as a Cloud Service** or AEM 6.5.x with Service Pack
- **Java** 11 or 17 (for Maven builds)

### Installation

```bash
# Navigate to the React frontend module
cd ui.frontend.react

# Install dependencies
npm install

# Run development server (standalone mode)
npm run dev

# Build for AEM
npm run build:clientlib
```

### NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build production bundle to `dist/` |
| `npm run build:clientlib` | Build + copy to AEM clientlib structure |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

---

## Creating a New React Component

### Step 1: Create the Component

Create a new directory under `src/components/`:

```
src/components/MyWidget/
├── index.tsx              # Main component (default export)
├── MyWidget.types.ts      # TypeScript interfaces
└── MyWidget.module.css    # Component styles (optional)
```

**`index.tsx`:**

```tsx
import type { BaseWidgetProps } from '../../types/widget.types';
import styles from './MyWidget.module.css';

interface MyWidgetProps extends BaseWidgetProps {
  title: string;
  description?: string;
  variant?: 'primary' | 'secondary';
}

export default function MyWidget({
  title,
  description,
  variant = 'primary',
}: MyWidgetProps): JSX.Element {
  return (
    <div className={`${styles.container} ${styles[variant]}`}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
```

### Step 2: Register in Registry

Add your component to `src/registry.ts`:

```typescript
import { lazy } from 'react';
import type { WidgetRegistry } from './types/widget.types';

export const registry: WidgetRegistry = {
  // Existing components
  'ProductCard': lazy(() => import('./components/ProductCard')),
  'Calculator': lazy(() => import('./components/Calculator')),
  
  // Add your new component
  'MyWidget': lazy(() => import('./components/MyWidget')),
};
```

> **Important:** The registry key (`'MyWidget'`) must match exactly the value used in AEM's `data-widget-component` attribute. It's case-sensitive.

### Step 3: Create AEM Component

In `ui.apps`, create the AEM component structure:

```
ui.apps/src/main/content/jcr_root/apps/[project]/components/my-widget/
├── _cq_dialog/
│   └── .content.xml      # Author dialog definition
├── my-widget.html        # HTL template
└── .content.xml          # Component node definition
```

**`.content.xml` (component node):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" 
          xmlns:cq="http://www.day.com/jcr/cq/1.0"
          jcr:primaryType="cq:Component"
          jcr:title="My Widget"
          componentGroup="[Project] - Content"/>
```

**`my-widget.html` (HTL template):**

```html
<sly data-sly-use.model="com.project.core.models.MyWidgetModel">
  <div class="react-widget-container"
       data-widget-component="MyWidget"
       data-props="${model.propsJson}">
    <!-- Skeleton loader shown until React mounts -->
    <div class="skeleton-loader">Loading...</div>
  </div>
</sly>
```

### Step 4: Create Sling Model

In `core` module, create the Sling Model:

```java
package com.project.core.models;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import com.google.gson.Gson;
import java.util.Map;
import java.util.HashMap;

@Model(adaptables = SlingHttpServletRequest.class)
public class MyWidgetModel {

    @ValueMapValue
    private String title;

    @ValueMapValue
    private String description;

    @ValueMapValue
    private String variant;

    public String getPropsJson() {
        Map<String, Object> props = new HashMap<>();
        props.put("title", title);
        props.put("description", description);
        props.put("variant", variant);
        return new Gson().toJson(props);
    }
}
```

### Step 5: Build & Deploy

```bash
# Build React bundle
cd ui.frontend.react
npm run build:clientlib

# Deploy to AEM
cd ..
mvn clean install -PautoInstallPackage
```

---

## AEM Integration

### Data Contract

Communication between AEM and React uses **data attributes**:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-widget-component` | Component name (registry key) | `"ProductCard"` |
| `data-props` | JSON-serialized props | `'{"sku":"123","theme":"dark"}'` |

### HTL Template Pattern

```html
<sly data-sly-use.model="com.project.models.WidgetModel">
  <div class="react-widget-container"
       data-widget-component="${model.componentName}"
       data-props="${model.propsJson}">
    <!-- Skeleton shown during load -->
    <div class="skeleton-loader">${model.loadingText @ i18n}</div>
  </div>
</sly>
```

### Clientlib Embedding

Include the React clientlib in your page template:

```html
<!-- In page's head or body -->
<sly data-sly-use.clientlib="/libs/granite/sightly/templates/clientlib.html">
  <sly data-sly-call="${clientlib.js @ categories='[project].react'}"/>
</sly>
```

### WCM Mode Detection

The widget engine detects AEM WCM modes and can render placeholders in Edit mode to avoid conflicts with AEM's edit overlays:

```tsx
// In main.tsx
function getWcmMode(): 'edit' | 'preview' | 'disabled' {
  if (typeof window.Granite?.author !== 'undefined') {
    return window.Granite.author?.active ? 'edit' : 'preview';
  }
  return 'disabled'; // Published mode
}
```

---

## Build & Deployment

### Build Pipeline Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐
│   Source    │───►│    Vite     │───►│   dist/ (ES Mods)   │
│  (.tsx/.ts) │    │  (Rollup)   │    │                     │
└─────────────┘    └─────────────┘    └─────────┬───────────┘
                                                │
                                    ┌───────────▼───────────┐
                                    │ aem-clientlib-generator│
                                    └───────────┬───────────┘
                                                │
                                    ┌───────────▼───────────┐
                                    │  ui.apps/clientlibs/  │
                                    │   clientlib-react/    │
                                    └───────────────────────┘
```

### Vite Configuration (`vite.config.ts`)

Key configuration points:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // CRITICAL: Ensures relative paths for dynamic imports
  base: './',
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
  
  build: {
    outDir: 'dist',
    manifest: true,
    cssCodeSplit: false,  // Single CSS file
    
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/main.tsx'),
      },
      output: {
        format: 'es',
        
        // Vendor splitting for caching
        manualChunks: {
          react: ['react', 'react-dom'],
        },
        
        // Naming patterns
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
      },
    },
  },
});
```

### Clientlib Generator (`clientlib.config.js`)

```javascript
module.exports = {
  clientLibRoot: '../ui.apps/src/main/content/jcr_root/apps/[project]/clientlibs',
  
  libs: [{
    name: 'clientlib-react',
    allowProxy: true,
    categories: ['[project].react'],
    
    // Disable AEM processing (Vite already optimized)
    jsProcessor: ['default:none', 'min:none'],
    cssProcessor: ['default:none', 'min:none'],
    
    assets: {
      // Loader goes to js/ folder
      js: {
        cwd: 'src',
        files: ['loader.js'],
      },
      
      // Vite output goes to resources/ folder
      resources: {
        cwd: 'dist',
        files: ['**/*'],
        flatten: false,
      },
    },
  }],
};
```

---

## Framework Components

### 1. Loader Script (`loader.js`)

**Purpose:** Bridges AEM's standard script loading with ES Modules.

**Key responsibilities:**

- Detects if any widgets exist on page (skips load if none)
- Resolves the clientlib base path (handles versioned URLs)
- Injects `<script type="module">` pointing to `main.js`
- Loads CSS from resources folder
- Adds preload hints for performance

```javascript
(function() {
  'use strict';
  
  var WIDGET_SELECTOR = '[data-widget-component]';
  
  // Skip if no widgets (performance optimization)
  if (!document.querySelector(WIDGET_SELECTOR)) {
    if (!window.Granite?.author) return;
  }
  
  var basePath = getClientlibBasePath();
  loadScript(basePath + '/resources/main.js', 'module');
  loadCSS(basePath + '/resources/assets/main.css');
})();
```

### 2. Widget Engine (`main.tsx`)

**Purpose:** Discovers widget containers and mounts React components.

**Key responsibilities:**

- Scans DOM for `[data-widget-component]` elements
- Looks up components in registry
- Parses JSON props from `data-props`
- Creates React roots with ErrorBoundary wrapping
- Handles cleanup via MutationObserver

```tsx
const WIDGET_SELECTOR = '[data-widget-component]';
const activeRoots = new Map<HTMLElement, Root>();

function mountWidget(container: HTMLElement): void {
  if (activeRoots.has(container)) return;
  
  const componentName = container.dataset.widgetComponent;
  const Component = registry[componentName];
  
  if (!Component) {
    console.warn(`[Widget Engine] "${componentName}" not in registry`);
    return;
  }
  
  const props = JSON.parse(container.dataset.props || '{}');
  const root = createRoot(container);
  
  root.render(
    <ErrorBoundary widgetName={componentName}>
      <Suspense fallback={<div>Loading...</div>}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
  
  activeRoots.set(container, root);
}
```

### 3. Component Registry (`registry.ts`)

**Purpose:** Maps string names to lazy-loaded React components.

```typescript
import { lazy } from 'react';
import type { WidgetRegistry } from './types/widget.types';

export const registry: WidgetRegistry = {
  'ProductCard': lazy(() => import('./components/ProductCard')),
  'Calculator': lazy(() => import('./components/Calculator')),
  'SearchWidget': lazy(() => import('./components/SearchWidget')),
};
```

### 4. Error Boundary (`ErrorBoundary.tsx`)

**Purpose:** Prevents one widget's error from crashing the entire page.

```tsx
export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[${this.props.widgetName}] Error:`, error);
    // Send to error tracking (Sentry, DataDog, etc.)
  }
  
  render() {
    if (this.state.hasError) {
      return <div className="widget-error">Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

---

## Wrapper Component Pattern

When integrating shared component libraries (e.g., NBC Design System, UMA), create **wrapper components** that adapt AEM dialog props to the library's interface:

```tsx
// src/components/NBCButton/index.tsx
import { Button } from '@nbc/design-system';
import type { BaseWidgetProps } from '../../types/widget.types';

interface NBCButtonProps extends BaseWidgetProps {
  buttonLabel: string;
  buttonVariant?: 'primary' | 'secondary' | 'ghost';
  buttonLink?: string;
  openInNewTab?: boolean;
}

export default function NBCButton({
  buttonLabel,
  buttonVariant = 'primary',
  buttonLink,
  openInNewTab = false,
}: NBCButtonProps): JSX.Element {
  
  const handleClick = () => {
    if (buttonLink) {
      window.open(buttonLink, openInNewTab ? '_blank' : '_self');
    }
  };

  return (
    <Button variant={buttonVariant} onClick={handleClick}>
      {buttonLabel}
    </Button>
  );
}
```

### Why Wrappers?

| Challenge | Solution |
|-----------|----------|
| AEM dialogs output JSON strings | Wrapper parses and transforms to typed props |
| Design system expects specific prop names | Wrapper maps AEM field names to DS prop names |
| Design system has required props | Wrapper provides defaults for optional fields |
| Multiple DS components per widget | Wrapper composes components together |

---

## Development Guidelines

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Widget component name | PascalCase | `ProductCard` |
| Registry key | Matches component name | `'ProductCard'` |
| AEM component folder | kebab-case | `product-card/` |
| HTL data attribute | Matches registry key | `data-widget-component="ProductCard"` |
| CSS module file | Component name | `ProductCard.module.css` |

### TypeScript Types

Always extend `BaseWidgetProps` for widget props:

```typescript
// types/widget.types.ts
export interface BaseWidgetProps {
  className?: string;
}

export type WidgetRegistry = Record<string, React.LazyExoticComponent<React.ComponentType<any>>>;

export type WidgetContainer = HTMLElement & {
  dataset: {
    widgetComponent: string;
    props?: string;
  };
};
```

### Widget State Isolation

**Principle:** Each widget is completely isolated—including its React context, state, and providers.

❌ **Don't:** Share state between widgets using global Redux or shared Context  
✅ **Do:** Each widget manages its own state; use CustomEvents for rare cross-widget communication

### Performance Best Practices

1. **Lazy load all components** using `React.lazy()` in the registry
2. **Use Suspense boundaries** with meaningful fallback UI
3. **Avoid large dependencies** in frequently-used widgets
4. **Leverage vendor splitting** to cache React core separately
5. **Skip loading** when no widgets exist on page (handled by loader)

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `SyntaxError: Cannot use import statement outside a module` | ES Module loaded without `type="module"` | Ensure `loader.js` is properly injecting the script |
| Widget shows "Loading..." forever | Component not in registry or import failed | Check registry key matches `data-widget-component` |
| Widget not mounting | Container missing required data attributes | Verify `data-widget-component` and `data-props` are present |
| Props undefined in component | JSON parsing error | Check `data-props` contains valid JSON |
| Styles not loading | CSS not bundled or path incorrect | Verify `main.css` is in resources/assets/ |

### Debug Mode

Enable verbose logging in browser console:

```javascript
localStorage.setItem('REACT_WIDGET_DEBUG', 'true');
```

### Checking Widget Registry

In browser console:

```javascript
// View all registered components
console.log(window.__WIDGET_REGISTRY__);

// Check if specific component exists
console.log(window.__WIDGET_REGISTRY__['ProductCard']);
```

---

## Technical Reference

### Browser Compatibility

ES Modules are supported in:

- Chrome 61+
- Firefox 60+
- Safari 10.1+
- Edge 16+

> **IE11 is not supported** (ES Modules not available; IE11 reached end-of-life June 2022)

### Performance Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| React core bundle | ~45KB gzipped | Cached via vendor splitting |
| Individual widget chunk | <25KB gzipped | Lazy loaded on demand |
| Time to Interactive (TTI) | +50-200ms | Varies by widget complexity |

### Key Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Build configuration, code splitting, output format |
| `tsconfig.json` | TypeScript compiler options |
| `clientlib.config.js` | AEM clientlib generation |
| `.content.xml` | JCR node properties for clientlib |

### External Resources

- [React 18 createRoot API](https://react.dev/reference/react-dom/client/createRoot)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Vite Documentation](https://vitejs.dev/guide/)
- [AEM Client Libraries](https://experienceleague.adobe.com/docs/experience-manager-65/developing/introduction/clientlibs.html)
- [Islands Architecture](https://jasonformat.com/islands-architecture/)

---

## License

[Specify your license here]

---

*For the full technical design document with diagrams and decision rationale, see [`gemini/poc_technical_design_enhanced.md`](./gemini/poc_technical_design_enhanced.md).*
