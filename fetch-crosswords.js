#!/usr/bin/env node

/**
 * Pre-fetch script for Hetmańska Krzyżówka
 * Downloads all crosswords from hetmanskie.pl and saves them as static JSON files
 * 
 * Usage: node fetch-crosswords.js
 */

const fs = require('fs');
const path = require('path');

const MAX_CROSSWORD_ID = 117;

class CrosswordFetcher {
    constructor() {
        this.baseUrl = 'http://hetmanskie.pl/index.php?page=krzyzowki&nr=';
        this.outputDir = './data/crosswords';
        this.maxRetries = 3;
        this.delay = 2000; // 1 second between requests
    }

    async init() {
        // Create output directory
        if (!fs.existsSync('./data')) {
            fs.mkdirSync('./data');
        }
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir);
        }
    }

    async fetchCrosswordHTML(id) {
        for (let retry = 0; retry < this.maxRetries; retry++) {
            try {
                console.log(`Fetching crossword ${id} (attempt ${retry + 1}/${this.maxRetries})`);
                
                const response = await fetch(this.baseUrl + id);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const html = await response.text();
                
                if (!html || html.length < 100) {
                    throw new Error('Empty or invalid response');
                }
                
                return html;
                
            } catch (error) {
                console.warn(`Attempt ${retry + 1} failed:`, error.message);
                
                if (retry < this.maxRetries - 1) {
                    console.log(`Retrying in ${1 + retry} second(s)...`);
                    await this.sleep((1 + retry) * 1000);
                }
            }
        }
        
        throw new Error(`Failed to fetch crossword ${id} after ${this.maxRetries} attempts`);
    }

    parseCrosswordData(html) {
        // Use JSDOM for server-side DOM parsing
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        const table = doc.querySelector('table#cwd.cwd');
        if (!table) {
            throw new Error('Crossword table not found');
        }

        const grid = this.parseGrid(table);
        const clues = this.parseClues(doc);

        return { grid, clues };
    }

    parseGrid(table) {
        const rows = table.querySelectorAll('tr');
        const grid = [];

        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td');
            const gridRow = [];

            cells.forEach((cell, colIndex) => {
                const isBlack = cell.classList.contains('black');
                const number = cell.textContent.trim();
                const hasNumber = /^\d+/.test(number);

                gridRow.push({
                    isBlack,
                    number: hasNumber ? parseInt(number) : null,
                    value: '',
                    row: rowIndex,
                    col: colIndex,
                    horizontalWord: null,
                    verticalWord: null,
                    horizontalWordPosition: null,
                    verticalWordPosition: null
                });
            });

            grid.push(gridRow);
        });

        // Detect words after grid is built
        this.detectWords(grid);

        return grid;
    }

    finishWord(wordCells, isHorizontal) {
        if (wordCells.length > 1) {
            const wordPositions = wordCells.map(cell => ({ row: cell.row, col: cell.col }));
            
            wordCells.forEach((wordCell, index) => {
                if (isHorizontal) {
                    wordCell.horizontalWord = wordPositions;
                    wordCell.horizontalWordPosition = index;
                } else {
                    wordCell.verticalWord = wordPositions;
                    wordCell.verticalWordPosition = index;
                }
            });
        }
    }

    detectWords(grid) {
        // Detect horizontal words
        for (let row = 0; row < grid.length; row++) {
            let wordCells = [];
            
            for (let col = 0; col < grid[row].length; col++) {
                const cell = grid[row][col];
                
                if (!cell.isBlack) {
                    wordCells.push(cell);
                } else {
                    this.finishWord(wordCells, true);
                    wordCells = [];
                }
            }
            
            this.finishWord(wordCells, true);
        }
        
        // Detect vertical words
        for (let col = 0; col < grid[0].length; col++) {
            let wordCells = [];
            
            for (let row = 0; row < grid.length; row++) {
                const cell = grid[row][col];
                
                if (!cell.isBlack) {
                    wordCells.push(cell);
                } else {
                    this.finishWord(wordCells, false);
                    wordCells = [];
                }
            }
            
            this.finishWord(wordCells, false);
        }
    }

    parseClues(doc) {
        const clues = { across: [], down: [] };
        
        const defTables = doc.querySelectorAll('table.defs');
        
        if (defTables.length >= 2) {
            // First table - Poziomo (across)
            const acrossTable = defTables[0];
            const acrossRows = acrossTable.querySelectorAll('tr.defpair');
            
            acrossRows.forEach(row => {
                const tagCell = row.querySelector('td.tag');
                const defCell = row.querySelector('td.def');
                
                if (tagCell && defCell) {
                    const numberText = tagCell.textContent.trim();
                    const clueText = defCell.textContent.trim();
                    const number = parseInt(numberText.replace(')', ''));
                    
                    if (!isNaN(number) && clueText) {
                        clues.across.push({
                            number: number,
                            clue: clueText
                        });
                    }
                }
            });
            
            // Second table - Pionowo (down)
            const downTable = defTables[1];
            const downRows = downTable.querySelectorAll('tr.defpair');
            
            downRows.forEach(row => {
                const tagCell = row.querySelector('td.tag');
                const defCell = row.querySelector('td.def');
                
                if (tagCell && defCell) {
                    const numberText = tagCell.textContent.trim();
                    const clueText = defCell.textContent.trim();
                    const number = parseInt(numberText.replace(')', ''));
                    
                    if (!isNaN(number) && clueText) {
                        clues.down.push({
                            number: number,
                            clue: clueText
                        });
                    }
                }
            });
        }

        return clues;
    }

    async saveCrossword(id, data) {
        const filePath = path.join(this.outputDir, `${id}.json`);
        const jsonData = {
            id: parseInt(id),
            ...data,
            fetchedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
        console.log(`✓ Saved crossword ${id} to ${filePath}`);
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async fetchAll() {
        await this.init();
        
        const successfulFetches = [];
        const failedFetches = [];
        
        console.log(`Starting to fetch all crosswords (1-${MAX_CROSSWORD_ID})...\n`);
        
        for (let id = 1; id <= MAX_CROSSWORD_ID; id++) {
            try {
                // Check if file already exists
                const filePath = path.join(this.outputDir, `${id}.json`);
                if (fs.existsSync(filePath)) {
                    console.log(`⏭️  Crossword ${id} already exists, skipping`);
                    successfulFetches.push(id);
                    continue;
                }
                
                const html = await this.fetchCrosswordHTML(id);
                const crosswordData = this.parseCrosswordData(html);
                await this.saveCrossword(id, crosswordData);
                
                successfulFetches.push(id);
                
                // Delay between requests to be respectful
                if (id < MAX_CROSSWORD_ID) {
                    console.log(`Waiting ${this.delay}ms before next request...\n`);
                    await this.sleep(this.delay);
                }
                
            } catch (error) {
                console.error(`✗ Failed to fetch crossword ${id}:`, error.message);
                failedFetches.push(id);
                
                // Still wait before next request
                if (id < MAX_CROSSWORD_ID) {
                    await this.sleep(this.delay);
                }
            }
        }
        
        // Create index file
        const indexData = {
            total: MAX_CROSSWORD_ID,
            successful: successfulFetches.length,
            failed: failedFetches.length,
            successfulIds: successfulFetches,
            failedIds: failedFetches,
            lastUpdated: new Date().toISOString()
        };
        
        fs.writeFileSync('./data/index.json', JSON.stringify(indexData, null, 2));
        
        console.log('\n=== FETCH SUMMARY ===');
        console.log(`✓ Successfully fetched: ${successfulFetches.length}/${MAX_CROSSWORD_ID}`);
        console.log(`✗ Failed: ${failedFetches.length}/${MAX_CROSSWORD_ID}`);
        
        if (failedFetches.length > 0) {
            console.log(`Failed IDs: ${failedFetches.join(', ')}`);
        }
        
        console.log('\n✅ All done! Check ./data/crosswords/ for the JSON files.');
    }
}

// Install JSDOM if not present
try {
    require('jsdom');
} catch (error) {
    console.error('JSDOM is required for server-side DOM parsing.');
    console.log('Install it with: npm install jsdom');
    process.exit(1);
}

// Run the fetcher
const fetcher = new CrosswordFetcher();
fetcher.fetchAll().catch(console.error);
