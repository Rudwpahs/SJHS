# SJHS Memory Palace Design System

## Product character

**Spatial, quiet, precise, exploratory.** The interface should feel like looking into a stable scientific universe rather than operating a dashboard. The map carries identity; controls recede until needed.

## Token architecture

The CSS uses three layers:

1. **Primitive**: HSL neutral/accent values, spacing, radii, type sizes, motion timings.
2. **Semantic**: map surface, floating surface, text, border, focus, edge, selection, community accents.
3. **Component**: command dock, icon button, inspector, segmented filter, map controls.

Never bypass semantic/component tokens with ad-hoc visual values in a component.

## Themes

### Dark

Near-black blue-neutral field with warm-white text. Community colors are desaturated enough to avoid a neon dashboard look. The selected concept gets a clear high-contrast ring; map edges remain quiet until related to selection.

### Light

Warm near-white field, ink text, toned-down community colors, subtle opaque floating surfaces. The geometry and hierarchy remain identical to dark mode.

## Typography

- Family: system sans (`Inter` only if locally available, then platform/system fallbacks, then `Noto Sans KR`).
- Map labels: 11-16px based on semantic importance.
- Inspector body: 14px minimum, 1.65 line height.
- Controls: 12-14px, never relying on tiny text to fit.
- Use weight/space before adding extra colors.

## Spacing

4px base rhythm with practical tiers: 4, 8, 12, 16, 24, 32. Interactive controls use a shared 44px hit-size token.

## Shape language

- Map is borderless and full-bleed.
- Floating UI uses restrained opaque/translucent surfaces with one subtle border; no heavy glass blur.
- Foundation = ring/core, standard = circle, personal = diamond, modern = rounded-square.
- All system icons use a consistent 1.75px outline SVG style.

## Motion

- Fast feedback: 120ms.
- Standard UI reveal: 180ms.
- Spatial transition: 260ms only when it helps preserve location.
- Reduced motion removes animated transforms/transitions that are not required for state comprehension.

## Responsive rules

- Desktop: inspector right rail, command dock upper left/center, filters below.
- Mobile: inspector bottom sheet <= 46svh; compact brand; map controls stay reachable; safe areas included.
- The page itself never scrolls horizontally. Inspector content may scroll vertically.

## Accessibility

- Focus ring is visible against both themes.
- All icon-only controls have accessible labels.
- Search has an explicit label available to assistive technology.
- Canvas is keyboard focusable and reports selection/zoom through a live status region.
- Nearby graph connections are rendered as DOM buttons inside the inspector for non-pointer traversal.
