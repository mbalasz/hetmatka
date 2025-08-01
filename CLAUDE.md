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

### Key Classes and Methods

#### `CrosswordApp` Main Class
- `loadCrossword(id)` - Fetches and displays a crossword
- `parseCrosswordData(html)` - Extracts grid and clues from HTML
- `parseGrid(table)` - Converts HTML table to grid data structure
- `detectWords(grid)` - Identifies horizontal and vertical words, stores word arrays in each cell
- `parseClues(doc)` - Extracts clues from HTML tables
- `handleCellClick(row, col)` - Manages cell selection and direction toggling
- `setActiveCell(row, col)` - Updates active cell and highlighting (navigation-safe)
- `updateHighlighting()` - Applies visual highlighting to active word
- `moveToNextCell/moveToPrevCell()` - Directional navigation within word boundaries
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

## HTML Structure Parsing

### Grid Structure (from hetmanskie.pl)
```html
<table id="cwd" class="cwd">
  <tr>
    <td class="cell"><!-- fillable cell --></td>
    <td class="black"><!-- blocked cell --></td>
  </tr>
</table>
```

### Clue Structure
```html
<table class="defs">
  <tr class="defpair">
    <td class="tag">3)</td>
    <td class="def">pierwsze miejsce pryszczy trochę się nie błyszczy</td>
  </tr>
</table>
```

- First `table.defs` = "Poziomo" (Across) clues
- Second `table.defs` = "Pionowo" (Down) clues

## Advanced User Interface Features

### Word Detection and Highlighting
Each cell during parsing is enhanced with:
```javascript
{
  // ... existing cell data
  horizontalWord: [{row, col}, ...], // Array of cells in horizontal word
  verticalWord: [{row, col}, ...],   // Array of cells in vertical word
  horizontalWordPosition: number,    // Position within horizontal word
  verticalWordPosition: number       // Position within vertical word
}
```

### Interactive Behavior
**Cell Selection**:
- **First click**: Select cell, default to horizontal direction, highlight entire word
- **Same cell click**: Toggle between horizontal/vertical directions (if both exist)
- **Different cell click**: New selection with horizontal default

**Visual Highlighting**:
- **Active cell**: Dark blue background (`.cell-active`)
- **Word cells**: Light blue background (`.cell-word-highlight`)
- **Clean design**: No visible text selection or cursor caret

**Navigation Logic**:
- **Horizontal mode**: Tab/Enter moves right within word boundaries
- **Vertical mode**: Tab/Enter moves down within word boundaries
- **Word end behavior**: Stay on last cell, new input replaces current letter
- **Backspace**: Clear current cell and move to previous cell in one action

### Input Handling
**Text Replacement**:
- All text automatically selected on focus (invisible to user)
- Any keystroke replaces entire cell content
- Support for Polish characters: `A-ZĄĆĘŁŃÓŚŹŻ`

**Navigation Keys**:
- **Arrow keys**: Move in current direction within word
- **Tab/Enter**: Move to next cell in current direction
- **Backspace**: Clear and move backward
- **Letter keys**: Replace content and advance (except at word end)

## Mobile Design Specifications

### Touch Targets
- Desktop: 40px × 40px cells
- Mobile: 35px × 35px cells  
- Phones: 30px × 30px cells

### Responsive Breakpoints
- `@media (max-width: 768px)`: Tablet adjustments
- `@media (max-width: 480px)`: Phone adjustments

### Grid Scaling
- Cells automatically scale based on screen size
- Two-column clue layout becomes single-column on mobile
- Full-width controls on small screens

## Development Workflow

### Testing
1. Test with **Krzyżówka 5** (matches provided screenshot example)
2. Verify submission value generation against known example
3. Test word highlighting and direction toggling
4. Test directional navigation and word boundaries
5. Test backspace behavior and text replacement
6. Test on mobile devices for touch responsiveness

### Local Development
```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

### Key Files
- `index.html` - Complete single-page application
- `CLAUDE.md` - This documentation file
- `hetmanska_example_screenshot.png` - Reference screenshot for Krzyżówka 5

## Important Notes

### CORS Handling
- Uses `https://api.allorigins.win/get?url=` proxy for fetching
- Alternative: `https://cors-anywhere.herokuapp.com/` (requires access request)

### Polish Character Support
- Validates input for Polish characters: `A-ZĄĆĘŁŃÓŚŹŻ`
- Users expected to input characters correctly

### Error Handling
- Network request failures
- Invalid crossword numbers
- Submission errors
- Loading states with user feedback

## Common Issues & Solutions

### CORS Errors
- Ensure using proper proxy URL format
- Test with different proxy services if needed
- Occasional failures expected with free public proxies

### Submission Failures
- Verify column-by-column reading algorithm
- Check form field names match exactly: `stan`, `cwd_id`, `id`
- Ensure POST to correct endpoint: `index.php?page=krzyzowki`

### Grid Rendering Issues
- Check that `table#cwd.cwd` exists in fetched HTML
- Verify cell classes: `cell` vs `black`
- Ensure proper grid dimensions handling

### Word Highlighting Issues
- Verify word detection completed successfully in `detectWords()`
- Check that cells have `horizontalWord` and `verticalWord` arrays populated
- Ensure `setActiveCell()` vs `handleCellClick()` separation is maintained

### Navigation Problems
- Direction should only change on explicit clicks, not during navigation
- Word boundaries must be respected - check `activeWordCells` array
- Text selection should be invisible but functional for replace-on-type behavior

## Future Enhancements

- Solution checking and scoring display
- Offline mode support
- Multiple crossword format support
- Better error recovery
- Performance optimizations for large grids

## Dependencies

**None** - Pure vanilla JavaScript implementation with no external dependencies.