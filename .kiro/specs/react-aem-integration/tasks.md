# Implementation Plan

## 1. Project Setup and Core Infrastructure

- [ ] 1.1 Initialize React project with Vite
  - Create `ui.frontend.react` directory structure
  - Configure Vite with React plugin and TypeScript
  - Set up `manualChunks` for react-vendor and design-system separation
  - Configure output paths compatible with aem-clientlib-generator
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 1.2 Configure aem-clientlib-generator
  - Create `clientlib.config.js` with runtime and widget clientlib definitions
  - Set up category naming convention (`myproject.react.runtime`, `myproject.react.widget.*`)
  - Configure dependencies between widget clientlibs and runtime
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 1.3 Set up Jest testing framework with fast-check
  - Configure Jest for TypeScript and React
  - Install and configure fast-check for property-based testing
  - Create test directory structure (`__tests__/properties/`)
  - _Requirements: Testing Strategy_

## 2. Widget Engine Implementation

- [ ] 2.1 Implement core Widget Engine (mount script)
  - Create `src/core/mount.ts` with widget discovery logic
  - Implement `initializeWidgets()` to query widget containers (`[data-react-component]` elements)
  - Implement `mountWidget()` with props parsing and root creation
  - Track active roots in Map keyed by widget container
  - _Requirements: 1.1, 1.3, 1.4, 8.1, 8.4_

- [ ]* 2.2 Write property test for widget discovery completeness
  - **Property 1: Widget Discovery Completeness**
  - **Validates: Requirements 1.1, 1.3**

- [ ] 2.3 Implement unmount and cleanup functionality
  - Implement `unmountAllWidgets()` for page navigation cleanup
  - Implement `mountWidgetsInContainer()` for dynamic content
  - Expose global `window.ReactWidgets` API
  - _Requirements: 8.2, 8.3, 8.5_

- [ ]* 2.4 Write property test for root tracking consistency
  - **Property 6: Root Tracking Consistency**
  - **Validates: Requirements 8.2, 8.4**

- [ ]* 2.5 Write property test for cleanup execution
  - **Property 7: Cleanup Execution**
  - **Validates: Requirements 8.3**

## 3. Component Registry and Lazy Loading

- [ ] 3.1 Implement component registry
  - Create `src/core/registry.ts` with lazy component mapping
  - Configure React.lazy imports for each widget type
  - Handle unknown component names with warning log
  - _Requirements: 2.1, 2.2, 2.4, 1.5_

- [ ]* 3.2 Write property test for invalid props handling
  - **Property 4: Invalid Props Graceful Handling**
  - **Validates: Requirements 1.5, 7.3**

- [ ] 3.3 Implement Suspense wrapper with loading skeleton
  - Create `src/components/WidgetSkeleton.tsx` loading component
  - Wrap lazy-loaded components in Suspense with skeleton fallback
  - _Requirements: 2.3_

## 4. Error Handling Infrastructure

- [ ] 4.1 Implement Error Boundary component
  - Create `src/components/ErrorBoundary.tsx`
  - Implement fallback UI with configurable options (silent, message, retry)
  - Log errors to console
  - _Requirements: 7.1, 7.2, 7.5_

- [ ]* 4.2 Write property test for error isolation
  - **Property 2: Error Isolation**
  - **Validates: Requirements 1.2, 7.1**

- [ ] 4.3 Implement chunk load error handling
  - Create `src/components/ChunkErrorBoundary.tsx`
  - Wrap Suspense in error boundary for chunk load failures
  - Implement retry button for transient network errors
  - _Requirements: 7.4_

## 5. Checkpoint - Core Infrastructure Tests

- [ ] 5. Ensure all tests pass, ask the user if questions arise.

## 6. Widget Wrapper Implementation

- [ ] 6.1 Create base wrapper component pattern
  - Create `src/widgets/BaseWrapper.tsx` with common wrapper logic
  - Implement props transformation utilities
  - Add language code handling
  - Include dataLayerName prop for analytics
  - _Requirements: 3.1, 3.4, 3.5_

- [ ]* 6.2 Write property test for props round-trip consistency
  - **Property 3: Props Round-Trip Consistency**
  - **Validates: Requirements 1.4, 4.2**

- [ ]* 6.3 Write property test for wrapper props transformation
  - **Property 8: Wrapper Props Transformation**
  - **Validates: Requirements 3.4, 3.5**

- [ ] 6.4 Implement Calculator widget wrapper
  - Create `src/widgets/CalculatorWrapper.tsx`
  - Transform AEM dialog props to UMA/NBC Design System props
  - Integrate with Error Boundary
  - _Requirements: 3.1, 3.4_

- [ ] 6.5 Implement Chart widget wrapper
  - Create `src/widgets/ChartWrapper.tsx`
  - Transform AEM dialog props to UMA/NBC Design System props
  - Handle data endpoint and filter options
  - _Requirements: 3.1, 3.4_

## 7. Performance Optimization

- [ ] 7.1 Implement lazy hydration with Intersection Observer
  - Create `src/core/lazy-hydration.ts`
  - Detect `data-lazy-hydrate` attribute on containers
  - Defer mounting until container intersects viewport
  - Configure rootMargin for preloading
  - _Requirements: 10.1_

- [ ]* 7.2 Write property test for lazy hydration
  - **Property 9: Lazy Hydration Deferred Mounting**
  - **Validates: Requirements 10.1**

- [ ] 7.3 Implement non-blocking initialization
  - Use `requestIdleCallback` for batched widget mounting
  - Prioritize above-fold widgets
  - Add Safari fallback using setTimeout
  - _Requirements: 10.5_

- [ ]* 7.4 Write property test for main thread non-blocking
  - **Property 11: Main Thread Non-Blocking**
  - **Validates: Requirements 10.5**

- [ ] 7.5 Create widget skeleton CSS for CLS prevention
  - Create `src/styles/widget-skeleton.css`
  - Define min-height CSS custom properties
  - Implement skeleton pulse animation
  - _Requirements: 10.2, 10.4_

- [ ]* 7.6 Write property test for layout shift prevention
  - **Property 10: Layout Shift Prevention**
  - **Validates: Requirements 10.2, 10.4**

## 8. Checkpoint - Widget and Performance Tests

- [ ] 8. Ensure all tests pass, ask the user if questions arise.

## 9. AEM Component Templates

- [ ] 9.1 Create AEM component folder structure template
  - Create `react-calculator` component folder with `.content.xml`
  - Create HTL template `calculator.html` with mount point div
  - Include data-react-component and data-props attributes
  - Add clientlib dependency to React runtime
  - _Requirements: 4.1, 4.4, 4.5_

- [ ] 9.2 Create widget dialog template
  - Create `_cq_dialog/.content.xml` for Calculator widget
  - Add common fields (language, dataLayerName)
  - Add widget-specific fields (calculatorType, defaultValues)
  - Implement validation for required fields
  - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [ ] 9.3 Implement unconfigured widget placeholder
  - Add HTL conditional for unconfigured state
  - Render placeholder message prompting configuration
  - _Requirements: 4.3_

- [ ] 9.4 Create Chart AEM component
  - Create `react-chart` component folder structure
  - Create HTL template and dialog
  - Add chart-specific fields (chartType, dataEndpoint, filterOptions)
  - _Requirements: 4.1, 4.5, 9.1, 9.5_

## 10. Analytics Integration

- [ ] 10.1 Implement data layer utility
  - Create `src/utils/analytics.ts`
  - Implement `pushToDataLayer()` function
  - Handle missing data layer gracefully
  - _Requirements: Analytics Integration_

- [ ] 10.2 Integrate analytics in widget wrappers
  - Add dataLayerName prop to wrapper interfaces
  - Implement event tracking in Calculator widget
  - Implement event tracking in Chart widget
  - _Requirements: Analytics Integration_

## 11. Runtime Singleton Verification

- [ ]* 11.1 Write property test for runtime singleton
  - **Property 5: Runtime Singleton**
  - **Validates: Requirements 6.3**

## 12. Final Checkpoint

- [ ] 12. Ensure all tests pass, ask the user if questions arise.
