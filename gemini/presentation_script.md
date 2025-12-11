# React Integration Framework for AEM - Presentation Script

> **Presenter:** [Your Name]  
> **Audience:** Development Team  
> **Estimated Duration:** 45-60 minutes  
> **Date:** December 2024

---

## 📋 Pre-Presentation Checklist

### Environment Setup

- [ ] AEM Author instance running and accessible
- [ ] Demo project deployed to AEM
- [ ] Browser open with:
  - [ ] AEM Page Editor (blank page ready)
  - [ ] VS Code with `ui.frontend.react/` open
  - [ ] Terminal in `ui.frontend.react/` directory
- [ ] `poc_technical_design_enhanced.md` open for Part 2
- [ ] `static.html` demo page ready in browser tab

### Technical Checks

- [ ] `npm run dev` works without errors
- [ ] `npm run build:clientlib` completes successfully
- [ ] AEM component available in component browser
- [ ] Screen sharing ready (correct resolution)

---

## 🎯 Presentation Overview

| Part | Topic | Duration | Style |
|------|-------|----------|-------|
| **Part 1** | Executive Summary + Live Demo | 10-15 min | Slides + Demo |
| **Part 2** | Technical Deep-Dive | 15-20 min | Doc Walkthrough |
| **Part 3** | Hands-On Component Build | 15-20 min | Live Coding |
| **Q&A** | Questions & Discussion | 5-10 min | Interactive |

---

# PART 1: Executive Summary & Live Demo

## ⏱️ Duration: 10-15 minutes

---

### 1.1 Opening (1-2 minutes)

**[SLIDE: Title]**

> "Good [morning/afternoon] everyone. Today I'm presenting the results of our **Proof of Concept for integrating React into AEM**.
>
> This presentation has three parts:
>
> 1. First, I'll give you a quick summary of what we set out to do, what we achieved, and show you a **live demo**
> 2. Then we'll dive into the **technical documentation** where I'll explain the architecture choices and challenges
> 3. Finally, for the developers, I'll do a **hands-on session** building a component from scratch
>
> Let's start with the executive summary."

---

### 1.2 The Problem Statement (2-3 minutes)

**[SLIDE: Current Challenges]**

> "Before we look at the solution, let's remember **why** we needed this.
>
> **Our current state:**
>
> - We're using HTL and vanilla JavaScript for interactivity
> - Complex features like multi-step forms become 'spaghetti code'
> - We can't easily reuse components from our **NBC Design System** or **UMA libraries**
> - Developer experience is... let's say, not modern
>
> **The specific pain points:**"

*[Point to each as you mention them]*

> "1. **State management is painful** — try building a filter with 10 options in vanilla JS
> 2. **No component reuse** — we're reinventing wheels that NBC Design System already solved
> 3. **Developer velocity** — our team knows React, but we're stuck writing jQuery-style code
> 4. **Cross-platform consistency** — we want the same components on our other platforms
>
> So the question was: **Can we bring React into AEM without breaking what makes AEM valuable?**"

---

### 1.3 POC Objectives (1-2 minutes)

**[SLIDE: Objectives]**

> "Our POC had **five specific objectives**:"

*[Read each, pausing briefly]*

> "1. **Enable component reuse** — specifically, NBC Design System and UMA components
> 2. **Deliver modern interfaces** — more interactive than HTL can offer
> 3. **Accelerate development** — leverage React's component model
> 4. **Preserve AEM strengths** — don't break SEO, authoring, or content management
> 5. **Works with AEM authoring** — standard dialogs, Page Editor, preview mode
>
> The key constraint was: **React should enhance AEM, not replace it.**"

---

### 1.4 The Solution: Islands Architecture (2-3 minutes)

**[SLIDE: Architecture Diagram]**

> "What we built is called the **'Islands Architecture'** or **'Multi-Root Mounting Strategy'**.
>
> Think of it like this:"

*[Point to diagram]*

> "The page is like an ocean of **static HTML** rendered by AEM — this is what search engines see, this is what loads fast.
>
> And within that ocean, we have **islands of interactivity** — React widgets that mount at specific locations.
>
> **Key characteristics:**
>
> - AEM remains the **host** — it controls the page, the routing, the SEO
> - React **enhances selectively** — only where we need interactivity
> - Each island is **independent** — if one crashes, others keep working
> - Widgets are **lazy-loaded** — we don't pay for what we don't use
>
> This is fundamentally different from a Single Page Application. We're not fighting AEM, we're working **with** it."

---

### 1.5 Results Summary (1 minute)

**[SLIDE: Results Checkboxes]**

> "So did we achieve our objectives?"

*[Check off each as you say it]*

> "✅ **React components coexist** within AEM pages — I'll show you  
> ✅ **Widgets are configurable** via standard AEM dialogs — I'll show you  
> ✅ **Zero impact on static content** rendering — SEO preserved  
> ✅ **Works in Edit and Preview modes** — authors can use it today  
> ✅ **NBC Design System ready** — we can wrap any component
>
> Let me show you this working right now."

---

### 1.6 Live Demo (3-5 minutes)

**[SWITCH TO BROWSER - Demo Page]**

> "Here's the proof. I have a page running on our AEM instance."

**Demo Script:**

**Step 1: Show the static page**
> "First, notice this is a regular AEM page. HTL rendered the structure. The header, footer, content — all server-side."

**Step 2: Point to a React widget**
> "But this [ProductCard / Calculator / etc.] — this is React.
>
> Watch what happens when I interact with it..."

*[Click buttons, filter, expand — show interactivity]*

> "This isn't vanilla JavaScript. This is a full React component with state, hooks, everything."

**Step 3: Open DevTools → Elements**
> "Let me prove it. In DevTools, you can see the `data-widget-component` attribute. This is how AEM tells React 'mount here'.
>
> And look at `data-props` — this JSON came from the AEM dialog. The author configured this."

**Step 4: Show Page Editor (if time)**
> "And if I go to Edit mode... [open Page Editor]
>
> See? The component appears in the Page Editor. The author can drag it, configure it via dialog...
>
> [Open component dialog]
>
> These fields... they become React props. No magic, just a clean contract."

**Step 5: Show Network tab**
> "One more thing — look at the Network tab. See how the React bundle is separate from the page?
>
> If this page had no widgets, that JavaScript wouldn't even load. That's the lazy-loading working."

---

### 1.7 Next Steps (1 minute)

**[SLIDE: Next Steps]**

> "So what's next?
>
> 1. **Documentation** — already done. You'll get the README and technical design doc
> 2. **Developer onboarding** — that's Part 3 of this presentation
> 3. **First real component** — [Name a specific business widget you're planning]
> 4. **NBC Design System integration** — start wrapping existing components
> 5. **Performance baseline** — establish Core Web Vitals targets
>
> But first, let's understand **how** this works..."

---

# PART 2: Technical Deep-Dive

## ⏱️ Duration: 15-20 minutes

---

**[SWITCH TO: poc_technical_design_enhanced.md]**

> "Now I'm going to walk through the technical documentation. I wrote this so future developers can understand the architecture, but let me highlight the key decisions and challenges."

---

### 2.1 The Core Challenge: ES Modules (3-4 minutes)

**[SCROLL TO: Section 3 - The Core Challenge: ES Modules in AEM]**

> "Before we look at the solution, you need to understand **the core problem** we had to solve.
>
> Modern JavaScript — and therefore React — uses **ES Modules**. That means `import` statements, `export`, dynamic `import()` for code-splitting.
>
> **But AEM Clientlibs were designed in 2010.** They generate regular `<script>` tags. When the browser tries to run an `import` statement in a regular script, you get this:"

*[Point to the error message in the doc]*

> "`SyntaxError: Cannot use import statement outside a module`
>
> This is why you can't just 'add React' to an AEM project. The clientlib system doesn't know what ES Modules are."

**[Point to the solution diagram]**

> "Our solution is the **Resource + Loader Pattern**:
>
> 1. We put Vite's output (ES Modules) in a **`resources/`** folder — AEM serves these raw, without processing
> 2. We have a **`loader.js`** — this is regular JavaScript that AEM can load normally
> 3. The loader **injects** a `<script type='module'>` tag pointing to our entry file
>
> It's a bridge. AEM loads the loader, the loader loads the modules."

**Why this matters:**
> "Without this pattern, we'd have to transpile everything to IIFE format — which means **no code-splitting**, **no lazy loading**, bundles get huge. This pattern preserves all the benefits of modern JavaScript."

---

### 2.2 Framework Architecture (4-5 minutes)

**[SCROLL TO: Section 5 - React Integration Framework]**

> "The framework has **five components**. Let me explain each one's role."

**[Point to the architecture diagram]**

**Loader Script (`loader.js`):**
> "This is the entry point that AEM loads. It:
>
> - Checks if any widgets exist on the page — if not, it **exits early** (performance)
> - Calculates the correct path to the resources folder
> - Injects the module script and CSS
>
> Important: this runs **before** React. It's vanilla JavaScript."

**Widget Engine (`main.tsx`):**
> "This is the orchestrator. When it loads:
>
> - Scans the DOM for `[data-widget-component]` elements
> - For each one, looks up the component in the **registry**
> - Creates a **separate React root** — this is the 'multi-root' in our architecture
> - Wraps everything in an **ErrorBoundary** — fault isolation
>
> If the DOM changes later (author adds a component in Page Editor), we detect that too."

**Registry (`registry.ts`):**
> "This is just a mapping:
>
> - String name → React component
> - All components use `React.lazy()` — **code-split automatically**
> - Adding a new component? Add one line here."

**Error Boundary:**
> "Critical for production. If one widget throws an error:
>
> - Only **that** widget shows the error state
> - Other widgets keep working
> - We log to console (and can send to Sentry/DataDog)
>
> Without this, one bug would take down every widget on the page."

---

### 2.3 Data Contract: AEM ↔ React (2-3 minutes)

**[SCROLL TO: Section 5.5 - Naming Convention]**

> "How does AEM talk to React? Through a **data contract** — two data attributes."

*[Point to the HTML example]*

> "`data-widget-component` — the component name, must match the registry key exactly
> `data-props` — JSON from the Sling Model
>
> **That's it.** No complex serialization, no AEM-specific SDK. Just HTML attributes.
>
> This means:
>
> - React components can be **tested in isolation** — just pass props
> - We can change the Sling Model without touching React (and vice versa)
> - The contract is **explicit and visible** in the DOM"

---

### 2.4 Build Pipeline (2-3 minutes)

**[SCROLL TO: Section 6 - Build Pipeline]**

> "Quick overview of how code gets from source to AEM."

**[Point to the Vite diagram]**

> "**Vite** is our build tool. I chose it over Webpack for three reasons:
>
> 1. **Dev server starts in milliseconds** — not 30 seconds
> 2. **Native ES Module support** — exactly what we need
> 3. **Minimal configuration** — less to maintain
>
> Vite outputs ES Modules to `dist/`. Then **aem-clientlib-generator** copies everything to the right structure in `ui.apps`."

*[Point to the clientlib structure]*

> "Notice:
>
> - `js/loader.js` — this is what AEM's `<script>` tag loads
> - `resources/` — everything else, served raw
> - Processors set to `none` — we don't want AEM to minify again, Vite already did"

---

### 2.5 Risks & Mitigations (2-3 minutes)

**[SCROLL TO: Section 10 - Risks & Mitigations]**

> "Every architecture has tradeoffs. Here are the main risks I identified:"

*[Highlight top 3-4 risks]*

> "**Bundle size affecting Core Web Vitals**
>
> - React core is ~45KB — we can't avoid that
> - Mitigation: vendor splitting, lazy loading, skip load when no widgets
>
> **Widget error crashing the page**
>
> - Solved by ErrorBoundary — each widget isolated
>
> **Memory leaks from author edits**
>
> - If author removes a widget in Page Editor, we need to unmount the React root
> - MutationObserver detects this automatically
>
> **NBC Design System version conflicts**
>
> - Pin exact versions, test upgrades in dev first"

---

### 2.6 Limitations (2 minutes)

**[SCROLL TO: Section 12 - Limitations & Constraints]**

> "I also documented what this architecture **cannot** do — important to set expectations."

*[Highlight key limitations]*

> "**No SSR** — we'd need Node.js infrastructure. AEM renders the skeleton, React hydrates.
>
> **React can't control `<head>`** — SEO metadata stays with AEM.
>
> **No routing inside widgets** — each widget is a mini-app, not a SPA.
>
> **IE11 not supported** — ES Modules require modern browsers. IE11 is end-of-life anyway.
>
> **Authors must preview to test** — Edit mode shows placeholders to avoid conflicts with AEM overlays."

---

### 2.7 Decision Log (2 minutes)

**[SCROLL TO: Section 11 - Decision Log]**

> "Finally, I documented the key decisions we made and **why**."

*[Quickly highlight 2-3 decisions]*

> "**Multi-Root vs Portals** — we chose multi-root for fault isolation
>
> **Vite vs Webpack** — Vite for DX and native ESM
>
> **Widgets fully isolated** — no shared state between widgets, keeps them independent
>
> These aren't arbitrary — each has a reason documented here for future reference."

---

# PART 3: Hands-On Component Build

## ⏱️ Duration: 15-20 minutes

---

**[SWITCH TO: VS Code + Terminal]**

> "Now the fun part. I'm going to build a component **from scratch** so you can see exactly what it takes to use this framework.
>
> We'll create a simple **CounterWidget** — it has:
>
> - A label (from AEM dialog)
> - A count (local state)
> - Increment/decrement buttons
>
> Simple, but it demonstrates the full flow."

---

### 3.1 Create React Component (5 minutes)

**[In VS Code, create new folder]**

> "Step 1: Create the component files."

```
ui.frontend.react/src/components/CounterWidget/
```

**[Create `CounterWidget.types.ts`]**

```typescript
import type { BaseWidgetProps } from '../../types/widget.types';

export interface CounterWidgetProps extends BaseWidgetProps {
  label: string;
  initialValue?: number;
  step?: number;
}
```

> "We extend `BaseWidgetProps` — this gives us common properties. Then we define what this component needs from AEM."

**[Create `index.tsx`]**

```tsx
import { useState } from 'react';
import type { CounterWidgetProps } from './CounterWidget.types';
import styles from './CounterWidget.module.css';

export default function CounterWidget({
  label,
  initialValue = 0,
  step = 1,
}: CounterWidgetProps): JSX.Element {
  const [count, setCount] = useState(initialValue);

  return (
    <div className={styles.container}>
      <h3 className={styles.label}>{label}</h3>
      <div className={styles.controls}>
        <button 
          onClick={() => setCount(c => c - step)}
          className={styles.button}
        >
          −
        </button>
        <span className={styles.count}>{count}</span>
        <button 
          onClick={() => setCount(c => c + step)}
          className={styles.button}
        >
          +
        </button>
      </div>
    </div>
  );
}
```

> "Standard React component. `useState` for the counter. Props come from AEM."

**[Create `CounterWidget.module.css`]**

```css
.container {
  padding: 1.5rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  font-family: system-ui, sans-serif;
}

.label {
  margin: 0 0 1rem;
  font-size: 1.25rem;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.button {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.button:hover {
  background: rgba(255,255,255,0.3);
}

.count {
  font-size: 2rem;
  font-weight: bold;
  min-width: 3rem;
}
```

> "CSS Modules — scoped to this component, no conflicts."

---

### 3.2 Register the Component (1 minute)

**[Open `registry.ts`]**

> "Step 2: Add one line to the registry."

```typescript
export const registry: WidgetRegistry = {
  // ... existing components
  'CounterWidget': lazy(() => import('./components/CounterWidget')),
};
```

> "That's it for the React side. The name `'CounterWidget'` must match what we use in AEM."

---

### 3.3 Build and Verify (2 minutes)

**[In terminal]**

```bash
npm run build:clientlib
```

> "This runs Vite, then copies to the clientlib structure."

*[Wait for build to complete]*

> "Done. Let's verify the output..."

**[Show the dist/ folder or resources/ in clientlib]**

> "See? We have our `main.js`, the vendor bundle, and now there should be a `CounterWidget-[hash].js` chunk. That's code-splitting working."

---

### 3.4 Create AEM Component (5-7 minutes)

**[Switch to AEM or show the file structure]**

> "Now the AEM side. We need three things: component node, dialog, HTL template."

**[Create component structure]**

```
ui.apps/.../components/counter-widget/
├── _cq_dialog/
│   └── .content.xml
├── counter-widget.html
└── .content.xml
```

**[Show `.content.xml` (component node)]**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" 
          xmlns:cq="http://www.day.com/jcr/cq/1.0"
          jcr:primaryType="cq:Component"
          jcr:title="Counter Widget"
          componentGroup="React Widgets"/>
```

> "Basic component definition. Shows up in component browser under 'React Widgets'."

**[Show `_cq_dialog/.content.xml`]**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" 
          xmlns:nt="http://www.jcp.org/jcr/nt/1.0"
          xmlns:cq="http://www.day.com/jcr/cq/1.0"
          xmlns:sling="http://sling.apache.org/jcr/sling/1.0"
          jcr:primaryType="nt:unstructured"
          jcr:title="Counter Widget"
          sling:resourceType="cq/gui/components/authoring/dialog">
  <content jcr:primaryType="nt:unstructured"
           sling:resourceType="granite/ui/components/coral/foundation/container">
    <items jcr:primaryType="nt:unstructured">
      <tabs jcr:primaryType="nt:unstructured"
            sling:resourceType="granite/ui/components/coral/foundation/tabs">
        <items jcr:primaryType="nt:unstructured">
          <properties jcr:primaryType="nt:unstructured"
                      jcr:title="Properties"
                      sling:resourceType="granite/ui/components/coral/foundation/container">
            <items jcr:primaryType="nt:unstructured">
              <label jcr:primaryType="nt:unstructured"
                     sling:resourceType="granite/ui/components/coral/foundation/form/textfield"
                     fieldLabel="Label"
                     name="./label"
                     required="{Boolean}true"/>
              <initialValue jcr:primaryType="nt:unstructured"
                            sling:resourceType="granite/ui/components/coral/foundation/form/numberfield"
                            fieldLabel="Initial Value"
                            name="./initialValue"
                            value="0"/>
              <step jcr:primaryType="nt:unstructured"
                    sling:resourceType="granite/ui/components/coral/foundation/form/numberfield"
                    fieldLabel="Step"
                    name="./step"
                    value="1"
                    min="1"/>
            </items>
          </properties>
        </items>
      </tabs>
    </items>
  </content>
</jcr:root>
```

> "Standard AEM dialog. Label is required, initial value and step are optional with defaults. These become React props."

**[Show `counter-widget.html`]**

```html
<sly data-sly-use.model="com.project.core.models.CounterWidgetModel">
  <div class="react-widget-container"
       data-widget-component="CounterWidget"
       data-props="${model.propsJson}">
    <div class="skeleton-loader">Loading counter...</div>
  </div>
</sly>
```

> "The HTL template is minimal:
>
> - Use the Sling Model
> - Output a div with our data attributes
> - `data-widget-component='CounterWidget'` — matches our registry key
> - `data-props` — JSON from the model
> - Skeleton loader shown until React mounts"

---

### 3.5 Create Sling Model (3-4 minutes)

**[Show Java code or explain]**

```java
package com.project.core.models;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.HashMap;
import java.util.Map;

@Model(
    adaptables = SlingHttpServletRequest.class,
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class CounterWidgetModel {

    private static final Gson GSON = new GsonBuilder().create();

    @ValueMapValue
    private String label;

    @ValueMapValue
    private Integer initialValue;

    @ValueMapValue
    private Integer step;

    public String getPropsJson() {
        Map<String, Object> props = new HashMap<>();
        
        props.put("label", label != null ? label : "Counter");
        
        if (initialValue != null) {
            props.put("initialValue", initialValue);
        }
        if (step != null) {
            props.put("step", step);
        }
        
        return GSON.toJson(props);
    }
}
```

> "The Sling Model:
>
> - Injects dialog values with `@ValueMapValue`
> - `getPropsJson()` creates the JSON string
> - We only include optional props if they were authored
> - Gson handles the serialization"

---

### 3.6 Deploy and Test (3 minutes)

**[In terminal]**

```bash
mvn clean install -PautoInstallPackage
```

*[Wait for deployment]*

> "Full Maven build deploys both the React bundle and the AEM component."

**[Switch to AEM Page Editor]**

> "Now let's test it..."

*[Steps:]*

1. Open a page in Edit mode
2. Find "Counter Widget" in component browser
3. Drag to page
4. Open dialog, fill in:
   - Label: "My Counter"
   - Initial Value: 10
   - Step: 5
5. Save and Preview

> "And there it is. A fully functional React component, configured by an author, running inside AEM.
>
> Let me increment... decrement... the state is managed by React, the configuration came from AEM.
>
> **This is the pattern.** For every new widget, you repeat these steps."

---

### 3.7 Recap (1 minute)

> "So what did we just do?
>
> 1. Created a React component with TypeScript and CSS Modules
> 2. Added one line to the registry
> 3. Built with `npm run build:clientlib`
> 4. Created AEM component: node, dialog, HTL
> 5. Created a Sling Model to serialize props
> 6. Deployed with Maven
>
> Five files on the React side, four on AEM. Most of it is boilerplate you can copy-paste.
>
> The framework handles everything else — loading, mounting, error isolation, code-splitting."

---

# Q&A Session

## ⏱️ Duration: 5-10 minutes

---

> "Before we wrap up, any questions?"

### Anticipated Questions

**Q: What about existing vanilla JS components?**
> "They can coexist. This framework only mounts where it finds `data-widget-component`. Your existing JS keeps working."

**Q: Can widgets share state?**
> "By design, no. Each widget is isolated. If you need cross-widget communication, use browser CustomEvents. The documentation covers this."

**Q: What's the performance impact?**
> "React core is ~45KB. But it's cached separately (vendor splitting), and lazy-loaded components only download when needed. If a page has no widgets, zero JS loads."

**Q: Can authors break things?**
> "The ErrorBoundary catches rendering errors. Even if an author puts invalid data in a dialog, only that widget fails — others keep working. And we can log errors to DataDog."

**Q: Does this work with Experience Fragments?**
> "Yes, as long as the clientlib is included and the fragment contains the data attributes, the Widget Engine will find and mount it."

---

## Closing

> "That's the React Integration Framework.
>
> **To summarize:**
>
> - We validated the architecture in this POC
> - The documentation is in the repo for future reference
> - You now know how to create components
>
> Next steps are in the roadmap — [mention specific first business component].
>
> Thank you, and I'm happy to answer more questions offline!"

---

## 📎 Appendix: Demo Backup Plan

If AEM is unavailable, use `static.html` in the demo folder:

```bash
cd demo
npm run dev
# Open http://localhost:5173/static.html
```

This is a static HTML page that simulates AEM's output and demonstrates the widget mounting.

---

## 📎 Appendix: Key Files to Have Open

| File | Purpose |
|------|---------|
| `poc_technical_design_enhanced.md` | Part 2 walkthrough |
| `ui.frontend.react/src/registry.ts` | Show during Part 3 |
| `ui.frontend.react/src/main.tsx` | Reference for Widget Engine |
| `ui.frontend.react/vite.config.ts` | Build configuration reference |
| Terminal | For running builds |
| Browser with AEM | Demo and testing |

---

*End of Presentation Script*
