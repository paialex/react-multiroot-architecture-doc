# Tech Stack

## Core Technologies

- **React 19** - UI library for interactive widgets
- **Vite 5** - Build tool and dev server
- **Tailwind CSS 3** - Utility-first styling

## Build System

Vite is used for:
- Fast HMR during development
- Code splitting via `React.lazy()` for per-widget chunks
- ES module output for modern browsers
- Manifest generation for AEM clientlib mapping

## Key Dependencies

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "@vitejs/plugin-react": "^4.2.1",
  "vite": "^5.2.0",
  "tailwindcss": "^3.4.1"
}
```

## Common Commands

```bash
# Navigate to demo directory first
cd demo

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Build Output

- `dist/assets/` - Bundled JS/CSS chunks
- Manifest file generated for AEM clientlib integration
- Widget chunks are code-split for optimal loading

## AEM Integration (Production)

In production AEM environments:
- Use `aem-clientlib-generator` to convert Vite output to AEM clientlibs
- Runtime clientlib: shared React + mount script
- Widget clientlibs: per-widget code chunks with runtime dependency
