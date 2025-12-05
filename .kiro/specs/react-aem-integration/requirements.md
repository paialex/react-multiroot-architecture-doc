# Requirements Document

## Introduction

This document defines the requirements for integrating React.js components into Adobe Experience Manager (AEM) as a Cloud Service using a hybrid architecture approach. The integration enables interactive widgets (calculators, data visualizations with filters) to be embedded within server-rendered AEM pages while maintaining AEM's content management strengths.

The architecture follows the "Islands" pattern where React serves as an enhancement layer for specific interactive regions, while Apache Sling/HTL remains the primary rendering technology for page structure and static content.

This POC explores the optimal patterns for:
- Wrapping UMA (Unified Module Assembler) library components for AEM consumption
- Multi-root mounting strategy for independent widget isolation
- Build tooling migration from Webpack 4 to Vite
- Dynamic clientlib generation for optimal bundle loading

## Glossary

- **AEM**: Adobe Experience Manager - enterprise content management system
- **AEMaaCS**: AEM as a Cloud Service - cloud-native version of AEM
- **HTL**: HTML Template Language - AEM's server-side templating language
- **Sling**: Apache Sling - RESTful web framework underlying AEM
- **JCR**: Java Content Repository - content storage in AEM
- **Clientlib**: Client Library - AEM's mechanism for managing CSS/JS assets
- **UMA**: Unified Module Assembler - organization's internal React component library
- **Design System**: Organization's npm package containing shared styles and tokens
- **Multi-Root Mounting**: Pattern where multiple independent React applications mount at specific DOM locations
- **Islands Architecture**: Hybrid rendering pattern with static HTML and interactive "islands"
- **Widget**: Self-contained React component providing interactive functionality
- **Wrapper Component**: AEM component that bridges UMA React components with AEM authoring

## Requirements

### Requirement 1: Multi-Root Mounting Architecture

**User Story:** As a frontend developer, I want to mount multiple independent React widgets on a single AEM page, so that each widget operates in isolation without affecting others.

#### Acceptance Criteria

1. WHEN a page contains multiple React widget containers THEN the System SHALL create independent React roots for each container using React 18's `createRoot` API
2. WHEN one React widget encounters a runtime error THEN the System SHALL contain the error within that widget's boundary without affecting other widgets on the page
3. WHEN the page loads THEN the System SHALL discover all widget mount points by querying DOM elements with `data-react-component` attributes
4. WHEN a widget mount point is discovered THEN the System SHALL parse configuration from `data-props` attribute as JSON and pass to the React component
5. IF a component name in `data-react-component` is not found in the registry THEN the System SHALL log a warning and skip mounting without blocking other widgets

### Requirement 2: Component Registry and Lazy Loading

**User Story:** As a frontend developer, I want a centralized registry mapping component names to lazy-loaded modules, so that only the JavaScript for widgets present on the page is downloaded.

#### Acceptance Criteria

1. WHEN the build system processes the registry THEN the System SHALL generate separate JavaScript chunks for each registered widget
2. WHEN a widget is mounted THEN the System SHALL dynamically import only that widget's chunk using React.lazy
3. WHEN a lazy-loaded widget is loading THEN the System SHALL display a loading skeleton wrapped in React Suspense
4. WHEN registering a new widget THEN the Developer SHALL add an entry mapping the string identifier to a lazy import statement
5. WHEN the page contains no React widgets THEN the System SHALL load only the minimal React runtime without any widget chunks

### Requirement 3: UMA Component Integration

**User Story:** As a frontend developer, I want to wrap UMA library components for AEM consumption, so that I can leverage existing organizational React components within AEM pages.

#### Acceptance Criteria

1. WHEN integrating a UMA component THEN the Developer SHALL create a wrapper component that adapts AEM dialog props to UMA component props
2. WHEN a UMA component requires the Design System styles THEN the System SHALL include the Design System CSS in the React runtime clientlib
3. WHEN the UMA package is updated THEN the Build System SHALL fetch the latest version from GitHub Packages using the configured token
4. WHEN a wrapper component receives props from AEM THEN the Wrapper SHALL transform and validate props before passing to the UMA component
5. WHEN a UMA component supports multiple languages THEN the Wrapper SHALL pass the language code from AEM dialog configuration

### Requirement 4: AEM Component Wrapper Pattern

**User Story:** As an AEM developer, I want a standardized pattern for creating AEM components that wrap React widgets, so that content authors can configure widgets through familiar AEM dialogs.

#### Acceptance Criteria

1. WHEN an author adds a React widget to a page THEN the System SHALL render an HTL template containing the mount point div with data attributes
2. WHEN an author configures the widget dialog THEN the System SHALL serialize dialog properties to JSON in the `data-props` attribute
3. WHEN the widget is not configured THEN the System SHALL display a placeholder message prompting configuration
4. WHEN the page is rendered THEN the HTL template SHALL include the React runtime clientlib dependency
5. WHEN creating a new React widget AEM component THEN the Developer SHALL follow the established folder structure and naming conventions

### Requirement 5: Build System with Vite

**User Story:** As a frontend developer, I want to use Vite as the build tool for React widgets, so that I benefit from faster builds and modern ESM output.

#### Acceptance Criteria

1. WHEN building for production THEN Vite SHALL generate optimized chunks with React core libraries extracted into a shared vendor chunk
2. WHEN building for production THEN Vite SHALL output files compatible with AEM clientlib structure
3. WHEN multiple widgets share dependencies THEN Vite SHALL deduplicate shared code into common chunks using manualChunks configuration
4. WHEN developing locally THEN Vite SHALL provide fast refresh capabilities for React components
5. WHEN the build completes THEN the System SHALL generate a manifest mapping widget names to their chunk files

### Requirement 6: Clientlib Architecture

**User Story:** As an AEM architect, I want a clientlib structure that separates React runtime from widget-specific code, so that pages load only the JavaScript they need.

#### Acceptance Criteria

1. WHEN the React runtime clientlib is included THEN the System SHALL provide React, ReactDOM, and the universal mount script
2. WHEN a widget-specific clientlib is included THEN the System SHALL load only that widget's JavaScript chunk
3. WHEN multiple widgets on a page share the React runtime THEN the System SHALL load the runtime clientlib only once
4. WHEN a widget clientlib is loaded THEN the System SHALL declare a dependency on the React runtime clientlib
5. WHEN organizing clientlibs THEN the System SHALL use categories that isolate React components from classical AEM components

### Requirement 7: Error Handling and Resilience

**User Story:** As a frontend developer, I want robust error handling for React widgets, so that widget failures do not break the page experience.

#### Acceptance Criteria

1. WHEN a React widget throws an error during rendering THEN the Error Boundary SHALL catch the error and display a fallback UI
2. WHEN an error is caught THEN the Error Boundary SHALL log the error details to the browser console
3. WHEN props parsing fails THEN the Mount Script SHALL log the error and skip mounting that widget
4. WHEN a widget chunk fails to load THEN the Suspense boundary SHALL display an error state
5. WHEN implementing a widget THEN the Developer SHALL wrap the component in an Error Boundary as a best practice

### Requirement 8: Page Lifecycle Integration

**User Story:** As a frontend developer, I want React widgets to properly integrate with AEM page lifecycle, so that widgets initialize correctly and clean up resources appropriately.

#### Acceptance Criteria

1. WHEN the DOM is ready THEN the Mount Script SHALL initialize all discovered React widgets
2. WHEN a page uses client-side navigation THEN the System SHALL unmount all React roots before page transition to prevent memory leaks
3. WHEN a widget is unmounted THEN React SHALL execute all cleanup functions in useEffect hooks
4. WHEN the mount script runs THEN the System SHALL track all active roots for proper cleanup
5. WHEN a widget container is dynamically added to the page THEN the System SHALL provide a method to mount widgets programmatically

### Requirement 9: Author Experience

**User Story:** As a content author, I want to configure React widgets through AEM dialogs, so that I can customize widget behavior without developer assistance.

#### Acceptance Criteria

1. WHEN editing a React widget component THEN the Author SHALL see a dialog with configurable properties specific to that widget
2. WHEN a required property is missing THEN the Dialog SHALL display validation feedback
3. WHEN previewing the page THEN the Author SHALL see the React widget rendered with their configuration
4. WHEN the widget supports multiple languages THEN the Dialog SHALL provide a language selection field
5. WHEN the widget requires data source configuration THEN the Dialog SHALL provide appropriate input fields (pathfield, textfield, select)

### Requirement 10: Performance Optimization

**User Story:** As a frontend developer, I want optimized loading strategies for React widgets, so that pages achieve good Core Web Vitals scores.

#### Acceptance Criteria

1. WHEN a widget is below the fold THEN the System SHOULD support lazy hydration using Intersection Observer
2. WHEN the page loads THEN the System SHALL minimize Cumulative Layout Shift by reserving space for widget containers
3. WHEN building for production THEN Vite SHALL apply tree-shaking to remove unused code from bundles
4. WHEN a widget container is styled THEN the CSS SHALL include minimum height to prevent layout shifts
5. WHEN multiple widgets initialize simultaneously THEN the System SHALL not block the main thread excessively
