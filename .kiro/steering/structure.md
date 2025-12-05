# Project Structure

```
/
├── demo/                      # Main POC implementation
│   ├── src/
│   │   ├── components/        # React widget components
│   │   │   ├── Calculator.jsx
│   │   │   └── ProductCard.jsx
│   │   ├── main.js            # Widget Engine (mount script)
│   │   └── registry.js        # Component registry with lazy imports
│   ├── static.html            # Mock AEM page with widget containers
│   ├── vite.config.js         # Vite build configuration
│   └── package.json
├── design.md                  # Full architectural design document
├── prompt.md                  # Original requirements
└── gemini/                    # Alternative design iterations
```

## Key Files

| File | Purpose |
|------|---------|
| `demo/src/main.js` | Widget Engine - discovers and mounts React widgets |
| `demo/src/registry.js` | Maps component names to lazy-loaded React components |
| `demo/static.html` | Simulates AEM-rendered page with widget containers |

## Widget Container Convention

Widgets are mounted to DOM elements with this structure:

```html
<div class="react-widget-container"
     data-widget-component="ComponentName"
     data-props='{"key": "value"}'>
    <!-- Server-side skeleton placeholder -->
</div>
```

## Component Patterns

- Widgets are default exports from JSX files
- Props come from `data-props` JSON attribute
- Each widget is wrapped in `Suspense` with skeleton fallback
- Components use Tailwind CSS for styling
