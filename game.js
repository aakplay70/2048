// Import game logic functions
import { 
    mergeTiles,
    performMove
} from './gameLogic.js';

import {
    findBestMove,
    canMerge
} from './ai.js';


// Game variables

let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let gameWon = false;

// DOM elements
let gridContainer;
let scoreElement;
let bestScoreElement;
let gameMessage;
let retryButton;
let alwaysVisibleRestartButton;
let aiModeButton;

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
    retryButton = document.querySelector('.retry-button');
    alwaysVisibleRestartButton = document.querySelector('.restart-game-button');
    aiModeButton = document.querySelector('.ai-mode-button');

    // Attach event listeners only once
    if (!listenersAttached) {
        window.addEventListener('keydown', handleKeyPress);
        retryButton.addEventListener('click', initializeGame);
        alwaysVisibleRestartButton.addEventListener('click', initializeGame);
        aiModeButton.addEventListener('click', toggleAiMode);

        let touchstartX = 0;
        let touchstartY = 0;
        let touchendX = 0;
        let touchendY = 0;

        gridContainer.addEventListener('touchstart', e => {
            touchstartX = e.changedTouches[0].screenX;
            touchstartY = e.changedTouches[0].screenY;
        }, false);

        gridContainer.addEventListener('touchmove', e => {
            e.preventDefault();
        }, { passive: false });

        gridContainer.addEventListener('touchend', e => {
            touchendX = e.changedTouches[0].screenX;
            touchendY = e.changedTouches[0].screenY;
            handleGesture();
        }, false);

        function handleGesture() {
            const deltaX = touchendX - touchstartX;
            const deltaY = touchendY - touchstartY;

            const minSwipeDistance = 30; // Minimum distance for a swipe to be registered

            if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        moveTiles('right');
                    } else {
                        moveTiles('left');
                    }
                }
            } else { // Vertical swipe
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        moveTiles('down');
                    } else {
                        moveTiles('up');
                    }
                }
            }
        }
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
                tile.className = `tile tile-${value}`;
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

function getBoardMatrix() {
    const cells = Array.from(document.querySelectorAll('.grid-cell'));
    return cells.map(cell => cell.querySelector('.tile')?.textContent || '0');
}

let aiPlaying = false;
let aiInterval;

function toggleAiMode() {
    if (aiPlaying) {
        clearInterval(aiInterval);
        aiPlaying = false;
        aiModeButton.textContent = 'AI Mode';
    } else {
        aiPlaying = true;
        aiModeButton.textContent = 'Stop AI';
        aiInterval = setInterval(aiPlay, 500); // 0.5 second delay
    }
}

function aiPlay() {
    const currentMatrix = getBoardMatrix();
    const bestMove = findBestMove(currentMatrix);

    if (bestMove) {
        moveTiles(bestMove);
    } else {
        // If no move found, stop AI
        clearInterval(aiInterval);
        aiPlaying = false;
        aiModeButton.textContent = 'AI Mode';
        console.log("AI stopped: No valid moves found.");
    }

    // Check for game over after move
    const matrixAfterMove = getBoardMatrix();
    if (!matrixAfterMove.includes('0') && !canMerge(matrixAfterMove)) {
        clearInterval(aiInterval);
        aiPlaying = false;
        aiModeButton.textContent = 'AI Mode';
        console.log("AI stopped: Game Over.");
    }
}
