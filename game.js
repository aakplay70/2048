// Import game logic functions
import { 
    mergeTiles,
    performMove
} from './gameLogic.js';


// Game variables

let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let gameWon = false;

// DOM elements
let gridContainer;
let scoreElement;
let bestScoreElement;
let gameMessage;
let restartButton;

let listenersAttached = false;

// Export for testing
export { 
    initializeGame, 
    addNewTile, 
    moveTiles,
    performMove,
    mergeTiles, 
    checkGameState 
};

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});

function initializeGame() {
    // Query DOM elements every time initializeGame is called, as DOM might be reset (especially in tests)
    gridContainer = document.querySelector('.grid-container');
    scoreElement = document.getElementById('score');
    bestScoreElement = document.getElementById('best');
    gameMessage = document.querySelector('.game-message');
    restartButton = document.querySelector('.retry-button');

    // Attach event listeners only once
    if (!listenersAttached) {
        window.addEventListener('keydown', handleKeyPress);
        restartButton.addEventListener('click', initializeGame);
        listenersAttached = true;
    }

    score = 0;
    scoreElement.textContent = score;
    bestScoreElement.textContent = bestScore;
    gameWon = false;
    
    // Clear existing tiles
    gridContainer.innerHTML = '';
    
    // Create empty grid
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            gridContainer.appendChild(cell);
        }
    }
    
    addNewTile();
    addNewTile();
    gameMessage.style.display = 'none';
}

function addNewTile() {
    const cells = document.querySelectorAll('.grid-cell');
    const emptyCells = Array.from(cells).filter(cell => !cell.querySelector('.tile'));
    
    if (emptyCells.length === 0) return;
    
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    
    const tile = document.createElement('div');
    tile.className = `tile tile-${value}`;
    tile.textContent = value;
    
    randomCell.appendChild(tile);
    
    // Animate the new tile
    tile.style.transform = 'scale(0)';
    setTimeout(() => {
        tile.style.transform = 'scale(1)';
    }, 0);
}

function handleKeyPress(e) {
    const direction = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
    }[e.key];
    
    if (direction) {
        moveTiles(direction);
    }
}

function moveTiles(direction) {
    const cells = Array.from(document.querySelectorAll('.grid-cell'));
    const matrix = cells.map(cell => cell.querySelector('.tile')?.textContent || '0');
    const { newMatrix, scoreChange } = performMove(matrix, direction);
    
    if (matrix.join('') === newMatrix.join('')) return;
    
    // Update the grid
    cells.forEach((cell, i) => {
        const tile = cell.querySelector('.tile');
        const value = newMatrix[i];
        
        if (value === '0') {
            if (tile) cell.removeChild(tile);
        } else {
            if (!tile) {
                const newTile = document.createElement('div');
                newTile.className = `tile tile-${value}`;
                newTile.textContent = value;
                cell.appendChild(newTile);
            } else {
                tile.textContent = value;
            }
        }
    });
    
    // Add new tile
    addNewTile();
    
    // Update score
    score += scoreChange;
    scoreElement.textContent = score;
    
    // Update best score
    if (score > bestScore) {
        bestScore = score;
        bestScoreElement.textContent = bestScore;
        localStorage.setItem('bestScore', bestScore);
    }
    
    // Check for win condition
    if (newMatrix.some(tile => tile === '2048') && !gameWon) {
        gameWon = true;
        gameMessage.querySelector('p').textContent = 'You Won!';
        gameMessage.style.display = 'flex';
    }
    
    // Check game over condition
    checkGameState();
}

function checkGameState() {
    const cells = Array.from(document.querySelectorAll('.grid-cell'));
    const matrix = cells.map(cell => cell.querySelector('.tile')?.textContent || '0');
    
    // Check if there are any empty cells
    if (matrix.includes('0')) return;
    
    // Check if any adjacent tiles can be merged
    for (let i = 0; i < 16; i++) {
        const value = matrix[i];
        if (value === '0') continue;
        
        // Check right
        if (i % 4 !== 3 && value === matrix[i + 1]) return;
        // Check down
        if (i < 12 && value === matrix[i + 4]) return;
    }
    
    // Game over
    gameMessage.querySelector('p').textContent = 'Game Over!';
    gameMessage.style.display = 'flex';
}
