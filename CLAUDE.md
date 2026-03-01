# Rules4J Landing Page

Rules4J is an open source, JVM-based rule engine.
Its target audience is enterprise developers mainly in financial services, insurance, payment systems, and healthcare industries.

## Project Overview
- Static site (GitHub Pages) — no bundler, no build step
- Pure HTML/CSS/JS with CDN dependencies
- Material Design 3 design system with custom CSS tokens
- Light/dark theme switching via `body.light`/`body.dark` classes

## Tech Stack
- Material Web 2.4.0 components (from unpkg CDN)
- Highlight.js 11.11.1 for code syntax highlighting
- React 18 + @xyflow/react 12 via ESM importmap (for flow demo)
- Google Fonts: Roboto, Roboto Mono, Material Symbols Rounded
- No TypeScript, no package manager, no build tooling

## Design System
- Follow Material Design 3 guidelines strictly
- Use MD3 CSS tokens (--md-sys-color-*, --md-sys-shape-*) for all styling
- Two active themes: light and dark (toggled via body class)
- Four additional variant files exist (light-mc, dark-mc, light-hc, dark-hc) but are not currently toggled in the UI
- All new UI must respect theme switching (test both light and dark)

## Related Projects
- **Rules4J Editor (rules4j-ui)**: `/Volumes/development/rules-engine-workspace/rules4j-ui`
  - React + @xyflow/react 12 based rule flow editor
  - Reference for node styling, colors, validation behavior
  - Any landing page demos should match editor's look and feel

## Code Style
- No JSX in this project (no bundler) — use React.createElement
- CSS uses custom properties with MD3 token fallbacks
- Inline `<script type="module">` for page-specific JS
- Separate .js files for reusable components (ES modules)

## Key Files
- `index.html` — single-page site, all sections
- `components.css` — main styling, section layouts
- `tokens.css` — theme file imports + shared shape/state tokens in :root
- `flow-demo.js` / `flow-demo.css` — interactive React Flow demo
- `animated-node-background.js` — full-page animated SVG node graph background (custom web component, mouse-interactive)
- `theme/*.css` — six theme variant files
