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
let isMoving = false; // Flag to prevent input during animation

// DOM elements
let gridContainer;
let scoreElement;
let bestScoreElement;
let gameMessage;
let retryButton;
let alwaysVisibleRestartButton;
let aiModeButton;

let listenersAttached = false;
let keepPlayingButton;

// Export for testing
export { 
    initializeGame, 
    addNewTile, 
    moveTiles,
    performMove,
    mergeTiles, 
    checkGameState,
    keepPlaying
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
    keepPlayingButton = document.querySelector('.keep-playing-button');

    // Attach event listeners only once
    if (!listenersAttached) {
        window.addEventListener('keydown', handleKeyPress);
        retryButton.addEventListener('click', initializeGame);
        alwaysVisibleRestartButton.addEventListener('click', initializeGame);
        aiModeButton.addEventListener('click', toggleAiMode);
        keepPlayingButton.addEventListener('click', keepPlaying);

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
    gameMessage.className = 'game-message';
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
    if (isMoving) return;
    const direction = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
    }[e.key];
    
    if (direction) {
        e.preventDefault();
        moveTiles(direction);
    }
}

async function moveTiles(direction) {
    if (isMoving) return;
    isMoving = true;

    const matrix = getBoardMatrix();
    const { newMatrix, scoreChange, actions, hasChanged } = performMove(matrix, direction);

    if (!hasChanged) {
        isMoving = false;
        return;
    }

    await animateMovement(actions);
    renderGrid(newMatrix);

    score += scoreChange;
    scoreElement.textContent = score;
    if (score > bestScore) {
        bestScore = score;
        bestScoreElement.textContent = bestScore;
        localStorage.setItem('bestScore', bestScore);
    }

    addNewTile();
    checkGameState(newMatrix);

    isMoving = false;
}

function renderGrid(matrix) {
    gridContainer.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        if (matrix[i] !== '0') {
            const tile = document.createElement('div');
            tile.className = `tile tile-${matrix[i]}`;
            tile.textContent = matrix[i];
            cell.appendChild(tile);
        }
        gridContainer.appendChild(cell);
    }
}

function animateMovement(actions) {
    // Phase 1: Read all DOM properties to avoid layout thrashing
    const gridRect = gridContainer.getBoundingClientRect();
    const cellRects = Array.from(gridContainer.children).map(cell => cell.getBoundingClientRect());
    const originalTiles = gridContainer.querySelectorAll('.tile');

    // Phase 2: Prepare animation layer and tiles in memory
    const animationLayer = document.createElement('div');
    animationLayer.style.position = 'absolute';
    animationLayer.style.top = '0';
    animationLayer.style.left = '0';
    animationLayer.style.width = `${gridRect.width}px`;
    animationLayer.style.height = `${gridRect.height}px`;
    animationLayer.style.pointerEvents = 'none';

    const movingTilesData = [];

    const animationPromises = actions.map(action => {
        return new Promise(resolve => {
            const { from, to, value } = action;
            const fromRect = cellRects[from];
            const toRect = cellRects[to];

            const tile = document.createElement('div');
            tile.className = `tile tile-${value}`;
            tile.textContent = value;
            tile.style.width = `${fromRect.width}px`;
            tile.style.height = `${fromRect.height}px`;
            tile.style.position = 'absolute';
            tile.style.top = `${fromRect.top - gridRect.top}px`;
            tile.style.left = `${fromRect.left - gridRect.left}px`;

            animationLayer.appendChild(tile);
            movingTilesData.push({ tile, fromRect, toRect });

            let eventFired = false;
            const transitionDuration = 150; // Must match CSS: transition: transform 0.15s
            const safetyMargin = 50; // ms

            const onEnd = () => {
                if (!eventFired) {
                    eventFired = true;
                    resolve();
                }
            };

            tile.addEventListener('transitionend', onEnd, { once: true });
            setTimeout(onEnd, transitionDuration + safetyMargin); // Fallback timeout
        });
    });

    // Phase 3: Write to DOM
    originalTiles.forEach(t => { t.style.visibility = 'hidden'; });
    gridContainer.appendChild(animationLayer);

    // Phase 4: Animate
    requestAnimationFrame(() => {
        movingTilesData.forEach(({ tile, fromRect, toRect }) => {
            tile.classList.add('tile-moving');
            tile.style.transform = `translate(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px)`;
        });
    });

    // Phase 5: Cleanup
    return Promise.all(animationPromises).then(() => {
        // Show all tiles again
        originalTiles.forEach(t => { t.style.visibility = 'visible'; });
        gridContainer.removeChild(animationLayer);
    });
}

function checkGameState(matrix) {
    if (!matrix) {
        matrix = getBoardMatrix();
    }
    if (!gameWon && matrix.some(tileValue => parseInt(tileValue) >= 2048)) {
        gameWon = true;
        gameMessage.querySelector('p').textContent = 'You win!';
        gameMessage.classList.add('game-won');
        keepPlayingButton.style.display = 'block';
        if (aiPlaying) clearInterval(aiInterval);
    } else if (!matrix.includes('0') && !canMerge(matrix)) {
        gameMessage.querySelector('p').textContent = 'Game Over!';
        gameMessage.classList.add('game-over');
    }
}

function keepPlaying() {
    gameMessage.classList.remove('game-won');
    document.querySelector('.keep-playing-button').style.display = 'none';
    // Resume AI if it was running
    if (aiPlaying) {
        aiInterval = setInterval(aiPlay, 500);
    }
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

// Expose functions to global scope for testing, if running in a browser environment
if (typeof window !== 'undefined') {
    window.initializeGame = initializeGame;
    window.addNewTile = addNewTile;
    window.moveTiles = moveTiles;
    window.checkGameState = checkGameState;
    window.getBoardMatrix = getBoardMatrix;
    window.animateMovement = animateMovement; // Expose for testing
}
