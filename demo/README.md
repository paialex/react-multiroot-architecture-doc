# AEM React Integration Demo

## Overview

This project is a Proof of Concept (POC) demonstrating the "Multi-Root Mounting Strategy" for integrating React.js components into a static HTML page, simulating an Adobe Experience Manager (AEM) environment. It showcases how independent React widgets can coexist and function within a server-rendered page, leveraging modern React 19 features, **TypeScript** for type safety, and Vite for an optimized build.

The demo includes:

* A static `static.html` file acting as the AEM-rendered page.
* Two interactive React widgets: a `ProductCard` and a `Calculator`.
* A "Widget Engine" (mount script) that discovers and initializes these widgets.
* **TypeScript** for full type safety and improved developer experience.
* A Vite build pipeline to bundle and transpile TypeScript/React assets.
* Tailwind CSS for basic styling.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| React 19 | Component-based UI library |
| TypeScript | Type-safe development |
| Vite | Fast build tool with HMR |
| TailwindCSS | Utility-first CSS framework |

## How to Run

Follow these steps to set up and run the demo locally:

1. **Navigate to the Demo Directory:**

    ```bash
    cd demo
    ```

2. **Install Dependencies:**

    ```bash
    npm install
    ```

3. **Start the Development Server:**

    ```bash
    npm run dev
    ```

    This will start the Vite development server. It will provide a local URL (e.g., `http://localhost:5173`).

4. **Open `static.html`:**
    Open your web browser and navigate to the `static.html` file *served by the Vite dev server*. The URL will typically be `http://localhost:5173/static.html`.

    * **Important:** Do NOT open `static.html` directly from your file system (`file:///...`), as this can cause issues with module imports and Vite's dev server.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Type check and build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Run TypeScript type checking |

## Key Files

| File | Description |
|------|-------------|
| `static.html` | The mock AEM page containing static content and React widget containers |
| `src/main.tsx` | The "Widget Engine" responsible for discovering, mounting, and managing React widgets |
| `src/registry.ts` | The central registry mapping widget names to React components (using `React.lazy`) |
| `src/types/widget.types.ts` | TypeScript type definitions for all widgets and framework interfaces |
| `src/components/ProductCard.tsx` | A simple React product card widget |
| `src/components/Calculator.tsx` | A simple React tax calculator widget |
| `vite.config.ts` | Vite configuration for bundling the React/TypeScript application |
| `tsconfig.json` | TypeScript compiler configuration |
| `package.json` | Project dependencies and scripts |

## Project Structure

```
demo/
├── src/
│   ├── components/
│   │   ├── ProductCard.tsx    # Product card widget
│   │   └── Calculator.tsx     # Tax calculator widget
│   ├── types/
│   │   └── widget.types.ts    # Shared TypeScript interfaces
│   ├── main.tsx               # Widget Engine entry point
│   └── registry.ts            # Component registry
├── dist/                      # Production build output
├── static.html                # Mock AEM page
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## Verification Steps

Once `static.html` is open in your browser via the Vite dev server:

1. **Observe Initial Load:**
    * You should see the "AEM Site (Static Mock)" header, static text, and two grey "Loading..." skeleton boxes where the React widgets will appear. This demonstrates the server-rendered placeholder and client-side hydration.
2. **Widget Interactivity:**
    * **Product Card:** Click the "Add to Cart" button. It should change to "Added to Cart ✓" and back.
    * **Calculator:** Change the "Base Amount". The Tax and Total fields should update dynamically.
3. **Console Output:**
    * Open your browser's developer console. You should see `[Widget Engine] Mounted ProductCard` and `[Widget Engine] Mounted Calculator` messages, confirming successful initialization.
    * Look for any warnings or errors. There should be none.
4. **Network Tab (Optional):**
    * If you refresh the page and observe the Network tab, you might see separate JavaScript chunks being loaded for `ProductCard` and `Calculator`, demonstrating `React.lazy` in action (depending on browser caching and network conditions).

## TypeScript Benefits

The migration to TypeScript provides:

* **Type Safety:** Catch errors at compile time rather than runtime
* **Better IDE Support:** Autocomplete, refactoring, and inline documentation
* **Self-Documenting Code:** Interfaces serve as documentation for component props
* **Safer Refactoring:** TypeScript ensures all usages are updated when interfaces change
* **Improved Team Collaboration:** Clear contracts between Widget Engine and components

This demo successfully validates the core principles of the "Multi-Root Mounting Strategy" and the integration flow outlined in the `poc_technical_design_enhanced.md` document.
