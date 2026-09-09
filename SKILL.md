# SJHS Project Skill

This file governs changes to the Sejong Science Memory Palace project.

## Product truth

- The product is a spatial knowledge/memory system for Sejong Science High School interview study.
- **Space is memory:** existing canonical node coordinates are persistent memory anchors. Never auto-relayout existing nodes.
- **First principles are foundational:** explanations should descend toward underlying mechanisms before relying on memorized labels.
- **No misconception nodes:** incorrect statements are not stored as knowledge. Learning state may record uncertainty separately, but the canonical map contains only validated concepts.
- **Curriculum completeness matters:** the 2015 revised middle-school science coverage gate must not regress.

## UI hierarchy

1. The knowledge map is the dominant surface.
2. Permanent chrome is compact and low-contrast relative to selected knowledge.
3. Details use progressive disclosure; do not fill the initial viewport with explanatory text.
4. Fixed landmarks must remain visually recognizable across sessions and themes.
5. Subject boundaries are communities/filters, not hard visual walls.

## UI/UX quality rules

These project rules adopt the relevant requirements from UI/UX Pro Max, design-system, and ui-styling guidance.

- Accessibility before decoration: visible keyboard focus, semantic controls, descriptive accessible names, and normal-text contrast of at least 4.5:1.
- Every interactive web control has a hit area of at least `var(--control-hit-size)` = 44px.
- Wheel/drag interactions always have button/keyboard alternatives.
- Structural icons are inline SVG from one outline style. Never use emoji as navigation/system icons.
- Use three token layers: primitive -> semantic -> component. Component CSS and renderer code do not introduce raw hex colors.
- Support both dark and light semantic themes; dark is the product-preferred visual identity.
- Support `prefers-reduced-motion: reduce` and do not require animation to understand state.
- Mobile-first layouts must avoid page-level horizontal overflow and respect safe-area insets.
- Use system/local fonts only unless a future requirement explicitly justifies a network font.

## Canvas map rules

- Foundation nodes: ring/core landmark glyph.
- Curriculum/default concepts: circles.
- Personal research: diamonds.
- Modern physics: rounded squares.
- Color is never the sole encoding of category or selection.
- Unrelated nodes may dim on selection; selected and neighbor nodes must remain legible.
- Labels are semantic-zoom controlled and should be sparse at world scale.

## Engineering rules

- Stack: vanilla HTML, CSS custom properties, ES modules, Canvas 2D.
- Avoid runtime third-party dependencies unless the user explicitly approves a stack change.
- New behavior follows TDD: failing test -> minimal implementation -> passing test -> refactor.
- Before publication run `npm test` and `npm run audit`.
- GitHub Pages workflow is the publication path for the static site.
