---
inclusion: always
---

# Product Overview

React-AEM integration POC using **Multi-Root Mounting Strategy** (Islands Architecture).

## Core Architecture

- **AEM (Server)**: Primary renderer via Sling/HTL - owns page structure and content
- **React (Client)**: Widget Engine for interactive islands only - not a full SPA
- **Multi-Root Pattern**: Each widget = independent React root for fault isolation

## Widget Engine Behavior

1. Scans DOM for `.react-widget-container` elements
2. Reads `data-widget-component` to identify component
3. Parses `data-props` JSON for configuration
4. Mounts isolated React root with `Suspense` fallback

## Critical Constraints

- **No shared state** between widgets - each is fully isolated
- **No cross-widget communication** - widgets don't know about each other
- **AEM dialogs** control widget configuration (props come from server)
- **Lazy loading** required - widgets code-split via `React.lazy()`

## When Building Widgets

- Export component as default from JSX file
- Register in `registry.js` with lazy import
- Use Tailwind CSS for styling
- Accept all configuration via props (from `data-props`)
- Include skeleton/loading state for Suspense boundary
