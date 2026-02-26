# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**锱铢必较 (JiKou) / FairShare** - A precise bill-splitting web app. Users enter meal items, participants, and allocate what percentage each person ate. Unclaimed portions are split equally among all participants.

## Development Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Build for production (outputs to docs/)
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

## Architecture

### Core Flow (4-Step Wizard)
The app is a single-page wizard with state managed in `App.jsx`:

1. **StepPhotos** (`src/components/steps/StepPhotos.jsx`) - Photo upload placeholder (future AI receipt recognition)
2. **StepItems** (`src/components/steps/StepItems.jsx`) - Add participants and menu items
3. **StepAllocate** (`src/components/steps/StepAllocate.jsx`) - Slider-based percentage allocation per item per person
4. **StepResult** (`src/components/steps/StepResult.jsx`) - Final breakdown showing claimed vs. auto-split amounts

### Key Files
- `src/App.jsx` - Main component, holds all global state (participants, items, allocations)
- `src/utils/calculator.js` - Core calculation logic: splits claimed percentages, distributes unclaimed portions equally
- `src/components/ui/RoundTable.jsx` - Visualization component showing participants around a table with food items; transforms to pie chart on results page
- `src/index.css` - Global styles with CSS variables for the glassmorphism theme

### State Shape
```javascript
participants = [{ id: 'p1', name: '我' }, ...]
items = [{ id: 'item_x', name: 'Pizza', price: 40 }, ...]
allocations = { 'item_x': { 'p1': 50, 'p2': 25 }, ... }  // percentages per item per person
```

## Build Configuration

- Build output: `docs/` folder (for GitHub Pages deployment)
- Base path: `/fair-share/`
- No tests configured