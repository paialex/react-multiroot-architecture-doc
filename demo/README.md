# AEM React Integration Demo

## Overview
This project is a Proof of Concept (POC) demonstrating the "Multi-Root Mounting Strategy" for integrating React.js components into a static HTML page, simulating an Adobe Experience Manager (AEM) environment. It showcases how independent React widgets can coexist and function within a server-rendered page, leveraging modern React 19 features and Vite for an optimized build.

The demo includes:
*   A static `static.html` file acting as the AEM-rendered page.
*   Two interactive React widgets: a `ProductCard` and a `Calculator`.
*   A "Widget Engine" (mount script) that discovers and initializes these widgets.
*   A Vite build pipeline to bundle React assets.
*   Tailwind CSS for basic styling.

## How to Run

Follow these steps to set up and run the demo locally:

1.  **Navigate to the Demo Directory:**
    ```bash
    cd demo
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server. It will provide a local URL (e.g., `http://localhost:5173`).

4.  **Open `static.html`:**
    Open your web browser and navigate to the `static.html` file *served by the Vite dev server*. The URL will typically be `http://localhost:5173/static.html`.

    *   **Important:** Do NOT open `static.html` directly from your file system (`file:///...`), as this can cause issues with module imports and Vite's dev server.

## Key Files

*   `static.html`: The mock AEM page containing static content and React widget containers.
*   `src/components/ProductCard.jsx`: A simple React product card widget.
*   `src/components/Calculator.jsx`: A simple React tax calculator widget.
*   `src/registry.js`: The central registry mapping widget names to React components (using `React.lazy`).
*   `src/main.js`: The "Widget Engine" responsible for discovering, mounting, and managing the lifecycle of React widgets.
*   `vite.config.js`: Vite configuration for bundling the React application.
*   `package.json`: Project dependencies and scripts.

## Verification Steps

Once `static.html` is open in your browser via the Vite dev server:

1.  **Observe Initial Load:**
    *   You should see the "AEM Site (Static Mock)" header, static text, and two grey "Loading..." skeleton boxes where the React widgets will appear. This demonstrates the server-rendered placeholder and client-side hydration.
2.  **Widget Interactivity:**
    *   **Product Card:** Click the "Add to Cart" button. It should change to "Added to Cart ✓" and back.
    *   **Calculator:** Change the "Base Amount". The Tax and Total fields should update dynamically.
3.  **Console Output:**
    *   Open your browser's developer console. You should see `[Widget Engine] Mounted ProductCard` and `[Widget Engine] Mounted Calculator` messages, confirming successful initialization.
    *   Look for any warnings or errors. There should be none.
4.  **Network Tab (Optional):**
    *   If you refresh the page and observe the Network tab, you might see separate JavaScript chunks being loaded for `ProductCard` and `Calculator`, demonstrating `React.lazy` in action (depending on browser caching and network conditions).

This demo should successfully validate the core principles of the "Multi-Root Mounting Strategy" and the integration flow outlined in the `final_technical_design.md` document.