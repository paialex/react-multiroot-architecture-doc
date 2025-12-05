# Product Overview

This project demonstrates the **Multi-Root Mounting Strategy** for integrating React.js components into Adobe Experience Manager (AEM) static HTML pages.

## Purpose

A Proof of Concept (POC) showing how independent React widgets can coexist within server-rendered AEM pages using an "Islands Architecture" approach.

## Key Concepts

- **Widget Engine**: JavaScript runtime that discovers and mounts React components at designated DOM locations
- **Islands Architecture**: Static HTML with interactive React "islands" - AEM controls page rendering, React handles interactivity
- **Multi-Root Pattern**: Each widget gets its own independent React root for fault isolation

## Design Philosophy

- Sling/HTL is the primary renderer (server-side)
- React serves as the Widget Engine for interactive elements only
- Widgets are isolated - no shared state or cross-widget communication
- Content authors configure widgets through AEM dialogs
