# DESIGN.md — Visual Design System Specifications (Light Mode)

## 1. Typography
- **Headings:** `Epilogue`, sans-serif (Weights: 600, 700, 800) — Confident, authoritative, architectural.
- **Body & Controls:** `Albert Sans`, sans-serif (Weights: 400, 500, 600) — Clear, open geometry, high readability.
- **Code & Ledger:** `IBM Plex Mono`, monospace (Weights: 400, 500, 600) — Technical precision for hashes, addresses, and counters.

## 2. Color Palette (Light Mode — WCAG AA & AAA Compliant)
- **Base Background:** `#f8fafc` (Clean, softly tinted paper slate)
- **Ballot & Card Surface:** `#ffffff` (Pure, crisp paper card)
- **Subtle Surface / Elevated:** `#f1f5f9` (Tinted surface tone)
- **Surface Hover / Highlight:** `#e2e8f0`
- **Structural Borders:** `#cbd5e1` (Crisp 1px boundary)
- **Border Subtle:** `#e2e8f0`
- **Primary Ink / Text:** `#0f172a` (15.8:1 contrast against base — passes WCAG AAA)
- **Secondary Text:** `#334155` (9.5:1 contrast against white — passes WCAG AAA)
- **Muted Text & Placeholders:** `#64748b` (4.6:1 contrast against white — passes WCAG AA)
- **Ballot Action Accent:** `#15803d` (Civic Ballot Emerald — Solid, zero gradient, 4.8:1 contrast with white)
- **Action Hover:** `#166534` (6.1:1 contrast with white)
- **Active State Accent:** `#1d4ed8` (Authoritative Ledger Blue — Solid, zero gradient)
- **Warning / Alert:** `#9a3412` (text) on `#ffedd5` (fill) with `#fed7aa` (border)
- **Success / Confirmed:** `#14532d` (text) on `#f0fdf4` (fill) with `#bbf7d0` (border)

## 3. Shadows & Elevation
- **Card Elevation:** `0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)`
- **Hover Elevation:** `0 4px 12px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04)`
- **Rule:** Strictly zero colored glows, zero chromatic halos, and zero gradient texts.

## 4. Spacing & Rhythm
- Base unit: 4px.
- Container max width: `1040px`.
- Max text line length: `60ch` to prevent eye strain.
- Padding scale: 8px, 12px, 16px, 22px, 28px.
