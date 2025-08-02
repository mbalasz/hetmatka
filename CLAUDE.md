# Hetmańska Krzyżówka - Mobile Crossword Interface

A mobile-friendly web application that provides a better user experience for solving crosswords from hetmanskie.pl.

## Project Overview

This is a single-page vanilla JavaScript application that fetches crosswords from http://hetmanskie.pl and provides an improved mobile interface for solving them. The app handles crossword selection, interactive grid input, progress saving, and solution submission.

## Key Features

- **Crossword Selection**: Dropdown menu with options "Krzyżówka 1" through "Krzyżówka 117"
- **Interactive Grid**: Touch-friendly crossword cells with intelligent word navigation
- **Word Highlighting**: Visual highlighting of active word with direction awareness
- **Direction Toggle**: Click same cell to toggle between horizontal/vertical words
- **Smart Navigation**: Directional movement within word boundaries
- **Clue Display**: Properly formatted "Poziomo" (Across) and "Pionowo" (Down) clues
- **Progress Saving**: Auto-saves to localStorage on every letter input
- **Solution Submission**: Submits completed crosswords to the original site
- **Mobile-Responsive**: Optimized for phones and tablets with proper touch targets

## Technical Architecture

### Core Technologies
- **Vanilla HTML/CSS/JavaScript** (no frameworks)
- **CORS Proxy**: Uses `api.allorigins.win` to fetch from hetmanskie.pl
- **localStorage**: For progress persistence
- **Single Hidden Input**: Mobile-optimized input handling for performance

### Key Classes and Methods

#### `CrosswordApp` Main Class
- `loadCrossword(id)` - Fetches and displays a crossword
- `parseCrosswordData(html)` - Extracts grid and clues from HTML
- `detectWords(grid)` - Identifies horizontal and vertical words, stores word arrays in each cell
- `handleCellClick(row, col)` - Manages cell selection and direction toggling
- `setActiveCell(row, col)` - Updates active cell and highlighting (navigation-safe)
- `setCellValue(row, col, value)` - Updates visual cell content and grid data
- `generateSubmissionValue()` - **CRITICAL**: Creates column-by-column submission string
- `submitSolution()` - Submits to original site with exact form format

## CRITICAL: Submission Format

The most important aspect of this project is the **exact submission format** that matches hetmanskie.pl:

### Form Structure
```html
<form action="index.php?page=krzyzowki" method="post">
  <input name="stan" value="COLUMN_BY_COLUMN_GRID_DATA">
  <input name="cwd_id" value="CROSSWORD_NUMBER">
  <input name="id" value="send_cwd">
</form>
```

### Grid Reading Algorithm
The `generateSubmissionValue()` function reads the grid **column by column**:
- Start from leftmost column, read top-to-bottom
- Move to next column, repeat
- Filled cells: append the letter
- Empty/black cells: append a space character

**Example**: For Krzyżówka 5 (see `hetmanska_example_screenshot.png` in this directory), reading the grid column by column produces:
`"PIECHOTA L H R NPOLANA T R ŁACHYPALUSZEKRZEPA R Y SADŁO M Z KOLTADELAJDATYKA E B M MINIAMENU I K K SCENA"`

This corresponds exactly to reading the screenshot grid from left to right, column by column.

## Advanced User Interface Features

### Single Hidden Input Architecture
**Mobile Performance Optimization**:
- Single invisible input element captures all keyboard events
- Visual crossword cells are plain `<td>` elements with click handlers
- Zero input focus switching eliminates major mobile performance bottleneck
- Direct text content updates for instant visual feedback

### Interactive Behavior
**Cell Selection**:
- **Click cell**: Focus hidden input, highlight word, set direction
- **Same cell click**: Toggle between horizontal/vertical directions (if both exist)
- **Different cell click**: New selection with horizontal default

**Visual Highlighting**:
- **Active cell**: Dark blue background (`.cell-active`)
- **Word cells**: Light blue background (`.cell-word-highlight`)
- **Clean design**: No visible input elements or cursor artifacts

**Navigation Logic**:
- **Horizontal mode**: Letter input moves right within word boundaries
- **Vertical mode**: Letter input moves down within word boundaries
- **Word end behavior**: Stay on last cell, new input replaces current letter
- **Backspace**: Clear current cell and move to previous cell in one action

### Input Handling
**Multi-Event Input System**:
- Hidden input at fixed position captures all keystrokes
- **Three-layer input handling** for maximum mobile compatibility:
  - `keydown` events for desktop and standard mobile input
  - `input` events for mobile Polish character long-press (ą, ć, ę, etc.)
  - `compositionend` events for complex input methods and IME
- Validates Polish characters: `A-ZĄĆĘŁŃÓŚŹŻ`
- Direct cell content updates via `setCellValue()`
- Auto-clears input buffer to prevent character buildup
- No focus switching between elements

## Development Workflow

### Testing
1. Test with **Krzyżówka 5** (matches provided screenshot example)
2. Verify submission value generation against known example
3. Test word highlighting and direction toggling
4. Test directional navigation and word boundaries
5. Test multi-event input system performance on mobile devices
6. **Test Polish characters on mobile**: Long-press 'a' for 'ą', 'c' for 'ć', etc.
7. Test backspace behavior and text replacement
8. Verify hidden input keyboard activation on mobile
9. Test input buffer clearing prevents character buildup

### Local Development
```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

### Key Files
- `index.html` - Complete single-page application with hidden input system
- `test.html` - Minimal test implementation for performance validation
- `CLAUDE.md` - This documentation file
- `hetmanska_example_screenshot.png` - Reference screenshot for Krzyżówka 5

## Important Notes

### CORS Handling
- Uses `https://api.allorigins.win/get?url=` proxy for fetching
- Alternative: `https://cors-anywhere.herokuapp.com/` (requires access request)

## Common Issues & Solutions

### CORS Errors
- Ensure using proper proxy URL format
- Test with different proxy services if needed
- Occasional failures expected with free public proxies

### Mobile Polish Character Input
- **Issue**: Polish characters (ą, ć, ę, ł, ń, ó, ś, ź, ż) not working on mobile keyboards
- **Solution**: Multi-layered event handling system implemented:
  - Uses `keydown`, `input`, and `compositionend` events
  - Handles long-press character selection on mobile keyboards
  - Auto-clears input buffer to prevent character buildup
- **Testing**: Long-press base letters (a→ą, c→ć, e→ę, etc.) on mobile

## Future Enhancements

- Solution checking and scoring display
- Offline mode support
- Multiple crossword format support
- Better error recovery
- Performance optimizations for large grids

## Dependencies

**None** - Pure vanilla JavaScript implementation with no external dependencies.
